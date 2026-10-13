-- ==============================================================================
-- SCHEMA COMPLETO DO BANCO DE DADOS E POLÍTICAS DE ARMAZENAMENTO (SUPABASE)
-- Sistema de Totem de Autoatendimento para Restaurante
-- ==============================================================================
-- Correção para o erro 42501 (must be owner of table objects):
-- A tabela storage.objects já possui RLS habilitado nativamente pelo Supabase,
-- portanto não devemos executar "ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;".
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. CRIAÇÃO DAS TABELAS DO BANCO DE DADOS (Schema public)
-- ------------------------------------------------------------------------------

-- Tabela de Pedidos
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

-- Tabela de Itens do Pedido
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

-- Tabela de Produtos do Cardápio (Opcional para gerenciar catálogo no Supabase)
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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índices de performance
create index if not exists idx_orders_created_at on public.orders(created_at desc);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_order_items_order_id on public.order_items(order_id);
create index if not exists idx_products_category on public.products(category);

-- ------------------------------------------------------------------------------
-- 2. HABILITAR ROW LEVEL SECURITY (RLS) NAS TABELAS DO SCHEMA PUBLIC
-- ------------------------------------------------------------------------------
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.products enable row level security;

-- ------------------------------------------------------------------------------
-- 3. POLÍTICAS DE SEGURANÇA (RLS) DAS TABELAS
-- ------------------------------------------------------------------------------
drop policy if exists "Permitir insercao anonima de pedidos" on public.orders;
drop policy if exists "Permitir leitura anonima de pedidos" on public.orders;
drop policy if exists "Permitir atualizacao de status de pedidos" on public.orders;

drop policy if exists "Permitir insercao anonima de itens" on public.order_items;
drop policy if exists "Permitir leitura anonima de itens" on public.order_items;

drop policy if exists "Permitir leitura pública de produtos" on public.products;
drop policy if exists "Permitir modificação de produtos por autenticados" on public.products;

-- Políticas para public.orders
create policy "Permitir insercao anonima de pedidos"
  on public.orders for insert
  to anon, authenticated
  with check (true);

create policy "Permitir leitura anonima de pedidos"
  on public.orders for select
  to anon, authenticated
  using (true);

create policy "Permitir atualizacao de status de pedidos"
  on public.orders for update
  to anon, authenticated
  using (true)
  with check (true);

-- Políticas para public.order_items
create policy "Permitir insercao anonima de itens"
  on public.order_items for insert
  to anon, authenticated
  with check (true);

create policy "Permitir leitura anonima de itens"
  on public.order_items for select
  to anon, authenticated
  using (true);

-- Políticas para public.products
create policy "Permitir leitura pública de produtos"
  on public.products for select
  to anon, authenticated
  using (true);

create policy "Permitir modificação de produtos por autenticados"
  on public.products for all
  to authenticated
  using (true)
  with check (true);

-- ------------------------------------------------------------------------------
-- 4. BUCKETS DE ARMAZENAMENTO (SUPABASE STORAGE)
-- ------------------------------------------------------------------------------
-- Cria os buckets de armazenamento no schema storage se ainda não existirem
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'restaurant-media',
  'restaurant-media',
  true,
  5242880, -- limite de 5MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880;

insert into storage.buckets (id, name, public, file_size_limit)
values (
  'order-receipts',
  'order-receipts',
  true,
  5242880
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880;

-- ------------------------------------------------------------------------------
-- 5. POLÍTICAS DE ACESSO AO STORAGE (STORAGE.OBJECTS)
-- NOTA: Não execute 'alter table storage.objects enable row level security;'
-- pois o Supabase gerencia o RLS desta tabela pelo usuário supabase_storage_admin.
-- ------------------------------------------------------------------------------
drop policy if exists "Acesso público para leitura de imagens do cardápio" on storage.objects;
drop policy if exists "Permitir upload anonimo no bucket restaurant-media" on storage.objects;
drop policy if exists "Permitir atualizacao no bucket restaurant-media" on storage.objects;
drop policy if exists "Permitir exclusao no bucket restaurant-media" on storage.objects;

drop policy if exists "Acesso público para leitura de comprovantes" on storage.objects;
drop policy if exists "Permitir upload de comprovantes no bucket order-receipts" on storage.objects;

-- POLÍTICA 1: Leitura pública das fotos do cardápio
create policy "Acesso público para leitura de imagens do cardápio"
  on storage.objects for select
  to public
  using (bucket_id = 'restaurant-media');

-- POLÍTICA 2: Upload de imagens no bucket restaurant-media
create policy "Permitir upload anonimo no bucket restaurant-media"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'restaurant-media');

-- POLÍTICA 3: Atualização de imagens no bucket restaurant-media
create policy "Permitir atualizacao no bucket restaurant-media"
  on storage.objects for update
  to anon, authenticated
  using (bucket_id = 'restaurant-media')
  with check (bucket_id = 'restaurant-media');

-- POLÍTICA 4: Exclusão de imagens (autenticado)
create policy "Permitir exclusao no bucket restaurant-media"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'restaurant-media');

-- POLÍTICA 5: Leitura de comprovantes de pedidos
create policy "Acesso público para leitura de comprovantes"
  on storage.objects for select
  to public
  using (bucket_id = 'order-receipts');

-- POLÍTICA 6: Upload de comprovantes de pedidos pelo Totem
create policy "Permitir upload de comprovantes no bucket order-receipts"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'order-receipts');

-- ==============================================================================
-- FIM DO SCRIPT
-- ==============================================================================
