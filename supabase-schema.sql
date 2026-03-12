-- Ejecutar este SQL en: supabase.com → Tu proyecto → SQL Editor → New Query

-- 1. Tabla de productos
create table if not exists products (
  id                    bigint primary key generated always as identity,
  name                  text not null default '',
  sku                   text default '',
  marca                 text default '',
  modelo                text default '',
  serie                 text default '',
  proveedor             text default '',
  tipo_adquisicion      text default 'COMPRA',
  fecha_adquisicion     text default '',
  responsable           text default '',
  unidad_administrativa text default '',
  valor_en_libros       numeric default 0,
  photo_url             text default null,
  locations             jsonb default '{"C5":{"funcional":0,"no_funcional":0},"Seguridad Pública":{"funcional":0,"no_funcional":0},"CERITY":{"funcional":0,"no_funcional":0}}'::jsonb,
  created_at            timestamptz default now()
);

-- 2. Tabla de auditorías
create table if not exists audits (
  id       bigint primary key generated always as identity,
  name     text default '',
  date     timestamptz default now(),
  status   text default 'in_progress',
  location text default 'Global'
);

-- 3. Ítems individuales por auditoría
create table if not exists audit_items (
  id                  bigint primary key generated always as identity,
  audit_id            bigint references audits(id) on delete cascade,
  product_id          bigint,
  product_name        text default '',
  product_sku         text default '',
  product_marca       text default '',
  product_responsable text default '',
  original_location   text default '',
  original_condition  text default 'funcional',
  unit_index          int default 0,
  unit_seq            int generated always as (unit_index + 1) stored,
  status              text default null
);

-- 4. Historial de transacciones
create table if not exists transactions (
  id              bigint primary key generated always as identity,
  product_id      bigint,
  product_name    text default '',
  type            text default '',
  quantity        int default 0,
  location        text default '',
  target_location text default null,
  condition       text default 'funcional',
  reason          text default '',
  date            timestamptz default now()
);

-- 5. Habilitar Row Level Security y permitir todo (sin autenticación por ahora)
alter table products    enable row level security;
alter table audits      enable row level security;
alter table audit_items enable row level security;
alter table transactions enable row level security;

create policy "allow_all" on products     for all using (true) with check (true);
create policy "allow_all" on audits       for all using (true) with check (true);
create policy "allow_all" on audit_items  for all using (true) with check (true);
create policy "allow_all" on transactions for all using (true) with check (true);
