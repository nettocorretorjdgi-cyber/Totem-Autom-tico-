import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppConfig, Order, CartItem } from '../types';

const STORAGE_KEYS = {
  CONFIG: 'totem_restaurant_config',
  ORDER_COUNTER: 'totem_order_counter',
  SAVED_ORDERS: 'totem_saved_orders',
};

// Default configuration with env var fallbacks
export const getDefaultConfig = (): AppConfig => {
  const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // fallback
    }
  }

  return {
    supabaseUrl: (import.meta.env.VITE_SUPABASE_URL as string) || '',
    supabaseAnonKey: (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '',
    n8nWebhookUrl: (import.meta.env.VITE_N8N_WEBHOOK_URL as string) || '',
    restaurantName: 'BURGER LAB ARTESANAL',
  };
};

export const saveConfig = (config: AppConfig): void => {
  localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
};

let cachedSupabaseClient: SupabaseClient | null = null;
let lastClientKey = '';

export const getSupabaseClient = (config: AppConfig): SupabaseClient | null => {
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    return null;
  }

  const key = `${config.supabaseUrl}:${config.supabaseAnonKey}`;
  if (cachedSupabaseClient && lastClientKey === key) {
    return cachedSupabaseClient;
  }

  try {
    cachedSupabaseClient = createClient(config.supabaseUrl, config.supabaseAnonKey);
    lastClientKey = key;
    return cachedSupabaseClient;
  } catch (err) {
    console.error('Erro ao instanciar Supabase Client:', err);
    return null;
  }
};

// Generates daily sequential order identifier like #A-101, #A-102
export const generateNextOrderNumber = (): string => {
  const rawCounter = localStorage.getItem(STORAGE_KEYS.ORDER_COUNTER);
  let next = 101;
  if (rawCounter) {
    const parsed = parseInt(rawCounter, 10);
    if (!isNaN(parsed)) {
      next = parsed >= 999 ? 101 : parsed + 1;
    }
  }
  localStorage.setItem(STORAGE_KEYS.ORDER_COUNTER, next.toString());

  const prefixLetter = 'A';
  return `#${prefixLetter}-${next}`;
};

export const getSavedOrders = (): Order[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SAVED_ORDERS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveOrderLocally = (order: Order): void => {
  try {
    const list = getSavedOrders();
    const updated = [order, ...list].slice(0, 50); // keep recent 50
    localStorage.setItem(STORAGE_KEYS.SAVED_ORDERS, JSON.stringify(updated));
  } catch (err) {
    console.error('Falha ao salvar pedido localmente:', err);
  }
};

/**
 * Saves order to Supabase in tables `orders` and `order_items`
 */
export const saveOrderToSupabase = async (
  order: Order,
  config: AppConfig
): Promise<{ success: boolean; error?: string }> => {
  const supabase = getSupabaseClient(config);

  if (!supabase) {
    return {
      success: false,
      error: 'Supabase não configurado. Adicione a URL e Chave Anon nas configurações do Totem.',
    };
  }

  try {
    // 1. Insert into orders
    const { error: orderError } = await supabase.from('orders').insert({
      id: order.id,
      order_number: order.orderNumber,
      customer_name: order.customerName || 'Cliente Balcão',
      dining_option: order.diningOption,
      payment_method: order.paymentMethod,
      total_amount: order.totalAmount,
      status: order.status,
      created_at: order.createdAt,
    });

    if (orderError) {
      console.error('Erro ao inserir em orders no Supabase:', orderError);
      return { success: false, error: orderError.message };
    }

    // 2. Insert items into order_items
    const orderItemsRows = order.items.map((item, index) => ({
      id: `${order.id}-item-${index + 1}`,
      order_id: order.id,
      product_id: item.product.id,
      product_name: item.product.name,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total_price: item.totalPrice,
      extras: item.selectedExtras,
      observations: item.observations || '',
      created_at: order.createdAt,
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(orderItemsRows);

    if (itemsError) {
      console.warn('Aviso: Falha ao inserir em order_items no Supabase:', itemsError);
      // order was inserted, but items had issue
      return { success: true, error: `Pedido salvo, mas itens tiveram aviso: ${itemsError.message}` };
    }

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Falha desconhecida de rede no Supabase';
    console.error('Erro de conexão com Supabase:', err);
    return { success: false, error: message };
  }
};

/**
 * Sends order payload to n8n Webhook
 */
export const sendOrderToN8nWebhook = async (
  order: Order,
  config: AppConfig
): Promise<{ success: boolean; error?: string; responseData?: unknown }> => {
  if (!config.n8nWebhookUrl) {
    return {
      success: false,
      error: 'URL do Webhook n8n não configurada nas opções do Totem.',
    };
  }

  const payload = {
    event: 'restaurant.order_created',
    orderId: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName || 'Cliente Balcão',
    diningOption: order.diningOption === 'dine_in' ? 'Comer no Local' : 'Para Levar',
    diningOptionCode: order.diningOption,
    paymentMethod: order.paymentMethod,
    totalAmount: order.totalAmount,
    currency: 'BRL',
    totalItemsCount: order.items.reduce((acc, curr) => acc + curr.quantity, 0),
    items: order.items.map((item) => ({
      id: item.product.id,
      name: item.product.name,
      category: item.product.category,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      extras: item.selectedExtras.map((e) => e.name),
      observations: item.observations || '',
    })),
    createdAt: order.createdAt,
    status: order.status,
    restaurantName: config.restaurantName,
    totemTerminalId: 'TOTEM-01',
  };

  try {
    const res = await fetch(config.n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      return {
        success: false,
        error: `Webhook n8n retornou status ${res.status}: ${res.statusText}`,
      };
    }

    let data;
    try {
      data = await res.json();
    } catch {
      data = { status: 'ok' };
    }

    return { success: true, responseData: data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Falha na requisição ao Webhook n8n';
    console.error('Erro ao acionar webhook n8n:', err);
    return { success: false, error: message };
  }
};

/**
 * SQL script for the user to create Supabase tables with proper schema,
 * storage buckets (restaurant-media and order-receipts) and storage RLS policies.
 */
export const getSupabaseSchemaSql = (): string => {
  return `-- ==============================================================================
-- SCHEMA COMPLETO DO BANCO DE DADOS E POLÍTICAS DE ARMAZENAMENTO (SUPABASE)
-- Sistema de Totem de Autoatendimento para Restaurante
-- ==============================================================================

-- 1. TABELAS DO BANCO DE DADOS
create table if not exists public.orders (
  id text primary key,
  order_number text not null,
  customer_name text default 'Cliente Balcão',
  dining_option text not null check (dining_option in ('dine_in', 'takeout')),
  payment_method text not null,
  total_amount numeric(10,2) not null check (total_amount >= 0),
  status text not null default 'confirmado' check (status in ('confirmado', 'em_preparo', 'pronto', 'entregue', 'cancelado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id text primary key,
  order_id text not null references public.orders(id) on delete cascade,
  product_id text not null,
  product_name text not null,
  quantity integer not null default 1 check (quantity > 0),
  unit_price numeric(10,2) not null check (unit_price >= 0),
  total_price numeric(10,2) not null check (total_price >= 0),
  extras jsonb default '[]'::jsonb,
  observations text default '',
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id text primary key,
  name text not null,
  description text default '',
  price numeric(10,2) not null check (price >= 0),
  category text not null,
  image_url text default '',
  available boolean not null default true,
  popular boolean not null default false,
  prep_time text default '',
  calories text default '',
  available_extras jsonb default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- Índices de consulta
create index if not exists idx_orders_created_at on public.orders(created_at desc);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_order_items_order_id on public.order_items(order_id);

-- 2. HABILITAR ROW LEVEL SECURITY (RLS) NAS TABELAS
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.products enable row level security;

-- 3. POLÍTICAS RLS DAS TABELAS (Permite totem registrar e ler pedidos)
drop policy if exists "Permitir insercao anonima de pedidos" on public.orders;
drop policy if exists "Permitir leitura anonima de pedidos" on public.orders;
drop policy if exists "Permitir atualizacao de status de pedidos" on public.orders;

drop policy if exists "Permitir insercao anonima de itens" on public.order_items;
drop policy if exists "Permitir leitura anonima de itens" on public.order_items;

drop policy if exists "Permitir leitura pública de produtos" on public.products;

create policy "Permitir insercao anonima de pedidos"
  on public.orders for insert to anon, authenticated with check (true);

create policy "Permitir leitura anonima de pedidos"
  on public.orders for select to anon, authenticated using (true);

create policy "Permitir atualizacao de status de pedidos"
  on public.orders for update to anon, authenticated using (true) with check (true);

create policy "Permitir insercao anonima de itens"
  on public.order_items for insert to anon, authenticated with check (true);

create policy "Permitir leitura anonima de itens"
  on public.order_items for select to anon, authenticated using (true);

create policy "Permitir leitura pública de produtos"
  on public.products for select to anon, authenticated using (true);

-- 4. BUCKETS DE ARMAZENAMENTO (SUPABASE STORAGE)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'restaurant-media',
  'restaurant-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public, file_size_limit)
values (
  'order-receipts',
  'order-receipts',
  true,
  5242880
)
on conflict (id) do update set public = true;

-- 5. POLÍTICAS DE ARMAZENAMENTO (STORAGE.OBJECTS RLS)
-- Nota: storage.objects já possui RLS gerenciado pelo sistema Supabase

drop policy if exists "Acesso público para leitura de imagens do cardápio" on storage.objects;
drop policy if exists "Permitir upload anonimo no bucket restaurant-media" on storage.objects;
drop policy if exists "Acesso público para leitura de comprovantes" on storage.objects;
drop policy if exists "Permitir upload de comprovantes no bucket order-receipts" on storage.objects;

-- Leitura pública de imagens do cardápio
create policy "Acesso público para leitura de imagens do cardápio"
  on storage.objects for select to public using (bucket_id = 'restaurant-media');

-- Upload de imagens no bucket restaurant-media
create policy "Permitir upload anonimo no bucket restaurant-media"
  on storage.objects for insert to anon, authenticated with check (bucket_id = 'restaurant-media');

-- Leitura de comprovantes de pedidos
create policy "Acesso público para leitura de comprovantes"
  on storage.objects for select to public using (bucket_id = 'order-receipts');

-- Upload de comprovantes/recibos de pedidos
create policy "Permitir upload de comprovantes no bucket order-receipts"
  on storage.objects for insert to anon, authenticated with check (bucket_id = 'order-receipts');
`;
};
