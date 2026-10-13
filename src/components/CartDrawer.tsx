import React from 'react';
import { X, Trash2, Plus, Minus, ArrowRight, UtensilsCrossed, ShoppingBag, User } from 'lucide-react';
import { CartItem, DiningOption } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  diningOption: DiningOption;
  onDiningOptionChange: (option: DiningOption) => void;
  customerName: string;
  onCustomerNameChange: (name: string) => void;
  onUpdateQuantity: (cartId: string, newQuantity: number) => void;
  onRemoveItem: (cartId: string) => void;
  onClearCart: () => void;
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  diningOption,
  onDiningOptionChange,
  customerName,
  onCustomerNameChange,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onProceedToCheckout,
}) => {
  if (!isOpen) return null;

  const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-lg bg-neutral-900 border-l border-neutral-800 text-white flex flex-col h-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/10 text-amber-400 p-2.5 rounded-xl border border-amber-500/20">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display">Resumo do Pedido</h2>
              <div className="text-xs text-neutral-400">
                {totalItemsCount} {totalItemsCount === 1 ? 'item selecionado' : 'itens selecionados'}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 bg-neutral-800/80 rounded-full flex items-center justify-center text-neutral-500 mb-4 border border-neutral-700/40">
              <ShoppingBag className="w-10 h-10 stroke-[1.5]" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Seu carrinho está vazio</h3>
            <p className="text-sm text-neutral-400 max-w-xs mb-6">
              Selecione produtos deliciosos no cardápio para montar seu pedido.
            </p>
            <button
              onClick={onClose}
              className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold px-6 py-3 rounded-xl transition-colors"
            >
              Explorar Cardápio
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Dining Option Selector */}
              <div className="bg-neutral-950 p-3.5 rounded-2xl border border-neutral-800">
                <span className="text-xs text-neutral-400 font-semibold block mb-2 uppercase tracking-wider">
                  Como deseja saborear?
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onDiningOptionChange('dine_in')}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition-all ${
                      diningOption === 'dine_in'
                        ? 'bg-amber-500 border-amber-500 text-neutral-950 shadow-md'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                    }`}
                  >
                    <UtensilsCrossed className="w-4 h-4" />
                    <span>Comer no Local</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDiningOptionChange('takeout')}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition-all ${
                      diningOption === 'takeout'
                        ? 'bg-amber-500 border-amber-500 text-neutral-950 shadow-md'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Para Levar</span>
                  </button>
                </div>
              </div>

              {/* Customer Name */}
              <div className="bg-neutral-950 p-3.5 rounded-2xl border border-neutral-800 space-y-1.5">
                <label className="text-xs text-neutral-400 font-semibold flex items-center gap-1.5 uppercase tracking-wider">
                  <User className="w-3.5 h-3.5 text-amber-500" />
                  <span>Nome para a Senha (Opcional)</span>
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => onCustomerNameChange(e.target.value)}
                  placeholder="Ex: Carlos, Ana, Mesa 04..."
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Items List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-neutral-400 font-semibold uppercase tracking-wider">
                  <span>Itens Selecionados</span>
                  <button
                    onClick={onClearCart}
                    className="text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Limpar Tudo</span>
                  </button>
                </div>

                {items.map((item) => (
                  <div
                    key={item.cartId}
                    className="bg-neutral-950/70 border border-neutral-800 rounded-2xl p-4 flex gap-3.5 transition-colors"
                  >
                    {/* Thumbnail */}
                    <div className="w-16 h-16 rounded-xl bg-neutral-900 overflow-hidden shrink-0 border border-neutral-800">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-bold text-white truncate">
                          {item.product.name}
                        </h4>
                        <button
                          onClick={() => onRemoveItem(item.cartId)}
                          className="text-neutral-500 hover:text-red-400 p-1 -mr-1"
                          title="Remover item"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Extras list */}
                      {item.selectedExtras.length > 0 && (
                        <div className="mt-1 text-xs text-amber-400/90 font-medium space-x-1">
                          <span>+ {item.selectedExtras.map((e) => e.name).join(', ')}</span>
                        </div>
                      )}

                      {/* Observations */}
                      {item.observations && (
                        <div className="mt-1 text-xs text-neutral-400 italic">
                          Obs: "{item.observations}"
                        </div>
                      )}

                      {/* Price & Quantity Stepper */}
                      <div className="mt-3 flex items-center justify-between">
                        <div className="text-sm font-black text-white tabular-nums">
                          {item.totalPrice.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </div>

                        <div className="flex items-center bg-neutral-900 rounded-xl border border-neutral-800">
                          <button
                            onClick={() => onUpdateQuantity(item.cartId, item.quantity - 1)}
                            className="p-1.5 text-neutral-400 hover:text-white"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-7 text-center text-xs font-bold tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.cartId, item.quantity + 1)}
                            className="p-1.5 text-neutral-400 hover:text-white"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Summary & Proceed CTA */}
            <div className="p-5 bg-neutral-950 border-t border-neutral-800 space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-neutral-400">
                  <span>Subtotal ({totalItemsCount} itens)</span>
                  <span className="tabular-nums">
                    {totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Taxa de Atendimento</span>
                  <span className="text-emerald-400 font-medium">Grátis</span>
                </div>
                <div className="flex justify-between text-lg font-black text-white pt-2 border-t border-neutral-800">
                  <span>Total a Pagar</span>
                  <span className="text-amber-400 tabular-nums">
                    {totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/3 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-bold py-3.5 px-3 rounded-2xl border border-neutral-800 transition-colors text-sm"
                >
                  Mais Itens
                </button>
                <button
                  type="button"
                  onClick={onProceedToCheckout}
                  className="flex-1 bg-amber-500 hover:bg-amber-400 active:scale-98 text-neutral-950 font-extrabold py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/25 text-base"
                >
                  <span>Confirmar & Pagar</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
