import React from 'react';
import { UtensilsCrossed, ShoppingBag, Sparkles, Touchpad } from 'lucide-react';
import { DiningOption } from '../types';

interface AttractScreenProps {
  restaurantName: string;
  onStartOrder: (option: DiningOption) => void;
  onOpenSettings: () => void;
}

export const AttractScreen: React.FC<AttractScreenProps> = ({
  restaurantName,
  onStartOrder,
  onOpenSettings,
}) => {
  return (
    <div className="relative min-h-screen bg-neutral-950 text-white flex flex-col justify-between overflow-hidden select-none">
      {/* Background Hero Image with Dark Gradient Scrim */}
      <div className="absolute inset-0 z-0">
        <img
          src="/src/assets/images/combo_especial_1791585036353.jpg"
          alt="Hambúrguer artesanal"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover scale-105 filter brightness-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/70 to-neutral-950/40" />
      </div>

      {/* Top bar with subtle brand and settings */}
      <div className="relative z-10 max-w-7xl mx-auto w-full px-6 py-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-amber-500 font-black tracking-widest text-sm uppercase">
            Autoatendimento Kiosk
          </span>
          <span className="text-neutral-500">·</span>
          <span className="text-neutral-400 text-xs">Terminal 01</span>
        </div>

        <button
          onClick={onOpenSettings}
          className="text-xs text-neutral-400 hover:text-white bg-neutral-900/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-neutral-800 transition-colors"
        >
          Configurações
        </button>
      </div>

      {/* Center Hero Callout */}
      <div className="relative z-10 max-w-3xl mx-auto text-center px-6 py-12 flex flex-col items-center">
        <div className="inline-flex items-center gap-2 bg-amber-500/15 border border-amber-500/30 text-amber-400 px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold mb-6 backdrop-blur-md">
          <Sparkles className="w-4 h-4" />
          <span>Ingredientes Frescos & Carnes Selecionadas na Brasa</span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight font-display text-balance uppercase">
          {restaurantName}
        </h1>

        <p className="mt-4 text-base sm:text-xl text-neutral-300 max-w-xl font-medium leading-relaxed">
          Monte seu pedido personalizado em poucos toques e retire diretamente no balcão com sua senha.
        </p>

        {/* Big Touch CTA Buttons for Dining Option */}
        <div className="mt-10 sm:mt-12 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full max-w-lg">
          <button
            onClick={() => onStartOrder('dine_in')}
            className="group relative bg-amber-500 hover:bg-amber-400 active:scale-95 text-neutral-950 p-6 rounded-3xl flex flex-col items-center justify-center gap-3 transition-all shadow-2xl shadow-amber-500/25 cursor-pointer"
          >
            <div className="w-16 h-16 bg-neutral-950/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <UtensilsCrossed className="w-8 h-8 stroke-[2.5]" />
            </div>
            <div className="text-center">
              <span className="text-xl sm:text-2xl font-black block font-display">
                Comer no Local
              </span>
              <span className="text-xs text-neutral-900/80 font-bold uppercase tracking-wider mt-0.5 block">
                Mesa ou Balcão
              </span>
            </div>
          </button>

          <button
            onClick={() => onStartOrder('takeout')}
            className="group relative bg-neutral-900/90 hover:bg-neutral-800 active:scale-95 border-2 border-neutral-700 hover:border-amber-500 text-white p-6 rounded-3xl flex flex-col items-center justify-center gap-3 transition-all shadow-xl cursor-pointer"
          >
            <div className="w-16 h-16 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShoppingBag className="w-8 h-8 stroke-[2.5]" />
            </div>
            <div className="text-center">
              <span className="text-xl sm:text-2xl font-black block font-display">
                Para Levar
              </span>
              <span className="text-xs text-neutral-400 font-bold uppercase tracking-wider mt-0.5 block">
                Embalagem de Viagem
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Bottom Hint */}
      <div className="relative z-10 pb-8 text-center text-xs text-neutral-400 flex items-center justify-center gap-2">
        <Touchpad className="w-4 h-4 text-amber-500 animate-pulse" />
        <span>Toque em uma das opções acima para começar</span>
      </div>
    </div>
  );
};
