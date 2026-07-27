import React, { useRef, useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL as string;
const ADMIN_TOKEN = import.meta.env.VITE_ADMIN_TOKEN as string;

interface ImagePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  urlLabel?: string;
}

// Redimensiona/comprime a imagem no navegador antes de enviar,
// pra não subir fotos gigantes pro servidor.
function compressImage(file: File, maxWidth = 1400, quality = 0.82): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas indisponível.'));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error('Falha ao gerar imagem.'))),
          'image/jpeg',
          quality
        );
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export const ImagePicker: React.FC<ImagePickerProps> = ({
  value,
  onChange,
  placeholder = 'https://images.unsplash.com/...',
  urlLabel = 'Link/URL da Imagem',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Escolha um arquivo de imagem.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const blob = await compressImage(file);
      // Envia a foto já comprimida pro R2 (via Worker) — o documento salvo
      // na KV guarda só o link, não a imagem em si.
      const res = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'image/jpeg',
          Authorization: `Bearer ${ADMIN_TOKEN}`,
        },
        body: blob,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Falha ao enviar a imagem.');
      }
      const { url } = await res.json();
      onChange(url);
    } catch (e: any) {
      setError(e?.message || 'Falha ao processar a imagem.');
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div>
      <label className="text-[9px] uppercase font-bold tracking-widest text-neutral-300 block mb-1">{urlLabel}</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-neutral-900 border border-neutral-800 rounded-md px-3.5 py-2.5 text-xs text-neutral-300 focus:outline-hidden focus:border-[#8C7853] font-mono"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className="shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-md border border-neutral-800 bg-neutral-900 text-neutral-300 text-[10px] uppercase font-bold tracking-widest hover:border-[#8C7853] hover:text-[#8C7853] transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          <span>{loading ? 'Enviando...' : 'Do computador'}</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
      {error && <span className="text-[9px] text-red-400 mt-1 block">{error}</span>}
      {value && (
        <div className="mt-2 w-20 h-20 rounded-md overflow-hidden border border-neutral-800">
          <img src={value} alt="Pré-visualização" className="w-full h-full object-cover" />
        </div>
      )}
    </div>
  );
};
