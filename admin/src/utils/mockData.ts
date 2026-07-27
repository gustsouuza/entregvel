/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WeddingData, WeddingTheme } from '../types';

// Premium themes presets
export const PRESET_THEMES: WeddingTheme[] = [
  {
    id: 'theme-champagne',
    name: 'Champagne Clássico',
    primaryColor: '#8C7853', // Warm gold / champagne
    accentColor: '#D9C8A9',  // Soft cream champagne
    bgColor: '#FAF7F2',      // Elegant off-white
    textColor: '#2C2520',    // Matte charcoal / dark chocolate
    cardBg: '#FFFFFF',
    fontFamily: 'serif',
    buttonStyle: 'rounded-md',
    borderStyle: 'border-solid',
    heroLayout: 'classic',
    backgroundEffect: 'sparkles'
  },
  {
    id: 'theme-oliva',
    name: 'Verde Oliva & Off-White',
    primaryColor: '#5B6846', // Olive green
    accentColor: '#BAC4A8',  // Sage accent
    bgColor: '#F5F7F2',      // Warm soft sage cream
    textColor: '#1A2112',    // Deep forest green-black
    cardBg: '#FFFFFF',
    fontFamily: 'romantic',
    buttonStyle: 'rounded-full',
    borderStyle: 'border-solid',
    heroLayout: 'romantic',
    backgroundEffect: 'none'
  },
  {
    id: 'theme-minimal',
    name: 'Minimalist Charcoal',
    primaryColor: '#1A1A1A', // Matte black
    accentColor: '#7A7A7A',  // Slate gray
    bgColor: '#FAF9F6',      // Pure soft linen
    textColor: '#111111',    // Intense dark charcoal
    cardBg: '#FFFFFF',
    fontFamily: 'sans',
    buttonStyle: 'rounded-none',
    borderStyle: 'border-solid',
    heroLayout: 'minimalist',
    backgroundEffect: 'none'
  },
  {
    id: 'theme-terracotta',
    name: 'Terracota & Areia',
    primaryColor: '#B3543B', // Terracotta
    accentColor: '#E6B69E',  // Warm sand
    bgColor: '#FAF5F0',      // Soft peach-offwhite
    textColor: '#2E1510',    // Deep earth-brown
    cardBg: '#FFFFFF',
    fontFamily: 'serif',
    buttonStyle: 'rounded-lg',
    borderStyle: 'border-solid',
    heroLayout: 'modern',
    backgroundEffect: 'stars'
  }
];
export const INITIAL_WEDDING_DATA: WeddingData = {
  id: 'wed-joao-julia',
  slug: 'joao-e-julia',
  partner1: {
    firstName: 'Luciana',
    lastName: 'Mendes',
    bio: 'Designer de Interiores apaixonada por curadoria, luz natural e a simplicidade elegante das coisas feitas à mão. Encontrou no Nilton seu melhor amigo, porto seguro e a inspiração diária.',
    imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=600'
  },
  partner2: {
    firstName: 'Nilton',
    lastName: 'Silva',
    bio: 'Arquiteto fascinado por fotografia e marcenaria tradicional. Encontra na Luciana a sua sintonia perfeita, o melhor abraço e o sorriso de todas as manhãs.',
    imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=600'
  },
  eventDate: '2026-09-19', // Data correta do casamento: 19/09/2026
  ceremonyTime: '17:00',
  ceremonyLocation: {
    name: 'Espaço Bela Vista',
    address: 'QSC 19, Setor Primavera, Chácara 27, Taguatinga Sul - DF',
    mapsLink: 'https://maps.google.com/?q=Espa%C3%A7o%20Bela%20Vista%2C%20QSC%2019%20Setor%20Primavera%20Ch%C3%A1cara%2027%2C%20Taguatinga%20Sul%20-%20DF',
    embedUrl: 'https://maps.google.com/maps?q=Espa%C3%A7o%20Bela%20Vista%2C%20QSC%2019%20Setor%20Primavera%20Ch%C3%A1cara%2027%2C%20Taguatinga%20Sul%20-%20DF&t=&z=15&ie=UTF8&iwloc=&output=embed'
  },
  receptionTime: '17:30',
  receptionLocation: {
    name: 'Espaço Bela Vista',
    address: 'QSC 19, Setor Primavera, Chácara 27, Taguatinga Sul - DF',
    mapsLink: 'https://maps.google.com/?q=Espa%C3%A7o%20Bela%20Vista%2C%20QSC%2019%20Setor%20Primavera%20Ch%C3%A1cara%2027%2C%20Taguatinga%20Sul%20-%20DF',
    embedUrl: 'https://maps.google.com/maps?q=Espa%C3%A7o%20Bela%20Vista%2C%20QSC%2019%20Setor%20Primavera%20Ch%C3%A1cara%2027%2C%20Taguatinga%20Sul%20-%20DF&t=&z=15&ie=UTF8&iwloc=&output=embed'
  },
  dressCode: {
    madrinhas: 'Vestidos fluidos (midi ou longos), estampas florais sutis, cores alegres. Calçado confortável para área gramada e arborizada.',
    padrinhos: 'Traje esporte fino. Blazer ou terno claro opcional. Gravata não obrigatória. Mocassim ou sapato social.',
    guests: 'Esporte Fino. Traje sugerido (não obrigatório) para celebrarmos em local arborizado durante a tarde (Espaço Bela Vista, às 16:30), unindo elegância e conforto.',
    colors: [],
    imageUrl: '/assets/images/dress_code.jpg'
  },
  pixKeyType: 'email',
  pixKeyValue: 'niltoneluciana2026@gmail.com',
  pixFavoredName: 'Nilton Silva e Luciana Mendes',
  
  timeline: [
    {
      id: 'tl-1',
      date: '12 de Março de 2021',
      title: 'O Primeiro Olhar',
      description: 'Nos conhecemos de forma totalmente inesperada em uma livraria com café no coração de São Paulo. Nilton derrubou acidentalmente sua xícara de cappuccino perto da mesa de Luciana. O pedido de desculpas se transformou em uma conversa de quatro horas sobre livros, viagens e arquitetura.',
      imageUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=600'
    },
    {
      id: 'tl-2',
      date: '18 de Setembro de 2022',
      title: 'A Primeira Viagem Juntos',
      description: 'Decidimos passar um feriado prolongado em Tiradentes, Minas Gerais. Entre ruelas históricas, passeios de maria-fumaça e jantares à luz de velas, percebemos que nossas vidas se encaixavam perfeitamente e que queríamos planejar todas as próximas viagens juntos.',
      imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=600'
    },
    {
      id: 'tl-3',
      date: '25 de Dezembro de 2024',
      title: 'O Pedido de Casamento',
      description: 'Durante uma viagem para a Itália, sob o céu estrelado de Positano na Costa Amalfitana, o Nilton preparou um piquenique privado num terraço com vista para o mar azul. Entre risos e lágrimas de pura emoção, ele se ajoelhou e fez a pergunta mais importante de nossas vidas. A resposta foi um sonoro e emocionado SIM!',
      imageUrl: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=600'
    }
  ],
  
  gallery: [
    {
      id: 'gal-1',
      url: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=800',
      caption: 'Nossos votos de amor eterno.'
    },
    {
      id: 'gal-2',
      url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800',
      caption: 'Nosso ensaio pré-wedding florido.'
    },
    {
      id: 'gal-3',
      url: 'https://images.unsplash.com/photo-1519225495810-7512c696505a?auto=format&fit=crop&q=80&w=800',
      caption: 'O pôr do sol mais especial de nossas vidas.'
    },
    {
      id: 'gal-4',
      url: 'https://images.unsplash.com/photo-1464518017462-75c0c1d4413c?auto=format&fit=crop&q=80&w=800',
      caption: 'De mãos dadas, rumo ao nosso futuro.'
    },
    {
      id: 'gal-5',
      url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&q=80&w=800',
      caption: 'Caminhando juntos na mesma direção.'
    },
    {
      id: 'gal-6',
      url: 'https://images.unsplash.com/photo-1529634597503-139d3726fed5?auto=format&fit=crop&q=80&w=800',
      caption: 'O momento do SIM mais importante de nossas vidas.'
    },
    {
      id: 'gal-7',
      url: 'https://images.unsplash.com/photo-1537655780520-1e392edd816a?auto=format&fit=crop&q=80&w=800',
      caption: 'Novos horizontes para explorar juntos.'
    },
    {
      id: 'gal-8',
      url: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&q=80&w=800',
      caption: 'A sintonia e paz que encontramos um no outro.'
    },
    {
      id: 'gal-9',
      url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=800',
      caption: 'Amor é também diversão e risadas soltas.'
    },
    {
      id: 'gal-10',
      url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=800',
      caption: 'Nossa cumplicidade em cada passo do dia a dia.'
    },
    {
      id: 'gal-11',
      url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=800',
      caption: 'Dançando no ritmo suave da nossa própria canção.'
    },
    {
      id: 'gal-12',
      url: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&q=80&w=800',
      caption: 'Nossa maior riqueza é a família que construímos.'
    },
    {
      id: 'gal-13',
      url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=800',
      caption: 'Sorrisos sinceros e muito amor envolvido.'
    },
    {
      id: 'gal-14',
      url: 'https://images.unsplash.com/photo-1525253086316-d0c936c814f8?auto=format&fit=crop&q=80&w=800',
      caption: 'Ansiosos para o grande dia das nossas vidas!'
    },
    {
      id: 'gal-15',
      url: 'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&q=80&w=800',
      caption: 'Parceria, carinho e diversão em todos os instantes.'
    },
    {
      id: 'gal-16',
      url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=800',
      caption: 'O melhor lugar do mundo é sempre o seu abraço.'
    }
  ],
  
  schedule: [
    {
      id: 'sch-1',
      time: '16:30',
      title: 'Chegada dos Convidados',
      location: 'Espaço Bela Vista',
      description: 'Recepção com água de coco aromatizada e música instrumental suave para acolher a todos.'
    },
    {
      id: 'sch-2',
      time: '17:00',
      title: 'Início da Cerimônia',
      location: 'Altar do Espaço Bela Vista',
      description: 'O início do nosso felizes para sempre em um momento abençoado de frente para o mar.'
    },
    {
      id: 'sch-3',
      time: '18:00',
      title: 'Coquetel de Boas-Vindas',
      location: 'Gramado Principal do Espaço Reserva',
      description: 'Drinks tropicais personalizados, petiscos locais e sessão de fotos com familiares.'
    },
    {
      id: 'sch-4',
      time: '19:30',
      title: 'Jantar e Brinde dos Noivos',
      location: 'Salão de Festas Climatizado',
      description: 'Banquete assinado com o melhor da gastronomia nordestina e frutos do mar.'
    },
    {
      id: 'sch-5',
      time: '21:00',
      title: 'Abertura da Pista de Dança',
      location: 'Pista de Dança Reserva',
      description: 'Início da festa com nossa banda favorita e DJ com setlist animada até o amanhecer.'
    }
  ],
  
  hospitality: [
    {
      id: 'hosp-1',
      category: 'hospedagem',
      name: 'Pousada Reserva dos Milagres',
      phone: '(82) 99876-5432',
      address: 'Praia de Marceneiro, São Miguel dos Milagres - AL',
      description: 'Uma das pousadas mais charmosas e confortáveis da região. Fica a apenas 5 minutos de caminhada da capela da cerimônia. Oferece desconto especial de 10% para convidados do casamento mencionando nosso nome no WhatsApp.',
      link: 'https://pousadareservadosmilagres.com.br'
    },
    {
      id: 'hosp-2',
      category: 'hospedagem',
      name: 'Hotel Angatu Beach',
      phone: '(82) 99123-4567',
      address: 'Rua Principal da Praia, São Miguel dos Milagres - AL',
      description: 'Excelente custo-benefício e estrutura com piscina de borda infinita de frente para as piscinas naturais. Ideal para famílias e grupos maiores.',
      link: 'https://angatubeachhotel.com.br'
    },
    {
      id: 'hosp-3',
      category: 'beleza',
      name: 'Studio Milagres Beauty',
      phone: '(82) 98888-1111',
      address: 'Av. Costeira, 450 - Centro, São Miguel dos Milagres - AL',
      description: 'Equipe especializada em maquiagem e penteados praianos de alta durabilidade para casamentos diurnos. Recomendamos agendar com pelo menos 2 meses de antecedência devido à alta demanda.',
      link: 'https://instagram.com/studiomilagresbeauty'
    },
    {
      id: 'hosp-4',
      category: 'restaurante',
      name: 'Restaurante No Quintal',
      phone: '(82) 99654-3210',
      address: 'Rua da Balsa, s/n - Porto de Pedras - AL',
      description: 'O restaurante mais famoso e delicioso da Rota ecológica dos Milagres. Serve pratos artesanais com ingredientes frescos cultivados no próprio quintal da pousada. Reserva obrigatória!',
      link: 'https://noquintalmilagres.com.br'
    }
  ],
  
  gifts: [],
  
  giftContributions: [],
  
  rsvps: [
    {
      id: 'r-1',
      name: 'Lucas Ferreira da Silva',
      phone: '(11) 98765-4321',
      attending: true,
      companions: 1,
      dietaryRestrictions: 'Sem glúten',
      message: 'Mari e Gui! Não perderíamos esse momento por nada! Passagens já compradas e hospedagem fechada. Vamos comemorar muito!',
      date: '2026-06-15T10:00:00-03:00',
      code: 'RSVP-LUCAS-31'
    },
    {
      id: 'r-2',
      name: 'Ana Júlia de Souza',
      phone: '(11) 99122-3344',
      attending: true,
      companions: 0,
      dietaryRestrictions: 'Vegetariana',
      message: 'Estou explodindo de felicidade por vocês! É uma honra ver essa linda história chegar ao altar. Nos vemos na praia!',
      date: '2026-06-20T16:30:00-03:00',
      code: 'RSVP-ANA-84'
    },
    {
      id: 'r-3',
      name: 'Roberto Mendes Vasconcellos',
      phone: '(21) 97766-5544',
      attending: false,
      companions: 0,
      message: 'Queridos primos, infelizmente terei um compromisso corporativo inadiável fora do país nessa mesma data. Desejo de coração uma cerimônia divina e uma vida repleta de conquistas para vocês!',
      date: '2026-06-22T11:20:00-03:00',
      code: 'RSVP-ROBERTO-15'
    }
  ],
  
  messages: [
    {
      id: 'msg-1',
      author: 'Carolina Almeida (Mãe da Noiva)',
      content: 'Ver minha filha realizar este grande sonho, ao lado de um homem tão íntegro e carinhoso como o Nilton, enche meu coração de uma gratidão sem fim. Que Deus guie sempre os passos de vocês e encha a casa nova de risos, respeito e companheirismo infinito!',
      date: '2026-06-10T14:35:00-03:00',
      likes: 12,
      isApproved: true,
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150'
    },
    {
      id: 'msg-2',
      author: 'Rodrigo & Amanda (Padrinhos)',
      content: 'Luciana e Nilton, que privilégio gigantesco acompanhar o crescimento dessa história de amor desde os primeiros cappuccinos! Vocês são inspiração para nós de dedicação, diversão e parceria. A contagem regressiva para milagres já começou!',
      date: '2026-06-12T19:22:00-03:00',
      likes: 8,
      isApproved: true,
      avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150'
    },
    {
      id: 'msg-3',
      author: 'Tia Helena',
      content: 'Desejo muitas felicidades para esse casal abençoado! Que a jornada seja repleta de paciência, amor e harmonia. Um forte abraço!',
      date: '2026-06-18T10:05:00-03:00',
      likes: 4,
      isApproved: true,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'
    }
  ],
  
  theme: PRESET_THEMES[0], // Gold Champagne Default
  
  analytics: [
    {
      date: '2026-06-24',
      visits: 42,
      clicks: 18,
      devices: { mobile: 28, desktop: 12, tablet: 2 },
      origins: { instagram: 15, whatsapp: 20, qrcode: 3, direct: 4 },
      locations: [
        { city: 'São Paulo', count: 22, lat: -23.5505, lng: -46.6333 },
        { city: 'Rio de Janeiro', count: 12, lat: -22.9068, lng: -43.1729 },
        { city: 'Maceió', count: 8, lat: -9.6658, lng: -35.7350 }
      ]
    },
    {
      date: '2026-06-25',
      visits: 58,
      clicks: 29,
      devices: { mobile: 42, desktop: 13, tablet: 3 },
      origins: { instagram: 22, whatsapp: 24, qrcode: 5, direct: 7 },
      locations: [
        { city: 'São Paulo', count: 32, lat: -23.5505, lng: -46.6333 },
        { city: 'Rio de Janeiro', count: 15, lat: -22.9068, lng: -43.1729 },
        { city: 'Maceió', count: 11, lat: -9.6658, lng: -35.7350 }
      ]
    },
    {
      date: '2026-06-26',
      visits: 73,
      clicks: 34,
      devices: { mobile: 55, desktop: 15, tablet: 3 },
      origins: { instagram: 30, whatsapp: 28, qrcode: 6, direct: 9 },
      locations: [
        { city: 'São Paulo', count: 41, lat: -23.5505, lng: -46.6333 },
        { city: 'Rio de Janeiro', count: 19, lat: -22.9068, lng: -43.1729 },
        { city: 'Maceió', count: 13, lat: -9.6658, lng: -35.7350 }
      ]
    },
    {
      date: '2026-06-27',
      visits: 85,
      clicks: 41,
      devices: { mobile: 65, desktop: 16, tablet: 4 },
      origins: { instagram: 35, whatsapp: 32, qrcode: 10, direct: 8 },
      locations: [
        { city: 'São Paulo', count: 48, lat: -23.5505, lng: -46.6333 },
        { city: 'Rio de Janeiro', count: 22, lat: -22.9068, lng: -43.1729 },
        { city: 'Maceió', count: 15, lat: -9.6658, lng: -35.7350 }
      ]
    },
    {
      date: '2026-06-28',
      visits: 94,
      clicks: 52,
      devices: { mobile: 72, desktop: 18, tablet: 4 },
      origins: { instagram: 38, whatsapp: 36, qrcode: 12, direct: 8 },
      locations: [
        { city: 'São Paulo', count: 52, lat: -23.5505, lng: -46.6333 },
        { city: 'Rio de Janeiro', count: 25, lat: -22.9068, lng: -43.1729 },
        { city: 'Maceió', count: 17, lat: -9.6658, lng: -35.7350 }
      ]
    },
    {
      date: '2026-06-29',
      visits: 110,
      clicks: 65,
      devices: { mobile: 80, desktop: 24, tablet: 6 },
      origins: { instagram: 42, whatsapp: 45, qrcode: 15, direct: 8 },
      locations: [
        { city: 'São Paulo', count: 61, lat: -23.5505, lng: -46.6333 },
        { city: 'Rio de Janeiro', count: 30, lat: -22.9068, lng: -43.1729 },
        { city: 'Maceió', count: 19, lat: -9.6658, lng: -35.7350 }
      ]
    }
  ],
  
  rsvpPinCode: '582914',
  invitations: [
    {
      id: 'inv-1',
      familyName: 'Família Silva de Souza',
      pin: 'SILV98',
      maxGuests: 4,
      guests: [
        { id: 'g-1-1', name: 'Carlos Silva de Souza', confirmed: true },
        { id: 'g-1-2', name: 'Ana Silva de Souza', confirmed: false },
        { id: 'g-1-3', name: 'Bruno Silva de Souza', confirmed: null },
        { id: 'g-1-4', name: 'Mariana Silva de Souza', confirmed: null }
      ]
    },
    {
      id: 'inv-2',
      familyName: 'Família Oliveira',
      pin: 'OLIV42',
      maxGuests: 2,
      guests: [
        { id: 'g-2-1', name: 'Sônia Oliveira', confirmed: true },
        { id: 'g-2-2', name: 'Marcos Oliveira', confirmed: true }
      ]
    },
    {
      id: 'inv-3',
      familyName: 'Casal Santos',
      pin: 'SANT15',
      maxGuests: 2,
      guests: [
        { id: 'g-3-1', name: 'Renato Santos', confirmed: null },
        { id: 'g-3-2', name: 'Camila Santos', confirmed: null }
      ]
    }
  ],
  seo: {
    title: 'Casamento Luciana & Nilton - 15 de Agosto de 2026',
    description: 'Seja bem-vindo ao site oficial do nosso casamento! Aqui você encontrará todas as informações sobre a cerimônia, confirmação de presença (RSVP), dicas de hospedagem e nossa lista de presentes.'
  }
};