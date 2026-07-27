/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  imageUrl?: string;
}

export interface GalleryItem {
  id: string;
  url: string;
  caption?: string;
}

export interface ScheduleEvent {
  id: string;
  time: string;
  title: string;
  location: string;
  description?: string;
}

export interface HospitalityTip {
  id: string;
  category: 'hospedagem' | 'beleza' | 'dica' | 'restaurante';
  name: string;
  phone?: string;
  address: string;
  description?: string;
  link?: string;
}

export interface GiftItem {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  category: string;
  status: 'disponivel' | 'reservado' | 'recebido';
}

export interface GiftContribution {
  id: string;
  giftId: string;
  giftName: string;
  donorName: string;
  message: string;
  value: number;
  date: string;
  status: 'confirmado' | 'pendente';
  comprovanteUrl?: string;
}

export interface RSVPResponse {
  id: string;
  name: string;
  phone: string;
  attending: boolean;
  companions: number;
  dietaryRestrictions?: string;
  message?: string;
  date: string;
  code: string;
}

export interface GuestMessage {
  id: string;
  author: string;
  content: string;
  date: string;
  likes: number;
  isApproved: boolean;
  avatarUrl?: string;
}

export interface WeddingTheme {
  id: string;
  name: string;
  primaryColor: string; // Tailwind color or hex
  accentColor: string;
  bgColor: string;
  textColor: string;
  cardBg: string;
  fontFamily: 'serif' | 'sans' | 'mono' | 'romantic';
  buttonStyle: 'rounded-none' | 'rounded-md' | 'rounded-full' | 'rounded-lg';
  borderStyle: 'border-solid' | 'border-dashed' | 'border-none';
  heroLayout: 'classic' | 'modern' | 'romantic' | 'minimalist';
  backgroundEffect: 'none' | 'stars' | 'sparkles' | 'snow';
}

export interface AccessAnalytic {
  date: string;
  visits: number;
  clicks: number;
  devices: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
  origins: {
    instagram: number;
    whatsapp: number;
    qrcode: number;
    direct: number;
  };
  locations: {
    city: string;
    count: number;
    lat: number;
    lng: number;
  }[];
}

export interface WeddingData {
  id: string;
  slug: string;
  partner1: {
    firstName: string;
    lastName: string;
    bio: string;
    imageUrl?: string;
  };
  partner2: {
    firstName: string;
    lastName: string;
    bio: string;
    imageUrl?: string;
  };
  eventDate: string; // ISO String or YYYY-MM-DD
  ceremonyTime: string;
  ceremonyLocation: {
    name: string;
    address: string;
    mapsLink: string;
    embedUrl?: string;
  };
  receptionTime: string;
  receptionLocation: {
    name: string;
    address: string;
    mapsLink: string;
    embedUrl?: string;
  };
  dressCode: {
    madrinhas: string;
    padrinhos: string;
    guests: string;
    colors: string[]; // hex codes for palette
    imageUrl?: string;
  };
  pixKeyType: 'cpf' | 'telefone' | 'email' | 'chave_aleatoria';
  pixKeyValue: string;
  pixFavoredName: string;
  
  timeline: TimelineEvent[];
  gallery: GalleryItem[];
  schedule: ScheduleEvent[];
  hospitality: HospitalityTip[];
  gifts: GiftItem[];
  giftContributions: GiftContribution[];
  rsvps: RSVPResponse[];
  messages: GuestMessage[];
  theme: WeddingTheme;
  analytics: AccessAnalytic[];
  rsvpPinCode?: string;
  invitations?: WeddingInvitation[];
  saveTheDate?: {
    imageUrl: string; // imagem do save the date / convite, enviada pro R2
    message: string; // texto padrão usado no disparo do WhatsApp (aceita {NOME}, {PIN}, {SITE})
  };
  seo: {
    title: string;
    description: string;
    ogImage?: string;
  };
}

export interface InvitationGuest {
  id: string;
  name: string;
  type?: 'adulto' | 'crianca'; // adulto (padrão) ou criança
  confirmed?: boolean | null; // true = confirmed, false = declined, null/undefined = pending
}

export interface WeddingInvitation {
  id: string;
  familyName: string;
  pin: string; // generated automatic PIN
  guests: InvitationGuest[];
  maxGuests: number;
  notes?: string;
  phone?: string;
  whatsappSent?: boolean; // marcado quando o admin envia o convite pelo WhatsApp
}
