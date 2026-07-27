// Dados iniciais (seed): são gravados automaticamente na KV na primeiríssima
// leitura, quando ainda está vazia (ver getData() em index.ts). Este arquivo
// é o "site zerado" que qualquer cliente novo recebe antes de preencher o
// próprio conteúdo pelo painel admin. NÃO coloque dados reais de nenhum
// cliente aqui — isso é reaproveitado a cada novo deploy.
export const SEED = {
  "id": "wed-novo-casal",
  "slug": "novo-casal",
  "partner1": {
    "firstName": "",
    "lastName": "",
    "bio": "",
    "imageUrl": ""
  },
  "partner2": {
    "firstName": "",
    "lastName": "",
    "bio": "",
    "imageUrl": ""
  },
  "eventDate": "2026-12-31",
  "ceremonyTime": "17:00",
  "ceremonyLocation": {
    "name": "",
    "address": "",
    "mapsLink": "",
    "embedUrl": ""
  },
  "receptionTime": "18:00",
  "receptionLocation": {
    "name": "",
    "address": "",
    "mapsLink": "",
    "embedUrl": ""
  },
  "dressCode": {
    "madrinhas": "",
    "padrinhos": "",
    "guests": "",
    "colors": [],
    "imageUrl": "/assets/images/dress_code.jpg"
  },
  "pixKeyType": "email",
  "pixKeyValue": "",
  "pixFavoredName": "",
  "timeline": [],
  "gallery": [],
  "schedule": [],
  "hospitality": [],
  "gifts": [],
  "giftContributions": [],
  "rsvps": [],
  "messages": [],
  "theme": {
    "id": "theme-champagne",
    "name": "Champagne Clássico",
    "primaryColor": "#8C7853",
    "accentColor": "#D9C8A9",
    "bgColor": "#FAF7F2",
    "textColor": "#2C2520",
    "cardBg": "#FFFFFF",
    "fontFamily": "serif",
    "buttonStyle": "rounded-md",
    "borderStyle": "border-solid",
    "heroLayout": "classic",
    "backgroundEffect": "sparkles"
  },
  "analytics": [],
  "rsvpPinCode": "",
  "invitations": [],
  "seo": {
    "title": "Nosso Casamento",
    "description": "Seja bem-vindo ao site oficial do nosso casamento! Aqui você encontrará todas as informações sobre a cerimônia, confirmação de presença (RSVP), dicas de hospedagem e nossa lista de presentes."
  }
};
