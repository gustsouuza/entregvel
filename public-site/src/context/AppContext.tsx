import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { WeddingData, GiftContribution, RSVPResponse, GuestMessage } from '../types';

const API_URL = import.meta.env.VITE_API_URL as string;

interface AppContextType {
  weddingData: WeddingData;
  loading: boolean;
  setCurrentView: (view: string) => void; // no-op aqui (site público não tem outras "telas")
  updateWeddingData: (data: Partial<WeddingData>) => Promise<boolean>;
  addContribution: (contribution: Omit<GiftContribution, 'id' | 'date' | 'status'>) => void;
  submitRSVP: (rsvp: Omit<RSVPResponse, 'id' | 'date' | 'code'>) => Promise<RSVPResponse>;
  submitMessage: (message: Omit<GuestMessage, 'id' | 'date' | 'likes' | 'isApproved'>) => void;
  likeMessage: (id: string) => void;
  trackClick: (target: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Retorna true/false para o chamador saber se a chamada realmente deu certo.
// Sem isso, o site mostrava "confirmado" pro convidado mesmo quando a
// requisição falhava (sem internet, timeout, erro no Worker, etc).
async function post(path: string, body: any): Promise<boolean> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      console.error(`Falha ao sincronizar com a API (${path}): status ${res.status}`);
      return false;
    }
    return true;
  } catch (e) {
    console.error(`Falha ao sincronizar com a API (${path}):`, e);
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [weddingData, setWeddingData] = useState<WeddingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/wedding`)
      .then(res => res.json())
      .then(data => setWeddingData(data))
      .catch(err => console.error('Falha ao carregar dados do casamento:', err))
      .finally(() => setLoading(false));

    // Atualiza periodicamente para refletir mudanças feitas no painel admin
    const interval = setInterval(() => {
      fetch(`${API_URL}/api/wedding`)
        .then(res => res.json())
        .then(data => setWeddingData(data))
        .catch(() => {});
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  const updateWeddingData = useCallback(async (data: Partial<WeddingData>): Promise<boolean> => {
    // Único uso hoje: confirmação de presença de convite nominal.
    // Importante: só atualizamos o estado local (e portanto a tela de
    // "confirmado") DEPOIS que a API confirma que salvou de verdade.
    if (data.invitations) {
      let allSucceeded = true;
      for (const inv of data.invitations as any[]) {
        const ok = await post(`/api/wedding/invitations/${inv.id}/rsvp`, {
          guests: inv.guests?.map((g: any) => ({ id: g.id, confirmed: g.confirmed })),
          phone: inv.phone,
          notes: inv.notes,
        });
        if (!ok) {
          allSucceeded = false;
        }
      }

      if (!allSucceeded) {
        return false;
      }

      // Mescla só os convites enviados (por id) na lista local, sem descartar
      // os demais que não fizeram parte desta atualização.
      setWeddingData(prev => {
        if (!prev) return prev;
        const incoming = data.invitations as any[];
        const merged = prev.invitations.map(inv => incoming.find(u => u.id === inv.id) || inv);
        return { ...prev, invitations: merged };
      });
      return true;
    }

    setWeddingData(prev => (prev ? { ...prev, ...data } : prev));
    return true;
  }, []);

  const addContribution = useCallback((contribution: Omit<GiftContribution, 'id' | 'date' | 'status'>) => {
    const newContribution: GiftContribution = {
      ...contribution,
      id: `gcon-${Date.now()}`,
      date: new Date().toISOString(),
      status: 'pendente',
    };
    setWeddingData(prev => prev ? {
      ...prev,
      giftContributions: [newContribution, ...prev.giftContributions],
      gifts: prev.gifts.map(g => g.id === contribution.giftId ? { ...g, status: 'reservado' } : g),
    } : prev);
    post('/api/wedding/contributions', contribution);
  }, []);

  const submitRSVP = useCallback(async (rsvp: Omit<RSVPResponse, 'id' | 'date' | 'code'>): Promise<RSVPResponse> => {
    const ok = await post('/api/wedding/rsvp', rsvp);
    if (!ok) {
      // Não salva nada localmente nem mostra sucesso: o chamador deve
      // capturar esse erro e avisar o convidado para tentar de novo.
      throw new Error('Não foi possível confirmar sua presença. Verifique sua conexão e tente novamente.');
    }
    const code = `RSVP-${rsvp.name.split(' ')[0].toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`;
    const newRSVP: RSVPResponse = { ...rsvp, id: `r-${Date.now()}`, date: new Date().toISOString(), code };
    setWeddingData(prev => prev ? { ...prev, rsvps: [newRSVP, ...prev.rsvps] } : prev);
    return newRSVP;
  }, []);

  const submitMessage = useCallback((message: Omit<GuestMessage, 'id' | 'date' | 'likes' | 'isApproved'>) => {
    const newMessage: GuestMessage = {
      ...message,
      id: `msg-${Date.now()}`,
      date: new Date().toISOString(),
      likes: 0,
      isApproved: true,
    };
    setWeddingData(prev => prev ? { ...prev, messages: [newMessage, ...prev.messages] } : prev);
    post('/api/wedding/messages', message);
  }, []);

  const likeMessage = useCallback((id: string) => {
    setWeddingData(prev => prev ? {
      ...prev,
      messages: prev.messages.map(m => m.id === id ? { ...m, likes: m.likes + 1 } : m),
    } : prev);
    post(`/api/wedding/messages/${id}/like`, {});
  }, []);

  const trackClick = useCallback(() => {
    // Analytics detalhado fica só no admin por simplicidade/custo zero.
  }, []);

  if (loading || !weddingData) {
    return (
      <AppContext.Provider value={{
        weddingData: weddingData as any,
        loading: true,
        setCurrentView: () => {},
        updateWeddingData,
        addContribution,
        submitRSVP,
        submitMessage,
        likeMessage,
        trackClick,
      }}>
        {children}
      </AppContext.Provider>
    );
  }

  return (
    <AppContext.Provider value={{
      weddingData,
      loading: false,
      setCurrentView: () => {},
      updateWeddingData,
      addContribution,
      submitRSVP,
      submitMessage,
      likeMessage,
      trackClick,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
