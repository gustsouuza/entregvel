/**
 * API do site de casamento — Cloudflare Worker + KV
 * Um único documento (weddingData) fica salvo na KV sob a chave KV_KEY.
 *
 * Rotas:
 *   GET    /api/wedding                       -> público, lê os dados
 *   PUT    /api/wedding                       -> admin (Bearer ADMIN_TOKEN), substitui tudo
 *   POST   /api/wedding/rsvp                  -> público, adiciona RSVP "simples" (sem convite nominal)
 *   POST   /api/wedding/messages              -> público, adiciona recado no mural
 *   POST   /api/wedding/messages/:id/like     -> público, curte um recado
 *   POST   /api/wedding/contributions         -> público, registra contribuição de presente
 *   POST   /api/wedding/invitations/:id/rsvp  -> público, confirma presença de um convite nominal
 *   POST   /api/upload                        -> admin (Bearer ADMIN_TOKEN), envia uma imagem pro R2
 *   GET    /api/images/:key                   -> público, serve uma imagem guardada no R2
 */

export interface Env {
  WEDDING_KV: KVNamespace;
  WEDDING_IMAGES: R2Bucket;
  ADMIN_TOKEN: string;
}

const KV_KEY = 'wedding-data';

function corsHeaders(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET,PUT,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

function json(data: unknown, init: ResponseInit = {}, origin: string | null = '*') {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(origin),
      ...(init.headers || {}),
    },
  });
}

async function getData(env: Env): Promise<any> {
  const raw = await env.WEDDING_KV.get(KV_KEY);
  if (raw) return JSON.parse(raw);
  // Semente inicial (primeira execução, KV ainda vazia)
  const { SEED } = await import('./seed');
  await env.WEDDING_KV.put(KV_KEY, JSON.stringify(SEED));
  return SEED;
}

async function saveData(env: Env, data: any): Promise<void> {
  await env.WEDDING_KV.put(KV_KEY, JSON.stringify(data));
}

function isAdmin(req: Request, env: Env): boolean {
  const auth = req.headers.get('Authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  return !!env.ADMIN_TOKEN && token === env.ADMIN_TOKEN;
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const origin = req.headers.get('Origin');
    const path = url.pathname;

    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(origin) });
    }

    try {
      // GET /api/wedding
      if (path === '/api/wedding' && req.method === 'GET') {
        const data = await getData(env);
        return json(data, {}, origin);
      }

      // PUT /api/wedding (admin - substitui o documento inteiro)
      if (path === '/api/wedding' && req.method === 'PUT') {
        if (!isAdmin(req, env)) return json({ error: 'unauthorized' }, { status: 401 }, origin);
        const body = await req.json();
        await saveData(env, body);
        return json({ ok: true }, {}, origin);
      }

      // POST /api/wedding/rsvp (público - RSVP simples)
      if (path === '/api/wedding/rsvp' && req.method === 'POST') {
        const body: any = await req.json();
        const data = await getData(env);
        const code = `RSVP-${(body.name || 'CONVIDADO').split(' ')[0].toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`;
        const newRsvp = { ...body, id: `r-${Date.now()}`, date: new Date().toISOString(), code };
        data.rsvps = [newRsvp, ...(data.rsvps || [])];
        await saveData(env, data);
        return json(newRsvp, {}, origin);
      }

      // POST /api/wedding/messages (público - mural de recados)
      if (path === '/api/wedding/messages' && req.method === 'POST') {
        const body: any = await req.json();
        const data = await getData(env);
        const newMessage = {
          ...body,
          id: `msg-${Date.now()}`,
          date: new Date().toISOString(),
          likes: 0,
          isApproved: true,
        };
        data.messages = [newMessage, ...(data.messages || [])];
        await saveData(env, data);
        return json(newMessage, {}, origin);
      }

      // POST /api/wedding/messages/:id/like (público)
      const likeMatch = path.match(/^\/api\/wedding\/messages\/([^/]+)\/like$/);
      if (likeMatch && req.method === 'POST') {
        const id = likeMatch[1];
        const data = await getData(env);
        data.messages = (data.messages || []).map((m: any) =>
          m.id === id ? { ...m, likes: (m.likes || 0) + 1 } : m
        );
        await saveData(env, data);
        return json({ ok: true }, {}, origin);
      }

      // POST /api/wedding/contributions (público - presente/contribuição)
      if (path === '/api/wedding/contributions' && req.method === 'POST') {
        const body: any = await req.json();
        const data = await getData(env);
        const newContribution = {
          ...body,
          id: `gcon-${Date.now()}`,
          date: new Date().toISOString(),
          status: 'pendente',
        };
        data.giftContributions = [newContribution, ...(data.giftContributions || [])];
        data.gifts = (data.gifts || []).map((g: any) =>
          g.id === body.giftId ? { ...g, status: 'reservado' } : g
        );
        await saveData(env, data);
        return json(newContribution, {}, origin);
      }

      // POST /api/wedding/invitations/:id/rsvp (público - convite nominal)
      const invMatch = path.match(/^\/api\/wedding\/invitations\/([^/]+)\/rsvp$/);
      if (invMatch && req.method === 'POST') {
        const id = invMatch[1];
        const body: any = await req.json(); // { guests: [{id, confirmed}], phone?, notes? }
        const data = await getData(env);
        data.invitations = (data.invitations || []).map((inv: any) => {
          if (inv.id !== id) return inv;
          return {
            ...inv,
            guests: body.guests ? body.guests.map((g: any) => ({ ...inv.guests.find((og: any) => og.id === g.id), ...g })) : inv.guests,
            phone: body.phone !== undefined ? body.phone : inv.phone,
            // O cliente já manda o texto final pronto (concatenado), então aqui é substituição, não soma.
            notes: body.notes !== undefined ? body.notes : inv.notes,
          };
        });
        await saveData(env, data);
        const updatedInv = data.invitations.find((i: any) => i.id === id);
        return json(updatedInv, {}, origin);
      }

      // POST /api/upload (admin - envia uma imagem pro R2, fora do documento da KV)
      if (path === '/api/upload' && req.method === 'POST') {
        if (!isAdmin(req, env)) return json({ error: 'unauthorized' }, { status: 401 }, origin);
        const contentType = req.headers.get('Content-Type') || 'image/jpeg';
        if (!contentType.startsWith('image/')) {
          return json({ error: 'apenas imagens são aceitas' }, { status: 400 }, origin);
        }
        const bytes = await req.arrayBuffer();
        const MAX_BYTES = 8 * 1024 * 1024; // 8MB por foto, já vem comprimida do navegador
        if (bytes.byteLength > MAX_BYTES) {
          return json({ error: 'imagem muito grande (máx. 8MB)' }, { status: 400 }, origin);
        }
        const ext = contentType.split('/')[1]?.split('+')[0] || 'jpg';
        const key = `uploads/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
        await env.WEDDING_IMAGES.put(key, bytes, { httpMetadata: { contentType } });
        const imageUrl = `${url.origin}/api/images/${key}`;
        return json({ url: imageUrl, key }, {}, origin);
      }

      // GET /api/images/:key (público - serve a imagem guardada no R2)
      const imgMatch = path.match(/^\/api\/images\/(.+)$/);
      if (imgMatch && req.method === 'GET') {
        const key = decodeURIComponent(imgMatch[1]);
        const obj = await env.WEDDING_IMAGES.get(key);
        if (!obj) return json({ error: 'não encontrada' }, { status: 404 }, origin);
        return new Response(obj.body, {
          headers: {
            'Content-Type': obj.httpMetadata?.contentType || 'application/octet-stream',
            'Cache-Control': 'public, max-age=31536000, immutable',
            ...corsHeaders(origin),
          },
        });
      }

      return json({ error: 'not found' }, { status: 404 }, origin);
    } catch (err: any) {
      return json({ error: err?.message || 'internal error' }, { status: 500 }, origin);
    }
  },
};
