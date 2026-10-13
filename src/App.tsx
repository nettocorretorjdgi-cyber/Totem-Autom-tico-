import React, { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { CategoryNav } from './components/CategoryNav';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderConfirmation } from './components/OrderConfirmation';
import { SettingsModal } from './components/SettingsModal';
import { AttractScreen } from './components/AttractScreen';
import { PRODUCTS } from './data/products';
import { 
  Product, 
  CartItem, 
  DiningOption, 
  ProductCategory, 
  PaymentMethod, 
  Order, 
  AppConfig 
} from './types';
import { 
  getDefaultConfig, 
  saveConfig, 
  generateNextOrderNumber, 
  saveOrderToSupabase, 
  sendOrderToN8nWebhook, 
  saveOrderLocally 
} from './services/api';

export default function App() {
  // App Configuration (Supabase, n8n, Restaurant Name)
  const [config, setConfig] = useState<AppConfig>(getDefaultConfig);

  // Kiosk flow state
  const [viewMode, setViewMode] = useState<'attract' | 'menu' | 'confirmed'>('menu');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'todos'>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [diningOption, setDiningOption] = useState<DiningOption>('dine_in');
  const [customerName, setCustomerName] = useState('');

  // Cart & Modals
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Submission & Confirmed Order
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastConfirmedOrder, setLastConfirmedOrder] = useState<Order | null>(null);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter((product) => {
      const matchesCategory =
        selectedCategory === 'todos' || product.category === selectedCategory;
      const matchesSearch =
        searchQuery === '' ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Cart metrics
  const cartTotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [cartItems]);

  const cartCount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  // Cart item count per product
  const getProductCountInCart = (productId: string): number => {
    return cartItems
      .filter((item) => item.product.id === productId)
      .reduce((sum, item) => sum + item.quantity, 0);
  };

  // Add Item with options from Modal
  const handleAddToCart = (newItem: CartItem) => {
    setCartItems((prev) => {
      // Check if identical item (same product, same extras, same obs) exists
      const extrasKey = newItem.selectedExtras.map((e) => e.id).sort().join(',');
      const existingIdx = prev.findIndex(
        (item) =>
          item.product.id === newItem.product.id &&
          item.observations === newItem.observations &&
          item.selectedExtras.map((e) => e.id).sort().join(',') === extrasKey
      );

      if (existingIdx >= 0) {
        const copy = [...prev];
        const existing = copy[existingIdx];
        const updatedQty = existing.quantity + newItem.quantity;
        copy[existingIdx] = {
          ...existing,
          quantity: updatedQty,
          totalPrice: existing.unitPrice * updatedQty,
        };
        return copy;
      }

      return [...prev, newItem];
    });
  };

  // Quick Add for items without mandatory options
  const handleQuickAdd = (product: Product) => {
    const defaultItem: CartItem = {
      cartId: `${product.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      product,
      quantity: 1,
      selectedExtras: [],
      observations: '',
      unitPrice: product.price,
      totalPrice: product.price,
    };
    handleAddToCart(defaultItem);
  };

  // Update quantity in cart
  const handleUpdateQuantity = (cartId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(cartId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.cartId === cartId
          ? {
              ...item,
              quantity: newQuantity,
              totalPrice: item.unitPrice * newQuantity,
            }
          : item
      )
    );
  };

  // Remove item
  const handleRemoveItem = (cartId: string) => {
    setCartItems((prev) => prev.filter((item) => item.cartId !== cartId));
  };

  // Clear cart
  const handleClearCart = () => {
    setCartItems([]);
  };

  // Save Settings
  const handleSaveConfig = (newConfig: AppConfig) => {
    setConfig(newConfig);
    saveConfig(newConfig);
  };

  // Start order from Attract Screen
  const handleStartOrder = (option: DiningOption) => {
    setDiningOption(option);
    setViewMode('menu');
  };

  // Reset order to clean state
  const handleResetOrder = () => {
    setCartItems([]);
    setCustomerName('');
    setIsCartOpen(false);
    setIsCheckoutOpen(false);
    setLastConfirmedOrder(null);
    setViewMode('attract');
  };

  // Confirm Order: Generates Order Number, saves to Supabase, sends to n8n Webhook
  const handleConfirmOrder = async (paymentMethod: PaymentMethod) => {
    setIsSubmitting(true);

    const generatedNumber = generateNextOrderNumber();
    const orderId = `ord-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const nowIso = new Date().toISOString();

    const newOrder: Order = {
      id: orderId,
      orderNumber: generatedNumber,
      customerName: customerName.trim() || 'Cliente Balcão',
      diningOption,
      paymentMethod,
      items: [...cartItems],
      totalAmount: cartTotal,
      createdAt: nowIso,
      status: 'confirmado',
      supabaseSynced: false,
      n8nSynced: false,
    };

    // 1. Save to Supabase (if configured)
    try {
      const supabaseResult = await saveOrderToSupabase(newOrder, config);
      if (supabaseResult.success) {
        newOrder.supabaseSynced = true;
      } else {
        newOrder.supabaseError = supabaseResult.error;
      }
    } catch (err) {
      console.error('Erro ao persistir no Supabase:', err);
      newOrder.supabaseError = 'Falha na requisição ao Supabase';
    }

    // 2. Dispatch to n8n Webhook (if configured)
    try {
      const n8nResult = await sendOrderToN8nWebhook(newOrder, config);
      if (n8nResult.success) {
        newOrder.n8nSynced = true;
      } else {
        newOrder.n8nError = n8nResult.error;
      }
    } catch (err) {
      console.error('Erro ao acionar webhook n8n:', err);
      newOrder.n8nError = 'Falha na requisição ao Webhook n8n';
    }

    // 3. Save order locally for reliable history
    saveOrderLocally(newOrder);

    // 4. Update UI State
    setLastConfirmedOrder(newOrder);
    setCartItems([]);
    setIsCheckoutOpen(false);
    setIsCartOpen(false);
    setIsSubmitting(false);
    setViewMode('confirmed');
  };

  // Attract Idle View
  if (viewMode === 'attract') {
    return (
      <>
        <AttractScreen
          restaurantName={config.restaurantName}
          onStartOrder={handleStartOrder}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          config={config}
          onSaveConfig={handleSaveConfig}
        />
      </>
    );
  }

  // Confirmed Receipt View
  if (viewMode === 'confirmed' && lastConfirmedOrder) {
    return (
      <>
        <Header
          restaurantName={config.restaurantName}
          diningOption={diningOption}
          onDiningOptionChange={setDiningOption}
          cartCount={0}
          cartTotal={0}
          onOpenCart={() => {}}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onResetOrder={handleResetOrder}
        />
        <OrderConfirmation
          order={lastConfirmedOrder}
          onNewOrder={handleResetOrder}
          restaurantName={config.restaurantName}
        />
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          config={config}
          onSaveConfig={handleSaveConfig}
        />
      </>
    );
  }

  // Active Menu / Catalog View
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col">
      {/* Top Bar */}
      <Header
        restaurantName={config.restaurantName}
        diningOption={diningOption}
        onDiningOptionChange={setDiningOption}
        cartCount={cartCount}
        cartTotal={cartTotal}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onResetOrder={handleResetOrder}
      />

      {/* Category Navigation Bar */}
      <CategoryNav
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        totalProductsCount={filteredProducts.length}
      />

      {/* Main Catalog View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Banner callout */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-neutral-900/60 p-4 rounded-2xl border border-neutral-800">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white font-display">
              {selectedCategory === 'todos'
                ? 'Cardápio Completo'
                : selectedCategory === 'combos'
                ? 'Combos Promocionais'
                : selectedCategory === 'hamburgueres'
                ? 'Hambúrgueres Artesanais'
                : selectedCategory === 'acompanhamentos'
                ? 'Acompanhamentos & Porções'
                : selectedCategory === 'bebidas'
                ? 'Bebidas Geladas'
                : 'Shakes & Sobremesas'}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
              Toque no produto para escolher adicionais e observações.
            </p>
          </div>

          <div className="text-xs text-neutral-400 font-medium">
            <span>Exibindo </span>
            <span className="font-bold text-amber-400">{filteredProducts.length}</span>
            <span> opções</span>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-neutral-900/40 border border-neutral-800 rounded-3xl p-12 text-center max-w-md mx-auto my-12">
            <h3 className="text-lg font-bold text-white mb-2">Nenhum produto encontrado</h3>
            <p className="text-sm text-neutral-400 mb-6">
              Não encontramos nenhum item correspondente ao termo "{searchQuery}".
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('todos');
              }}
              className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
            >
              Ver Todo o Cardápio
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={(p) => setCustomizingProduct(p)}
                onQuickAdd={handleQuickAdd}
                quantityInCart={getProductCountInCart(product.id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Floating Bottom Bar on Mobile/Tablet if Cart has items */}
      {cartCount > 0 && !isCartOpen && (
        <div className="sticky bottom-0 z-20 bg-neutral-950/90 backdrop-blur-md p-4 border-t border-neutral-800 lg:hidden">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black py-4 px-6 rounded-2xl flex items-center justify-between shadow-2xl shadow-amber-500/25 active:scale-98 transition-all"
          >
            <div className="flex items-center gap-2">
              <span className="bg-neutral-950 text-amber-400 text-xs px-2.5 py-0.5 rounded-full font-black">
                {cartCount}
              </span>
              <span className="text-sm font-bold">Ver Meu Pedido</span>
            </div>
            <span className="text-base font-black tabular-nums">
              {cartTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </button>
        </div>
      )}

      {/* Modals & Drawers */}
      <ProductModal
        product={customizingProduct}
        onClose={() => setCustomizingProduct(null)}
        onAddToCart={handleAddToCart}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        diningOption={diningOption}
        onDiningOptionChange={setDiningOption}
        customerName={customerName}
        onCustomerNameChange={setCustomerName}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        onProceedToCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onBackToCart={() => {
          setIsCheckoutOpen(false);
          setIsCartOpen(true);
        }}
        items={cartItems}
        diningOption={diningOption}
        customerName={customerName}
        totalAmount={cartTotal}
        onConfirmOrder={handleConfirmOrder}
        isSubmitting={isSubmitting}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onSaveConfig={handleSaveConfig}
      />
    </div>
  );
}
