-- ═══════════════════════════════════════════════════════════════════════════
-- Secret Santa — Schéma Postgres
-- À coller dans le SQL Editor de Supabase (projet à créer au préalable).
-- Idempotent : peut être rejoué sans erreur.
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- Participants
-- `token` est le secret du lien de connexion. Il n'est jamais renvoyé au
-- client : il vit dans un cookie httpOnly.
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists public.participants (
  id          uuid primary key default gen_random_uuid(),
  first_name  text not null check (length(btrim(first_name)) > 0),
  initials    text not null check (length(initials) between 1 and 3),
  token       text not null unique default encode(gen_random_bytes(24), 'hex'),
  created_at  timestamptz not null default now()
);

comment on table public.participants is 'Participants du Secret Santa, tous donneurs et tous destinataires.';

-- ───────────────────────────────────────────────────────────────────────────
-- Restrictions de tirage
--
-- R4 : une restriction est symétrique. On la stocke sous forme canonique
-- (a_id < b_id) : l'ordre des identifiants est imposé par une contrainte, donc
-- la symétrie est garantie PAR CONSTRUCTION — aucune logique applicative, aucun
-- trigger, aucune désynchronisation possible.
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists public.restrictions (
  a_id uuid not null references public.participants (id) on delete cascade,
  b_id uuid not null references public.participants (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (a_id, b_id),
  constraint restrictions_no_self check (a_id <> b_id),
  constraint restrictions_canonical check (a_id < b_id)
);

comment on table public.restrictions is 'Paires de participants qui ne peuvent pas se tirer mutuellement. Symétrique par construction.';

create index if not exists restrictions_b_idx on public.restrictions (b_id);

-- ───────────────────────────────────────────────────────────────────────────
-- Wishlist
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists public.wishlist_items (
  id             uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants (id) on delete cascade,
  title          text not null check (length(btrim(title)) > 0),
  url            text not null check (url ~* '^https?://'),
  created_at     timestamptz not null default now()
);

create index if not exists wishlist_items_participant_idx
  on public.wishlist_items (participant_id, created_at);

comment on table public.wishlist_items is 'Idées de cadeau. Le participant ne lit que les lignes dont il est propriétaire ou le destinataire désigné.';

-- ───────────────────────────────────────────────────────────────────────────
-- Tirages
--
-- R7 : la réinitialisation ne supprime rien, elle ouvre un nouveau `batch`.
-- L'historique reste consultable et les unicités sont donc portentées par batch.
--
-- R2 : `unique (batch, recipient_id)` est LA garantie de la règle « une personne
-- tirée n'est plus disponible ». Elle est appliquée par le moteur de la base, pas
-- par le code applicatif : deux tirages simultanés ne peuvent pas aboutir au
-- même destinataire.
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists public.draws (
  id           uuid primary key default gen_random_uuid(),
  batch        uuid not null,
  giver_id     uuid not null references public.participants (id) on delete cascade,
  recipient_id uuid not null references public.participants (id) on delete cascade,
  created_at   timestamptz not null default now(),
  constraint draws_no_self check (giver_id <> recipient_id),
  constraint draws_unique_giver_per_batch unique (batch, giver_id),
  constraint draws_unique_recipient_per_batch unique (batch, recipient_id)
);

create index if not exists draws_batch_idx on public.draws (batch);
create index if not exists draws_giver_idx on public.draws (giver_id);
create index if not exists draws_recipient_idx on public.draws (recipient_id);

comment on table public.draws is 'Couplage bijectif donneur → destinataire, versionné par batch.';

-- ───────────────────────────────────────────────────────────────────────────
-- Configuration (ligne unique)
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists public.app_settings (
  id         integer primary key default 1 check (id = 1),
  draws_open boolean not null default false,
  batch      uuid not null default gen_random_uuid()
);

insert into public.app_settings (id) values (1) on conflict (id) do nothing;

comment on table public.app_settings is 'Singleton. batch = génération courante de tirages.';

-- ═══════════════════════════════════════════════════════════════════════════
-- Sécurité — RLS
--
-- Toutes les lectures et écritures passent par le serveur Next.js avec la clé
-- service_role. RLS est activée SANS aucune policy pour anon/authenticated :
-- tout accès direct depuis le navigateur est refusé par défaut.
-- C'est une défense en profondeur, pas le mécanisme principal.
-- ═══════════════════════════════════════════════════════════════════════════
alter table public.participants    enable row level security;
alter table public.restrictions    enable row level security;
alter table public.wishlist_items  enable row level security;
alter table public.draws           enable row level security;
alter table public.app_settings    enable row level security;

revoke all on public.participants   from anon, authenticated;
revoke all on public.restrictions   from anon, authenticated;
revoke all on public.wishlist_items from anon, authenticated;
revoke all on public.draws          from anon, authenticated;
revoke all on public.app_settings   from anon, authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- Fonctions serveur
--
-- `security definer` + `search_path` figé : elles sont appelables uniquement
-- depuis le serveur (clé service_role) et ne sont pas exposées au public.
-- ═══════════════════════════════════════════════════════════════════════════

-- Ouverture des tirages : remplace intégralement le batch courant.
-- L'affectation est calculée et validée par draw.ts ; cette fonction se charge
-- de l'écriture atomique. Toute violation de contrainte annule la transaction.
create or replace function public.open_draw(p_assignments jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_batch        uuid;
  v_expected     integer;
  v_actual       integer;
  v_self_draws   integer;
  v_restricted   integer;
begin
  -- Verrouille la ligne singleton pour toute la durée de la transaction.
  select batch into v_batch from public.app_settings where id = 1 for update;
  if v_batch is null then
    raise exception 'Configuration absente : la ligne app_settings id=1 est requise.';
  end if;

  select count(*) into v_expected from public.participants;
  select count(*) into v_actual from jsonb_array_elements(p_assignments);
  if v_expected = 0 then
    raise exception 'Aucun participant : ajoutez au moins deux participants avant d'ouvrir le tirage.';
  end if;
  if v_expected < 2 then
    raise exception 'Un Secret Santa nécessite au moins deux participants.';
  end if;
  if v_actual <> v_expected then
    raise exception 'Affectation incomplète : %tie(s) reçue(s) pour %participant(s).', v_actual, v_expected;
  end if;

  select count(*) into v_self_draws
  from jsonb_array_elements(p_assignments) a
  where (a->>'giver_id')::uuid = (a->>'recipient_id')::uuid;
  if v_self_draws > 0 then
    raise exception 'Auto-tirage détecté dans l''affectation (%cas).', v_self_draws;
  end if;

  -- Défense en profondeur : l'algorithme de draw.ts doit déjà respecter R4, mais
  -- une restriction violée est ici rejetée par la base elle-même plutôt que
  -- d'être acceptée sur la seule foi du code applicatif.
  select count(*) into v_restricted
  from jsonb_array_elements(p_assignments) a
  join public.restrictions r
    on r.a_id = least((a->>'giver_id')::uuid, (a->>'recipient_id')::uuid)
   and r.b_id = greatest((a->>'giver_id')::uuid, (a->>'recipient_id')::uuid);
  if v_restricted > 0 then
    raise exception 'Tirage interdit par les restrictions configurées (%cas).', v_restricted;
  end if;

  -- Les unicités (batch, giver) et (batch, recipient) garantissent R1 et R2.
  insert into public.draws (batch, giver_id, recipient_id)
  select v_batch, (a->>'giver_id')::uuid, (a->>'recipient_id')::uuid
  from jsonb_array_elements(p_assignments) a;

  update public.app_settings set draws_open = true where id = 1;
end;
$$;

-- Réinitialisation : nouveau batch, tirage refermé. L'historique est conservé (R7).
create or replace function public.reset_draws()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.app_settings
     set batch = gen_random_uuid(), draws_open = false
   where id = 1;

  if not found then
    raise exception 'Configuration absente : la ligne app_settings id=1 est requise.';
  end if;
end;
$$;

-- Un participant est-il déjà impliqué dans le batch courant ?
-- L'admin s'en sert pour refuser une suppression qui casserait la bijectivité.
create or replace function public.participant_is_drawn(p_participant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.draws d
      join public.app_settings s on s.id = 1 and s.batch = d.batch
     where d.giver_id = p_participant_id
        or d.recipient_id = p_participant_id
  );
$$;

revoke all on function public.open_draw(jsonb)              from public, anon, authenticated;
revoke all on function public.reset_draws()                 from public, anon, authenticated;
revoke all on function public.participant_is_drawn(uuid)    from public, anon, authenticated;