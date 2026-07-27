import React, { useState } from 'react';
import { X } from 'lucide-react';

const PHONE = '556192344668'; // +55 61 9234-4668

const OPTIONS = [
  'Confirmação de presença',
  'Pagamento do presente',
  'Código de vestimenta',
  'Outros',
];

function sendDoubt(topic: string) {
  const msg = topic === 'Outros' ? 'Gostaria de tirar uma dúvida' : `Gostaria de tirar uma dúvida sobre: ${topic}.`;
  const link = `https://wa.me/${PHONE}?text=${encodeURIComponent(msg)}`;
  window.open(link, '_blank', 'noopener,noreferrer');
}

function DoubtMenu({ open, onSelect }: { open: boolean; onSelect: (topic: string) => void }) {
  if (!open) return null;
  return (
    <div className="bg-white rounded-lg shadow-xl border border-neutral-200 w-64 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
      <div className="bg-[#8C7853] text-white text-sm font-semibold px-4 py-3">
        Sobre o que é sua dúvida?
      </div>
      <div className="flex flex-col">
        {OPTIONS.map((opt) => (
          <button
            key={opt}
            onClick={() => onSelect(opt)}
            className="text-left px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 border-b border-neutral-100 last:border-b-0"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// Botão flutuante (canto inferior direito)
export function WhatsappHelpButton() {
  const [open, setOpen] = useState(false);
  const select = (topic: string) => { sendDoubt(topic); setOpen(false); };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      <DoubtMenu open={open} onSelect={select} />
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Tirar Dúvida"
        className="h-11 px-5 sm:h-14 sm:px-6 rounded-full bg-[#8C7853] hover:bg-[#726141] text-white font-semibold flex items-center gap-2 shadow-lg transition-colors"
      >
        {open ? <X className="w-5 h-5" /> : null}
        <span>{open ? 'Fechar' : 'Tirar Dúvida'}</span>
      </button>
    </div>
  );
}

// Botão para usar no rodapé do site
export function WhatsappHelpFooterButton() {
  const [open, setOpen] = useState(false);
  const select = (topic: string) => { sendDoubt(topic); setOpen(false); };

  return (
    <div className="relative inline-flex flex-col items-center gap-3">
      <div className="absolute bottom-full mb-3">
        <DoubtMenu open={open} onSelect={select} />
      </div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="h-12 px-6 rounded-full bg-[#8C7853] hover:bg-[#726141] text-white font-semibold shadow-md transition-colors"
      >
        Tirar Dúvida
      </button>
    </div>
  );
}
