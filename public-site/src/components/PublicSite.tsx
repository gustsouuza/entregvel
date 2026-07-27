/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  Clock, 
  MapPin, 
  Gift, 
  Check, 
  Copy, 
  Upload, 
  X, 
  Smile, 
  Phone, 
  MessageSquare,
  Sparkles,
  Info,
  Compass,
  Briefcase,
  ChevronRight,
  Calendar,
  Lock
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { GiftItem } from '../types';
import { WhatsappHelpFooterButton } from './WhatsappHelpButton';

interface PublicSiteProps {
  isPreviewMode?: boolean;
}

export const PublicSite: React.FC<PublicSiteProps> = ({ isPreviewMode = false }) => {
  const { 
    weddingData, 
    submitRSVP, 
    submitMessage, 
    likeMessage, 
    addContribution, 
    trackClick,
    updateWeddingData,
    setCurrentView
  } = useApp();

  const { theme, partner1, partner2, eventDate, ceremonyTime, timeline, gallery, schedule, hospitality, gifts, dressCode, messages } = weddingData;

  // Real-time countdown state
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  
  // Interactive UI states
  const [selectedGift, setSelectedGift] = useState<GiftItem | null>(null);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [giftStep, setGiftStep] = useState<'details' | 'form' | 'success'>('details');
  const [copiedPix, setCopiedPix] = useState(false);
  
  // Gift Contribution form state
  const [contribName, setContribName] = useState('');
  const [contribMessage, setContribMessage] = useState('');
  const [contribValue, setContribValue] = useState('');
  const [contribFile, setContribFile] = useState<File | null>(null);
  const [contribFileName, setContribFileName] = useState('');

  // RSVP Form state
  const [rsvpName, setRsvpName] = useState('');
  const [rsvpPhone, setRsvpPhone] = useState('');
  const [rsvpAttending, setRsvpAttending] = useState(true);
  const [rsvpCompanions, setRsvpCompanions] = useState(0);
  const [rsvpDiet, setRsvpDiet] = useState('');
  const [rsvpMsg, setRsvpMsg] = useState('');
  const [rsvpSuccessData, setRsvpSuccessData] = useState<any | null>(null);
  const [rsvpError, setRsvpError] = useState<string | null>(null);
  const [rsvpSubmitting, setRsvpSubmitting] = useState(false);

  // RSVP PIN Protection state
  // IMPORTANTE (segurança): o PIN NUNCA é persistido em localStorage/sessionStorage.
  // Isso garante que, a cada nova visita/recarregamento — independente de navegador
  // ou dispositivo — o site sempre exija a digitação do PIN novamente antes de
  // mostrar ou alterar qualquer dado de confirmação de presença.
  const [showRsvpPinModal, setShowRsvpPinModal] = useState(false);
  const [isPinValidated, setIsPinValidated] = useState(false);
  const [rsvpPinInput, setRsvpPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // Family Pin state (mantido apenas em memória, nunca persistido)
  const [validatedPin, setValidatedPin] = useState('');

  const [tempGuestStatuses, setTempGuestStatuses] = useState<Record<string, boolean | null>>({});
  // Guarda quais convidados o usuário já clicou "Confirmar/Não vai" nesta sessão.
  // Usado para não deixar o polling de 20s sobrescrever uma escolha que ele já
  // fez, mas ainda assim manter os campos que ele NÃO tocou sincronizados com
  // o servidor (ex: outra pessoa da família confirmando pelo celular dela).
  const touchedGuestIdsRef = useRef<Set<string>>(new Set());

  const matchedInvitation = (weddingData.invitations || []).find(
    inv => inv.pin.toUpperCase() === validatedPin.toUpperCase()
  );

  // Reseta o controle de "convidados já tocados" só quando o convite muda de
  // fato (PIN diferente) — nunca durante o polling do mesmo convite.
  useEffect(() => {
    touchedGuestIdsRef.current = new Set();
  }, [matchedInvitation?.id]);

  // Initialize/sincroniza a seleção de presença dos convidados.
  // O weddingData é recarregado a cada 20s (polling), o que cria um novo objeto
  // "matchedInvitation" mesmo sem mudança real de dados. Por isso este efeito
  // roda de novo a cada poll — mas em vez de sobrescrever tudo (o que apagava
  // silenciosamente o "Sim/Não" que o convidado já tinha marcado antes de dar
  // tempo de salvar), ele só atualiza os convidados que o usuário AINDA NÃO
  // tocou nesta sessão. Assim: (a) a escolha em andamento nunca some, e (b) se
  // outra pessoa da mesma família confirmar por outro celular enquanto esta
  // página está aberta, essa mudança ainda chega aqui pros campos não mexidos.
  useEffect(() => {
    if (matchedInvitation) {
      setTempGuestStatuses(prev => {
        const next = { ...prev };
        matchedInvitation.guests?.forEach(g => {
          if (!touchedGuestIdsRef.current.has(g.id)) {
            next[g.id] = g.confirmed;
          }
        });
        return next;
      });

      // Prefill WhatsApp phone if they have it
      if (matchedInvitation.phone && !rsvpPhone) {
        setRsvpPhone(matchedInvitation.phone);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchedInvitation]);

  // OBS (segurança): removida a auto-validação via "?pin=" na URL.
  // Antes, um link contendo o PIN validava automaticamente e pulava a etapa
  // de digitação — o que contrariava a exigência de sempre passar pela tela
  // de PIN ao clicar em "Confirmar Presença". Agora o convidado precisa
  // digitar o PIN manualmente em toda visita, mesmo que chegue por um link direto.

  // Guest Wall form state
  const [guestName, setGuestName] = useState('');
  const [guestMsg, setGuestMsg] = useState('');
  const [guestAvatar, setGuestAvatar] = useState('');

  // Gallery Lightbox state
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [galleryActiveIdx, setGalleryActiveIdx] = useState(0);

  // Carrossel horizontal da galeria (mobile): fotos enfileiradas, arrasta com
  // o dedo (direita pra esquerda) pra passar; fileira de miniaturas indica a posição.
  const galleryScrollRef = useRef<HTMLDivElement>(null);
  const [mobileGalleryIndex, setMobileGalleryIndex] = useState(0);

  const handleGalleryHScroll = () => {
    const el = galleryScrollRef.current;
    if (!el || !el.children.length) return;
    const firstCard = el.children[0] as HTMLElement;
    const cardWidth = firstCard.offsetWidth + 16; // 16px = gap-4
    const idx = Math.round(el.scrollLeft / cardWidth);
    setMobileGalleryIndex(Math.min(gallery.length - 1, Math.max(0, idx)));
  };

  const scrollToGalleryIndex = (idx: number) => {
    const el = galleryScrollRef.current;
    if (!el) return;
    const card = el.children[idx] as HTMLElement;
    if (card) {
      el.scrollTo({ left: card.offsetLeft - 24, behavior: 'smooth' });
    }
  };

  // Detecta fotos na horizontal (paisagem) pra aplicar tarja off-white em cima/embaixo
  // em vez de cortar a foto com object-cover.
  const [landscapeItems, setLandscapeItems] = useState<Record<string, boolean>>({});
  const handleGalleryImgLoad = (id: string) => (e: React.SyntheticEvent<HTMLImageElement>) => {
    const t = e.currentTarget;
    if (t.naturalWidth > t.naturalHeight && !landscapeItems[id]) {
      setLandscapeItems(prev => ({ ...prev, [id]: true }));
    }
  };
  
  // Mobile menu responsive state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Scroll detection state to show/hide navbar
  const [scrolledDown, setScrolledDown] = useState(false);

  // Active page state for guest site routing
  const [activePage, setActivePage] = useState<'inicio' | 'cerimonia' | 'vestimenta' | 'presentes' | 'rsvp'>('inicio');

  // Filter gift category
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');

  // Categories list derived from gifts
  const categories = ['todos', ...Array.from(new Set(gifts.map(g => g.category)))];

  // Calculate countdown
  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(eventDate + 'T' + (ceremonyTime || '17:00') + ':00') - +new Date();
      let left = { days: 0, hours: 0, minutes: 0, seconds: 0 };

      if (difference > 0) {
        left = {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        };
      }
      setTimeLeft(left);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [eventDate, ceremonyTime]);

  // Detect window scroll to hide/show navbar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolledDown(true);
      } else {
        setScrolledDown(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Apply Theme Typography Style Class
  const getFontFamilyClass = (family: string) => {
    switch(family) {
      case 'serif': return 'font-serif';
      case 'romantic': return 'font-romantic';
      case 'cinzel': return 'font-cinzel';
      case 'mono': return 'font-mono';
      default: return 'font-sans';
    }
  };

  const fontClass = getFontFamilyClass(theme.fontFamily);

  // Handle PIX Copy Action
  const copyPixKey = () => {
    navigator.clipboard.writeText(weddingData.pixKeyValue);
    setCopiedPix(true);
    trackClick('copiar_pix');
    setTimeout(() => setCopiedPix(false), 2000);
  };

  // Handle Gift contribution submit
  const handleGiftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGift || !contribName) return;

    addContribution({
      giftId: selectedGift.id,
      giftName: selectedGift.name,
      donorName: contribName,
      message: contribMessage,
      value: contribValue ? parseFloat(contribValue) : selectedGift.price,
      comprovanteUrl: contribFileName ? 'uploaded_comprovante_mock.pdf' : undefined
    });

    setGiftStep('success');
    trackClick('enviar_presente');
  };

  // Handle RSVP Submit
  // Importante: só mostramos a confirmação (e só limpamos o formulário)
  // depois que a API confirma que o dado foi salvo de verdade. Se a
  // requisição falhar (sem internet, instabilidade, erro no servidor etc),
  // mostramos uma mensagem de erro clara e mantemos o que o convidado
  // preencheu, para ele poder tentar novamente sem perder nada.
  const handleRsvpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rsvpSubmitting) return; // evita clique duplo enquanto já está enviando
    setRsvpError(null);

    if (matchedInvitation) {
      // 1. Dynamic family invitation RSVP logic
      const updatedGuests = matchedInvitation.guests.map(g => {
        const val = tempGuestStatuses[g.id];
        return {
          ...g,
          confirmed: val === undefined ? null : val
        };
      });

      // Envia apenas o convite que mudou (e não a lista inteira de convites),
      // para não disparar uma requisição por família cadastrada no evento.
      const mergedInvitation = {
        ...matchedInvitation,
        guests: updatedGuests,
        phone: rsvpPhone || matchedInvitation.phone,
        notes: matchedInvitation.notes ? matchedInvitation.notes + (rsvpMsg ? ` | Recado: ${rsvpMsg}` : '') : (rsvpMsg ? `Recado: ${rsvpMsg}` : '')
      };

      setRsvpSubmitting(true);
      const ok = await updateWeddingData({ invitations: [mergedInvitation] });
      setRsvpSubmitting(false);

      if (!ok) {
        setRsvpError('Não conseguimos confirmar sua presença agora. Verifique sua internet e toque em "Salvar Confirmações" novamente.');
        return;
      }

      // Salvo com sucesso: a partir daqui o servidor já reflete a escolha do
      // usuário, então libera o polling pra voltar a sincronizar normalmente
      // (útil se ele reabrir o formulário e editar de novo na mesma visita).
      touchedGuestIdsRef.current = new Set();

      // Save a general success card
      setRsvpSuccessData({
        id: matchedInvitation.id,
        name: matchedInvitation.familyName,
        code: matchedInvitation.pin,
        attendingCount: updatedGuests.filter(g => g.confirmed === true).length
      });

      trackClick('rsvp_familia_confirmado');
      
      // Also write message to the guest wall if filled
      if (rsvpMsg) {
        submitMessage({
          author: matchedInvitation.familyName,
          text: rsvpMsg,
          avatar: ''
        });
      }

      setRsvpMsg('');
    } else {
      // 2. Fallback standard RSVP flow (e.g. bypass PIN)
      if (!rsvpName || !rsvpPhone) return;

      setRsvpSubmitting(true);
      try {
        const result = await submitRSVP({
          name: rsvpName,
          phone: rsvpPhone,
          attending: rsvpAttending,
          companions: rsvpAttending ? rsvpCompanions : 0,
          dietaryRestrictions: rsvpAttending && rsvpDiet ? rsvpDiet : undefined,
          message: rsvpMsg || undefined
        });

        setRsvpSuccessData(result);
        trackClick('rsvp_confirmado');

        // Reset fields (só depois de confirmado com sucesso)
        setRsvpName('');
        setRsvpPhone('');
        setRsvpAttending(true);
        setRsvpCompanions(0);
        setRsvpDiet('');
        setRsvpMsg('');
      } catch (err) {
        setRsvpError('Não conseguimos confirmar sua presença agora. Verifique sua internet e toque em "Confirmar Presença" novamente.');
      } finally {
        setRsvpSubmitting(false);
      }
    }
  };

  // Handle Guest Message Submit
  const handleGuestMsgSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName || !guestMsg) return;

    submitMessage({
      author: guestName,
      content: guestMsg,
      avatarUrl: guestAvatar || undefined
    });

    setGuestName('');
    setGuestMsg('');
    setGuestAvatar('');
    trackClick('mural_post');
  };

  // Navigation helper for RSVP that opens PIN modal if not validated
  const handleRsvpNav = (shortcutName?: string) => {
    setActivePage('rsvp');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (shortcutName) {
      trackClick(shortcutName);
    }
    if (!isPinValidated) {
      setShowRsvpPinModal(true);
    }
  };

  // Handle PIN validation
  const handleValidatePin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = rsvpPinInput.trim().toUpperCase();
    // Accept standard pins: '582914', '150826' (wedding date), '123456', or customize code in Admin
    const defaultPins = ['582914', '150826', '123456', '2026', 'NILTONELUCIANA'];
    const customPin = weddingData.rsvpPinCode ? weddingData.rsvpPinCode.toUpperCase() : '';

    const foundInvitation = (weddingData.invitations || []).find(
      inv => inv.pin.toUpperCase() === cleanPin
    );

    // Segurança: validação vale apenas para a sessão/aba atual em memória.
    // Nada é gravado em localStorage — ao recarregar ou reabrir o site
    // (em qualquer navegador/dispositivo), o PIN precisa ser digitado de novo.
    if (foundInvitation) {
      setIsPinValidated(true);
      setValidatedPin(cleanPin);
      setShowRsvpPinModal(false);
      setPinError('');
    } else if (defaultPins.includes(cleanPin) || (customPin && cleanPin === customPin)) {
      setIsPinValidated(true);
      setValidatedPin(cleanPin);
      setShowRsvpPinModal(false);
      setPinError('');
    } else {
      setPinError('PIN de acesso incorreto. Verifique seu convite ou consulte os noivos.');
    }
  };

  // Helper for generating dynamic PIX BR Code mockup representation
  const generatePixPayload = () => {
    const cleanKey = weddingData.pixKeyValue.replace(/[^a-zA-Z0-9@._-]/g, '');
    const cleanName = weddingData.pixFavoredName.substring(0, 25).toUpperCase();
    return `00020101021126580014br.gov.bcb.pix0136${cleanKey}5204000053039865406${selectedGift?.price || '150'}.005802BR5925${cleanName}6009SAO_PAULO62070503***6304`;
  };

  return (
    <div 
      className={`min-h-screen relative overflow-x-hidden transition-all duration-500 ease-out pb-16 ${activePage === 'inicio' ? 'pt-0' : 'pt-20'}`} 
      style={{ 
        backgroundColor: theme.bgColor, 
        color: theme.textColor,
        fontFamily: theme.fontFamily === 'serif' ? 'var(--font-serif)' : theme.fontFamily === 'romantic' ? 'var(--font-romantic)' : theme.fontFamily === 'mono' ? 'var(--font-mono)' : 'var(--font-sans)'
      }}
    >
      {/* Floating Sticky Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 h-20 flex items-center justify-between px-6 md:px-12 transition-all duration-500 ease-in-out ${
        (activePage !== 'inicio' || scrolledDown) 
          ? 'bg-[#607284]/95 backdrop-blur-md border-b border-[#758799] shadow-md' 
          : 'bg-transparent border-b border-transparent shadow-none'
      }`}>
        {/* Monogram */}
        <div className="flex items-center space-x-2">
          <span 
            className="font-cinzel text-base md:text-lg font-light tracking-[0.25em] text-gray-200 cursor-pointer" 
            onClick={() => { setActivePage('inicio'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          >
            L<span className="text-[10px] text-gray-200/60 font-sans mx-0.5">&</span>N
          </span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-8 text-[15px] uppercase tracking-[0.2em] font-medium text-white/80">
          <button 
            onClick={() => { setActivePage('inicio'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
            className={`hover:text-[#D9C8A9] transition-colors ${activePage === 'inicio' ? 'text-[#D9C8A9] font-semibold' : ''}`}
          >
            Início
          </button>
          <button 
            onClick={() => { setActivePage('cerimonia'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
            className={`hover:text-[#D9C8A9] transition-colors ${activePage === 'cerimonia' ? 'text-[#D9C8A9] font-semibold' : ''}`}
          >
            Cerimônia
          </button>
          <button 
            onClick={() => { setActivePage('vestimenta'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
            className={`hover:text-[#D9C8A9] transition-colors ${activePage === 'vestimenta' ? 'text-[#D9C8A9] font-semibold' : ''}`}
          >
            Código de Vestimenta
          </button>
          <button 
            onClick={() => { setActivePage('presentes'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
            className={`hover:text-[#D9C8A9] transition-colors ${activePage === 'presentes' ? 'text-[#D9C8A9] font-semibold' : ''}`}
          >
            Lista de Presentes
          </button>
          <button 
            onClick={() => handleRsvpNav('nav_rsvp_top')} 
            className={`hover:text-[#D9C8A9] transition-colors ${activePage === 'rsvp' ? 'text-[#D9C8A9] font-semibold' : ''}`}
          >
            Confirmar Presença
          </button>
        </nav>

        {/* RSVP Fast Button */}
        <div className="hidden lg:flex items-center">
          <button 
            onClick={() => handleRsvpNav('nav_rsvp_btn_fast')}
            className="border border-[#D9C8A9]/50 hover:bg-[#D9C8A9] hover:text-[#607284] text-[#D9C8A9] text-[13px] uppercase tracking-[0.15em] font-bold px-5 py-2.5 rounded-md transition-all duration-300"
            id="nav-rsvp-btn"
          >
            Confirmar Presença
          </button>
        </div>

        {/* Mobile Hamburger Icon */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden text-white/80 hover:text-white p-2 focus:outline-hidden"
          aria-label="Menu"
        >
          <div className="w-5 h-4 flex flex-col justify-between">
            <span className={`h-0.5 w-full bg-current transform transition-all duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
            <span className={`h-0.5 w-full bg-current transition-all duration-200 ${mobileMenuOpen ? 'opacity-0' : ''}`}></span>
            <span className={`h-0.5 w-full bg-current transform transition-all duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
          </div>
        </button>

        {/* Mobile Drawer Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="absolute top-20 left-0 right-0 bg-[#607284] border-b border-[#758799] shadow-2xl overflow-hidden lg:hidden flex flex-col p-6 space-y-4 text-sm uppercase tracking-widest font-semibold text-white/90"
            >
              <button 
                onClick={() => { setActivePage('inicio'); setMobileMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
                className={`text-left py-2 border-b border-[#758799]/45 hover:text-[#D9C8A9] transition-colors ${activePage === 'inicio' ? 'text-[#D9C8A9]' : ''}`}
              >
                Início
              </button>
              <button 
                onClick={() => { setActivePage('cerimonia'); setMobileMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
                className={`text-left py-2 border-b border-[#758799]/45 hover:text-[#D9C8A9] transition-colors ${activePage === 'cerimonia' ? 'text-[#D9C8A9]' : ''}`}
              >
                Cerimônia
              </button>
              <button 
                onClick={() => { setActivePage('vestimenta'); setMobileMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
                className={`text-left py-2 border-b border-[#758799]/45 hover:text-[#D9C8A9] transition-colors ${activePage === 'vestimenta' ? 'text-[#D9C8A9]' : ''}`}
              >
                Código de Vestimenta
              </button>
              <button 
                onClick={() => { setActivePage('presentes'); setMobileMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
                className={`text-left py-2 border-b border-[#758799]/45 hover:text-[#D9C8A9] transition-colors ${activePage === 'presentes' ? 'text-[#D9C8A9]' : ''}`}
              >
                Lista de Presentes
              </button>
              <button 
                onClick={() => { handleRsvpNav('mobile_nav_rsvp'); setMobileMenuOpen(false); }} 
                className={`text-left py-2 border-b border-[#758799]/45 hover:text-[#D9C8A9] transition-colors ${activePage === 'rsvp' ? 'text-[#D9C8A9]' : ''}`}
              >
                Confirmar Presença
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Background Sparkles / Star Effect */}
      {theme.backgroundEffect !== 'none' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(255,255,255,0.15))]"></div>
          {/* Subtle slow floating sparkles */}
          <div className="absolute w-2 h-2 rounded-full bg-white opacity-40 blur-xs top-24 left-1/4 animate-float-slow"></div>
          <div className="absolute w-3 h-3 rounded-full bg-white opacity-30 blur-xs top-96 right-1/4 animate-pulse-slow"></div>
          <div className="absolute w-1.5 h-1.5 rounded-full bg-white opacity-50 top-1/3 left-10 animate-float-slow"></div>
          <div className="absolute w-2 h-2 rounded-full bg-white opacity-45 blur-xs bottom-32 right-12 animate-pulse-slow"></div>
        </div>
      )}

      {activePage === 'inicio' && (
        <motion.div
          key="inicio-page"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Hero Section */}
          <section className="relative min-h-[100dvh] md:min-h-screen flex items-end md:items-center justify-center text-center px-6 pb-14 md:pb-0 z-10 overflow-hidden">
        {/* Immersive Classical Landscape Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/assets/images/hero_landscape.jpg" 
            alt="Luciana & Nilton Cover" 
            className="w-full h-full object-cover object-[center_14%] md:object-[center_38%] select-none scale-100 filter brightness-[0.6] transition-all duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/35"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-white">
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="font-romantic text-3xl md:text-4xl italic text-[#D9C8A9] mb-4"
          >
            Save the date
          </motion.p>
          
          <motion.h1 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.2 }}
            className="font-cinzel text-[30px] md:text-6xl tracking-[0.1em] font-light mb-6 text-gray-300 drop-shadow-md select-none"
          >
            LUCIANA & NILTON
          </motion.h1>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="w-24 h-[1px] bg-[#D9C8A9]/60 mx-auto mb-6"
          />

          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="font-cinzel text-sm md:text-base tracking-[0.25em] font-medium mb-8 uppercase text-white/95"
          >
            19.09.2026 — Faltam {timeLeft.days > 0 ? `${timeLeft.days} dias` : 'Chegou o dia!'}
          </motion.p>

          {/* Biblical Verse Quote */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.8 }}
            className="max-w-2xl mx-auto mb-6 md:mb-12 px-4"
          >
            <p className="font-serif italic text-sm md:text-base text-white/80 leading-relaxed">
              “Para que todos vejam e saibam, considerem e juntamente entendam que a mão do Senhor fez isso.”
            </p>
            <span className="font-cinzel text-[10px] tracking-[0.2em] uppercase text-[#D9C8A9] mt-2 block">
              Isaías 41:20
            </span>
          </motion.div>

          {/* RSVP Button - Mobile only, mirrors desktop nav button */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.9 }}
            className="lg:hidden mb-4"
          >
            <button
              onClick={() => handleRsvpNav('hero_rsvp_btn_mobile')}
              className="border border-[#D9C8A9]/50 hover:bg-[#D9C8A9] hover:text-[#607284] text-[#D9C8A9] text-[13px] uppercase tracking-[0.15em] font-bold px-6 py-3 rounded-md transition-all duration-300"
            >
              Confirmar Presença
            </button>
          </motion.div>


        </div>

      </section>

      {/* Visual Shortcuts Navigation Grid (Photo 2 - ao rolar) */}
      <section id="shortcuts-grid" className="py-16 md:py-24 px-6 max-w-7xl mx-auto z-10 relative">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Lista de Presentes */}
          <button 
            onClick={() => { setActivePage('presentes'); window.scrollTo({ top: 0, behavior: 'smooth' }); trackClick('shortcut_presentes'); }}
            className="group relative h-72 border border-[#D9C8A9]/20 rounded-xl overflow-hidden shadow-md cursor-pointer block text-left w-full"
          >
            <div className="absolute inset-0 z-0">
              <img 
                src="/assets/images/gift_package.jpg" 
                alt="Lista de Presentes" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-75"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
            </div>
            <div className="absolute inset-0 z-10 flex flex-col justify-end p-6">
              <h3 className="font-cinzel text-sm tracking-[0.2em] font-semibold text-white group-hover:text-[#D9C8A9] transition-colors mb-1.5">
                LISTA DE PRESENTES
              </h3>
              <p className="text-[10px] uppercase tracking-[0.15em] text-[#D9C8A9]/80 flex items-center gap-1.5 transition-all group-hover:translate-x-1.5">
                Presentear Casal <ChevronRight className="w-3.5 h-3.5" />
              </p>
            </div>
          </button>

          {/* Card 2: Confirmar Presença */}
          <button 
            onClick={() => handleRsvpNav('shortcut_rsvp')}
            className="group relative h-72 border border-[#D9C8A9]/20 rounded-xl overflow-hidden shadow-md cursor-pointer block text-left w-full"
          >
            <div className="absolute inset-0 z-0">
              <img 
                src="/assets/images/reaching_hands.jpg" 
                alt="Confirmar Presença" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-75"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
            </div>
            <div className="absolute inset-0 z-10 flex flex-col justify-end p-6">
              <h3 className="font-cinzel text-sm tracking-[0.2em] font-semibold text-white group-hover:text-[#D9C8A9] transition-colors mb-1.5">
                CONFIRMAR PRESENÇA
              </h3>
              <p className="text-[10px] uppercase tracking-[0.15em] text-[#D9C8A9]/80 flex items-center gap-1.5 transition-all group-hover:translate-x-1.5">
                Fazer RSVP <ChevronRight className="w-3.5 h-3.5" />
              </p>
            </div>
          </button>

          {/* Card 3: Pré-Wedding */}
          <a 
            href="#galeria"
            className="group relative h-72 border border-[#D9C8A9]/20 rounded-xl overflow-hidden shadow-md cursor-pointer block"
            onClick={() => { setActivePage('inicio'); trackClick('shortcut_galeria'); }}
          >
            <div className="absolute inset-0 z-0">
              <img 
                src="/assets/images/hero_landscape.jpg" 
                alt="Pré-Wedding" 
                className="w-full h-full object-cover object-[center_28%] md:object-[center_14%] group-hover:scale-105 transition-transform duration-700 brightness-75"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
            </div>
            <div className="absolute inset-0 z-10 flex flex-col justify-end p-6">
              <h3 className="font-cinzel text-sm tracking-[0.2em] font-semibold text-white group-hover:text-[#D9C8A9] transition-colors mb-1.5">
                PRÉ-WEDDING
              </h3>
              <p className="text-[10px] uppercase tracking-[0.15em] text-[#D9C8A9]/80 flex items-center gap-1.5 transition-all group-hover:translate-x-1.5">
                Ver Galeria <ChevronRight className="w-3.5 h-3.5" />
              </p>
            </div>
          </a>

          {/* Card 4: A Cerimônia */}
          <button 
            onClick={() => { setActivePage('cerimonia'); window.scrollTo({ top: 0, behavior: 'smooth' }); trackClick('shortcut_cerimonia'); }}
            className="group relative h-72 border border-[#D9C8A9]/20 rounded-xl overflow-hidden shadow-md cursor-pointer block text-left w-full"
          >
            <div className="absolute inset-0 z-0">
              <img 
                src="/assets/images/outdoor_ceremony.jpg" 
                alt="A Cerimônia" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-75"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
            </div>
            <div className="absolute inset-0 z-10 flex flex-col justify-end p-6">
              <h3 className="font-cinzel text-sm tracking-[0.2em] font-semibold text-white group-hover:text-[#D9C8A9] transition-colors mb-1.5">
                A CERIMÔNIA
              </h3>
              <p className="text-[10px] uppercase tracking-[0.15em] text-[#D9C8A9]/80 flex items-center gap-1.5 transition-all group-hover:translate-x-1.5">
                Local & Horário <ChevronRight className="w-3.5 h-3.5" />
              </p>
            </div>
          </button>
        </div>
      </section>

      {/* Galeria (Grid / Bento Layout) */}
      <section id="galeria" className="py-24 bg-white/40 border-t border-b border-[#8C7853]/10 px-6 z-10 relative">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <span className="font-cinzel text-xs tracking-widest uppercase text-[#8C7853] font-bold block mb-2">
              Galeria de Fotos
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-light text-[#2C2520] tracking-wider italic">
              Nossos Momentos
            </h2>
            <div className="w-12 h-[1px] bg-[#8C7853]/40 mx-auto mt-4"></div>
            <p className="text-[11px] md:text-xs text-[#2C2520]/60 uppercase tracking-widest mt-3">
              Cada instante guardado no coração e agora compartilhado com você
            </p>
          </div>

          {/* Versão Mobile — carrossel horizontal: fotos enfileiradas, arraste
              da direita pra esquerda pra passar. Fileira de miniaturas por
              cima da foto indica em qual imagem você está. */}
          <div className="md:hidden -mx-6 px-6" style={{ height: '72dvh' }}>
            <div
              ref={galleryScrollRef}
              onScroll={handleGalleryHScroll}
              className="flex gap-4 overflow-x-scroll snap-x snap-mandatory h-full [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: 'none' }}
            >
              {gallery.map((item, idx) => (
                <div
                  key={item.id}
                  onClick={() => { setLightboxIndex(idx); trackClick(`abrir_lightbox_mobile_${idx}`); }}
                  className={`snap-center shrink-0 w-[86%] h-full relative transition-all duration-300 ${
                    idx === mobileGalleryIndex ? 'scale-100 opacity-100' : 'scale-[0.94] opacity-70'
                  }`}
                >
                  <div className="relative w-full h-full bg-white p-2 rounded-2xl shadow-lg">
                    <div className="relative w-full h-full rounded-xl overflow-hidden bg-[#FAF3E9]">
                      <img
                        src={item.url}
                        alt={item.caption || 'Foto do casamento'}
                        loading="lazy"
                        onLoad={handleGalleryImgLoad(item.id)}
                        className={`w-full h-full ${landscapeItems[item.id] ? 'object-contain' : 'object-cover'}`}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent"></div>

                      {/* Contador */}
                      <span className="absolute top-4 right-4 text-white/80 text-[10px] font-mono bg-black/40 px-2 py-0.5 rounded-full">
                        {idx + 1}/{gallery.length}
                      </span>

                      {/* Rodapé: fileira de miniaturas (indicador de posição) + legenda */}
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <div
                          className="flex gap-1.5 overflow-x-auto mb-3 [&::-webkit-scrollbar]:hidden"
                          style={{ scrollbarWidth: 'none' }}
                        >
                          {gallery.map((thumb, thumbIdx) => (
                            <button
                              key={thumb.id}
                              onClick={(e) => { e.stopPropagation(); scrollToGalleryIndex(thumbIdx); }}
                              className={`shrink-0 w-9 h-9 rounded-md overflow-hidden border-2 transition-all ${
                                thumbIdx === mobileGalleryIndex ? 'border-[#D9C8A9] scale-105' : 'border-white/30 opacity-60'
                              }`}
                            >
                              <img src={thumb.url} alt="" className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                        <span className="text-[#D9C8A9] text-[10px] uppercase tracking-widest font-mono mb-1 flex items-center gap-1">
                          <Heart className="w-3 h-3 fill-[#D9C8A9]" /> Luciana & Nilton
                        </span>
                        <p className="text-white text-sm font-serif italic font-light line-clamp-2">
                          {item.caption || 'Nosso amor'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Versão Tablet/Desktop — grid bento (igual já era) */}
          <motion.div 
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.05
                }
              }
            }}
            className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
          >
            {gallery.map((item, idx) => {
              // Custom spanning/layout classes to create an artistic bento/masonry grid feel on desktop
              let gridSpanClass = "col-span-1 aspect-square";
              if (idx === 1 || idx === 7 || idx === 11) {
                gridSpanClass = "col-span-1 md:col-span-2 md:aspect-[16/10] aspect-square";
              } else if (idx === 4 || idx === 14) {
                gridSpanClass = "col-span-1 md:row-span-2 md:aspect-[3/4] aspect-square";
              }

              return (
                <motion.div
                  key={item.id}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
                  }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => {
                    setLightboxIndex(idx);
                    trackClick(`abrir_lightbox_grid_${idx}`);
                  }}
                  className={`${gridSpanClass} relative rounded-xl overflow-hidden cursor-pointer group shadow-md hover:shadow-xl transition-all duration-300 border border-[#8C7853]/5 bg-[#FAF3E9]`}
                >
                  <img 
                    src={item.url} 
                    alt={item.caption || 'Foto do casamento'} 
                    loading="lazy"
                    onLoad={handleGalleryImgLoad(item.id)}
                    className={`w-full h-full transition-transform duration-700 ease-out group-hover:scale-105 ${
                      landscapeItems[item.id] ? 'object-contain' : 'object-cover'
                    }`}
                  />
                  {/* Elegant overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                    <span className="text-[#D9C8A9] text-[10px] uppercase tracking-widest font-mono mb-1 flex items-center gap-1">
                      <Heart className="w-3 h-3 fill-[#D9C8A9]" /> Luciana & Nilton
                    </span>
                    <p className="text-white text-xs md:text-sm font-serif italic font-light line-clamp-2">
                      {item.caption || 'Nosso amor'}
                    </p>
                  </div>
                  {/* Subtle decorative frame border */}
                  <div className="absolute inset-3 border border-white/0 group-hover:border-white/10 rounded-lg pointer-events-none transition-all duration-300"></div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>



      {/* Informações: Cerimônia, Recepção e Dress Code */}
      <section id="cerimonia" className="py-24 bg-[#E8DCD0]/20 border-t border-b border-[#8C7853]/10 px-6 z-10 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="font-cinzel text-sm tracking-widest uppercase text-[#8C7853] font-bold block mb-2">Detalhes</span>
            <h2 className="font-cinzel text-2xl md:text-3xl tracking-wider uppercase">Local & Cronograma</h2>
            <div className="w-12 h-[1px] bg-[#8C7853]/40 mx-auto mt-4"></div>
          </div>

          {/* Side-by-Side Split Blocks (Cerimônia e Recepção - Photo 3 style) */}
          <div className="space-y-16 max-w-5xl mx-auto mb-20">
            {/* Cerimônia Split Card */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border border-[#8C7853]/15 rounded-2xl overflow-hidden shadow-xl">
              {/* Left Column: Ceremony Image */}
              <div className="lg:col-span-7 h-80 lg:h-auto min-h-[360px] relative">
                <img 
                  src="/assets/images/outdoor_ceremony.jpg" 
                  alt="A Cerimônia" 
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/10"></div>
              </div>
              
              {/* Right Column: Ceremony Details */}
              <div className="lg:col-span-5 bg-[#FDFBF7] p-8 md:p-12 flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-[#8C7853]/10">
                <span className="font-cinzel text-sm uppercase font-bold tracking-[0.2em] text-[#8C7853] mb-2 block">Cenário dos Nossos Votos</span>
                <h3 className="font-cinzel text-xl md:text-2xl uppercase tracking-wider text-[#2C2520] font-light mb-4">A Cerimônia</h3>
                
                <p className="text-sm text-[#2C2520]/70 leading-relaxed font-light mb-8">
                  Nossa cerimônia terá início pontualmente às 17:00. Recomendamos chegar com 30 minutos de antecedência para desfrutar desse momento tão especial em nossas vidas.
                </p>

                <div className="border-t border-b border-[#8C7853]/15 py-6 text-sm text-[#2C2520]/80 space-y-4 mb-8">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-[#8C7853] shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-cinzel text-sm uppercase tracking-wider block text-[#2C2520] mb-0.5">LOCAL</strong>
                      <span className="font-light">Espaço Bela Vista</span>
                      <p className="text-sm text-[#2C2520]/60 mt-0.5">QSC 19, Setor Primavera, Chácara 27, Taguatinga Sul - DF</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-[#8C7853] shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-cinzel text-sm uppercase tracking-wider block text-[#2C2520] mb-0.5">DATA & HORÁRIO</strong>
                      <span className="font-light">19 de Setembro de 2026, às 17:00</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    setActivePage('cerimonia');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    trackClick('ceremony_map');
                  }}
                  className="border border-[#8C7853] hover:bg-[#8C7853] hover:text-white text-[#8C7853] text-sm uppercase tracking-[0.2em] font-bold py-3.5 px-6 rounded-md transition-all text-center cursor-pointer"
                >
                  Como Chegar (Maps)
                </button>
              </div>
            </div>

          </div>

          {/* Chronogram Timings */}
          <div className="bg-white border border-[#8C7853]/10 p-8 rounded-xl max-w-2xl mx-auto shadow-xs mb-16">
            <h3 className="font-cinzel text-sm uppercase tracking-widest text-[#8C7853] font-bold text-center mb-6">Cronograma do Dia</h3>
            <div className="relative pl-6 border-l border-[#8C7853]/20 space-y-8">
              {schedule.map((item) => (
                <div key={item.id} className="relative">
                  <div className="absolute -left-[30px] top-1 w-2.5 h-2.5 rounded-full bg-[#8C7853]"></div>
                  <div className="flex justify-between items-baseline gap-4">
                    <h4 className="font-cinzel text-sm uppercase tracking-wider font-semibold text-[#2C2520]">{item.title}</h4>
                    <span className="font-mono text-sm text-[#8C7853] font-bold">{item.time}</span>
                  </div>
                  {item.description && <p className="text-sm text-[#2C2520]/60 mt-1 font-light leading-relaxed">{item.description}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* Dress Code Section */}
          <div id="dicas" className="bg-white border border-[#8C7853]/15 rounded-2xl max-w-4xl mx-auto shadow-lg overflow-hidden grid grid-cols-1 md:grid-cols-12 gap-0">
            {/* Image Column */}
            <div className="md:col-span-6 h-80 md:h-full min-h-[340px] relative">
              <img 
                src="/assets/images/dress_code.jpg" 
                alt="Dress Code Exemplo" 
                className="absolute inset-0 w-full h-full object-cover brightness-[0.98]" 
              />
            </div>

            {/* Content Column */}
            <div className="md:col-span-6 p-8 md:p-12 flex flex-col justify-center bg-[#FDFBF7] text-left">
              <span className="font-cinzel text-sm uppercase font-bold tracking-widest text-[#8C7853] mb-2 block">DRESS CODE</span>
              <h3 className="font-cinzel text-xl uppercase tracking-wider text-[#2C2520] font-light mb-4">Guia de Estilo</h3>
              
              <p className="text-sm md:text-sm text-[#2C2520]/80 leading-relaxed font-light mb-8">
                Para celebrarmos este momento especial em um local arborizado e durante a tarde, o traje sugerido será <strong className="font-semibold text-[#8C7853]">Esporte Fino</strong>.
              </p>

              <div>
                <button 
                  onClick={() => { setActivePage('vestimenta'); window.scrollTo({ top: 0, behavior: 'smooth' }); trackClick('continuar_lendo_vestimenta'); }}
                  className="bg-[#8C7853] hover:bg-[#726141] text-white text-sm uppercase tracking-[0.2em] font-bold py-3.5 px-6 rounded-md transition-all inline-flex items-center gap-2 cursor-pointer shadow-md duration-300"
                >
                  CONTINUAR LENDO <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
        </motion.div>
      )}

      {activePage === 'cerimonia' && (
        <motion.div
          key="cerimonia-page"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.6 }}
          className="pt-16 bg-[#111111] min-h-screen"
        >
          {/* Immersive Map Header Section */}
          <div className="w-full h-[250px] md:h-[320px] overflow-hidden relative border-b border-white/5 shadow-inner">
            <iframe 
              src="https://maps.google.com/maps?q=Espa%C3%A7o%20Bela%20Vista%2C%20QSC%2019%20Setor%20Primavera%20Ch%C3%A1cara%2027%2C%20Taguatinga%20Sul%20-%20DF&t=&z=15&ie=UTF8&iwloc=&output=embed" 
              className="w-full h-full border-0 grayscale brightness-[0.6] contrast-[1.15] invert-[0.08]" 
              allowFullScreen={true} 
              loading="lazy"
              title="Mapa da Cerimônia"
            />
          </div>

          {/* Ceremony Details Content */}
          <div className="max-w-4xl mx-auto px-6 py-10 md:py-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              {/* Left Column: Information Card */}
              <div className="flex flex-col justify-between py-2 text-left">
                <div>
                  <span className="font-sans text-sm uppercase font-bold tracking-[0.3em] text-[#D9C8A9]/80 block mb-1">EVENTO</span>
                  <h2 className="font-cinzel text-xl md:text-3xl tracking-[0.1em] text-white font-light uppercase">Cerimônia</h2>
                  
                  {/* Styled connection line */}
                  <div className="relative pl-7 border-l border-dashed border-white/20 space-y-8 my-8">
                    {/* Data / Horário Row */}
                    <div className="relative">
                      {/* Round indicator with Calendar icon */}
                      <div className="absolute -left-[41px] top-0.5 w-7 h-7 rounded-full bg-[#1A1613] border border-[#D9C8A9]/40 flex items-center justify-center text-[#D9C8A9]">
                        <Calendar className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-sans text-sm uppercase font-semibold tracking-widest text-white/40 block mb-0.5">Data</span>
                        <p className="text-white/95 text-sm md:text-sm font-light font-cinzel tracking-wider">19 de setembro de 2026 — 17h</p>
                      </div>
                    </div>

                    {/* Local Row */}
                    <div className="relative">
                      {/* Round indicator with MapPin icon */}
                      <div className="absolute -left-[41px] top-0.5 w-7 h-7 rounded-full bg-[#1A1613] border border-[#D9C8A9]/40 flex items-center justify-center text-[#D9C8A9]">
                        <MapPin className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-sans text-sm uppercase font-semibold tracking-widest text-white/40 block mb-0.5">Local</span>
                        <p className="text-white/95 text-sm md:text-sm font-light font-cinzel tracking-wider">Espaço Bela Vista</p>
                        <p className="text-[#D9C8A9]/80 text-sm md:text-sm mt-1 font-light leading-relaxed">QSC 19, Setor Primavera, Chácara 27, Taguatinga Sul - DF</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Direct Action Buttons matching the screenshot exactly */}
                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <a 
                    href="https://maps.google.com/?q=Espa%C3%A7o%20Bela%20Vista%2C%20QSC%2019%20Setor%20Primavera%20Ch%C3%A1cara%2027%2C%20Taguatinga%20Sul%20-%20DF"
                    target="_blank"
                    rel="noreferrer"
                    className="bg-[#4F5459] hover:bg-[#5E646A] text-white text-sm uppercase tracking-[0.2em] font-semibold py-3 px-6 rounded-sm transition-all text-center flex-1 duration-300 shadow-md shadow-black/10"
                    onClick={() => trackClick('ceremony_page_maps')}
                  >
                    ABRIR NO MAPS
                  </a>
                  <a 
                    href="https://calendar.google.com/calendar/render?action=TEMPLATE&text=Casamento+de+Luciana+%26+Nilton+-+Cerim%C3%B4nia&dates=20260919T200000Z/20260920T010000Z&details=Casamento+de+Luciana+e+Nilton.+Esperamos+voc%C3%AA!&location=Espa%C3%A7o+Bela+Vista+-+QSC+19+Setor+Primavera+Ch%C3%A1cara+27,+Taguatinga+Sul+-+DF"
                    target="_blank"
                    rel="noreferrer"
                    className="bg-[#2F3235] hover:bg-[#3D4145] text-white text-sm uppercase tracking-[0.2em] font-semibold py-3 px-6 rounded-sm transition-all text-center flex-1 duration-300 shadow-md shadow-black/10"
                    onClick={() => trackClick('ceremony_page_calendar')}
                  >
                    ADICIONAR À AGENDA
                  </a>
                </div>
              </div>

              {/* Right Column: High-quality Location Photo (Made smaller and centered) */}
              <div className="rounded-lg overflow-hidden shadow-xl h-[280px] md:h-[320px] max-w-sm mx-auto w-full border border-white/5">
                <img 
                  src="/assets/images/outdoor_ceremony.jpg" 
                  alt="Cerimônia Espaço Bela Vista" 
                  className="w-full h-full object-cover brightness-[0.85] contrast-[1.05]"
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {activePage === 'vestimenta' && (
        <motion.div
          key="vestimenta-page"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.6 }}
          className="pt-16 bg-[#1A1613] min-h-screen text-white"
        >
          {/* Immersive Header Image Section */}
          <div className="w-full h-[250px] md:h-[320px] overflow-hidden relative border-b border-white/5 shadow-inner">
            <img 
              src="/assets/images/dress_code.jpg" 
              alt="Dress Code Cover" 
              className="w-full h-full object-cover filter brightness-[0.55] contrast-[1.05]" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1A1613] via-transparent to-transparent"></div>
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
              <div>
                <span className="font-sans text-sm uppercase font-bold tracking-[0.3em] text-[#D9C8A9]/80 block mb-2">GUIA DE ESTILO</span>
                <h1 className="font-cinzel text-2xl md:text-4xl tracking-[0.1em] text-white font-light uppercase">Código de Vestimenta</h1>
              </div>
            </div>
          </div>

          {/* Page Content */}
          <div className="max-w-4xl mx-auto px-6 py-16 md:py-20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start text-left">
              {/* Left Column: Descriptions */}
              <div className="space-y-8">
                <div>
                  <h2 className="font-cinzel text-lg tracking-wider text-[#D9C8A9] font-light uppercase mb-3">Esporte Fino</h2>
                  <p className="text-sm text-white/80 leading-relaxed font-light">
                    Para celebrarmos este momento especial em um local arborizado e durante a tarde (Espaço Bela Vista, às 16:30), o traje sugerido (Não Obrigatório) será <strong className="font-medium text-[#D9C8A9]">Esporte Fino</strong>. Unindo elegância e conforto para aproveitar o gramado e o dia ao ar livre.
                  </p>
                </div>

                <div className="border-t border-white/10 pt-6">
                  <h3 className="font-cinzel text-sm uppercase tracking-widest text-[#D9C8A9] font-bold mb-3">Para Elas (Feminino)</h3>
                  <p className="text-sm text-white/70 leading-relaxed font-light mb-2">
                    • Vestidos fluidos (midi ou longos), estampas florais sutis, cores alegres.
                  </p>
                  <p className="text-sm text-white/70 leading-relaxed font-light">
                    • <strong className="text-[#D9C8A9]/90 font-medium">Atenção ao Calçado:</strong> Como o local conta com área gramada e arborizada, sugerimos algo com mais conforto ao caminhar.
                  </p>
                </div>

                <div className="border-t border-white/10 pt-6">
                  <h3 className="font-cinzel text-sm uppercase tracking-widest text-[#D9C8A9] font-bold mb-3">Para Eles (Masculino)</h3>
                  <p className="text-sm text-white/70 leading-relaxed font-light mb-2">
                    • Traje esporte fino.
                  </p>
                  <p className="text-sm text-white/70 leading-relaxed font-light">
                    • O uso de blazer ou terno claro é opcional devido ao clima e horário vespertino. Gravata também não é obrigatória. Complete com mocassim ou sapato social.
                  </p>
                </div>
              </div>

              {/* Right Column: Actions */}
              <div className="bg-[#241F1B] border border-white/5 p-8 rounded-xl shadow-xl space-y-8">
                <div className="flex flex-col gap-4">
                  <button 
                    onClick={() => { setActivePage('rsvp'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="w-full bg-[#8C7853] hover:bg-[#726141] text-white text-sm uppercase tracking-[0.2em] font-bold py-4 rounded-md transition-all text-center shadow-md duration-300"
                  >
                    CONFIRMAR PRESENÇA
                  </button>
                  <button 
                    onClick={() => { setActivePage('inicio'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="w-full bg-white/5 hover:bg-white/10 border border-white/15 text-white text-sm uppercase tracking-[0.2em] font-bold py-4 rounded-md transition-all text-center duration-300"
                  >
                    VOLTAR AO INÍCIO
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {activePage === 'presentes' && (
        <motion.div
          key="presentes-page"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.6 }}
          className="pt-16"
        >
          {/* Lista de Presentes (PIX custom) */}
          <section id="presentes" className="py-24 bg-white/40 border-t border-b border-[#8C7853]/10 px-6 z-10 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="font-cinzel text-xs tracking-widest uppercase text-[#8C7853] font-bold block mb-2">Lista de Casamento</span>
            <h2 className="font-cinzel text-2xl md:text-3xl tracking-wider uppercase">Lista de Presentes Virtuais</h2>
            <div className="w-12 h-[1px] bg-[#8C7853]/40 mx-auto mt-4"></div>
            <p className="text-xs text-[#2C2520]/60 max-w-md mx-auto mt-4 font-light leading-relaxed">
              Desenvolvemos uma lista de cotas e presentes virtuais. Sua contribuição é repassada integralmente aos noivos de forma segura e transparente via PIX.
            </p>
          </div>

          {/* Category tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-[10px] uppercase font-bold tracking-widest px-4 py-2 border transition-all ${
                  selectedCategory === cat 
                    ? 'bg-[#8C7853] text-white border-[#8C7853]' 
                    : 'bg-white border-[#8C7853]/15 text-[#2C2520]/70 hover:border-[#8C7853]'
                }`}
                style={{ borderRadius: '4px' }}
              >
                {cat === 'todos' ? 'Todos' : cat}
              </button>
            ))}
          </div>

          {/* Gifts Grid */}
          <div className={selectedCategory === 'Contribuição Livre' ? 'flex justify-center' : 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto'}>
            {gifts
              .filter(gift => selectedCategory === 'todos' || gift.category === selectedCategory)
              .map((gift) => (
                <div 
                  key={gift.id} 
                  className={`bg-white border border-[#8C7853]/10 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${selectedCategory === 'Contribuição Livre' ? 'max-w-xs w-full' : ''}`}
                >
                  <div className="h-44 overflow-hidden relative">
                    <img src={gift.imageUrl} alt={gift.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                    <span className="absolute top-3 left-3 bg-[#8C7853] text-white text-[8px] tracking-widest uppercase px-2.5 py-1 rounded-full font-bold">
                      {gift.category}
                    </span>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-cinzel text-xs uppercase tracking-wider font-bold text-[#2C2520] mb-1.5">{gift.name}</h4>
                      <p className="text-[11px] text-[#2C2520]/60 font-light leading-relaxed mb-4">{gift.description}</p>
                    </div>

                    <div className={`border-t border-[#8C7853]/10 pt-4 mt-2 flex items-center ${gift.category === 'Contribuição Livre' ? 'justify-center' : 'justify-between'}`}>
                      {gift.category !== 'Contribuição Livre' && (
                        <div className="flex flex-col">
                          <span className="text-[9px] uppercase tracking-widest text-[#2C2520]/50">Valor Sugerido</span>
                          <span className="font-mono text-sm font-bold text-[#8C7853]">R$ {gift.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}

                      {gift.status === 'recebido' ? (
                        <span className="text-[9px] uppercase tracking-widest font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-md border border-emerald-200 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Recebido
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedGift(gift);
                            setGiftStep('details');
                            setShowGiftModal(true);
                            trackClick(`presente_click_${gift.name.replace(/\s+/g, '_')}`);
                          }}
                          className="bg-[#2C2520] hover:bg-[#1A1613] text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2.5 transition-colors"
                          style={{ borderRadius: '4px' }}
                        >
                          Presentear
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </section>
        </motion.div>
      )}

      {activePage === 'rsvp' && (
        <motion.div
          key="rsvp-page"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.6 }}
          className="pt-16"
        >
          {/* RSVP Section */}
          <section id="rsvp" className="py-24 px-6 max-w-4xl mx-auto z-10 relative">
            {!isPinValidated ? (
              <div className="bg-white border border-[#8C7853]/15 rounded-2xl p-8 md:p-12 shadow-sm text-center max-w-lg mx-auto py-16">
                <div className="w-14 h-14 bg-[#8C7853]/10 rounded-full flex items-center justify-center mb-6 mx-auto">
                  <Lock className="w-6 h-6 text-[#8C7853]" />
                </div>
                <h2 className="font-cinzel text-xl md:text-2xl tracking-wider uppercase text-[#2C2520]">Área Restrita aos Convidados</h2>
                <p className="text-xs text-[#2C2520]/60 mt-4 max-w-sm mx-auto font-light leading-relaxed mb-8">
                  Para confirmar sua presença, por favor utilize o PIN exclusivo enviado pelos noivos no seu convite de casamento.
                </p>
                <button
                  onClick={() => setShowRsvpPinModal(true)}
                  className="bg-[#8C7853] hover:bg-[#726141] text-white text-xs font-bold uppercase tracking-widest px-8 py-3.5 rounded-lg transition-colors shadow-md inline-flex items-center gap-2"
                >
                  <Lock className="w-3.5 h-3.5" /> Digitar PIN de Acesso
                </button>
              </div>
            ) : (
              <div className="bg-white border border-[#8C7853]/15 rounded-2xl p-8 md:p-12 shadow-sm">
                <div className="text-center mb-10">
                  <span className="font-cinzel text-xs tracking-widest uppercase text-[#8C7853] font-bold block mb-2">RSVP</span>
                  <h2 className="font-cinzel text-2xl md:text-3xl tracking-wider uppercase">Confirmar Presença</h2>
                  <div className="w-12 h-[1px] bg-[#8C7853]/40 mx-auto mt-4"></div>
                  <p className="text-xs text-[#2C2520]/60 mt-4 max-w-sm mx-auto font-light leading-relaxed">
                    Por favor, confirme sua presença para que possamos planejar perfeitamente os preparativos do nosso grande dia.
                  </p>
                  <div className="mt-4 inline-block px-4 py-1.5 rounded-full border border-[#8C7853] text-[10px] font-bold uppercase tracking-widest text-black">
                    Convidado não Convida
                  </div>
                </div>

                <AnimatePresence mode="wait">
                {rsvpSuccessData ? (
                  <motion.div
                    key="rsvp-success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-[#8C7853]/10 border-2 border-dashed border-[#8C7853]/40 p-8 rounded-xl text-center flex flex-col items-center max-w-sm mx-auto"
                  >
                    <div className="w-10 h-10 bg-[#8C7853] rounded-full flex items-center justify-center text-white mb-4">
                      <Check className="w-5 h-5" />
                    </div>
                    <span className="font-cinzel text-xs font-bold tracking-widest text-[#8C7853] uppercase mb-1">Presença Confirmada!</span>
                    <h4 className="font-cinzel text-sm font-semibold text-[#2C2520] max-w-[200px] leading-tight mb-2">{rsvpSuccessData.name}</h4>

                    {rsvpSuccessData.attendingCount !== undefined && (
                      <span className="text-[10px] bg-[#8C7853]/20 text-[#2C2520] px-2 py-0.5 rounded font-mono mb-4">
                        {rsvpSuccessData.attendingCount} confirmados do grupo
                      </span>
                    )}

                    {!matchedInvitation && (
                      <>
                        {/* Tick Code */}
                        <div className="bg-white px-4 py-1.5 rounded-md border border-[#8C7853]/25 text-[10px] font-mono tracking-wider mb-6 text-[#2C2520]">
                          CÓDIGO: {rsvpSuccessData.code}
                        </div>

                        {/* QR Code Graphic Mockup */}
                        <div className="bg-white p-3 rounded-lg border border-[#8C7853]/15 mb-4">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=everafter_rsvp_${rsvpSuccessData.code}`}
                            alt="RSVP QR Ticket"
                            className="w-28 h-28"
                          />
                        </div>
                        <p className="text-[10px] text-[#2C2520]/60 leading-normal max-w-[220px]">
                          Apresente seu código ou QR Code no dia do evento para check-in. O casal já foi notificado!
                        </p>
                      </>
                    )}
                    <button
                      onClick={() => {
                        setRsvpSuccessData(null);
                        // If they want to log out or validate another
                        if (matchedInvitation) {
                          // Keep validated so they can edit
                        } else {
                          setIsPinValidated(false);
                          setValidatedPin('');
                        }
                      }}
                      className="mt-6 text-[9px] uppercase tracking-widest font-bold text-[#8C7853] hover:underline"
                    >
                      {matchedInvitation ? 'Ajustar Presenças Novamente' : 'Confirmar Outro Convidado'}
                    </button>
                  </motion.div>
                ) : (
                <motion.div
                  key="rsvp-form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start"
                >
                  
                  {/* Dynamic Family/Group Form */}
                  {matchedInvitation ? (
                    <form onSubmit={handleRsvpSubmit} className="space-y-6">
                      <div className="bg-[#FAF7F2] p-5 rounded-xl border border-[#8C7853]/25">
                        <span className="text-[10px] uppercase font-mono tracking-widest text-[#8C7853] font-bold block mb-1">Convite Localizado</span>
                        <h3 className="font-cinzel text-base font-bold text-[#2C2520]">{matchedInvitation.familyName}</h3>
                        <p className="text-[11px] text-[#2C2520]/60 mt-1 font-light leading-normal">
                          Selecione o status de presença para cada membro da família abaixo:
                        </p>
                      </div>

                      {/* Guest Members Selectors */}
                      <div className="space-y-3">
                        {matchedInvitation.guests?.map((guest) => {
                          const status = tempGuestStatuses[guest.id];
                          return (
                            <div key={guest.id} className="bg-[#FAF7F2]/60 border border-[#8C7853]/10 rounded-lg p-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5">
                              <span className="text-xs font-semibold text-[#2C2520] truncate max-w-[160px] flex items-center gap-1.5" title={guest.name}>
                                {guest.name}
                                <span className="text-[8px] uppercase tracking-wider font-bold text-[#8C7853]/70 bg-[#8C7853]/10 px-1.5 py-0.5 rounded shrink-0">
                                  {guest.type === 'crianca' ? 'Criança' : 'Adulto'}
                                </span>
                              </span>
                              
                              <div className="flex gap-2 w-full sm:w-auto shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    touchedGuestIdsRef.current.add(guest.id);
                                    setTempGuestStatuses(prev => ({ ...prev, [guest.id]: true }));
                                  }}
                                  className={`flex-1 sm:flex-initial text-[9px] uppercase font-bold tracking-widest px-3.5 py-1.5 border transition-colors rounded ${
                                    status === true 
                                      ? 'bg-[#8C7853] text-white border-[#8C7853]' 
                                      : 'bg-white border-[#8C7853]/25 text-[#2C2520]/70 hover:bg-[#8C7853]/5'
                                  }`}
                                >
                                  Confirmar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    touchedGuestIdsRef.current.add(guest.id);
                                    setTempGuestStatuses(prev => ({ ...prev, [guest.id]: false }));
                                  }}
                                  className={`flex-1 sm:flex-initial text-[9px] uppercase font-bold tracking-widest px-3.5 py-1.5 border transition-colors rounded ${
                                    status === false 
                                      ? 'bg-neutral-500 text-white border-neutral-500' 
                                      : 'bg-white border-[#8C7853]/25 text-[#2C2520]/70 hover:bg-rose-50/50'
                                  }`}
                                >
                                  Recusar
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Phone WhatsApp */}
                      <div>
                        <label className="font-cinzel text-[10px] uppercase font-bold tracking-widest text-[#2C2520] block mb-1">Telefone WhatsApp</label>
                        <input 
                          type="tel" 
                          required 
                          value={rsvpPhone}
                          onChange={(e) => setRsvpPhone(e.target.value)}
                          placeholder="(00) 00000-0000" 
                          className="w-full bg-[#FAF7F2] border border-[#8C7853]/20 px-4 py-3 rounded-md text-xs focus:outline-hidden focus:border-[#8C7853] transition-colors"
                        />
                      </div>

                      {/* Message to Couple */}
                      <div>
                        <label className="font-cinzel text-[10px] uppercase font-bold tracking-widest text-[#2C2520] block mb-1">Mensagem para os Noivos (opcional)</label>
                        <textarea 
                          value={rsvpMsg}
                          onChange={(e) => setRsvpMsg(e.target.value)}
                          placeholder="Deixe um recado carinhoso..." 
                          rows={3}
                          className="w-full bg-[#FAF7F2] border border-[#8C7853]/20 px-4 py-3 rounded-md text-xs focus:outline-hidden focus:border-[#8C7853] transition-colors resize-none"
                        ></textarea>
                      </div>

                      {rsvpError && (
                        <div className="bg-rose-50 border border-rose-300 text-rose-700 text-[11px] font-medium leading-relaxed rounded-md px-4 py-3">
                          {rsvpError}
                        </div>
                      )}

                      {rsvpSubmitting && (
                        <div className="text-center text-[11px] font-medium text-[#2C2520]">
                          Aguarde Estamos Salvando a sua Confirmação...
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={rsvpSubmitting}
                        className="w-full bg-[#2C2520] hover:bg-[#1A1613] disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-widest py-4 rounded-md transition-colors shadow-xs text-center"
                      >
                        {rsvpSubmitting ? 'Salvando...' : 'Salvar Confirmações'}
                      </button>
                    </form>
                  ) : (
                    
                    /* Fallback Single Guest Form (for master/bypass PINs) */
                    <form onSubmit={handleRsvpSubmit} className="space-y-4">
                      <div>
                        <label className="font-cinzel text-[10px] uppercase font-bold tracking-widest text-[#2C2520] block mb-1">Nome Completo</label>
                        <input 
                          type="text" 
                          required 
                          value={rsvpName}
                          onChange={(e) => setRsvpName(e.target.value)}
                          placeholder="Seu nome completo" 
                          className="w-full bg-[#FAF7F2] border border-[#8C7853]/20 px-4 py-3 rounded-md text-xs focus:outline-hidden focus:border-[#8C7853] transition-colors"
                        />
                      </div>

                      <div>
                        <label className="font-cinzel text-[10px] uppercase font-bold tracking-widest text-[#2C2520] block mb-1">Telefone WhatsApp</label>
                        <input 
                          type="tel" 
                          required 
                          value={rsvpPhone}
                          onChange={(e) => setRsvpPhone(e.target.value)}
                          placeholder="(00) 00000-0000" 
                          className="w-full bg-[#FAF7F2] border border-[#8C7853]/20 px-4 py-3 rounded-md text-xs focus:outline-hidden focus:border-[#8C7853] transition-colors"
                        />
                      </div>

                      <div>
                        <label className="font-cinzel text-[10px] uppercase font-bold tracking-widest text-[#2C2520] block mb-1.5">Sua Presença</label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setRsvpAttending(true)}
                            className={`text-[10px] uppercase font-bold tracking-widest py-3 border transition-colors ${
                              rsvpAttending 
                                ? 'bg-[#8C7853] text-white border-[#8C7853]' 
                                : 'bg-[#FAF7F2] border-[#8C7853]/20 text-[#2C2520]/70'
                            }`}
                            style={{ borderRadius: '4px' }}
                          >
                            Sim, irei comparecer
                          </button>
                          <button
                            type="button"
                            onClick={() => setRsvpAttending(false)}
                            className={`text-[10px] uppercase font-bold tracking-widest py-3 border transition-colors ${
                              !rsvpAttending 
                                ? 'bg-[#8C7853] text-white border-[#8C7853]' 
                                : 'bg-[#FAF7F2] border-[#8C7853]/20 text-[#2C2520]/70'
                            }`}
                            style={{ borderRadius: '4px' }}
                          >
                            Não poderei ir
                          </button>
                        </div>
                      </div>

                      {rsvpAttending && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-4 pt-2 overflow-hidden"
                        >
                          <div>
                            <label className="font-cinzel text-[10px] uppercase font-bold tracking-widest text-[#2C2520] block mb-1">Quantidade de Acompanhantes</label>
                            <select
                              value={rsvpCompanions}
                              onChange={(e) => setRsvpCompanions(parseInt(e.target.value))}
                              className="w-full bg-[#FAF7F2] border border-[#8C7853]/20 px-4 py-3 rounded-md text-xs focus:outline-hidden focus:border-[#8C7853] transition-colors"
                            >
                              <option value="0">Apenas eu</option>
                              <option value="1">1 Acompanhante</option>
                              <option value="2">2 Acompanhantes</option>
                              <option value="3">3 Acompanhantes</option>
                              <option value="4">4 Acompanhantes</option>
                            </select>
                          </div>

                          <div>
                            <label className="font-cinzel text-[10px] uppercase font-bold tracking-widest text-[#2C2520] block mb-1">Restrição Alimentar ou Alergias (opcional)</label>
                            <input 
                              type="text" 
                              value={rsvpDiet}
                              onChange={(e) => setRsvpDiet(e.target.value)}
                              placeholder="Ex: Vegetariano, Sem lactose, Alérgico a camarão" 
                              className="w-full bg-[#FAF7F2] border border-[#8C7853]/20 px-4 py-3 rounded-md text-xs focus:outline-hidden focus:border-[#8C7853] transition-colors"
                            />
                          </div>
                        </motion.div>
                      )}

                      <div>
                        <label className="font-cinzel text-[10px] uppercase font-bold tracking-widest text-[#2C2520] block mb-1">Mensagem para os Noivos (opcional)</label>
                        <textarea 
                          value={rsvpMsg}
                          onChange={(e) => setRsvpMsg(e.target.value)}
                          placeholder="Deixe uma mensagem carinhosa..." 
                          rows={3}
                          className="w-full bg-[#FAF7F2] border border-[#8C7853]/20 px-4 py-3 rounded-md text-xs focus:outline-hidden focus:border-[#8C7853] transition-colors resize-none"
                        ></textarea>
                      </div>

                      {rsvpError && (
                        <div className="bg-rose-50 border border-rose-300 text-rose-700 text-[11px] font-medium leading-relaxed rounded-md px-4 py-3">
                          {rsvpError}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={rsvpSubmitting}
                        className="w-full bg-[#2C2520] hover:bg-[#1A1613] disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-widest py-4 rounded-md transition-colors shadow-xs text-center"
                      >
                        {rsvpSubmitting ? 'Confirmando...' : 'Confirmar Presença'}
                      </button>
                    </form>
                  )}

                  {/* Instructions Panel */}
                  <div className="bg-[#FAF7F2] border border-[#8C7853]/15 p-6 rounded-xl space-y-4">
                    <h4 className="font-cinzel text-xs uppercase tracking-wider font-semibold text-[#2C2520] flex items-center gap-2">
                      <Info className="w-4 h-4 text-[#8C7853]" />
                      <span>Instruções Importantes</span>
                    </h4>
                    <ul className="space-y-2.5 text-[11px] text-[#2C2520]/70 font-light list-disc pl-4 leading-relaxed">
                      {matchedInvitation ? (
                        <>
                          <li>Você pode alterar a presença de qualquer familiar a qualquer momento digitando o mesmo PIN.</li>
                          <li>Caso precise incluir um convidado que não esteja listado, favor entrar em contato diretamente com os noivos.</li>
                          <li>Lembre-se de salvar as confirmações após marcar as opções de presença.</li>
                        </>
                      ) : (
                        <>
                          <li>Por favor, preencha o nome completo para localizarmos na lista oficial de convidados.</li>
                          <li>Caso possua acompanhantes, certifique-se de preencher a quantidade correta para garantir o assento na mesa.</li>
                          <li>Para dúvidas urgentes sobre rotas ou vestimentas, utilize a aba de Contato ou consulte o mapa integrado.</li>
                        </>
                      )}
                    </ul>
                  </div>
                </motion.div>
                )}
                </AnimatePresence>
              </div>
            )}
          </section>
        </motion.div>
      )}

      {/* Footer / Copyright */}
      <footer className="text-center py-16 z-10 relative">
        <Heart className="w-5 h-5 text-[#8C7853] fill-[#8C7853]/10 mx-auto mb-4" />
        <p className="font-cinzel text-xs tracking-widest text-[#2C2520] font-semibold uppercase">{partner1.firstName} & {partner2.firstName}</p>
        <p className="text-[9px] uppercase tracking-widest text-[#2C2520]/50 mt-1">19.09.2026 • Feito com amor para Luciana & Nilton</p>
        <div className="mt-6">
          <WhatsappHelpFooterButton />
        </div>
      </footer>

      {/* LIGHTBOX SLIDESHOW MODAL */}
      {lightboxIndex !== null && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
          <button 
            onClick={() => setLightboxIndex(null)}
            className="absolute top-6 right-6 text-white/70 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="max-w-4xl max-h-[85vh] relative flex flex-col items-center">
            <img 
              src={gallery[lightboxIndex].url} 
              alt="Gallery item large" 
              className="max-w-full max-h-[75vh] object-contain rounded-md"
            />
            {gallery[lightboxIndex].caption && (
              <p className="text-white/80 text-xs tracking-wider uppercase mt-4 text-center">{gallery[lightboxIndex].caption}</p>
            )}
            
            {/* Navigation keys */}
            <div className="flex gap-4 mt-4">
              <button
                disabled={lightboxIndex === 0}
                onClick={() => setLightboxIndex(prev => prev !== null ? prev - 1 : null)}
                className="text-white/60 hover:text-white disabled:opacity-20 text-xs tracking-widest uppercase font-mono"
              >
                ← Anterior
              </button>
              <span className="text-white/40 text-xs font-mono">{lightboxIndex + 1} / {gallery.length}</span>
              <button
                disabled={lightboxIndex === gallery.length - 1}
                onClick={() => setLightboxIndex(prev => prev !== null ? prev + 1 : null)}
                className="text-white/60 hover:text-white disabled:opacity-20 text-xs tracking-widest uppercase font-mono"
              >
                Próximo →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PREMIUM INTERACTIVE GIFT PIX MODAL */}
      {showGiftModal && selectedGift && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white text-[#2C2520] max-w-md w-full rounded-2xl overflow-hidden shadow-2xl border border-[#8C7853]/15 flex flex-col justify-between"
          >
            {/* Modal Header */}
            <div className="border-b border-[#8C7853]/10 p-5 flex justify-between items-center bg-[#FAF7F2]">
              <span className="font-cinzel text-xs font-bold tracking-widest text-[#8C7853] uppercase flex items-center gap-1.5">
                <Gift className="w-3.5 h-3.5" /> Presentear Casal
              </span>
              <button 
                onClick={() => setShowGiftModal(false)}
                className="text-[#2C2520]/50 hover:text-[#2C2520]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Steps rendering */}
            {giftStep === 'details' && (
              <div className="p-6 space-y-6">
                <div className="flex gap-4">
                  <img src={selectedGift.imageUrl} alt={selectedGift.name} className="w-20 h-20 object-cover rounded-lg border border-[#8C7853]/15" />
                  <div>
                    <h4 className="font-cinzel text-xs uppercase tracking-wider font-bold mb-1">{selectedGift.name}</h4>
                    <p className="text-[11px] text-[#2C2520]/60 font-light leading-normal mb-2">{selectedGift.description}</p>
                    {selectedGift.category !== 'Contribuição Livre' && (
                      <span className="font-mono text-sm font-bold text-[#8C7853]">R$ {selectedGift.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    )}
                  </div>
                </div>

                <div className="bg-[#8C7853]/5 border border-[#8C7853]/25 rounded-xl p-5 text-center">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#8C7853] block mb-2">Chave PIX para Pagamento</span>

                  <p className="text-[10px] text-[#2C2520]/60 mb-4 leading-normal max-w-[280px] mx-auto">
                    Copie a chave PIX abaixo e cole no aplicativo do seu banco para realizar a transferência.
                  </p>

                  {/* Chave Copiar */}
                  <div className="flex items-center justify-between bg-white border border-[#8C7853]/20 rounded-md p-2 pl-3 max-w-xs mx-auto">
                    <span className="text-[10px] font-mono select-all truncate text-left flex-1 max-w-[200px]">
                      {weddingData.pixKeyValue}
                    </span>
                    <button 
                      onClick={copyPixKey}
                      className="text-[#8C7853] hover:text-[#726141] shrink-0 p-1.5 hover:bg-[#8C7853]/5 rounded-md transition-colors"
                      title="Copiar Chave"
                    >
                      {copiedPix ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  {copiedPix && <span className="text-[9px] text-emerald-600 font-bold tracking-wider uppercase block mt-1">Chave Copiada!</span>}
                </div>

                <div className="text-center">
                  <span className="text-[10px] text-[#2C2520]/50 italic block mb-4">"Agradecemos a sua Contribuição!"</span>
                  <button
                    onClick={() => setGiftStep('form')}
                    className="w-full bg-[#2C2520] hover:bg-[#1A1613] text-white text-xs font-bold uppercase tracking-widest py-3.5 rounded-md transition-colors text-center"
                  >
                    Já Realizei Minha Contribuição
                  </button>
                </div>
              </div>
            )}

            {giftStep === 'form' && (
              <form onSubmit={handleGiftSubmit} className="p-6 space-y-4">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#8C7853] block border-b border-[#8C7853]/10 pb-1.5">Registrar Contribuição</span>
                
                <div>
                  <label className="font-cinzel text-[10px] uppercase font-bold tracking-widest text-[#2C2520] block mb-1">Seu Nome / De Quem</label>
                  <input 
                    type="text" 
                    required 
                    value={contribName}
                    onChange={(e) => setContribName(e.target.value)}
                    placeholder="Ex: Tio Roberto e Família" 
                    className="w-full bg-[#FAF7F2] border border-[#8C7853]/20 px-3.5 py-2.5 rounded-md text-xs focus:outline-hidden focus:border-[#8C7853] transition-colors"
                  />
                </div>

                <div>
                  <label className="font-cinzel text-[10px] uppercase font-bold tracking-widest text-[#2C2520] block mb-1">Mensagem de Carinho</label>
                  <textarea 
                    value={contribMessage}
                    onChange={(e) => setContribMessage(e.target.value)}
                    placeholder="Deixe uma mensagem para o casal ler no painel..." 
                    rows={3}
                    className="w-full bg-[#FAF7F2] border border-[#8C7853]/20 px-3.5 py-2.5 rounded-md text-xs focus:outline-hidden focus:border-[#8C7853] transition-colors resize-none"
                  ></textarea>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-cinzel text-[10px] uppercase font-bold tracking-widest text-[#2C2520] block mb-1">Valor do PIX (opcional)</label>
                    <input 
                      type="number" 
                      value={contribValue}
                      onChange={(e) => setContribValue(e.target.value)}
                      placeholder={`R$ ${selectedGift.price}`}
                      className="w-full bg-[#FAF7F2] border border-[#8C7853]/20 px-3.5 py-2.5 rounded-md text-xs focus:outline-hidden focus:border-[#8C7853] transition-colors font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-cinzel text-[10px] uppercase font-bold tracking-widest text-[#2C2520] block mb-1">Comprovante (opcional)</label>
                    <div className="relative">
                      <input 
                        type="file" 
                        id="upload-comprovante"
                        className="hidden" 
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setContribFile(e.target.files[0]);
                            setContribFileName(e.target.files[0].name);
                          }
                        }}
                      />
                      <label 
                        htmlFor="upload-comprovante"
                        className="w-full bg-[#FAF7F2] border border-dashed border-[#8C7853]/30 px-3.5 py-2.5 rounded-md text-[10px] text-center font-bold uppercase tracking-wider text-[#8C7853] flex items-center justify-center gap-1.5 cursor-pointer hover:bg-[#8C7853]/5 transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[120px]">{contribFileName || 'Comprovante'}</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-[#8C7853]/10">
                  <button
                    type="button"
                    onClick={() => setGiftStep('details')}
                    className="flex-1 border border-[#8C7853]/20 hover:bg-[#FAF7F2] text-[#2C2520]/70 text-[10px] font-bold uppercase tracking-widest py-3 rounded-md transition-colors text-center"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-[#8C7853] hover:bg-[#726141] text-white text-[10px] font-bold uppercase tracking-widest py-3 rounded-md transition-colors text-center"
                  >
                    Enviar Registro
                  </button>
                </div>
              </form>
            )}

            {giftStep === 'success' && (
              <div className="p-8 text-center space-y-4">
                <div className="w-12 h-12 bg-[#8C7853]/15 border border-[#8C7853]/35 rounded-full flex items-center justify-center text-[#8C7853] mx-auto animate-bounce">
                  <Heart className="w-6 h-6 fill-[#8C7853]/30" />
                </div>
                <h3 className="font-cinzel text-sm uppercase tracking-wider font-bold text-[#2C2520]">Registro Concluído!</h3>
                <p className="text-[11px] text-[#2C2520]/60 leading-relaxed max-w-[280px] mx-auto">
                  Sua contribuição foi registrada com sucesso e um e-mail de agradecimento foi preparado ao casal. Obrigado por fazer parte da nossa história!
                </p>
                <button
                  onClick={() => setShowGiftModal(false)}
                  className="w-full bg-[#2C2520] hover:bg-[#1A1613] text-white text-[10px] font-bold uppercase tracking-widest py-3 rounded-md transition-colors text-center mt-6"
                >
                  Fechar Janela
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* RSVP PIN PROTECTION FLOATING MODAL */}
      <AnimatePresence>
        {showRsvpPinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRsvpPinModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="bg-[#FAF7F2] border border-[#8C7853]/25 w-full max-w-md rounded-2xl shadow-2xl relative overflow-hidden z-10 p-8 md:p-10"
            >
              {/* Close Button */}
              <button 
                onClick={() => setShowRsvpPinModal(false)}
                className="absolute top-5 right-5 text-[#2C2520]/40 hover:text-[#2C2520]/80 p-1.5 hover:bg-[#8C7853]/5 rounded-full transition-colors"
              >
                <X className="w-4.5 h-4.5" />
              </button>

              {/* Padlock Icon */}
              <div className="w-14 h-14 bg-[#8C7853]/10 rounded-full flex items-center justify-center mb-5 mx-auto">
                <Lock className="w-6 h-6 text-[#8C7853]" />
              </div>

              {/* Header */}
              <div className="text-center mb-6">
                <h3 className="font-cinzel text-xl md:text-2xl font-semibold tracking-wide text-[#2C2520] mb-2.5">
                  Confirmação de Presença
                </h3>
                <p className="text-[11px] md:text-xs text-[#2C2520]/60 max-w-[280px] mx-auto leading-relaxed">
                  Para confirmar sua presença, informe o PIN exclusivo enviado pelos noivos no seu convite.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleValidatePin} className="space-y-4">
                <div>
                  <label className="text-[9px] font-mono tracking-widest text-[#2C2520]/50 uppercase mb-2 block text-center">
                    SEU PIN DE ACESSO
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={rsvpPinInput}
                    onChange={(e) => {
                      setRsvpPinInput(e.target.value);
                      if (pinError) setPinError('');
                    }}
                    placeholder="Ex: 582914" 
                    className="w-full bg-white border border-[#8C7853]/40 focus:border-[#8C7853] text-center font-mono font-bold tracking-[0.2em] text-sm py-3.5 rounded-lg focus:outline-hidden transition-all uppercase"
                  />
                  {pinError && (
                    <p className="text-[10px] text-rose-500 mt-2 text-center font-medium animate-pulse">
                      {pinError}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="bg-[#8C7853] hover:bg-[#726141] text-white text-xs font-bold uppercase tracking-widest py-3.5 w-full rounded-lg transition-colors shadow-md mt-2"
                >
                  VALIDAR PIN
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
