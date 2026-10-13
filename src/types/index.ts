export type ProductCategory = 
  | 'hamburgueres'
  | 'combos'
  | 'acompanhamentos'
  | 'bebidas'
  | 'sobremesas';

export interface ProductExtra {
  id: string;
  name: string;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: ProductCategory;
  calories?: string;
  prepTime?: string;
  availableExtras?: ProductExtra[];
  popular?: boolean;
}

export interface CartItem {
  cartId: string;
  product: Product;
  quantity: number;
  selectedExtras: ProductExtra[];
  observations: string;
  unitPrice: number;
  totalPrice: number;
}

export type DiningOption = 'dine_in' | 'takeout';

export type PaymentMethod = 'pix' | 'cartao_credito' | 'cartao_debito' | 'balcao';

export interface OrderItemPayload {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  extras: ProductExtra[];
  observations: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  diningOption: DiningOption;
  paymentMethod: PaymentMethod;
  items: CartItem[];
  totalAmount: number;
  createdAt: string;
  status: 'confirmado' | 'em_preparo' | 'pronto' | 'entregue';
  supabaseSynced: boolean;
  supabaseError?: string;
  n8nSynced: boolean;
  n8nError?: string;
}

export interface AppConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  n8nWebhookUrl: string;
  restaurantName: string;
}
