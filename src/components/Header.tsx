import React from 'react';
import { ShoppingBag, Settings, UtensilsCrossed, ShoppingBag as BagTakeout } from 'lucide-react';
import { DiningOption } from '../types';

interface HeaderProps {
  restaurantName: string;
  diningOption: DiningOption;
  onDiningOptionChange: (option: DiningOption) => void;
  cartCount: number;
  cartTotal: number;
  onOpenCart: () => void;
  onOpenSettings: () => void;
  onResetOrder: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  restaurantName,
  diningOption,
  onDiningOptionChange,
  cartCount,
  cartTotal,
  onOpenCart,
  onOpenSettings,
  onResetOrder,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-neutral-900/95 backdrop-blur-md border-b border-neutral-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Brand / Reset */}
        <div className="flex items-center gap-4">
          <button
            onClick={onResetOrder}
            className="text-left group focus:outline-none"
            title="Voltar ao início"
          >
            <span className="text-xl sm:text-2xl font-black tracking-tight text-white group-hover:text-amber-400 transition-colors">
              {restaurantName}
            </span>
            <div className="text-xs text-neutral-400 flex items-center gap-1.5 font-medium">
              <span>Totem Autoatendimento</span>
              <span>·</span>
              <span className="text-amber-400">Terminal 01</span>
            </div>
          </button>
        </div>

        {/* Dining Option Toggle (Comer Aqui vs Para Levar) */}
        <div className="hidden sm:flex items-center bg-neutral-800/90 p-1.5 rounded-xl border border-neutral-700/60 shadow-inner">
          <button
            type="button"
            onClick={() => onDiningOptionChange('dine_in')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              diningOption === 'dine_in'
                ? 'bg-amber-500 text-neutral-950 shadow-md font-bold'
                : 'text-neutral-300 hover:text-white hover:bg-neutral-700/40'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>Comer no Local</span>
          </button>
          <button
            type="button"
            onClick={() => onDiningOptionChange('takeout')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              diningOption === 'takeout'
                ? 'bg-amber-500 text-neutral-950 shadow-md font-bold'
                : 'text-neutral-300 hover:text-white hover:bg-neutral-700/40'
            }`}
          >
            <BagTakeout className="w-4 h-4" />
            <span>Para Levar</span>
          </button>
        </div>

        {/* Actions (Settings + Cart) */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSettings}
            className="p-3 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors border border-transparent hover:border-neutral-700"
            title="Configurações de Integração (Supabase e n8n)"
          >
            <Settings className="w-6 h-6" />
          </button>

          <button
            onClick={onOpenCart}
            className="relative flex items-center gap-3 bg-amber-500 hover:bg-amber-400 active:scale-95 text-neutral-950 font-bold px-4 sm:px-5 py-3 rounded-xl transition-all shadow-lg shadow-amber-500/20"
          >
            <div className="relative">
              <ShoppingBag className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-neutral-950 text-amber-400 border border-amber-500 text-xs font-black rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </div>
            <div className="text-left font-display">
              <span className="text-xs uppercase tracking-wider block font-semibold leading-none text-neutral-900/80">
                Seu Pedido
              </span>
              <span className="text-base sm:text-lg font-black leading-tight tabular-nums">
                {cartTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Dining Toggle */}
      <div className="sm:hidden px-4 pb-3 flex items-center bg-neutral-900 border-t border-neutral-800 pt-2 gap-2">
        <button
          type="button"
          onClick={() => onDiningOptionChange('dine_in')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold ${
            diningOption === 'dine_in'
              ? 'bg-amber-500 text-neutral-950 font-bold'
              : 'bg-neutral-800 text-neutral-300'
          }`}
        >
          <UtensilsCrossed className="w-3.5 h-3.5" />
          <span>Comer Aqui</span>
        </button>
        <button
          type="button"
          onClick={() => onDiningOptionChange('takeout')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold ${
            diningOption === 'takeout'
              ? 'bg-amber-500 text-neutral-950 font-bold'
              : 'bg-neutral-800 text-neutral-300'
          }`}
        >
          <BagTakeout className="w-3.5 h-3.5" />
          <span>Para Levar</span>
        </button>
      </div>
    </header>
  );
};
