/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  LayoutGrid, 
  Settings, 
  Sparkles, 
  Users, 
  Gift, 
  MapPin, 
  Calendar, 
  Layers, 
  QrCode, 
  DollarSign, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  TrendingUp, 
  Smartphone, 
  Eye, 
  LogOut,
  Sliders,
  FileSpreadsheet,
  Image,
  Lock,
  ArrowLeft,
  Send,
  MessageCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ImagePicker } from './ImagePicker';

// URL do site público de verdade (projeto `public-site/`), usado pelo botão
// "Ver Site Real"/"Ver Site Público" para abrir em uma nova aba.
const PUBLIC_SITE_URL = (import.meta.env.VITE_PUBLIC_SITE_URL as string) || '';
const openPublicSite = () => {
  if (PUBLIC_SITE_URL) {
    window.open(PUBLIC_SITE_URL, '_blank', 'noopener,noreferrer');
  } else {
    alert('Configure VITE_PUBLIC_SITE_URL no .env do admin para habilitar este botão.');
  }
};

export const AdminPanel: React.FC = () => {
  const { 
    weddingData, 
    selectedAdminTab, 
    setSelectedAdminTab, 
    updateWeddingData,
    
    addScheduleEvent,
    deleteScheduleEvent,
    
    addHospitalityTip,
    deleteHospitalityTip,
    
    addGiftItem,
    updateGiftItem,
    deleteGiftItem,
    confirmContribution,
    deleteContribution,
    deleteRSVP,
    approveMessage,
    deleteMessage,
    saveError
  } = useApp();

  const { partner1, partner2, eventDate, gallery, schedule, hospitality, gifts, giftContributions, rsvps, messages, analytics, invitations = [], saveTheDate } = weddingData;

  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return sessionStorage.getItem('everafter_admin_authenticated') === 'true';
  });
  const [authError, setAuthError] = useState('');

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPass = adminPassword.trim().toUpperCase();
    
    // Accept keys: '150826' (wedding date), '582914', 'NILTONELUCIANA', or the customizable admin PIN
    const correctPasswords = ['150826', '582914', 'NILTONELUCIANA', 'ADMIN'];
    const customPin = weddingData.rsvpPinCode ? weddingData.rsvpPinCode.toUpperCase() : '';
    
    if (correctPasswords.includes(cleanPass) || (customPin && cleanPass === customPin)) {
      setIsAdminAuthenticated(true);
      sessionStorage.setItem('everafter_admin_authenticated', 'true');
      setAuthError('');
    } else {
      setAuthError('Código de acesso ou senha inválida.');
    }
  };

  // Calculate high-level stats based on family invitations
  const allInvitedGuests = invitations.flatMap(inv => inv.guests || []);
  const totalInvitedCount = allInvitedGuests.length;
  const confirmedCount = allInvitedGuests.filter(g => g.confirmed === true).length;
  const declinedCount = allInvitedGuests.filter(g => g.confirmed === false).length;
  const pendingCount = allInvitedGuests.filter(g => g.confirmed === null || g.confirmed === undefined).length;
  
  const totalGuests = confirmedCount; // used for backward compatibility in stats card display

  // Exporta todos os convidados confirmados (convites nominais + RSVP avulso)
  // para um arquivo .csv que o Excel abre diretamente (separador ; e BOM
  // UTF-8 para os acentos aparecerem certinho no Excel em pt-BR).
  const handleExportConfirmedGuestsExcel = () => {
    const rows: string[][] = [
      ['Nome', 'Origem', 'Família / Grupo', 'Tipo', 'Acompanhantes', 'Telefone', 'Restrição Alimentar', 'Recado']
    ];

    (invitations || []).forEach(inv => {
      (inv.guests || []).forEach(g => {
        if (g.confirmed === true) {
          rows.push([
            g.name,
            'Convite Nominal',
            inv.familyName,
            g.type === 'crianca' ? 'Criança' : 'Adulto',
            '',
            inv.phone || '',
            '',
            inv.notes || ''
          ]);
        }
      });
    });

    (rsvps || []).filter(r => r.attending).forEach(r => {
      rows.push([
        r.name,
        'RSVP Avulso',
        '-',
        'Adulto',
        String(r.companions ?? 0),
        r.phone || '',
        r.dietaryRestrictions || '',
        r.message || ''
      ]);
    });

    if (rows.length === 1) {
      alert('Nenhum convidado confirmado ainda para exportar.');
      return;
    }

    const csvContent = rows
      .map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(';'))
      .join('\r\n');

    // BOM (\uFEFF) garante que o Excel reconheça UTF-8 e exiba acentos corretamente
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    link.download = `convidados-confirmados-${dateStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  // Received Gifts Stats
  const confirmedContributions = giftContributions.filter(c => c.status === 'confirmado');
  const pendingContributions = giftContributions.filter(c => c.status === 'pendente');
  const totalGiftCash = confirmedContributions.reduce((acc, c) => acc + c.value, 0);
  const pendingGiftCash = pendingContributions.reduce((acc, c) => acc + c.value, 0);

  // Form State for editing simple text info
  const [partner1First, setPartner1First] = useState(partner1.firstName);
  const [partner1Bio, setPartner1Bio] = useState(partner1.bio);
  const [partner2First, setPartner2First] = useState(partner2.firstName);
  const [partner2Bio, setPartner2Bio] = useState(partner2.bio);
  const [wedDate, setWedDate] = useState(eventDate);
  const [pixKey, setPixKey] = useState(weddingData.pixKeyValue);
  const [pixFavored, setPixFavored] = useState(weddingData.pixFavoredName);

  // Dynamic Add State forms

  const [showAddGift, setShowAddGift] = useState(false);
  const [editingGiftId, setEditingGiftId] = useState<string | null>(null);
  const [giftName, setGiftName] = useState('');
  const [giftDesc, setGiftDesc] = useState('');
  const [giftPrice, setGiftPrice] = useState('');
  const [giftCategory, setGiftCategory] = useState('Presentes');
  const [giftImg, setGiftImg] = useState('');

  const [showAddTip, setShowAddTip] = useState(false);
  const [tipName, setTipName] = useState('');
  const [tipCategory, setTipCategory] = useState<'hospedagem' | 'beleza' | 'dica' | 'restaurante'>('hospedagem');
  const [tipAddress, setTipAddress] = useState('');
  const [tipPhone, setTipPhone] = useState('');
  const [tipDesc, setTipDesc] = useState('');
  const [tipLink, setTipLink] = useState('');

  const [showAddSchedule, setShowAddSchedule] = useState(false);
  const [schTime, setSchTime] = useState('');
  const [schTitle, setSchTitle] = useState('');
  const [schLocation, setSchLocation] = useState('');
  const [schDesc, setSchDesc] = useState('');

  // Gallery Admin Form State
  const [showAddGallery, setShowAddGallery] = useState(false);
  const [galleryImgUrl, setGalleryImgUrl] = useState('');
  const [galleryCaption, setGalleryCaption] = useState('');
  const [editingGalId, setEditingGalId] = useState<string | null>(null);
  const [editingGalCaption, setEditingGalCaption] = useState('');

  // Gallery Helpers
  const handleAddGallerySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!galleryImgUrl) return;
    const newItem = {
      id: `gal-${Date.now()}`,
      url: galleryImgUrl,
      caption: galleryCaption
    };
    const updatedGallery = [...(gallery || []), newItem];
    updateWeddingData({ gallery: updatedGallery });
    setGalleryImgUrl('');
    setGalleryCaption('');
    setShowAddGallery(false);
    alert('Nova foto adicionada à galeria com sucesso!');
  };

  const handleDeleteGalleryItem = (id: string) => {
    const updatedGallery = (gallery || []).filter(item => item.id !== id);
    updateWeddingData({ gallery: updatedGallery });
    alert('Foto removida da galeria com sucesso!');
  };

  const handleSaveGalleryCaption = (id: string) => {
    const updatedGallery = (gallery || []).map(item => {
      if (item.id === id) {
        return { ...item, caption: editingGalCaption };
      }
      return item;
    });
    updateWeddingData({ gallery: updatedGallery });
    setEditingGalId(null);
    setEditingGalCaption('');
    alert('Legenda da foto atualizada com sucesso!');
  };

  // Invitations Form & List State
  const [showAddInvitation, setShowAddInvitation] = useState(false);
  const [invFamilyName, setInvFamilyName] = useState('');
  const [invGuests, setInvGuests] = useState<{ name: string; type: 'adulto' | 'crianca' }[]>([{ name: '', type: 'adulto' }]);
  const [invMaxGuests, setInvMaxGuests] = useState<number | ''>('');
  const [invPhone, setInvPhone] = useState('');
  const [invNotes, setInvNotes] = useState('');
  const [editingInvId, setEditingInvId] = useState<string | null>(null);
  const [invSearchTerm, setInvSearchTerm] = useState('');

  const addInvGuestBox = () => setInvGuests(prev => [...prev, { name: '', type: 'adulto' }]);
  const removeInvGuestBox = (idx: number) => setInvGuests(prev => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev);
  const updateInvGuestBox = (idx: number, field: 'name' | 'type', value: string) =>
    setInvGuests(prev => prev.map((g, i) => (i === idx ? { ...g, [field]: value } : g)));

  // Helper for generating PIN
  const generatePin = (familyName: string) => {
    const clean = familyName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove accents
      .replace(/[^a-zA-Z]/g, "") // remove spaces and specials
      .toUpperCase();
    const prefix = clean.substring(0, 4).padEnd(4, 'X');
    
    let attempts = 0;
    const currentInvitations = weddingData.invitations || [];
    while (attempts < 100) {
      const num = Math.floor(10 + Math.random() * 90); // 2 digits
      const candidate = `${prefix}${num}`;
      if (!currentInvitations.some(inv => inv.pin === candidate)) {
        return candidate;
      }
      attempts++;
    }
    // pure random alphanumeric 6-chars
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randomPin = '';
    for (let i = 0; i < 6; i++) {
      randomPin += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return randomPin;
  };

  const handleSaveInvitation = (e: React.FormEvent) => {
    e.preventDefault();
    const validGuests = invGuests.map(g => ({ name: g.name.trim(), type: g.type })).filter(g => g.name);
    if (!invFamilyName.trim() || validGuests.length === 0) {
      alert('Por favor, informe o nome da família e pelo menos um convidado.');
      return;
    }

    const currentInvitations = weddingData.invitations || [];

    if (editingInvId) {
      // Editing mode
      const updatedInvitations = currentInvitations.map(inv => {
        if (inv.id === editingInvId) {
          // Re-map guests while preserving confirmation status for matching names if possible
          const newGuests = validGuests.map((g, idx) => {
            const existingGuest = inv.guests?.find(og => og.name.toLowerCase() === g.name.toLowerCase());
            return {
              id: existingGuest?.id || `g-${Date.now()}-${idx}`,
              name: g.name,
              type: g.type,
              confirmed: existingGuest ? existingGuest.confirmed : null
            };
          });

          return {
            ...inv,
            familyName: invFamilyName.trim(),
            guests: newGuests,
            maxGuests: invMaxGuests ? Number(invMaxGuests) : newGuests.length,
            phone: invPhone.trim(),
            notes: invNotes.trim()
          };
        }
        return inv;
      });

      updateWeddingData({ invitations: updatedInvitations });
      alert('Convite atualizado com sucesso!');
      setEditingInvId(null);
    } else {
      // Create mode
      const generatedCode = generatePin(invFamilyName.trim());
      const newGuests = validGuests.map((g, idx) => ({
        id: `g-${Date.now()}-${idx}`,
        name: g.name,
        type: g.type,
        confirmed: null
      }));

      const newInv = {
        id: `inv-${Date.now()}`,
        familyName: invFamilyName.trim(),
        pin: generatedCode,
        guests: newGuests,
        maxGuests: invMaxGuests ? Number(invMaxGuests) : newGuests.length,
        phone: invPhone.trim(),
        notes: invNotes.trim()
      };

      updateWeddingData({ invitations: [...currentInvitations, newInv] });
      alert(`Convite criado com sucesso! PIN de Acesso gerado: ${generatedCode}`);
    }

    // Reset Form
    setInvFamilyName('');
    setInvGuests([{ name: '', type: 'adulto' }]);
    setInvMaxGuests('');
    setInvPhone('');
    setInvNotes('');
    setShowAddInvitation(false);
  };

  const handleEditInvitation = (inv: any) => {
    setEditingInvId(inv.id);
    setInvFamilyName(inv.familyName);
    setInvGuests(inv.guests.map((g: any) => ({ name: g.name, type: g.type || 'adulto' })));
    setInvMaxGuests(inv.maxGuests);
    setInvPhone(inv.phone || '');
    setInvNotes(inv.notes || '');
    setShowAddInvitation(true);
  };

  const handleDeleteInvitation = (id: string) => {
    const currentInvitations = weddingData.invitations || [];
    const updated = currentInvitations.filter(inv => inv.id !== id);
    updateWeddingData({ invitations: updated });
    alert('Convite removido com sucesso!');
  };

  // ---- Central de Envio (WhatsApp) ----
  const DEFAULT_INVITE_TEMPLATE =
    'Olá *{NOME}*!\n\nTemos um convite super especial para vocês para o nosso casamento! 💍✨\n\nPor favor, confirmem sua presença acessando o nosso site oficial e informando o seu PIN exclusivo de confirmação:\n\n🔑 Seu PIN: *{PIN}*\n👉 Site do Casamento: {SITE}\n\nEstamos ansiosos para celebrar este grande dia com vocês! ❤️';

  const [envioSearchTerm, setEnvioSearchTerm] = useState('');
  const [envioFilter, setEnvioFilter]         = useState<'todos' | 'pendentes' | 'enviados'>('todos');
  const [stdMessage, setStdMessage]           = useState(saveTheDate?.message || DEFAULT_INVITE_TEMPLATE);
  const [stdImageUrl, setStdImageUrl]         = useState(saveTheDate?.imageUrl || '');
  const [envioMode, setEnvioMode]             = useState<'manual' | 'auto'>('manual');

  // Estado do disparo em massa
  const [blasting, setBlasting]           = useState(false);
  const [blastProgress, setBlastProgress] = useState<{ current: number; total: number } | null>(null);
  const [blastLog, setBlastLog]           = useState<{ family: string; phone: string; ok: boolean; error?: string }[]>([]);
  const [blastDone, setBlastDone]         = useState(false);
  const [blastSummary, setBlastSummary]   = useState<{ sent: number; failed: number } | null>(null);

  // Credenciais da Evolution API — definidas no .env do admin
  const EVOLUTION_URL      = (import.meta.env.VITE_EVOLUTION_URL      as string) || '';
  const EVOLUTION_KEY      = (import.meta.env.VITE_EVOLUTION_KEY      as string) || '';
  const EVOLUTION_INSTANCE = (import.meta.env.VITE_EVOLUTION_INSTANCE as string) || '';
  const evolutionOk        = !!(EVOLUTION_URL && EVOLUTION_KEY && EVOLUTION_INSTANCE);

  const handleSaveSaveTheDate = () => {
    updateWeddingData({ saveTheDate: { imageUrl: stdImageUrl, message: stdMessage } });
    if (saveError) alert('Não foi possível salvar no servidor. Tente novamente.');
    else alert('Configuração salva! Imagem e mensagem serão usadas nos envios automáticos.');
  };

  const buildInviteMessage = (inv: any) => {
    const siteUrl = PUBLIC_SITE_URL || window.location.origin;
    return (saveTheDate?.message || stdMessage || DEFAULT_INVITE_TEMPLATE)
      .replaceAll('{NOME}', inv.familyName || 'Convidado')
      .replaceAll('{PIN}',  inv.pin        || '')
      .replaceAll('{SITE}', siteUrl);
  };

  const buildWhatsappLink = (inv: any): string | null => {
    const digits = (inv.phone || '').replace(/\D/g, '');
    if (!digits) return null;
    const withCC = digits.startsWith('55') ? digits : `55${digits}`;
    return `https://wa.me/${withCC}?text=${encodeURIComponent(buildInviteMessage(inv))}`;
  };

  const toggleWhatsappSent = (id: string, sent: boolean) => {
    updateWeddingData({
      invitations: (weddingData.invitations || []).map(inv =>
        inv.id === id ? { ...inv, whatsappSent: sent } : inv
      ),
    });
  };

  const handleSendWhatsapp = (inv: any) => {
    const link = buildWhatsappLink(inv);
    if (!link) {
      alert('Esse convite não tem telefone cadastrado. Edite-o na aba "Acompanhar RSVP".');
      return;
    }
    window.open(link, '_blank', 'noopener,noreferrer');
    toggleWhatsappSent(inv.id, true);
  };

  // Convites pendentes com telefone — alvo do disparo automático
  const pendingWithPhone = (weddingData.invitations || []).filter(
    i => !i.whatsappSent && !!(i.phone || '').replace(/\D/g, '')
  );

  // ─── Disparo em massa via Evolution API ──────────────────────────────────────
  // Envia diretamente do navegador → Evolution API → WhatsApp de cada convidado.
  //
  // Precauções contra bloqueio implementadas:
  //  1. Mensagem personalizada por convidado ({NOME}) — nunca conteúdo idêntico
  //  2. Delay aleatório 5–12s entre envios — imita comportamento humano
  //  3. Só envia para pendentes com telefone cadastrado
  //  4. Cada envio marcado imediatamente como enviado — sem reenvios acidentais
  //  5. Imagem + texto numa única mensagem (sendMedia) quando imageUrl configurada
  const handleBlastAll = async () => {
    if (!evolutionOk) {
      alert('Configure VITE_EVOLUTION_URL, VITE_EVOLUTION_KEY e VITE_EVOLUTION_INSTANCE no .env do admin.');
      return;
    }
    if (pendingWithPhone.length === 0) {
      alert('Nenhum convite pendente com telefone cadastrado.');
      return;
    }
    const mins = Math.ceil(pendingWithPhone.length * 8.5 / 60);
    if (!window.confirm(
      `Enviar imagem + mensagem para ${pendingWithPhone.length} família(s) via Evolution API?\n\n` +
      `⏱ Tempo estimado: ~${mins} min (delay 5–12s entre envios para proteger o número)\n\n` +
      `Não feche esta janela durante o disparo.`
    )) return;

    setBlasting(true);
    setBlastDone(false);
    setBlastLog([]);
    setBlastSummary(null);
    setBlastProgress({ current: 0, total: pendingWithPhone.length });

    const imageUrl = stdImageUrl || saveTheDate?.imageUrl || '';
    const headers  = { 'Content-Type': 'application/json', apikey: EVOLUTION_KEY };
    let sent = 0, failed = 0;

    for (let i = 0; i < pendingWithPhone.length; i++) {
      const inv    = pendingWithPhone[i];
      const digits = (inv.phone || '').replace(/\D/g, '');
      const number = digits.startsWith('55') ? digits : `55${digits}`;
      const text   = buildInviteMessage(inv); // personalizado por convidado

      setBlastProgress({ current: i + 1, total: pendingWithPhone.length });

      try {
        let res: Response;
        if (imageUrl) {
          // Imagem + legenda numa única mensagem
          res = await fetch(`${EVOLUTION_URL}/message/sendMedia/${EVOLUTION_INSTANCE}`, {
            method: 'POST', headers,
            body: JSON.stringify({ number, mediatype: 'image', media: imageUrl, caption: text }),
          });
        } else {
          // Só texto
          res = await fetch(`${EVOLUTION_URL}/message/sendText/${EVOLUTION_INSTANCE}`, {
            method: 'POST', headers,
            body: JSON.stringify({ number, text }),
          });
        }

        if (res.ok) {
          sent++;
          toggleWhatsappSent(inv.id, true);
          setBlastLog(prev => [...prev, { family: inv.familyName, phone: number, ok: true }]);
        } else {
          failed++;
          const err = await res.text().catch(() => String(res.status));
          setBlastLog(prev => [...prev, { family: inv.familyName, phone: number, ok: false, error: err }]);
        }
      } catch (e: any) {
        failed++;
        setBlastLog(prev => [...prev, { family: inv.familyName, phone: number, ok: false, error: e?.message || 'Erro de rede' }]);
      }

      // Delay aleatório 5–12s — não fixo para imitar comportamento humano
      if (i < pendingWithPhone.length - 1) {
        await new Promise(r => setTimeout(r, 5000 + Math.floor(Math.random() * 7000)));
      }
    }

    setBlastSummary({ sent, failed });
    setBlastDone(true);
    setBlasting(false);
    setBlastProgress(null);
  };

  // Handle saving primary texts
  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    updateWeddingData({
      partner1: { ...partner1, firstName: partner1First, bio: partner1Bio },
      partner2: { ...partner2, firstName: partner2First, bio: partner2Bio },
      eventDate: wedDate,
      pixKeyValue: pixKey,
      pixFavoredName: pixFavored
    });
    alert('Informações do casamento atualizadas e salvas no banco de dados!');
  };

  // Add Gift Submit
  const handleAddGiftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!giftName || !giftPrice) return;
    const payload = {
      name: giftName,
      description: giftDesc,
      price: parseFloat(giftPrice),
      category: giftCategory,
      imageUrl: giftImg || 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&q=80&w=400'
    };
    if (editingGiftId) {
      updateGiftItem(editingGiftId, payload);
    } else {
      addGiftItem(payload);
    }
    setGiftName('');
    setGiftDesc('');
    setGiftPrice('');
    setGiftImg('');
    setEditingGiftId(null);
    setShowAddGift(false);
  };

  const openEditGift = (gift: any) => {
    setEditingGiftId(gift.id);
    setGiftName(gift.name);
    setGiftDesc(gift.description);
    setGiftPrice(String(gift.price));
    setGiftCategory(gift.category);
    setGiftImg(gift.imageUrl);
    setShowAddGift(true);
  };

  // Add Tip Submit
  const handleAddTipSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tipName || !tipAddress) return;
    addHospitalityTip({
      name: tipName,
      category: tipCategory,
      address: tipAddress,
      phone: tipPhone || undefined,
      description: tipDesc || undefined,
      link: tipLink || undefined
    });
    setTipName('');
    setTipAddress('');
    setTipPhone('');
    setTipDesc('');
    setTipLink('');
    setShowAddTip(false);
  };

  // Add Schedule Submit
  const handleAddScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schTime || !schTitle || !schLocation) return;
    addScheduleEvent({
      time: schTime,
      title: schTitle,
      location: schLocation,
      description: schDesc || undefined
    });
    setSchTime('');
    setSchTitle('');
    setSchLocation('');
    setSchDesc('');
    setShowAddSchedule(false);
  };

  // Sidebar navigation menu
  const sidebarMenu = [
    { id: 'dashboard', label: 'Painel Geral', icon: <LayoutGrid className="w-4 h-4" /> },
    { id: 'informacoes', label: 'Dados do Casal', icon: <Settings className="w-4 h-4" /> },
    { id: 'galeria', label: 'Galeria de Fotos', icon: <Image className="w-4 h-4" /> },
    { id: 'cronograma', label: 'Cronograma', icon: <Calendar className="w-4 h-4" /> },
    { id: 'presentes', label: 'Lista de Presentes', icon: <Gift className="w-4 h-4" /> },
    { id: 'rsvp', label: 'Acompanhar RSVP', icon: <Users className="w-4 h-4" /> },
    { id: 'envio', label: 'Central de Envio', icon: <Send className="w-4 h-4" /> }
  ];

  if (!isAdminAuthenticated) {
    return (
      <div className="bg-neutral-950 text-neutral-100 min-h-screen flex items-center justify-center p-6 font-sans select-none selection:bg-[#8C7853]/20 selection:text-[#8C7853]">
        <div className="absolute top-8 left-8">
          <button 
            onClick={openPublicSite}
            className="flex items-center gap-2 text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Site</span>
          </button>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-8 md:p-10 shadow-2xl relative overflow-hidden"
        >
          {/* Subtle gold accent light */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#8C7853]"></div>

          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-[#8C7853]/10 border border-[#8C7853]/30 rounded-full flex items-center justify-center mx-auto mb-4 text-[#8C7853]">
              <Lock className="w-5 h-5" />
            </div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-[#8C7853] block mb-1.5">Painel dos Noivos</span>
            <h1 className="font-cinzel text-xl tracking-wider text-white font-semibold">Painel Administrativo</h1>
            <p className="text-xs text-neutral-400 mt-2.5 font-light leading-relaxed">
              Insira a senha para acessar o painel de controle.
            </p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="text-[10px] uppercase font-bold tracking-wider text-neutral-300 block mb-1.5">Senha</label>
              <input 
                type="password"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Senha: 150826"
                className="w-full bg-neutral-950 border border-neutral-800 px-4 py-3 rounded-lg text-xs font-mono text-center tracking-widest focus:outline-hidden focus:border-[#8C7853] focus:ring-1 focus:ring-[#8C7853] text-white placeholder-neutral-600 transition-all"
              />
            </div>

            {authError && (
              <p className="text-[11px] text-rose-500 font-medium text-center bg-rose-950/10 border border-rose-900/20 py-2 rounded-md">
                {authError}
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-[#8C7853] hover:bg-[#726141] text-white text-xs font-bold uppercase tracking-widest py-3.5 rounded-lg shadow-md transition-colors text-center cursor-pointer"
            >
              Acessar Painel
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-neutral-800/60 text-center">
            <p className="text-[10px] text-neutral-500 font-light">
              Protegido por criptografia de ponta a ponta de sessão.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-900 text-neutral-100 min-h-screen flex flex-col md:flex-row font-sans selection:bg-[#8C7853]/20 selection:text-[#8C7853]">
      {/* Sidebar Admin Control */}
      <aside className="w-full md:w-64 bg-neutral-950 border-r border-neutral-800 p-6 flex flex-col justify-between shrink-0">
        <div>
          {/* Brand header */}
          <div className="flex items-center space-x-2.5 mb-10 pb-4 border-b border-neutral-800">
            <Heart className="w-5 h-5 text-[#8C7853] fill-[#8C7853]/10" />
            <span className="font-cinzel text-lg tracking-widest font-semibold text-white">Painel Administrativo</span>
            <span className="bg-[#8C7853]/15 text-[#8C7853] text-[8px] font-bold tracking-widest px-1.5 py-0.5 rounded-full uppercase">SaaS</span>
          </div>

          {/* Quick couple display */}
          <div className="mb-8 px-2 py-3 bg-neutral-900/50 rounded-lg border border-neutral-800/60 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#8C7853]/20 flex items-center justify-center font-serif italic text-sm text-[#8C7853] border border-[#8C7853]/20">
              {partner1.firstName[0]}
            </div>
            <div className="truncate">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#8C7853]">Site Ativo</span>
              <p className="text-xs font-semibold truncate text-white">{partner1.firstName} & {partner2.firstName}</p>
            </div>
          </div>

          {/* Nav menu links */}
          <nav className="space-y-1">
            {sidebarMenu.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedAdminTab(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all ${
                  selectedAdminTab === item.id 
                    ? 'bg-[#8C7853] text-white shadow-md' 
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Bottom utility links */}
        <div className="space-y-3 pt-6 border-t border-neutral-800">
          <button
            onClick={openPublicSite}
            className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-xs font-semibold text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
          >
            <Eye className="w-4 h-4 text-[#8C7853]" />
            <span>Ver Site Público</span>
          </button>

          <button
            onClick={() => {
              setIsAdminAuthenticated(false);
              sessionStorage.removeItem('everafter_admin_authenticated');
            }}
            className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair do Painel</span>
          </button>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-neutral-900 overflow-y-auto">
        
        {/* Top bar header */}
        <header className="border-b border-neutral-800 bg-neutral-950/60 px-8 py-5 flex justify-between items-center shrink-0">
          <div>
            <span className="text-[9px] uppercase tracking-widest font-bold text-[#8C7853]">Painel Administrativo dos Noivos</span>
            <h2 className="text-lg font-cinzel tracking-wider text-white font-semibold">
              {selectedAdminTab === 'dashboard' && 'Dashboard de Desempenho'}
              {selectedAdminTab === 'informacoes' && 'Gerenciador de Dados Gerais'}
              {selectedAdminTab === 'cronograma' && 'Cronograma do Casamento'}
              {selectedAdminTab === 'presentes' && 'Mesa de Presentes & Contribuições'}
              {selectedAdminTab === 'rsvp' && 'Central de RSVPs'}
              {selectedAdminTab === 'envio' && 'Central de Envio (WhatsApp)'}
            </h2>
          </div>

          <div className="flex gap-3">
            <button
              onClick={openPublicSite}
              className="px-4 py-2 bg-[#8C7853] hover:bg-[#726141] text-white text-[10px] uppercase font-bold tracking-widest rounded-md shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Ver Site Real</span>
            </button>
          </div>
        </header>

        {/* Tab Content Panels Rendering */}
        <div className="p-8 flex-1 min-w-0">
          
          {/* 1. DASHBOARD OVERVIEW */}
          {selectedAdminTab === 'dashboard' && (
            <div className="space-y-8 animate-fadeIn">
              {/* Stat Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Dias Restantes', val: Math.max(0, Math.floor((+new Date(eventDate + 'T17:00:00') - +new Date()) / (1000 * 60 * 60 * 24))), sub: 'Contagem regressiva', icon: <Calendar className="w-5 h-5 text-amber-500" /> },
                  { label: 'Convidados (RSVP)', val: `${confirmedCount} / ${totalInvitedCount}`, sub: `${confirmedCount} Conf. • ${declinedCount} Recusaram • ${pendingCount} Pendentes`, icon: <Users className="w-5 h-5 text-blue-500" /> },
                  { label: 'Presentes Recebidos', val: `R$ ${totalGiftCash.toLocaleString('pt-BR')}`, sub: `${confirmedContributions.length} depósitos PIX feitos`, icon: <DollarSign className="w-5 h-5 text-emerald-500" /> },
                  { label: 'Visitas Recentes', val: analytics.reduce((acc, a) => acc + a.visits, 0), sub: `${analytics.reduce((acc, a) => acc + a.clicks, 0)} cliques feitos`, icon: <TrendingUp className="w-5 h-5 text-[#8C7853]" /> }
                ].map((stat, idx) => (
                  <div key={idx} className="bg-neutral-950 border border-neutral-800 p-6 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-400">{stat.label}</span>
                      <h4 className="text-2xl font-bold font-mono text-white mt-1.5">{stat.val}</h4>
                      <p className="text-[10px] text-neutral-500 mt-1 font-light">{stat.sub}</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                      {stat.icon}
                    </div>
                  </div>
                ))}
              </div>

              {/* Charts and Maps Container (Mocked pure CSS charts for robust compilation) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Traffic Chart */}
                <div className="bg-neutral-950 border border-neutral-800 p-6 rounded-xl lg:col-span-2">
                  <h3 className="font-cinzel text-xs uppercase tracking-widest font-bold text-[#8C7853] mb-6 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4" /> Histórico de Acessos ao Site
                  </h3>
                  
                  {/* CSS Columns chart */}
                  <div className="h-64 flex items-end justify-between gap-3 pt-6 border-b border-neutral-800 pb-2">
                    {analytics.map((day, idx) => {
                      const maxVisits = Math.max(...analytics.map(a => a.visits));
                      const heightPercent = maxVisits > 0 ? (day.visits / maxVisits) * 80 : 0;
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center group cursor-pointer">
                          <div className="text-[9px] font-mono font-bold text-[#8C7853] mb-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {day.visits}
                          </div>
                          {/* Column bar */}
                          <div 
                            className="w-full bg-neutral-800 group-hover:bg-[#8C7853] transition-colors rounded-t-md" 
                            style={{ height: `${heightPercent}%`, minHeight: '8px' }}
                          ></div>
                          {/* Label Date */}
                          <span className="text-[8px] font-mono text-neutral-500 mt-2 rotate-45 md:rotate-0">
                            {day.date.split('-')[2]}/{day.date.split('-')[1]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Device & Origins stats */}
                <div className="bg-neutral-950 border border-neutral-800 p-6 rounded-xl flex flex-col justify-between">
                  <div>
                    <h3 className="font-cinzel text-xs uppercase tracking-widest font-bold text-[#8C7853] mb-6 flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4" /> Dispositivos & Canais
                    </h3>

                    <div className="space-y-4">
                      {/* Origins bars */}
                      <div>
                        <span className="text-[10px] text-neutral-400 block mb-1.5">Origem dos Convidados</span>
                        <div className="space-y-2">
                          {[
                            { name: 'WhatsApp', pct: 45, count: 81 },
                            { name: 'Instagram', pct: 35, count: 63 },
                            { name: 'Direct / Links', pct: 12, count: 21 },
                            { name: 'QR Code Impresso', pct: 8, count: 15 }
                          ].map((origin, idx) => (
                            <div key={idx} className="text-[10px] text-neutral-400">
                              <div className="flex justify-between items-center mb-0.5">
                                <span>{origin.name}</span>
                                <span className="font-mono text-[#8C7853]">{origin.pct}% ({origin.count})</span>
                              </div>
                              <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden">
                                <div className="h-full bg-[#8C7853]" style={{ width: `${origin.pct}%` }}></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-neutral-800 pt-4 mt-6 text-[10px] text-neutral-500 flex justify-between">
                    <span>Sessão de atualizações: 5s atrás</span>
                    <span className="text-[#8C7853] cursor-pointer hover:underline">Atualizar</span>
                  </div>
                </div>
              </div>

            </div>
          )}


          {/* 3. DADOS GERAIS DO CASAL */}
          {selectedAdminTab === 'informacoes' && (
            <div className="max-w-3xl animate-fadeIn">
              <form onSubmit={handleSaveInfo} className="bg-neutral-950 border border-neutral-800 rounded-xl p-8 space-y-6">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#8C7853] block border-b border-neutral-800 pb-2">Informações Primárias</span>
                
                {/* Spouse 1 fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-widest text-neutral-300 block mb-1.5">Noivo (a) 1 - Primeiro Nome</label>
                    <input 
                      type="text" 
                      required 
                      value={partner1First}
                      onChange={(e) => setPartner1First(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-xs text-neutral-300 focus:outline-hidden focus:border-[#8C7853]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-widest text-neutral-300 block mb-1.5">Noivo (a) 2 - Primeiro Nome</label>
                    <input 
                      type="text" 
                      required 
                      value={partner2First}
                      onChange={(e) => setPartner2First(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-xs text-neutral-300 focus:outline-hidden focus:border-[#8C7853]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-widest text-neutral-300 block mb-1.5">Noivo (a) 1 - Biografia Curta</label>
                    <textarea 
                      value={partner1Bio}
                      onChange={(e) => setPartner1Bio(e.target.value)}
                      rows={4}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-xs text-neutral-300 focus:outline-hidden focus:border-[#8C7853] resize-none"
                    ></textarea>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-widest text-neutral-300 block mb-1.5">Noivo (a) 2 - Biografia Curta</label>
                    <textarea 
                      value={partner2Bio}
                      onChange={(e) => setPartner2Bio(e.target.value)}
                      rows={4}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-xs text-neutral-300 focus:outline-hidden focus:border-[#8C7853] resize-none"
                    ></textarea>
                  </div>
                </div>

                {/* Wedding Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-widest text-neutral-300 block mb-1.5">Data do Grande Dia</label>
                    <input 
                      type="date" 
                      required 
                      value={wedDate}
                      onChange={(e) => setWedDate(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-xs text-neutral-300 focus:outline-hidden focus:border-[#8C7853] font-mono"
                    />
                  </div>
                </div>

                <span className="text-[10px] uppercase font-bold tracking-widest text-[#8C7853] block border-b border-neutral-800 pb-2 pt-6">Chave PIX para Receber Presentes</span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-widest text-neutral-300 block mb-1.5">Chave PIX (E-mail, CPF, Telefone ou Aleatória)</label>
                    <input 
                      type="text" 
                      required 
                      value={pixKey}
                      onChange={(e) => setPixKey(e.target.value)}
                      placeholder="marianaeguilherme2026@gmail.com"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-xs text-neutral-300 focus:outline-hidden focus:border-[#8C7853] font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-widest text-neutral-300 block mb-1.5">Nome Completo do Favorecido</label>
                    <input 
                      type="text" 
                      required 
                      value={pixFavored}
                      onChange={(e) => setPixFavored(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-xs text-neutral-300 focus:outline-hidden focus:border-[#8C7853]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="bg-[#8C7853] hover:bg-[#726141] text-white text-xs font-bold uppercase tracking-widest px-6 py-3.5 rounded-lg transition-colors mt-6 shadow-md"
                >
                  Salvar Alterações
                </button>
              </form>
            </div>
          )}

          {/* 5. LISTA DE PRESENTES & CONTRIBUIÇÕES */}
          {selectedAdminTab === 'presentes' && (
            <div className="space-y-12 animate-fadeIn">
              
              {/* Cash contributions logs */}
              <div className="bg-neutral-950 border border-neutral-800 p-6 rounded-xl">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <span className="text-[9px] uppercase tracking-widest font-bold text-[#8C7853]">Depósitos PIX Confirmados</span>
                    <h3 className="text-sm font-cinzel uppercase tracking-wider text-white font-bold">Mesa de Presentes Recebidos</h3>
                  </div>

                  <div className="flex gap-4">
                    <div className="text-right">
                      <span className="text-[9px] uppercase tracking-widest text-neutral-400">Montante Confirmado</span>
                      <p className="text-base font-bold font-mono text-emerald-500">R$ {totalGiftCash.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    {pendingGiftCash > 0 && (
                      <div className="text-right border-l border-neutral-800 pl-4">
                        <span className="text-[9px] uppercase tracking-widest text-neutral-400">Pendente de Confirmação</span>
                        <p className="text-base font-bold font-mono text-amber-500">R$ {pendingGiftCash.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contributions grid */}
                <div className="space-y-3">
                  {giftContributions.length === 0 ? (
                    <p className="text-xs text-center text-neutral-500 py-8">Nenhum registro de presente recebido ainda. Seu site de testes está pronto!</p>
                  ) : (
                    giftContributions.map((contrib) => (
                      <div key={contrib.id} className="p-4 bg-neutral-900 border border-neutral-800 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-white">{contrib.donorName}</span>
                            <span className="text-[8px] uppercase tracking-widest font-mono text-neutral-500">| {contrib.giftName}</span>
                          </div>
                          <p className="text-[11px] text-neutral-400 mt-1 leading-normal italic">"{contrib.message}"</p>
                          <span className="text-[8px] text-neutral-500 font-mono block mt-1.5">Registrado em: {new Date(contrib.date).toLocaleString('pt-BR')}</span>
                        </div>

                        <div className="flex items-center gap-3 self-end md:self-auto">
                          <span className="font-mono text-xs font-bold text-white mr-2">R$ {contrib.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          
                          {contrib.status === 'pendente' ? (
                            <button
                              onClick={() => {
                                confirmContribution(contrib.id);
                                alert('Contribuição marcada como CONFIRMADA e e-mail enviado automaticamente ao casal!');
                              }}
                              className="px-3 py-1.5 bg-emerald-950/20 hover:bg-emerald-800 border border-emerald-800 text-emerald-400 hover:text-white rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" /> Confirmar PIX
                            </button>
                          ) : (
                            <span className="px-2.5 py-1.5 bg-emerald-950/30 border border-emerald-900/40 text-emerald-400 text-[9px] font-bold uppercase tracking-widest rounded-md flex items-center gap-1">
                              <Check className="w-3 h-3" /> Confirmado
                            </span>
                          )}

                          <button
                            onClick={() => {
                              if (window.confirm('Deseja excluir permanentemente este registro de presente?')) {
                                deleteContribution(contrib.id);
                              }
                            }}
                            className="p-1.5 bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-rose-400 hover:bg-rose-950/10 rounded-md transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Manage Gifts Catalog List */}
              <div>
                <div className="flex justify-between items-center mb-6">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-400">Catálogo de Presentes Ativos ({gifts.length} itens)</span>
                  <button
                    onClick={() => { setShowAddGift(!showAddGift); setEditingGiftId(null); setGiftName(''); setGiftDesc(''); setGiftPrice(''); setGiftImg(''); }}
                    className="bg-[#8C7853] hover:bg-[#726141] text-white text-[10px] uppercase font-bold tracking-widest px-4 py-2.5 rounded-md flex items-center gap-1.5 shadow-sm"
                  >
                    {showAddGift ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    <span>{showAddGift ? 'Cancelar' : 'Adicionar Presente'}</span>
                  </button>
                </div>

                {/* Add/Edit Gift panel form */}
                <AnimatePresence>
                  {showAddGift && (
                    <motion.form
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      onSubmit={handleAddGiftSubmit}
                      className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 space-y-4 mb-6 overflow-hidden"
                    >
                      <span className="text-[10px] uppercase font-bold tracking-widest text-[#8C7853] block">
                        {editingGiftId ? 'Editando Presente' : 'Novo Presente'}
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[9px] uppercase font-bold tracking-widest text-neutral-300 block mb-1">Nome do Presente</label>
                          <input 
                            type="text" 
                            required 
                            value={giftName}
                            onChange={(e) => setGiftName(e.target.value)}
                            placeholder="Ex: Jantar Romântico em Paris" 
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-md px-3.5 py-2.5 text-xs text-neutral-300 focus:outline-hidden focus:border-[#8C7853]"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] uppercase font-bold tracking-widest text-neutral-300 block mb-1">Preço Sugerido (R$)</label>
                          <input 
                            type="number" 
                            required 
                            value={giftPrice}
                            onChange={(e) => setGiftPrice(e.target.value)}
                            placeholder="450.00" 
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-md px-3.5 py-2.5 text-xs text-neutral-300 focus:outline-hidden focus:border-[#8C7853] font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[9px] uppercase font-bold tracking-widest text-neutral-300 block mb-1">Categoria</label>
                          <select
                            value={giftCategory}
                            onChange={(e) => setGiftCategory(e.target.value)}
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-md px-3.5 py-2.5 text-xs text-neutral-300 focus:outline-hidden focus:border-[#8C7853]"
                          >
                            
                            
                            
                            <option value="Presentes">Presentes</option>
                            <option value="Contribuição Livre">Contribuição Livre</option>
                          </select>
                        </div>

                        <div>
                          <ImagePicker
                            value={giftImg}
                            onChange={setGiftImg}
                            urlLabel="Imagem Ilustrativa (opcional — link ou do computador)"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] uppercase font-bold tracking-widest text-neutral-300 block mb-1">Descrição Breve</label>
                        <input 
                          type="text" 
                          value={giftDesc}
                          onChange={(e) => setGiftDesc(e.target.value)}
                          placeholder="Ex: Cota para um jantar luxuoso do casal." 
                          className="w-full bg-neutral-900 border border-neutral-800 rounded-md px-3.5 py-2.5 text-xs text-neutral-300 focus:outline-hidden focus:border-[#8C7853]"
                        />
                      </div>

                      <button
                        type="submit"
                        className="bg-[#8C7853] hover:bg-[#726141] text-white text-[10px] uppercase font-bold tracking-widest py-3 px-6 rounded-md transition-colors"
                      >
                        {editingGiftId ? 'Salvar Alterações' : 'Criar Presente no Catálogo'}
                      </button>
                    </motion.form>
                  )}
                </AnimatePresence>

                {/* Gifts List Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {gifts.map((gift) => (
                    <div key={gift.id} className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 flex gap-4 items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-neutral-800">
                          <img src={gift.imageUrl} alt={gift.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-white uppercase tracking-wider truncate max-w-[150px]">{gift.name}</h4>
                          <span className="text-[9px] text-[#8C7853] font-mono block">R$ {gift.price.toLocaleString('pt-BR')}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[8px] uppercase tracking-widest font-bold px-2 py-0.5 rounded ${
                          gift.status === 'recebido' ? 'bg-emerald-950/40 text-emerald-400' : 'bg-neutral-900 text-neutral-400'
                        }`}>
                          {gift.status}
                        </span>
                        
                        <button
                          onClick={() => openEditGift(gift)}
                          className="p-1.5 bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:bg-[#8C7853]/30 rounded-md transition-colors"
                          title="Editar"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            if (window.confirm('Tem certeza de que deseja excluir este presente do catálogo?')) {
                              deleteGiftItem(gift.id);
                            }
                          }}
                          className="p-1.5 bg-neutral-900 border border-neutral-800 text-rose-400 hover:text-white hover:bg-rose-900/30 rounded-md transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* 6. CENTRAL DE CONVITES & RSVPS POR PIN */}
          {selectedAdminTab === 'rsvp' && (
            <div className="space-y-6 max-w-7xl animate-fadeIn">
              
              {/* Header with main buttons */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-neutral-950 border border-neutral-800 p-6 rounded-xl">
                <div>
                  <span className="text-[10px] uppercase tracking-widest font-bold text-[#8C7853]">Controle de convidados</span>
                  <h3 className="text-sm font-cinzel uppercase tracking-wider text-white font-bold">Gestão de Convites & PINs de Acesso</h3>
                  <p className="text-[11px] text-neutral-400 mt-1 max-w-xl">
                    Crie convites por família ou grupo. Cada convite gera um PIN automático que os convidados utilizam no site público para confirmar a presença individualmente.
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (showAddInvitation) {
                      setEditingInvId(null);
                      setInvFamilyName('');
                      setInvGuestsText('');
                      setInvMaxGuests('');
                      setInvPhone('');
                      setInvNotes('');
                    }
                    setShowAddInvitation(!showAddInvitation);
                  }}
                  className="bg-[#8C7853] hover:bg-[#726141] text-white text-[10px] uppercase font-bold tracking-widest px-4 py-2.5 rounded-md flex items-center gap-1.5 shadow-sm shrink-0"
                >
                  {showAddInvitation ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>{showAddInvitation ? 'Cancelar' : 'Criar Novo Convite'}</span>
                </button>
              </div>

              {/* RSVP Specific Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total de Convidados', val: totalInvitedCount, color: 'text-blue-400', sub: 'Noivos enviaram' },
                  { label: 'Confirmados', val: confirmedCount, color: 'text-emerald-400', sub: 'Estarão presentes' },
                  { label: 'Recusaram', val: declinedCount, color: 'text-rose-400', sub: 'Não poderão ir' },
                  { label: 'Pendentes', val: pendingCount, color: 'text-amber-400', sub: 'Aguardando resposta' }
                ].map((stat, idx) => (
                  <div key={idx} className="bg-neutral-950 border border-neutral-800 p-4 rounded-xl">
                    <span className="text-[9px] uppercase tracking-wider text-neutral-500 font-medium">{stat.label}</span>
                    <h4 className={`text-xl font-bold font-mono mt-1 ${stat.color}`}>{stat.val}</h4>
                    <p className="text-[9px] text-neutral-400 mt-0.5">{stat.sub}</p>
                  </div>
                ))}
              </div>

              {/* Add/Edit Invitation Form */}
              <AnimatePresence>
                {showAddInvitation && (
                  <motion.form 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleSaveInvitation}
                    className="bg-neutral-950 border border-neutral-800 p-6 rounded-xl space-y-4 overflow-hidden"
                  >
                    <div className="border-b border-neutral-800 pb-2 flex justify-between items-center">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-[#8C7853]">
                        {editingInvId ? 'Editar Convite da Família' : 'Novo Convite Familiar / Grupo'}
                      </span>
                      {editingInvId && (
                        <span className="text-[9px] font-mono bg-neutral-900 border border-neutral-800 text-neutral-400 px-2 py-0.5 rounded">
                          Modo Edição
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Family/Group name */}
                      <div>
                        <label className="text-[9px] uppercase font-bold tracking-widest text-neutral-300 block mb-1">Nome da Família ou Grupo *</label>
                        <input 
                          type="text" 
                          required 
                          value={invFamilyName}
                          onChange={(e) => setInvFamilyName(e.target.value)}
                          placeholder="Ex: Família Silva de Souza, Casal Azevedo, Padrinho João..." 
                          className="w-full bg-neutral-900 border border-neutral-800 rounded-md px-3.5 py-2.5 text-xs text-neutral-300 focus:outline-hidden focus:border-[#8C7853]"
                        />
                      </div>

                      {/* WhatsApp Phone */}
                      <div>
                        <label className="text-[9px] uppercase font-bold tracking-widest text-neutral-300 block mb-1">WhatsApp / Celular (Opcional)</label>
                        <input 
                          type="text" 
                          value={invPhone}
                          onChange={(e) => setInvPhone(e.target.value)}
                          placeholder="Ex: (11) 99999-9999" 
                          className="w-full bg-neutral-900 border border-neutral-800 rounded-md px-3.5 py-2.5 text-xs text-neutral-300 focus:outline-hidden focus:border-[#8C7853]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Guest Names - one box per guest */}
                      <div className="md:col-span-2">
                        <label className="text-[9px] uppercase font-bold tracking-widest text-neutral-300 block mb-1">
                          Convidados (Nome + Adulto/Criança) *
                        </label>
                        <div className="space-y-2">
                          {invGuests.map((g, idx) => (
                            <div key={idx} className="flex gap-2 items-center">
                              <input
                                type="text"
                                value={g.name}
                                onChange={(e) => updateInvGuestBox(idx, 'name', e.target.value)}
                                placeholder={`Nome do convidado ${idx + 1}`}
                                className="flex-1 bg-neutral-900 border border-neutral-800 rounded-md px-3.5 py-2 text-xs text-neutral-300 focus:outline-hidden focus:border-[#8C7853]"
                              />
                              <select
                                value={g.type}
                                onChange={(e) => updateInvGuestBox(idx, 'type', e.target.value)}
                                className="bg-neutral-900 border border-neutral-800 rounded-md px-2 py-2 text-[10px] uppercase font-bold text-neutral-300 focus:outline-hidden focus:border-[#8C7853]"
                              >
                                <option value="adulto">Adulto</option>
                                <option value="crianca">Criança</option>
                              </select>
                              <button
                                type="button"
                                onClick={() => removeInvGuestBox(idx)}
                                className="p-2 bg-neutral-900 border border-neutral-800 text-rose-400 hover:text-white hover:bg-rose-950/30 rounded-md transition-colors shrink-0"
                                title="Remover convidado"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={addInvGuestBox}
                          className="mt-2 flex items-center gap-1.5 text-[9px] uppercase font-bold tracking-widest text-[#8C7853] hover:underline"
                        >
                          <Plus className="w-3 h-3" /> Adicionar Convidado
                        </button>
                        <span className="text-[8px] text-neutral-500 mt-2 block">
                          Cada convidado confirma individualmente pelo site, marcando se é adulto ou criança.
                        </span>
                      </div>

                      {/* Notes & Max guests */}
                      <div className="space-y-4">
                        <div>
                          <label className="text-[9px] uppercase font-bold tracking-widest text-neutral-300 block mb-1">Limite Máximo de Convites</label>
                          <input 
                            type="number" 
                            value={invMaxGuests}
                            onChange={(e) => setInvMaxGuests(e.target.value ? Number(e.target.value) : '')}
                            placeholder="Deixe em branco para igualar à lista" 
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-md px-3.5 py-2 text-xs text-neutral-300 focus:outline-hidden focus:border-[#8C7853]"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] uppercase font-bold tracking-widest text-neutral-300 block mb-1">Notas Internas (Opcional)</label>
                          <input 
                            type="text" 
                            value={invNotes}
                            onChange={(e) => setInvNotes(e.target.value)}
                            placeholder="Ex: Família da Noiva / Padrinhos" 
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-md px-3.5 py-2 text-xs text-neutral-300 focus:outline-hidden focus:border-[#8C7853]"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingInvId(null);
                          setInvFamilyName('');
                          setInvGuests([{ name: '', type: 'adulto' }]);
                          setInvMaxGuests('');
                          setInvPhone('');
                          setInvNotes('');
                          setShowAddInvitation(false);
                        }}
                        className="px-4 py-2.5 bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white rounded-md text-[10px] uppercase font-bold tracking-widest transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="bg-[#8C7853] hover:bg-[#726141] text-white text-[10px] uppercase font-bold tracking-widest py-2.5 px-6 rounded-md transition-colors"
                      >
                        {editingInvId ? 'Atualizar Convite' : 'Criar Convite & Gerar PIN'}
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Filter and List Container */}
              <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div className="relative w-full sm:max-w-xs">
                    <input 
                      type="text"
                      value={invSearchTerm}
                      onChange={(e) => setInvSearchTerm(e.target.value)}
                      placeholder="Buscar por Família, Convidado ou PIN..."
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-md pl-3.5 pr-8 py-2 text-xs text-neutral-300 focus:outline-hidden focus:border-[#8C7853]"
                    />
                    {invSearchTerm && (
                      <button 
                        onClick={() => setInvSearchTerm('')}
                        className="absolute right-2.5 top-2.5 text-neutral-500 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-[10px] uppercase tracking-wider text-neutral-400 font-mono">
                      Filtrados: <span className="text-white font-bold">{
                        (invitations || []).filter(inv => {
                          const term = invSearchTerm.toLowerCase();
                          return inv.familyName.toLowerCase().includes(term) || 
                                 inv.pin.toLowerCase().includes(term) ||
                                 inv.guests?.some(g => g.name.toLowerCase().includes(term));
                        }).length
                      }</span> / Total: <span className="text-white font-bold">{(invitations || []).length}</span>
                    </div>

                    <button
                      onClick={handleExportConfirmedGuestsExcel}
                      title="Exporta todos os convidados confirmados (convites nominais + RSVP avulso) em um arquivo compatível com Excel"
                      className="bg-[#39FF14] hover:bg-[#2EDB0F] text-black text-[10px] uppercase font-bold tracking-widest px-4 py-2.5 rounded-md flex items-center gap-1.5 shadow-sm shadow-[#39FF14]/30 shrink-0"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Exportar Confirmados</span>
                    </button>
                  </div>
                </div>

                {/* Invitations Table */}
                <div className="overflow-x-auto">
                  {(!invitations || invitations.length === 0) ? (
                    <div className="py-12 text-center text-xs text-neutral-500">
                      Nenhum convite cadastrado ainda. Use o botão "Criar Novo Convite" para começar!
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-neutral-800 text-neutral-400 uppercase tracking-widest text-[9px] font-bold">
                          <th className="py-3 px-4">Família / Grupo</th>
                          <th className="py-3 px-4 text-center">PIN de Acesso</th>
                          <th className="py-3 px-4">Convidados & Status</th>
                          <th className="py-3 px-4">WhatsApp & Notas</th>
                          <th className="py-3 px-4 text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(invitations || [])
                          .filter(inv => {
                            const term = invSearchTerm.toLowerCase();
                            return inv.familyName.toLowerCase().includes(term) || 
                                   inv.pin.toLowerCase().includes(term) ||
                                   inv.guests?.some(g => g.name.toLowerCase().includes(term));
                          })
                          .map((inv) => {
                            return (
                              <tr key={inv.id} className="border-b border-neutral-800/50 hover:bg-neutral-900/20 text-neutral-300">
                                {/* Family Name */}
                                <td className="py-4 px-4">
                                  <div className="font-semibold text-white text-xs">{inv.familyName}</div>
                                  <div className="text-[9px] text-neutral-500 mt-1 font-mono">
                                    Limite: {inv.maxGuests} {inv.maxGuests > 1 ? 'pessoas' : 'pessoa'}
                                  </div>
                                </td>

                                {/* PIN Code */}
                                <td className="py-4 px-4 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <span className="font-mono text-xs font-bold text-[#8C7853] bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded select-all tracking-wider">
                                      {inv.pin}
                                    </span>
                                  </div>
                                </td>

                                {/* Guests and Status */}
                                <td className="py-4 px-4 max-w-xs sm:max-w-md">
                                  <div className="space-y-1.5">
                                    {inv.guests?.map((guest) => (
                                      <div key={guest.id} className="flex items-center gap-2 text-[11px]">
                                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                          guest.confirmed === true ? 'bg-emerald-400' :
                                          guest.confirmed === false ? 'bg-rose-400' : 'bg-amber-400'
                                        }`} />
                                        <span className="truncate max-w-[150px]" title={guest.name}>{guest.name}</span>
                                        <span className="text-[8px] uppercase tracking-wider px-1 py-0.25 rounded shrink-0 bg-neutral-800 text-neutral-400 border border-neutral-700">
                                          {guest.type === 'crianca' ? 'Criança' : 'Adulto'}
                                        </span>
                                        <span className={`text-[8px] uppercase tracking-wider px-1 py-0.25 rounded shrink-0 font-medium ${
                                          guest.confirmed === true ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/20' :
                                          guest.confirmed === false ? 'bg-rose-950/40 text-rose-400 border border-rose-900/20' :
                                          'bg-neutral-900 text-neutral-400'
                                        }`}>
                                          {guest.confirmed === true ? 'Confirmado' :
                                           guest.confirmed === false ? 'Recusou' : 'Pendente'}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </td>

                                {/* Phone & Notes */}
                                <td className="py-4 px-4">
                                  {inv.phone && (
                                    <div className="text-[10px] font-mono text-neutral-400" title="WhatsApp do Convidado">
                                      📞 {inv.phone}
                                    </div>
                                  )}
                                  {inv.notes && (
                                    <div className="text-[10px] text-neutral-500 italic mt-0.5" title="Notas Internas">
                                      📝 {inv.notes}
                                    </div>
                                  )}
                                  {!inv.phone && !inv.notes && (
                                    <span className="text-neutral-600 font-mono text-[9px] italic">Nenhuma nota</span>
                                  )}
                                </td>

                                {/* Actions */}
                                <td className="py-4 px-4">
                                  <div className="flex items-center justify-center gap-2">
                                    
                                    {/* Edit button */}
                                    <button
                                      onClick={() => handleEditInvitation(inv)}
                                      className="p-1.5 bg-neutral-900 hover:bg-neutral-800 text-amber-500 hover:text-white rounded-md border border-neutral-800 transition-colors"
                                      title="Editar Convite"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>

                                    {/* Delete button */}
                                    <button
                                      onClick={() => {
                                        if (window.confirm(`Excluir permanentemente o convite de "${inv.familyName}"? Isto apagará o PIN e as presenças associadas.`)) {
                                          handleDeleteInvitation(inv.id);
                                        }
                                      }}
                                      className="p-1.5 bg-neutral-900 hover:bg-rose-950/30 text-rose-400 hover:text-white rounded-md border border-neutral-800 transition-colors"
                                      title="Excluir Convite"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>

                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* CENTRAL DE ENVIO (WHATSAPP) */}
          {selectedAdminTab === 'envio' && (
            <div className="space-y-6 animate-fadeIn">

              {/* ── 1. Configuração: imagem + mensagem ── */}
              <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6">
                <div className="mb-5">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-[#8C7853]">Configuração do Envio</span>
                  <h3 className="text-sm font-cinzel uppercase tracking-wider text-white font-bold">Save the Date & Mensagem</h3>
                  <p className="text-[11px] text-neutral-400 font-light mt-1.5 leading-relaxed max-w-2xl">
                    Use <code className="text-[#8C7853]">{'{NOME}'}</code>,{' '}
                    <code className="text-[#8C7853]">{'{PIN}'}</code> e{' '}
                    <code className="text-[#8C7853]">{'{SITE}'}</code> — substituídos automaticamente para cada convidado.
                    No modo automático, imagem + texto chegam juntos numa única mensagem.
                  </p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-[9px] uppercase font-bold tracking-widest text-neutral-300 block mb-1">
                      URL da Imagem do Save the Date <span className="text-neutral-600 normal-case font-normal">(Cloudinary, Google Drive público, etc.)</span>
                    </label>
                    <input
                      type="url"
                      value={stdImageUrl}
                      onChange={e => setStdImageUrl(e.target.value)}
                      placeholder="https://res.cloudinary.com/..."
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-md px-3.5 py-2.5 text-xs text-neutral-300 focus:outline-hidden focus:border-[#8C7853]"
                    />
                    {stdImageUrl && (
                      <img src={stdImageUrl} alt="Preview Save the Date" className="mt-2 h-28 rounded-md object-cover border border-neutral-800" />
                    )}
                  </div>
                  <div>
                    <label className="text-[9px] uppercase font-bold tracking-widest text-neutral-300 block mb-1">
                      Mensagem (legenda da imagem)
                    </label>
                    <textarea
                      rows={8}
                      value={stdMessage}
                      onChange={e => setStdMessage(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-md px-3.5 py-2.5 text-xs text-neutral-300 focus:outline-hidden focus:border-[#8C7853] font-sans leading-relaxed"
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <button
                    onClick={handleSaveSaveTheDate}
                    className="bg-[#8C7853] hover:bg-[#726141] text-white text-[10px] uppercase font-bold tracking-widest py-2.5 px-6 rounded-md transition-colors"
                  >
                    Salvar Configuração
                  </button>
                </div>
              </div>

              {/* ── 2. Seletor de modo ── */}
              <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6">
                <div className="mb-4">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-[#8C7853]">Modo de Envio</span>
                  <h3 className="text-sm font-cinzel uppercase tracking-wider text-white font-bold">Como deseja enviar?</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => setEnvioMode('manual')}
                    className={`text-left p-4 rounded-xl border transition-colors ${envioMode === 'manual' ? 'border-[#8C7853] bg-[#8C7853]/10' : 'border-neutral-800 bg-neutral-900 hover:border-neutral-700'}`}
                  >
                    <div className="text-xs font-bold text-white mb-1">Manual — wa.me</div>
                    <div className="text-[10px] text-neutral-400 leading-relaxed">Abre o WhatsApp para cada família. Um por um. Só texto, sem imagem automática. Zero risco de bloqueio.</div>
                    <div className="mt-2 text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Gratuito · Risco zero</div>
                  </button>
                  <button
                    onClick={() => setEnvioMode('auto')}
                    className={`text-left p-4 rounded-xl border transition-colors ${envioMode === 'auto' ? 'border-[#8C7853] bg-[#8C7853]/10' : 'border-neutral-800 bg-neutral-900 hover:border-neutral-700'}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="text-xs font-bold text-white">Automático — Evolution API</div>
                      {!evolutionOk && <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-950/50 border border-amber-800/50 text-amber-400 font-bold">Setup necessário</span>}
                    </div>
                    <div className="text-[10px] text-neutral-400 leading-relaxed">Um clique envia imagem + texto para todos com delay aleatório entre envios.</div>
                    <div className="mt-2 text-[9px] font-bold text-amber-400 uppercase tracking-widest">Requer Evolution API · Risco baixo</div>
                  </button>
                </div>
              </div>

              {/* ── 3a. AUTOMÁTICO ── */}
              {envioMode === 'auto' && (
                <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 space-y-5">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest font-bold text-[#8C7853]">Disparo Automático</span>
                    <h3 className="text-sm font-cinzel uppercase tracking-wider text-white font-bold">Enviar para Todos de Uma Vez</h3>
                  </div>

                  {/* Alerta se Evolution API não configurada */}
                  {!evolutionOk && (
                    <div className="bg-amber-950/20 border border-amber-800/40 rounded-lg px-4 py-3 text-[11px] text-amber-300 leading-relaxed">
                      <strong>Evolution API não configurada.</strong> Adicione no <code className="text-amber-200">.env</code> do admin:<br />
                      <code className="text-[10px] block mt-1.5 text-amber-400 leading-relaxed">
                        VITE_EVOLUTION_URL=https://sua-api.railway.app<br />
                        VITE_EVOLUTION_KEY=sua_chave<br />
                        VITE_EVOLUTION_INSTANCE=nome_da_instancia
                      </code>
                    </div>
                  )}

                  {/* Proteções ativas */}
                  <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
                    <div className="text-[9px] uppercase font-bold tracking-widest text-neutral-500 mb-3">Proteções ativas contra bloqueio</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        ['Mensagem personalizada', 'Nome de cada convidado no texto — nunca idênticas'],
                        ['Delay aleatório 5–12s', 'Intervalo variável imita comportamento humano'],
                        ['Só pendentes com telefone', 'Ignora convites sem número ou já enviados'],
                        ['Marcação imediata', 'Cada envio registrado — sem reenvios acidentais'],
                      ].map(([t, d]) => (
                        <div key={t} className="flex gap-2">
                          <span className="text-emerald-400 mt-0.5 shrink-0 text-xs">✓</span>
                          <div>
                            <div className="text-[10px] font-semibold text-white">{t}</div>
                            <div className="text-[10px] text-neutral-500">{d}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Contadores */}
                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
                    <span className="px-2.5 py-1 rounded bg-emerald-950/30 border border-emerald-900/30 text-emerald-400">
                      {invitations.filter(i => i.whatsappSent).length} enviados
                    </span>
                    <span className="px-2.5 py-1 rounded bg-amber-950/30 border border-amber-900/30 text-amber-400">
                      {pendingWithPhone.length} pendentes com telefone
                    </span>
                    <span className="px-2.5 py-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
                      ≈ {Math.ceil(pendingWithPhone.length * 8.5 / 60)} min estimado
                    </span>
                  </div>

                  {/* Barra de progresso */}
                  {blasting && blastProgress && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] text-neutral-400">
                        <span>Enviando {blastProgress.current} de {blastProgress.total}...</span>
                        <span>{Math.round(blastProgress.current / blastProgress.total * 100)}%</span>
                      </div>
                      <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-[#25D366] h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${blastProgress.current / blastProgress.total * 100}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-neutral-500 italic">Não feche esta janela. Aguardando delay antes do próximo envio...</p>
                    </div>
                  )}

                  {/* Botão principal */}
                  <button
                    onClick={handleBlastAll}
                    disabled={blasting || pendingWithPhone.length === 0 || !evolutionOk}
                    className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-bold uppercase tracking-widest transition-colors ${
                      blasting
                        ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                        : !evolutionOk || pendingWithPhone.length === 0
                        ? 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
                        : 'bg-[#25D366] hover:bg-[#1ebc59] text-white shadow-lg shadow-green-900/20'
                    }`}
                  >
                    <MessageCircle className="w-4 h-4" />
                    {blasting
                      ? `Enviando ${blastProgress?.current ?? 0} / ${blastProgress?.total ?? 0}...`
                      : `Enviar para ${pendingWithPhone.length} família(s) agora`}
                  </button>

                  {/* Resumo */}
                  {blastDone && blastSummary && (
                    <div className={`rounded-lg px-4 py-3 text-[11px] border ${blastSummary.failed === 0 ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-300' : 'bg-amber-950/20 border-amber-800/40 text-amber-300'}`}>
                      Disparo concluído — <strong>{blastSummary.sent} enviados</strong>{blastSummary.failed > 0 ? `, ${blastSummary.failed} com falha` : ' com sucesso'}.
                    </div>
                  )}

                  {/* Log linha a linha */}
                  {blastLog.length > 0 && (
                    <div className="space-y-1 max-h-56 overflow-y-auto">
                      <div className="text-[9px] uppercase font-bold tracking-widest text-neutral-500 mb-2">Log do Disparo</div>
                      {blastLog.map((r, idx) => (
                        <div key={idx} className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-[10px] ${r.ok ? 'bg-emerald-950/20 border border-emerald-900/30' : 'bg-red-950/20 border border-red-900/30'}`}>
                          <span className={r.ok ? 'text-emerald-400' : 'text-red-400'}>{r.family}</span>
                          <span className={`font-mono ${r.ok ? 'text-emerald-500' : 'text-red-500'}`}>
                            {r.ok ? '✓ enviado' : `✗ ${r.error || 'falha'}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── 3b. MANUAL ── */}
              {envioMode === 'manual' && (
                <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6">
                  <div className="mb-5">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-[#8C7853]">Envio Manual</span>
                    <h3 className="text-sm font-cinzel uppercase tracking-wider text-white font-bold">Enviar Convites pelo WhatsApp</h3>
                    <p className="text-[11px] text-neutral-400 font-light mt-1.5 leading-relaxed max-w-2xl">
                      Abre o WhatsApp com a mensagem já preenchida. Gratuito e sem risco de bloqueio.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center mb-4">
                    <div className="flex items-center gap-2 text-[10px] font-mono">
                      <span className="px-2.5 py-1 rounded bg-emerald-950/30 border border-emerald-900/30 text-emerald-400">
                        {invitations.filter(i => i.whatsappSent).length} enviados
                      </span>
                      <span className="px-2.5 py-1 rounded bg-amber-950/30 border border-amber-900/30 text-amber-400">
                        {invitations.filter(i => !i.whatsappSent).length} pendentes
                      </span>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <input
                        type="text"
                        value={envioSearchTerm}
                        onChange={e => setEnvioSearchTerm(e.target.value)}
                        placeholder="Buscar família..."
                        className="flex-1 sm:w-56 bg-neutral-900 border border-neutral-800 rounded-md px-3 py-2 text-xs text-neutral-300 focus:outline-hidden focus:border-[#8C7853]"
                      />
                      <select
                        value={envioFilter}
                        onChange={e => setEnvioFilter(e.target.value as any)}
                        className="bg-neutral-900 border border-neutral-800 rounded-md px-2 py-2 text-[10px] uppercase font-bold text-neutral-300 focus:outline-hidden focus:border-[#8C7853]"
                      >
                        <option value="todos">Todos</option>
                        <option value="pendentes">Pendentes</option>
                        <option value="enviados">Enviados</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {invitations
                      .filter(inv => {
                        const term = envioSearchTerm.toLowerCase();
                        const matchesTerm = !term || inv.familyName.toLowerCase().includes(term);
                        const matchesFilter =
                          envioFilter === 'todos' ||
                          (envioFilter === 'enviados' && inv.whatsappSent) ||
                          (envioFilter === 'pendentes' && !inv.whatsappSent);
                        return matchesTerm && matchesFilter;
                      })
                      .map(inv => {
                        const hasPhone = !!(inv.phone || '').replace(/\D/g, '');
                        return (
                          <div
                            key={inv.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${inv.whatsappSent ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                              <div className="min-w-0">
                                <div className="text-xs font-semibold text-white truncate">{inv.familyName}</div>
                                <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                                  PIN: <span className="text-[#8C7853]">{inv.pin}</span>
                                  {inv.phone ? ` · ${inv.phone}` : ' · sem telefone cadastrado'}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {inv.whatsappSent && (
                                <button
                                  onClick={() => toggleWhatsappSent(inv.id, false)}
                                  className="text-[9px] uppercase font-bold tracking-widest text-neutral-500 hover:text-white transition-colors"
                                >
                                  Desmarcar
                                </button>
                              )}
                              <button
                                onClick={() => handleSendWhatsapp(inv)}
                                disabled={!hasPhone}
                                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-md text-[10px] uppercase font-bold tracking-widest transition-colors ${
                                  !hasPhone
                                    ? 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
                                    : inv.whatsappSent
                                    ? 'bg-neutral-800 border border-emerald-900/40 text-emerald-400 hover:bg-emerald-950/30'
                                    : 'bg-[#25D366] text-white hover:bg-[#1ebc59]'
                                }`}
                                title={hasPhone ? 'Abre o WhatsApp com a mensagem pronta' : 'Cadastre o telefone na aba Acompanhar RSVP'}
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>{inv.whatsappSent ? 'Reenviar' : 'Enviar'}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    {invitations.length === 0 && (
                      <p className="text-[11px] text-neutral-500 italic text-center py-8">
                        Nenhum convite cadastrado ainda. Crie convites na aba "Acompanhar RSVP".
                      </p>
                    )}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* 8. CRONOGRAMA CRUD */}
          {selectedAdminTab === 'cronograma' && (
            <div className="space-y-6 max-w-4xl animate-fadeIn">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-400">Cronograma do Evento ({schedule.length} atividades)</span>
                <button
                  onClick={() => setShowAddSchedule(!showAddSchedule)}
                  className="bg-[#8C7853] hover:bg-[#726141] text-white text-[10px] uppercase font-bold tracking-widest px-4 py-2.5 rounded-md flex items-center gap-1.5 shadow-sm"
                >
                  {showAddSchedule ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>{showAddSchedule ? 'Cancelar' : 'Adicionar Atividade'}</span>
                </button>
              </div>

              {/* Add schedule form */}
              <AnimatePresence>
                {showAddSchedule && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleAddScheduleSubmit}
                    className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 space-y-4 overflow-hidden"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-[9px] uppercase font-bold tracking-widest text-neutral-300 block mb-1">Horário (HH:MM)</label>
                        <input 
                          type="text" 
                          required 
                          value={schTime}
                          onChange={(e) => setSchTime(e.target.value)}
                          placeholder="Ex: 16:00" 
                          className="w-full bg-neutral-900 border border-neutral-800 rounded-md px-3.5 py-2.5 text-xs text-neutral-300 focus:outline-hidden focus:border-[#8C7853] font-mono"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-[9px] uppercase font-bold tracking-widest text-neutral-300 block mb-1">Nome da Atividade</label>
                        <input 
                          type="text" 
                          required 
                          value={schTitle}
                          onChange={(e) => setSchTitle(e.target.value)}
                          placeholder="Ex: Cerimônia Religiosa" 
                          className="w-full bg-neutral-900 border border-neutral-800 rounded-md px-3.5 py-2.5 text-xs text-neutral-300 focus:outline-hidden focus:border-[#8C7853]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] uppercase font-bold tracking-widest text-neutral-300 block mb-1">Local da Atividade</label>
                      <input 
                        type="text" 
                        required 
                        value={schLocation}
                        onChange={(e) => setSchLocation(e.target.value)}
                        placeholder="Ex: No Altar da Capela" 
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-md px-3.5 py-2.5 text-xs text-neutral-300 focus:outline-hidden focus:border-[#8C7853]"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] uppercase font-bold tracking-widest text-neutral-300 block mb-1">Breve Descrição (opcional)</label>
                      <input 
                        type="text" 
                        value={schDesc}
                        onChange={(e) => setSchDesc(e.target.value)}
                        placeholder="Ex: O início da celebração ao pôr do sol..." 
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-md px-3.5 py-2.5 text-xs text-neutral-300 focus:outline-hidden focus:border-[#8C7853]"
                      />
                    </div>

                    <button
                      type="submit"
                      className="bg-[#8C7853] hover:bg-[#726141] text-white text-[10px] uppercase font-bold tracking-widest py-3 px-6 rounded-md transition-colors"
                    >
                      Salvar Atividade no Cronograma
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Schedule Timing listing */}
              <div className="space-y-4">
                {schedule.map((item) => (
                  <div key={item.id} className="bg-neutral-950 border border-neutral-800 p-5 rounded-xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-sm font-bold text-[#8C7853] bg-neutral-900 px-3 py-1.5 rounded-md border border-neutral-800 shrink-0">
                        {item.time}
                      </span>
                      <div>
                        <h4 className="text-xs font-semibold text-white uppercase tracking-wider">{item.title}</h4>
                        <p className="text-[11px] text-neutral-400 font-light mt-0.5">Local: {item.location}</p>
                        {item.description && <p className="text-[10px] text-neutral-500 italic font-light mt-1">"{item.description}"</p>}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (window.confirm('Tem certeza de que deseja remover esta atividade?')) {
                          deleteScheduleEvent(item.id);
                        }
                      }}
                      className="p-1.5 bg-neutral-900 hover:bg-rose-950/30 text-rose-400 hover:text-white rounded-md border border-neutral-800 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}


          {/* GALERIA DE FOTOS CRUD */}
          {selectedAdminTab === 'galeria' && (
            <div className="space-y-6 max-w-5xl animate-fadeIn">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <span className="text-[9px] uppercase tracking-widest font-bold text-[#8C7853]">Gerenciar Fotos</span>
                  <h3 className="text-sm font-cinzel uppercase tracking-wider text-white font-bold">Galeria de Fotos do Casamento</h3>
                </div>
                <button
                  onClick={() => setShowAddGallery(!showAddGallery)}
                  className="bg-[#8C7853] hover:bg-[#726141] text-white text-[10px] uppercase font-bold tracking-widest px-4 py-2.5 rounded-md flex items-center gap-1.5 shadow-sm"
                >
                  {showAddGallery ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>{showAddGallery ? 'Cancelar' : 'Adicionar Foto'}</span>
                </button>
              </div>

              {/* Add form */}
              <AnimatePresence>
                {showAddGallery && (
                  <motion.form 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleAddGallerySubmit}
                    className="bg-neutral-950 border border-neutral-800 p-6 rounded-xl space-y-4 overflow-hidden"
                  >
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#8C7853] block border-b border-neutral-800 pb-1.5">Nova Imagem para a Galeria</span>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <ImagePicker
                          value={galleryImgUrl}
                          onChange={setGalleryImgUrl}
                          placeholder="https://images.unsplash.com/... ou link local"
                        />
                        <span className="text-[8px] text-neutral-500 mt-1 block">Cole uma URL pública ou clique em "Do computador" para enviar um arquivo do seu PC.</span>
                      </div>

                      <div>
                        <label className="text-[9px] uppercase font-bold tracking-widest text-neutral-300 block mb-1">Legenda da Foto (opcional)</label>
                        <input 
                          type="text" 
                          value={galleryCaption}
                          onChange={(e) => setGalleryCaption(e.target.value)}
                          placeholder="Ex: Pôr do sol na praia dos Milagres..." 
                          className="w-full bg-neutral-900 border border-neutral-800 rounded-md px-3.5 py-2.5 text-xs text-neutral-300 focus:outline-hidden focus:border-[#8C7853]"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="bg-[#8C7853] hover:bg-[#726141] text-white text-[10px] uppercase font-bold tracking-widest py-3 px-6 rounded-md transition-colors"
                    >
                      Adicionar Imagem à Galeria
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Gallery Grid */}
              <div className="bg-neutral-950 border border-neutral-800 p-6 rounded-xl">
                <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-400 block mb-4">Fotos Ativas ({gallery?.length || 0} fotos)</span>
                
                {(!gallery || gallery.length === 0) ? (
                  <p className="text-xs text-center text-neutral-500 py-8">A galeria de fotos está vazia. Adicione novas imagens acima!</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {gallery.map((item) => (
                      <div key={item.id} className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden group relative flex flex-col justify-between">
                        {/* Image preview */}
                        <div className="relative h-32 bg-neutral-950">
                          <img 
                            src={item.url} 
                            alt={item.caption || "Foto da galeria"} 
                            className="w-full h-full object-cover"
                          />
                          {/* Delete button hovering */}
                          <button
                            onClick={() => {
                              if (window.confirm('Excluir esta foto da galeria?')) {
                                handleDeleteGalleryItem(item.id);
                              }
                            }}
                            className="absolute top-2 right-2 p-1.5 bg-neutral-950/80 border border-neutral-800 hover:bg-rose-900 text-rose-400 hover:text-white rounded-md transition-colors"
                            title="Remover foto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Caption area */}
                        <div className="p-3 bg-neutral-900 flex-1 flex flex-col justify-between gap-2">
                          {editingGalId === item.id ? (
                            <div className="space-y-1.5">
                              <input 
                                type="text"
                                value={editingGalCaption}
                                onChange={(e) => setEditingGalCaption(e.target.value)}
                                className="w-full bg-neutral-950 border border-neutral-800 rounded-sm px-2 py-1 text-[10px] text-neutral-300 focus:outline-hidden focus:border-[#8C7853]"
                              />
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleSaveGalleryCaption(item.id)}
                                  className="px-2 py-0.5 bg-emerald-950/40 border border-emerald-800 text-emerald-400 rounded-xs text-[8px] font-bold uppercase tracking-wider"
                                >
                                  Salvar
                                </button>
                                <button
                                  onClick={() => setEditingGalId(null)}
                                  className="px-2 py-0.5 bg-neutral-800 border border-neutral-700 text-neutral-400 rounded-xs text-[8px] font-bold uppercase tracking-wider"
                                >
                                  Sair
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-between items-start gap-1">
                              <p className="text-[10px] text-neutral-300 leading-normal line-clamp-2 italic">
                                {item.caption || <span className="text-neutral-500 font-light font-mono text-[9px]">(sem legenda)</span>}
                              </p>
                              <button
                                onClick={() => {
                                  setEditingGalId(item.id);
                                  setEditingGalCaption(item.caption || '');
                                }}
                                className="p-1 text-neutral-500 hover:text-[#8C7853] transition-colors shrink-0"
                                title="Editar legenda"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};
