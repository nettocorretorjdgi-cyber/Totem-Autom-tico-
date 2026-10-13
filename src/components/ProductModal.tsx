import React, { useState } from 'react';
import { X, Plus, Minus, Check, MessageSquare, UtensilsCrossed } from 'lucide-react';
import { Product, ProductExtra, CartItem } from '../types';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (cartItem: CartItem) => void;
}

const COMMON_OBSERVATION_SUGGESTIONS = [
  'Sem cebola',
  'Sem picles',
  'Carne bem passada',
  'Carne ao ponto',
  'Molho à parte',
  'Sem sal na batata',
  'Gelo e limão',
];

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  onClose,
  onAddToCart,
}) => {
  if (!product) return null;

  const [quantity, setQuantity] = useState(1);
  const [selectedExtras, setSelectedExtras] = useState<ProductExtra[]>([]);
  const [observations, setObservations] = useState('');

  const toggleExtra = (extra: ProductExtra) => {
    setSelectedExtras((prev) => {
      const exists = prev.some((e) => e.id === extra.id);
      if (exists) {
        return prev.filter((e) => e.id !== extra.id);
      } else {
        return [...prev, extra];
      }
    });
  };

  const handleSuggestionClick = (text: string) => {
    if (observations.includes(text)) {
      setObservations((prev) =>
        prev
          .split(', ')
          .filter((t) => t !== text)
          .join(', ')
      );
    } else {
      setObservations((prev) => (prev ? `${prev}, ${text}` : text));
    }
  };

  const extrasTotal = selectedExtras.reduce((sum, item) => sum + item.price, 0);
  const unitPrice = product.price + extrasTotal;
  const totalPrice = unitPrice * quantity;

  const handleConfirm = () => {
    const cartItem: CartItem = {
      cartId: `${product.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      product,
      quantity,
      selectedExtras,
      observations: observations.trim(),
      unitPrice,
      totalPrice,
    };
    onAddToCart(cartItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div
        className="relative bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Close */}
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={onClose}
            className="bg-neutral-950/70 hover:bg-neutral-800 text-neutral-300 hover:text-white p-2.5 rounded-full backdrop-blur-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1">
          {/* Product Banner */}
          <div className="relative aspect-[16/9] w-full bg-neutral-950 overflow-hidden">
            <img
              src={product.image}
              alt={product.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/30 to-transparent" />
          </div>

          <div className="p-6 -mt-8 relative z-10 space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs text-neutral-400 mb-1">
                {product.calories && <span>{product.calories}</span>}
                {product.prepTime && <span>· Tempo: {product.prepTime}</span>}
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
                {product.name}
              </h2>
              <p className="mt-2 text-sm text-neutral-300 leading-relaxed">
                {product.description}
              </p>
              <div className="mt-3 text-xl font-black text-amber-400 tabular-nums">
                {product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
            </div>

            {/* Extras / Adicionais */}
            {product.availableExtras && product.availableExtras.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-neutral-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <UtensilsCrossed className="w-4 h-4 text-amber-500" />
                    <span>Turbine seu pedido (Opcional)</span>
                  </h3>
                  <span className="text-xs text-neutral-400">Escolha os extras</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {product.availableExtras.map((extra) => {
                    const isSelected = selectedExtras.some((e) => e.id === extra.id);
                    return (
                      <button
                        key={extra.id}
                        type="button"
                        onClick={() => toggleExtra(extra)}
                        className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-500 text-white font-medium'
                            : 'bg-neutral-800/60 border-neutral-700/60 text-neutral-300 hover:border-neutral-600'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                              isSelected
                                ? 'bg-amber-500 border-amber-500 text-neutral-950'
                                : 'border-neutral-600'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                          <span className="text-sm font-semibold">{extra.name}</span>
                        </div>
                        <span className="text-xs font-bold text-amber-400 tabular-nums">
                          +{extra.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Observações */}
            <div className="space-y-2.5 pt-4 border-t border-neutral-800">
              <label className="text-sm font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-amber-500" />
                <span>Observações para a cozinha</span>
              </label>

              {/* Quick pills */}
              <div className="flex flex-wrap gap-2">
                {COMMON_OBSERVATION_SUGGESTIONS.map((sugg) => {
                  const active = observations.includes(sugg);
                  return (
                    <button
                      key={sugg}
                      type="button"
                      onClick={() => handleSuggestionClick(sugg)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                        active
                          ? 'bg-amber-500 text-neutral-950 font-bold border-amber-500'
                          : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:border-neutral-500'
                      }`}
                    >
                      {active ? `✓ ${sugg}` : `+ ${sugg}`}
                    </button>
                  );
                })}
              </div>

              <input
                type="text"
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Ex: sem molho, ponto da carne, sem cebola..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Footer sticky bar with Quantity stepper and Add CTA */}
        <div className="p-4 sm:p-5 bg-neutral-950 border-t border-neutral-800 flex flex-col sm:flex-row items-center gap-4 justify-between">
          {/* Quantity selector */}
          <div className="flex items-center bg-neutral-800 rounded-2xl p-1 border border-neutral-700/80 w-full sm:w-auto justify-between sm:justify-start">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="p-3 sm:p-2.5 rounded-xl hover:bg-neutral-700 text-neutral-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              <Minus className="w-5 h-5" />
            </button>
            <span className="w-12 text-center text-lg font-black text-white tabular-nums">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(20, q + 1))}
              className="p-3 sm:p-2.5 rounded-xl hover:bg-neutral-700 text-neutral-200 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Add CTA */}
          <button
            type="button"
            onClick={handleConfirm}
            className="w-full sm:flex-1 bg-amber-500 hover:bg-amber-400 active:scale-98 text-neutral-950 font-extrabold text-base sm:text-lg py-4 px-6 rounded-2xl flex items-center justify-between transition-all shadow-lg shadow-amber-500/20"
          >
            <span>Adicionar ao Pedido</span>
            <span className="tabular-nums font-black text-neutral-950">
              {totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
