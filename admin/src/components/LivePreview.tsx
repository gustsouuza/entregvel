/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Monitor, Tablet, Smartphone, ExternalLink } from 'lucide-react';
import { PublicSite } from './PublicSite';
import { useApp } from '../context/AppContext';

// URL do site público de verdade (projeto `public-site/`).
const PUBLIC_SITE_URL = (import.meta.env.VITE_PUBLIC_SITE_URL as string) || '';

export const LivePreview: React.FC = () => {
  const { weddingData } = useApp();
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  const getViewportWidthClass = () => {
    switch (viewport) {
      case 'mobile': return 'max-w-[375px] h-[720px] rounded-[36px] border-[10px] border-neutral-800 shadow-2xl';
      case 'tablet': return 'max-w-[768px] h-[900px] rounded-[24px] border-[8px] border-neutral-800 shadow-xl';
      default: return 'w-full h-[95vh] rounded-lg shadow-sm border border-neutral-200';
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-50/50 p-4 border-l border-neutral-200/60">
      {/* Device Toggle Header */}
      <div className="flex justify-between items-center mb-4 bg-white px-4 py-3 border border-neutral-200/60 rounded-xl shadow-xs">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[10px] font-bold tracking-widest uppercase text-neutral-500">Preview Em Tempo Real</span>
        </div>

        {/* Viewport Toggles */}
        <div className="flex bg-neutral-100 p-1 rounded-lg border border-neutral-200/50">
          {[
            { id: 'desktop', icon: <Monitor className="w-3.5 h-3.5" />, label: 'Desktop' },
            { id: 'tablet', icon: <Tablet className="w-3.5 h-3.5" />, label: 'Tablet' },
            { id: 'mobile', icon: <Smartphone className="w-3.5 h-3.5" />, label: 'Móvel' }
          ].map((device) => (
            <button
              key={device.id}
              onClick={() => setViewport(device.id as any)}
              className={`p-1.5 rounded-md flex items-center space-x-1 text-[10px] uppercase font-bold tracking-wider transition-all ${
                viewport === device.id 
                  ? 'bg-white shadow-xs text-[#8C7853]' 
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
              title={device.label}
            >
              {device.icon}
            </button>
          ))}
        </div>

        {/* Link to view in new tab / full public view */}
        <button
          onClick={() => {
            if (PUBLIC_SITE_URL) {
              window.open(PUBLIC_SITE_URL, '_blank', 'noopener,noreferrer');
            } else {
              alert('Configure VITE_PUBLIC_SITE_URL no .env do admin para habilitar este botão.');
            }
          }}
          className="text-[10px] uppercase font-bold tracking-widest text-[#8C7853] hover:underline flex items-center gap-1"
        >
          <span>Ver Tela Cheia</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>

      {/* Frame Container */}
      <div className="flex-1 flex justify-center items-center overflow-hidden py-2 bg-neutral-100/60 rounded-xl border border-dashed border-neutral-200">
        <div 
          className={`relative bg-white overflow-hidden transition-all duration-300 ease-out flex flex-col ${getViewportWidthClass()}`}
        >
          {/* Status notch for phone preview */}
          {viewport === 'mobile' && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-neutral-800 w-32 h-4 rounded-full z-30 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-neutral-900 absolute left-3"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-neutral-600 absolute right-3"></div>
            </div>
          )}

          {/* Actual Site Render */}
          <div className="flex-1 overflow-y-auto w-full h-full relative" id="live-preview-viewport">
            <PublicSite isPreviewMode={true} />
          </div>
        </div>
      </div>
    </div>
  );
};
