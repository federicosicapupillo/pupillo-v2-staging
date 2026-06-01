-- SQL DDL Script - Refined MVP Pupillo Schema (Supabase / PostgreSQL)
-- Esegui questo script nel SQL Editor di Supabase per configurare le tabelle, gli indici, i trigger di sincronizzazione e le policy RLS.

create extension if not exists "uuid-ossp";

-- =========================================================================
-- 0. PROTEZIONE ANTI-COLLISIONE E PULIZIA CONTROLLATA (IDEMPOTENZA)
-- =========================================================================
-- Rimuoviamo gli oggetti nell'ordine inverso di dipendenza per evitare violazioni di chiavi esterne.
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user() cascade;
drop table if exists public.applications cascade;
drop table if exists public.jobs cascade;
drop table if exists public.restaurant_profiles cascade;
drop table if exists public.worker_profiles cascade;
drop table if exists public.profiles cascade;

-- =========================================================================
-- 1. TABELLA PROFILI CENTRALE ( public.profiles )
-- =========================================================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  role text not null check (role in ('worker', 'restaurant')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =========================================================================
-- 2. TABELLA DETTAGLI LAVORATORI ( public.worker_profiles )
-- =========================================================================
create table public.worker_profiles (
  id uuid references public.profiles on delete cascade primary key,
  first_name text not null,
  last_name text not null,
  phone text not null,
  bio text,
  skills text[] default '{}'::text[],
  experience_years integer default 0 check (experience_years >= 0),
  rating numeric(3,2) default 5.00,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =========================================================================
-- 3. TABELLA DETTAGLI RISTORANTI ( public.restaurant_profiles )
-- =========================================================================
create table public.restaurant_profiles (
  id uuid references public.profiles on delete cascade primary key,
  restaurant_name text not null,
  company_name text not null,
  vat_number text not null,
  phone text not null,
  address text not null,
  city text not null,
  description text,
  logo_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =========================================================================
-- 4. TABELLA TURNI / ANNUNCI ( public.jobs )
-- =========================================================================
create table public.jobs (
  id uuid default gen_random_uuid() primary key,
  restaurant_id uuid references public.restaurant_profiles on delete cascade not null,
  role text not null,
  date date not null,
  start_time time not null,
  end_time time not null,
  hourly_rate numeric(10,2) not null check (hourly_rate > 0),
  location text not null,
  status text default 'open' not null check (status in ('open', 'matched', 'completed', 'cancelled')),
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =========================================================================
-- 5. TABELLA CANDIDATURE ( public.applications )
-- =========================================================================
create table public.applications (
  id uuid default gen_random_uuid() primary key,
  job_id uuid references public.jobs on delete cascade not null,
  worker_id uuid references public.worker_profiles on delete cascade not null,
  status text default 'pending' not null check (status in ('pending', 'accepted', 'rejected')),
  applied_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(job_id, worker_id)
);

-- =========================================================================
-- 6. INDICIZZAZIONE STRUTTURALE ( OTTIMIZZAZIONE QUERY MVP )
-- =========================================================================
create index if not exists idx_jobs_restaurant_id on public.jobs(restaurant_id);
create index if not exists idx_applications_job_id on public.applications(job_id);
create index if not exists idx_applications_worker_id on public.applications(worker_id);

-- =========================================================================
-- 7. ATTIVAZIONE E POLICY RLS ( ROW LEVEL SECURITY )
-- =========================================================================
alter table public.profiles enable row level security;
alter table public.worker_profiles enable row level security;
alter table public.restaurant_profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.applications enable row level security;

-- POLICY: PROFILES
create policy "Consenti lettura profilo personale" 
  on public.profiles for select 
  using (auth.uid() = id);

create policy "Consenti aggiornamento profilo personale" 
  on public.profiles for update 
  using (auth.uid() = id);

-- POLICY: WORKER_PROFILES
create policy "Visualizzazione pubblica worker profiles"
  on public.worker_profiles for select
  using (true);

create policy "Modifica del proprio profilo worker"
  on public.worker_profiles for update
  using (auth.uid() = id);

create policy "Inserimento del proprio profilo worker"
  on public.worker_profiles for insert
  with check (auth.uid() = id);

-- POLICY: RESTAURANT_PROFILES
create policy "Visualizzazione pubblica restaurant profiles"
  on public.restaurant_profiles for select
  using (true);

create policy "Modifica del proprio profilo restaurant"
  on public.restaurant_profiles for update
  using (auth.uid() = id);

create policy "Inserimento del proprio profilo restaurant"
  on public.restaurant_profiles for insert
  with check (auth.uid() = id);

-- POLICY: JOBS (POLICIES SEPARATE AD HOC)
create policy "Visualizzazione pubblica dei turni"
  on public.jobs for select
  using (true);

create policy "I ristoratori autenticati possono inserire turni"
  on public.jobs for insert
  with check (
    auth.uid() = restaurant_id and
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'restaurant'
    )
  );

create policy "Il ristoratore proprietario può aggiornare il turno"
  on public.jobs for update
  using (restaurant_id = auth.uid())
  with check (restaurant_id = auth.uid());

create policy "Il ristoratore proprietario può eliminare il turno"
  on public.jobs for delete
  using (restaurant_id = auth.uid());

-- POLICY: APPLICATIONS (CON PROFILI ED EVITAMENTO INCOERENZE)
create policy "Candidato può vedere le proprie candidature"
  on public.applications for select
  using (auth.uid() = worker_id);

create policy "Candidato può proporsi per un turno"
  on public.applications for insert
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'worker'
    ) and auth.uid() = worker_id
  );

create policy "Ristoratore vede candidature per i suoi turni"
  on public.applications for select
  using (
    exists (
      select 1 from public.jobs
      where jobs.id = applications.job_id and jobs.restaurant_id = auth.uid()
    )
  );

create policy "Ristoratore gestisce stato candidature per i suoi turni"
  on public.applications for update
  using (
    exists (
      select 1 from public.jobs
      where jobs.id = applications.job_id and jobs.restaurant_id = auth.uid()
    )
  )
  with check (
    status in ('pending', 'accepted', 'rejected') and
    exists (
      select 1 from public.jobs
      where jobs.id = applications.job_id and jobs.restaurant_id = auth.uid()
    )
  );

-- =========================================================================
-- 8. TRIGGER E FUNZIONI DI AUTOMAZIONE
-- =========================================================================

-- Funzione di gestione inserimento utente da Auth.users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'worker')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger agganciato alla creazione di riga in auth.users
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
