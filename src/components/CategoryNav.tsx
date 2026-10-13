import React from 'react';
import { Search, X, Sparkles, Flame, Utensils, CupSoda, IceCream, LayoutGrid } from 'lucide-react';
import { ProductCategory } from '../types';
import { CATEGORIES } from '../data/products';

interface CategoryNavProps {
  selectedCategory: ProductCategory | 'todos';
  onSelectCategory: (category: ProductCategory | 'todos') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalProductsCount: number;
}

export const CategoryNav: React.FC<CategoryNavProps> = ({
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
}) => {
  const getCategoryIcon = (id: string) => {
    switch (id) {
      case 'combos':
        return <Sparkles className="w-5 h-5" />;
      case 'hamburgueres':
        return <Flame className="w-5 h-5" />;
      case 'acompanhamentos':
        return <Utensils className="w-5 h-5" />;
      case 'bebidas':
        return <CupSoda className="w-5 h-5" />;
      case 'sobremesas':
        return <IceCream className="w-5 h-5" />;
      default:
        return <LayoutGrid className="w-5 h-5" />;
    }
  };

  return (
    <div className="bg-neutral-900 border-b border-neutral-800 sticky top-20 sm:top-20 z-20 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Category Tabs (Scrollable on touch) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              onClick={() => onSelectCategory('todos')}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-bold whitespace-nowrap transition-all shrink-0 ${
                selectedCategory === 'todos'
                  ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                  : 'bg-neutral-800/80 text-neutral-300 hover:bg-neutral-800 hover:text-white border border-neutral-700/50'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Cardápio Completo</span>
            </button>

            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => onSelectCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold whitespace-nowrap transition-all shrink-0 ${
                    isActive
                      ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                      : 'bg-neutral-800/80 text-neutral-300 hover:bg-neutral-800 hover:text-white border border-neutral-700/50'
                  }`}
                >
                  <span className={isActive ? 'text-neutral-950' : 'text-amber-400'}>
                    {getCategoryIcon(cat.id)}
                  </span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search bar */}
          <div className="relative min-w-[260px] md:max-w-xs shrink-0">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar item ou ingrediente..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-9 py-2.5 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-0.5"
                title="Limpar busca"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
