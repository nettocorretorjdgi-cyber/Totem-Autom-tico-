import React, { useState } from 'react';
import { Plus, Flame, Clock, UtensilsCrossed } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onQuickAdd: (product: Product) => void;
  quantityInCart: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  onQuickAdd,
  quantityInCart,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <div
      onClick={() => onSelect(product)}
      className="group relative bg-neutral-900 rounded-2xl border border-neutral-800/80 overflow-hidden hover:border-neutral-700 transition-all duration-200 flex flex-col cursor-pointer active:scale-[0.99] shadow-sm hover:shadow-xl hover:shadow-black/40"
    >
      {/* Visual Image Container */}
      <div className="relative aspect-[4/3] w-full bg-neutral-950 overflow-hidden">
        {/* Styled Fallback / Placeholder */}
        {(!imageLoaded || imageError) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-950 text-neutral-600 p-4">
            <UtensilsCrossed className="w-10 h-10 mb-2 opacity-40 text-amber-500" />
            <span className="text-xs text-neutral-400 font-medium text-center line-clamp-1">
              {product.name}
            </span>
          </div>
        )}

        {!imageError && (
          <img
            src={product.image}
            alt={product.name}
            referrerPolicy="no-referrer"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}

        {/* Subtle vignette scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-transparent pointer-events-none" />

        {/* Popular text marker if present (no pill badge sandwich) */}
        {product.popular && (
          <div className="absolute top-3 left-3 bg-neutral-950/85 backdrop-blur-md border border-neutral-700/60 text-amber-400 text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1 shadow-sm">
            <Flame className="w-3.5 h-3.5" />
            <span>Mais Pedido</span>
          </div>
        )}

        {/* Quantity in Cart Indicator */}
        {quantityInCart > 0 && (
          <div className="absolute top-3 right-3 bg-amber-500 text-neutral-950 font-black text-xs px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1">
            <span>{quantityInCart} no pedido</span>
          </div>
        )}
      </div>

      {/* Content info */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Metadata: Calories & Prep Time */}
          {(product.calories || product.prepTime) && (
            <div className="flex items-center gap-2 text-xs text-neutral-400 mb-1.5 font-medium">
              {product.calories && <span>{product.calories}</span>}
              {product.calories && product.prepTime && <span aria-hidden="true">·</span>}
              {product.prepTime && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-neutral-500" />
                  {product.prepTime}
                </span>
              )}
            </div>
          )}

          <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-1 font-display">
            {product.name}
          </h3>

          <p className="mt-1 text-xs sm:text-sm text-neutral-400 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Price & Action Button */}
        <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between gap-3">
          <div>
            <span className="text-xs text-neutral-400 block font-medium">Preço</span>
            <span className="text-lg sm:text-xl font-black text-white tabular-nums">
              {product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (product.availableExtras && product.availableExtras.length > 0) {
                onSelect(product);
              } else {
                onQuickAdd(product);
              }
            }}
            className="flex items-center gap-1.5 bg-neutral-800 hover:bg-amber-500 hover:text-neutral-950 active:scale-95 text-amber-400 font-bold px-3.5 py-2.5 rounded-xl border border-neutral-700/80 hover:border-amber-500 transition-all text-xs sm:text-sm"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>{product.availableExtras?.length ? 'Personalizar' : 'Adicionar'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
