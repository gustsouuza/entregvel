import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  WeddingData,
  TimelineEvent,
  ScheduleEvent,
  HospitalityTip,
  GiftItem,
  GiftContribution,
  RSVPResponse,
  GuestMessage,
  WeddingTheme,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL as string;
const ADMIN_TOKEN = import.meta.env.VITE_ADMIN_TOKEN as string;

export type AppView = 'admin';

interface AppContextType {
  weddingData: WeddingData;
  loading: boolean;
  saving: boolean;
  saveError: boolean;
  currentView: AppView;
  setCurrentView: (view: string) => void;
  selectedAdminTab: string;
  setSelectedAdminTab: (tab: string) => void;

  updateWeddingData: (data: Partial<WeddingData>) => void;
  applyTheme: (theme: WeddingTheme) => void;

  addTimelineEvent: (event: Omit<TimelineEvent, 'id'>) => void;
  updateTimelineEvent: (id: string, event: Partial<TimelineEvent>) => void;
  deleteTimelineEvent: (id: string) => void;

  addScheduleEvent: (event: Omit<ScheduleEvent, 'id'>) => void;
  updateScheduleEvent: (id: string, event: Partial<ScheduleEvent>) => void;
  deleteScheduleEvent: (id: string) => void;

  addHospitalityTip: (tip: Omit<HospitalityTip, 'id'>) => void;
  updateHospitalityTip: (id: string, tip: Partial<HospitalityTip>) => void;
  deleteHospitalityTip: (id: string) => void;

  addGiftItem: (gift: Omit<GiftItem, 'id' | 'status'>) => void;
  updateGiftItem: (id: string, gift: Partial<GiftItem>) => void;
  deleteGiftItem: (id: string) => void;

  addContribution: (contribution: Omit<GiftContribution, 'id' | 'date' | 'status'>) => void;
  confirmContribution: (id: string) => void;
  deleteContribution: (id: string) => void;

  submitRSVP: (rsvp: Omit<RSVPResponse, 'id' | 'date' | 'code'>) => RSVPResponse;
  deleteRSVP: (id: string) => void;

  submitMessage: (message: Omit<GuestMessage, 'id' | 'date' | 'likes' | 'isApproved'>) => void;
  likeMessage: (id: string) => void;
  approveMessage: (id: string) => void;
  deleteMessage: (id: string) => void;

  trackClick: (target: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Chaves de "conteúdo" que o admin edita manualmente pelo painel.
// Tudo que NÃO estiver nesta lista (rsvps, invitations, messages,
// giftContributions, analytics) é considerado "dado ao vivo" gerado pelos
// convidados e é sempre buscado fresco do servidor antes de salvar, para
// que o admin nunca sobrescreva/apague uma confirmação de presença que
// chegou depois do último carregamento do painel.
const CONTENT_KEYS: (keyof WeddingData)[] = [
  'theme',
  'partner1',
  'partner2',
  'eventDate',
  'timeline',
  'gallery',
  'schedule',
  'hospitality',
  'gifts',
  'dressCode',
  'pixKeyValue',
  'pixFavoredName',
  'rsvpPinCode',
  'saveTheDate',
];

// Listas que TANTO o admin quanto os convidados podem alterar ao mesmo
// tempo (ex: convidado confirma presença enquanto o admin edita o convite;
// convidado reserva um presente enquanto o admin edita o catálogo). Para
// essas, em vez de substituir a lista inteira, mesclamos item a item.
const SHARED_LIST_KEYS: (keyof WeddingData)[] = ['invitations', 'rsvps', 'messages', 'giftContributions', 'gifts'];

/**
 * Mescla uma lista com id, item a item:
 * - Se o admin alterou um item (diferente do que era antes de ele começar
 *   a editar), a versão do admin vence para aquele item.
 * - Caso contrário, a versão mais recente do servidor vence (preservando
 *   qualquer alteração feita por um convidado nesse meio tempo).
 * - Itens novos localmente (criados pelo admin) são incluídos.
 * - Itens que existiam na baseline mas foram removidos localmente (admin
 *   deletou) são excluídos do resultado.
 * - Itens novos que só existem no servidor (criados por convidado) são
 *   preservados.
 */
function mergeKeyedArray<T extends { id: string }>(freshArr: T[] = [], localArr: T[] = [], baselineArr: T[] = []): T[] {
  const freshById = new Map(freshArr.map(i => [i.id, i]));
  const baselineById = new Map(baselineArr.map(i => [i.id, i]));
  const localIds = new Set(localArr.map(i => i.id));

  const result: T[] = localArr.map(localItem => {
    const baselineItem = baselineById.get(localItem.id);
    const changedByAdmin = !baselineItem || JSON.stringify(baselineItem) !== JSON.stringify(localItem);
    if (changedByAdmin) return localItem;
    // Não alterado pelo admin: prefere a versão mais nova do servidor (se existir).
    return freshById.get(localItem.id) || localItem;
  });

  // Itens que só existem no servidor (ex: convidado gerou um novo
  // RSVP/recado/contribuição que o admin ainda não tinha carregado).
  freshArr.forEach(freshItem => {
    // Só entra se for realmente novo no servidor (não existia na baseline).
    // Se já existia na baseline e sumiu do local, foi o admin que excluiu —
    // não deve ser readicionado.
    if (!localIds.has(freshItem.id) && !baselineById.has(freshItem.id)) result.push(freshItem);
  });

  return result;
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [weddingData, setWeddingData] = useState<WeddingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [selectedAdminTab, setSelectedAdminTab] = useState<string>('dashboard');
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextSave = useRef(true); // não salva no primeiro load
  // Guarda quais chaves de nível superior foram de fato editadas no painel
  // desde o último salvamento bem-sucedido. Só essas chaves são sobrepostas
  // em cima dos dados mais recentes do servidor ao salvar.
  const dirtyKeys = useRef<Set<keyof WeddingData>>(new Set());
  const weddingDataRef = useRef<WeddingData | null>(null);
  weddingDataRef.current = weddingData;
  // "Foto" dos dados como estavam antes de começar a editar — usada para
  // saber exatamente o que o admin mudou (diferente do que veio do servidor).
  const baselineRef = useRef<WeddingData | null>(null);

  const loadFromServer = () =>
    fetch(`${API_URL}/api/wedding`)
      .then(res => res.json())
      .then((data: WeddingData) => data)
      .catch(err => {
        console.error('Falha ao carregar dados:', err);
        return null;
      });

  useEffect(() => {
    loadFromServer().then(data => {
      if (data) {
        setWeddingData(data);
        baselineRef.current = data;
      }
      setLoading(false);
    });

    // Mantém o painel atualizado com o que os convidados vão confirmando
    // (RSVPs, presenças, recados, contribuições) mesmo sem recarregar a
    // página. Só atualiza os campos que o admin NÃO está editando no
    // momento, então nunca sobrescreve uma edição em andamento.
    const interval = setInterval(async () => {
      const fresh = await loadFromServer();
      if (!fresh) return;
      setWeddingData(prev => {
        if (!prev) return fresh;
        const merged: any = { ...fresh };
        // Preserva localmente qualquer chave que o admin editou e ainda não
        // foi salva (evita "piscar"/perder texto sendo digitado).
        dirtyKeys.current.forEach(key => {
          merged[key] = (prev as any)[key];
        });
        return merged;
      });
      // Atualiza a baseline apenas para as chaves que NÃO estão sendo
      // editadas agora, para manter o diff correto quando o admin salvar.
      const nextBaseline: any = { ...(baselineRef.current || fresh) };
      Object.keys(fresh).forEach(key => {
        if (!dirtyKeys.current.has(key as keyof WeddingData)) {
          nextBaseline[key] = (fresh as any)[key];
        }
      });
      baselineRef.current = nextBaseline;
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  // Persiste na API (debounced) sempre que weddingData mudar, exceto no load inicial.
  useEffect(() => {
    if (!weddingData) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
     // Se nada foi de fato editado no painel (a mudança veio só do polling
    // de sincronização a cada 15s), não faz sentido salvar de novo.
    if (dirtyKeys.current.size === 0) return;
    setSaving(true);
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      const keysToSave = Array.from(dirtyKeys.current);
      const localSnapshot = weddingDataRef.current;
      const baseline = baselineRef.current;
      try {
        // 1. Busca a versão mais recente do servidor — pode conter novas
        //    confirmações de presença, RSVPs, recados etc. que chegaram
        //    depois do último carregamento deste painel.
        const fresh = await loadFromServer();
        const base = fresh || localSnapshot;
        if (!base || !localSnapshot) return;

        // 2. Aplica por cima da versão fresca SOMENTE as chaves que o
        //    admin realmente alterou nesta sessão. Para listas
        //    compartilhadas com os convidados (convites, RSVPs, recados,
        //    contribuições, presentes), mescla item a item em vez de
        //    substituir a lista inteira — assim uma confirmação de
        //    presença feita por um convidado nunca é apagada por uma
        //    edição do admin em outro convite/registro.
        const merged: WeddingData = { ...base };
        keysToSave.forEach(key => {
          if (SHARED_LIST_KEYS.includes(key)) {
            const freshArr = (fresh as any)?.[key] || [];
            const localArr = (localSnapshot as any)[key] || [];
            const baselineArr = (baseline as any)?.[key] || [];
            (merged as any)[key] = mergeKeyedArray(freshArr, localArr, baselineArr);
          } else {
            (merged as any)[key] = (localSnapshot as any)[key];
          }
        });

        const res = await fetch(`${API_URL}/api/wedding`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${ADMIN_TOKEN}`,
          },
          body: JSON.stringify(merged),
        });
        if (!res.ok) throw new Error('Resposta não-OK da API: ' + res.status);

        dirtyKeys.current.clear();
        setWeddingData(merged);
        baselineRef.current = merged;
        setSaveError(false);
      } catch (e) {
        console.error('Falha ao salvar:', e);
        setSaveError(true);
      } finally {
        setSaving(false);
      }
    }, 800);
  }, [weddingData]);

  const markDirty = (keys: (keyof WeddingData)[]) => {
    keys.forEach(k => dirtyKeys.current.add(k));
  };

  const update = (fn: (prev: WeddingData) => WeddingData, keys: (keyof WeddingData)[]) => {
    markDirty(keys);
    setWeddingData(prev => (prev ? fn(prev) : prev));
  };

  const updateWeddingData = (data: Partial<WeddingData>) =>
    update(prev => ({ ...prev, ...data }), Object.keys(data) as (keyof WeddingData)[]);

  const applyTheme = (theme: WeddingTheme) => update(prev => ({ ...prev, theme }), ['theme']);

  const addTimelineEvent = (event: Omit<TimelineEvent, 'id'>) =>
    update(prev => ({ ...prev, timeline: [...prev.timeline, { ...event, id: `tl-${Date.now()}` }] }), ['timeline']);
  const updateTimelineEvent = (id: string, event: Partial<TimelineEvent>) =>
    update(prev => ({ ...prev, timeline: prev.timeline.map(i => (i.id === id ? { ...i, ...event } : i)) }), ['timeline']);
  const deleteTimelineEvent = (id: string) =>
    update(prev => ({ ...prev, timeline: prev.timeline.filter(i => i.id !== id) }), ['timeline']);

  const addScheduleEvent = (event: Omit<ScheduleEvent, 'id'>) =>
    update(prev => ({
      ...prev,
      schedule: [...prev.schedule, { ...event, id: `sch-${Date.now()}` }].sort((a, b) => a.time.localeCompare(b.time)),
    }), ['schedule']);
  const updateScheduleEvent = (id: string, event: Partial<ScheduleEvent>) =>
    update(prev => ({
      ...prev,
      schedule: prev.schedule.map(i => (i.id === id ? { ...i, ...event } : i)).sort((a, b) => a.time.localeCompare(b.time)),
    }), ['schedule']);
  const deleteScheduleEvent = (id: string) =>
    update(prev => ({ ...prev, schedule: prev.schedule.filter(i => i.id !== id) }), ['schedule']);

  const addHospitalityTip = (tip: Omit<HospitalityTip, 'id'>) =>
    update(prev => ({ ...prev, hospitality: [...prev.hospitality, { ...tip, id: `hosp-${Date.now()}` }] }), ['hospitality']);
  const updateHospitalityTip = (id: string, tip: Partial<HospitalityTip>) =>
    update(prev => ({ ...prev, hospitality: prev.hospitality.map(i => (i.id === id ? { ...i, ...tip } : i)) }), ['hospitality']);
  const deleteHospitalityTip = (id: string) =>
    update(prev => ({ ...prev, hospitality: prev.hospitality.filter(i => i.id !== id) }), ['hospitality']);

  const addGiftItem = (gift: Omit<GiftItem, 'id' | 'status'>) =>
    update(prev => ({ ...prev, gifts: [...prev.gifts, { ...gift, id: `gif-${Date.now()}`, status: 'disponivel' }] }), ['gifts']);
  const updateGiftItem = (id: string, gift: Partial<GiftItem>) =>
    update(prev => ({ ...prev, gifts: prev.gifts.map(i => (i.id === id ? { ...i, ...gift } : i)) }), ['gifts']);
  const deleteGiftItem = (id: string) =>
    update(prev => ({ ...prev, gifts: prev.gifts.filter(i => i.id !== id) }), ['gifts']);

  const addContribution = (contribution: Omit<GiftContribution, 'id' | 'date' | 'status'>) =>
    update(prev => ({
      ...prev,
      gifts: prev.gifts.map(i => (i.id === contribution.giftId ? { ...i, status: 'reservado' } : i)),
      giftContributions: [{ ...contribution, id: `gcon-${Date.now()}`, date: new Date().toISOString(), status: 'pendente' }, ...prev.giftContributions],
    }), ['gifts', 'giftContributions']);
  const confirmContribution = (id: string) =>
    update(prev => {
      const c = prev.giftContributions.find(x => x.id === id);
      if (!c) return prev;
      return {
        ...prev,
        giftContributions: prev.giftContributions.map(x => (x.id === id ? { ...x, status: 'confirmado' } : x)),
        gifts: prev.gifts.map(i => (i.id === c.giftId ? { ...i, status: 'recebido' } : i)),
      };
    }, ['gifts', 'giftContributions']);
  const deleteContribution = (id: string) =>
    update(prev => {
      const c = prev.giftContributions.find(x => x.id === id);
      const remaining = prev.giftContributions.filter(x => x.id !== id);
      let gifts = prev.gifts;
      if (c && !remaining.some(x => x.giftId === c.giftId)) {
        gifts = prev.gifts.map(i => (i.id === c.giftId ? { ...i, status: 'disponivel' } : i));
      }
      return { ...prev, giftContributions: remaining, gifts };
    }, ['gifts', 'giftContributions']);

  const submitRSVP = (rsvp: Omit<RSVPResponse, 'id' | 'date' | 'code'>) => {
    const code = `RSVP-${rsvp.name.split(' ')[0].toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`;
    const newRSVP: RSVPResponse = { ...rsvp, id: `r-${Date.now()}`, date: new Date().toISOString(), code };
    update(prev => ({ ...prev, rsvps: [newRSVP, ...prev.rsvps] }), ['rsvps']);
    return newRSVP;
  };
  const deleteRSVP = (id: string) => update(prev => ({ ...prev, rsvps: prev.rsvps.filter(i => i.id !== id) }), ['rsvps']);

  const submitMessage = (message: Omit<GuestMessage, 'id' | 'date' | 'likes' | 'isApproved'>) =>
    update(prev => ({
      ...prev,
      messages: [{ ...message, id: `msg-${Date.now()}`, date: new Date().toISOString(), likes: 0, isApproved: true }, ...prev.messages],
    }), ['messages']);
  const likeMessage = (id: string) =>
    update(prev => ({ ...prev, messages: prev.messages.map(m => (m.id === id ? { ...m, likes: m.likes + 1 } : m)) }), ['messages']);
  const approveMessage = (id: string) =>
    update(prev => ({ ...prev, messages: prev.messages.map(m => (m.id === id ? { ...m, isApproved: !m.isApproved } : m)) }), ['messages']);
  const deleteMessage = (id: string) =>
    update(prev => ({ ...prev, messages: prev.messages.filter(m => m.id !== id) }), ['messages']);

  const trackClick = (target: string) => {
    const today = new Date().toISOString().split('T')[0];
    update(prev => ({
      ...prev,
      analytics: prev.analytics.map(d => (d.date === today ? { ...d, clicks: d.clicks + 1 } : d)),
    }), ['analytics']);
  };

  if (loading || !weddingData) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center text-gray-400">
        Carregando painel...
      </div>
    );
  }

  return (
    <AppContext.Provider
      value={{
        weddingData,
        loading,
        saving,
        saveError,
        currentView: 'admin',
        setCurrentView: () => {},
        selectedAdminTab,
        setSelectedAdminTab,
        updateWeddingData,
        applyTheme,
        addTimelineEvent,
        updateTimelineEvent,
        deleteTimelineEvent,
        addScheduleEvent,
        updateScheduleEvent,
        deleteScheduleEvent,
        addHospitalityTip,
        updateHospitalityTip,
        deleteHospitalityTip,
        addGiftItem,
        updateGiftItem,
        deleteGiftItem,
        addContribution,
        confirmContribution,
        deleteContribution,
        submitRSVP,
        deleteRSVP,
        submitMessage,
        likeMessage,
        approveMessage,
        deleteMessage,
        trackClick,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
