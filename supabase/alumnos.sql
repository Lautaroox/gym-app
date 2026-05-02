-- Ejecutá este SQL en Supabase → SQL Editor (una vez) si la tabla o políticas no existen.

create table if not exists public.alumnos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  nombre text not null,
  "Fecha_vencimiento" date not null,
  cuota_al_dia boolean not null default false
);

alter table public.alumnos enable row level security;

drop policy if exists "anon_all_alumnos" on public.alumnos;

create policy "anon_all_alumnos"
  on public.alumnos
  for all
  to anon, authenticated
  using (true)
  with check (true);
