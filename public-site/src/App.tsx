import React, { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import { PublicSite } from './components/PublicSite';
import { WhatsappHelpButton } from './components/WhatsappHelpButton';

function LoadingScreen({ fadeOut }: { fadeOut: boolean }) {
  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-black transition-opacity duration-700 ${fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
    >
      <img
        src="/assets/images/hero_landscape.jpg"
        alt=""
        className="absolute inset-0 w-full h-full object-cover brightness-[0.35] blur-sm scale-105"
        style={{ objectPosition: 'center 22%' }}
      />
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 flex flex-col items-center gap-5">
        <div className="relative w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-[#D9C8A9]/25" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#D9C8A9] animate-spin" />
          <Heart className="w-6 h-6 text-[#D9C8A9] fill-[#D9C8A9]" />
        </div>
        <p className="font-romantic italic text-2xl md:text-3xl text-[#D9C8A9]">Luciana &amp; Nilton</p>
        <span className="font-cinzel text-[10px] tracking-[0.25em] uppercase text-white/70">Carregando</span>
      </div>
    </div>
  );
}

function AppContent() {
  const { loading } = useApp();
  const [showIntro, setShowIntro] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadeOut(true), 1800);
    const removeTimer = setTimeout(() => setShowIntro(false), 2500);
    return () => { clearTimeout(fadeTimer); clearTimeout(removeTimer); };
  }, []);

  if (loading) {
    return <LoadingScreen fadeOut={false} />;
  }
  return (
    <>
      {showIntro && <LoadingScreen fadeOut={fadeOut} />}
      <PublicSite />
      <WhatsappHelpButton />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
