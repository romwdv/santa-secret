-- ═══════════════════════════════════════════════════════════════════════════
-- Secret Santa — Schéma Postgres
--
-- ⚠️ TOUT vit dans le schéma `santa`, PAS dans `public`.
-- Le projet Supabase héberge une AUTRE application dans `public`
-- (actions, matches, outbox, participants, players, teams). Ne jamais écrire
-- dans `public`, ne jamais y faire de DROP : cela détruirait l'autre app.
--
-- Idempotent : peut être rejoué sans erreur.
--
-- ⚠️ PRÉREQUIS : ce script CRÉE le schéma `santa`. Il doit donc être exécuté
--    AVANT d'aller l'exposer dans le dashboard — le sélecteur « Exposed
--    schemas » ne propose que les schémas déjà existants, donc `santa` n'y
--    apparaîtra qu'après cette première exécution.
--
-- Ordre complet :
--   1. Coller ce fichier
--   2. Dashboard → Project Settings → API → Exposed schemas → ajouter `santa`
--   3. Coller VERIFY-DATA-MODEL.sql
-- ═══════════════════════════════════════════════════════════════════════════

create schema if not exists santa;

-- ───────────────────────────────────────────────────────────────────────────
-- Participants
--
-- `token` est le secret du lien de connexion. Il n'est jamais renvoyé au
-- client : il vit dans un cookie httpOnly.
--
-- Aucun DEFAULT ici, volontairement. Le token est généré par l'application avec
-- `crypto.randomBytes(24)` — un vrai CSPRNG. Un DEFAULT en base imposerait
-- pgcrypto (`gen_random_bytes`), qui n'existe pas dans le core Postgres et dont
-- la résolution dépend du search_path. Une colonne sans défaut échoue
-- bruyamment si on oublie le token, ce qui est préférable à un secret faible.
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists santa.participants (
  id          uuid primary key default gen_random_uuid(),
  first_name  text not null check (length(btrim(first_name)) > 0),
  initials    text not null check (length(initials) between 1 and 3),
  token       text not null unique,
  created_at  timestamptz not null default now()
);

comment on table santa.participants is 'Participants du Secret Santa, tous donneurs et tous destinataires.';

-- Mise à niveau : une version antérieure de ce script définissait un DEFAULT
-- `gen_random_bytes(...)` sur token. `create table if not exists` ne touche pas
-- une table déjà créée, donc ce ALTER est indispensable pour que le changement
-- s'applique réellement à une base déjà peuplée.
alter table santa.participants alter column token drop default;

-- ───────────────────────────────────────────────────────────────────────────
-- Restrictions de tirage
--
-- R4 : une restriction est symétrique. On la stocke sous forme canonique
-- (a_id < b_id) : l'ordre des identifiants est imposé par une contrainte, donc
-- la symétrie est garantie PAR CONSTRUCTION — aucune logique applicative, aucun
-- trigger, aucune désynchronisation possible.
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists santa.restrictions (
  a_id uuid not null references santa.participants (id) on delete cascade,
  b_id uuid not null references santa.participants (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (a_id, b_id),
  constraint restrictions_no_self check (a_id <> b_id),
  constraint restrictions_canonical check (a_id < b_id)
);

comment on table santa.restrictions is 'Paires de participants qui ne peuvent pas se tirer mutuellement. Symétrique par construction.';

create index if not exists restrictions_b_idx on santa.restrictions (b_id);

-- ───────────────────────────────────────────────────────────────────────────
-- Wishlist
--
-- `url` est FACULTATIF : une idée peut être décrite sans lien. La contrainte
-- ne s'applique donc que si un lien est fourni.
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists santa.wishlist_items (
  id             uuid primary key default gen_random_uuid(),
  participant_id uuid not null references santa.participants (id) on delete cascade,
  title          text not null check (length(btrim(title)) > 0),
  url            text check (url is null or btrim(url) = '' or url ~* '^https?://'),
  created_at     timestamptz not null default now()
);

-- Mise à niveau : la version initiale rendait `url` obligatoire. `create table if
-- exists` ne modifie pas une table déjà créée, donc ces ALTER sont nécessaires.
alter table santa.wishlist_items alter column url drop not null;
alter table santa.wishlist_items drop constraint if exists wishlist_items_url_check;
alter table santa.wishlist_items
  add constraint wishlist_items_url_check
  check (url is null or btrim(url) = '' or url ~* '^https?://');

create index if not exists wishlist_items_participant_idx
  on santa.wishlist_items (participant_id, created_at);

comment on table santa.wishlist_items is 'Idées de cadeau. Le participant ne lit que les lignes dont il est propriétaire ou le destinataire désigné.';

-- ───────────────────────────────────────────────────────────────────────────
-- Tirages
--
-- R7 : la réinitialisation ne supprime rien, elle ouvre un nouveau `batch`.
-- L'historique reste consultable et les unicités sont donc portées par batch.
--
-- R2 : `unique (batch, recipient_id)` est LA garantie de la règle « une personne
-- tirée n'est plus disponible ». Elle est appliquée par le moteur de la base, pas
-- par le code applicatif : deux tirages simultanés ne peuvent pas aboutir au
-- même destinataire.
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists santa.draws (
  id           uuid primary key default gen_random_uuid(),
  batch        uuid not null,
  giver_id     uuid not null references santa.participants (id) on delete cascade,
  recipient_id uuid not null references santa.participants (id) on delete cascade,
  created_at   timestamptz not null default now(),
  constraint draws_no_self check (giver_id <> recipient_id),
  constraint draws_unique_giver_per_batch unique (batch, giver_id),
  constraint draws_unique_recipient_per_batch unique (batch, recipient_id)
);

create index if not exists draws_batch_idx    on santa.draws (batch);
create index if not exists draws_giver_idx    on santa.draws (giver_id);
create index if not exists draws_recipient_idx on santa.draws (recipient_id);

comment on table santa.draws is 'Couplage bijectif donneur → destinataire, versionné par batch.';

-- ───────────────────────────────────────────────────────────────────────────
-- Configuration (ligne unique)
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists santa.app_settings (
  id         integer primary key default 1 check (id = 1),
  draws_open boolean not null default false,
  batch      uuid not null default gen_random_uuid()
);

insert into santa.app_settings (id) values (1) on conflict (id) do nothing;

comment on table santa.app_settings is 'Singleton. batch = génération courante de tirages.';

-- ═══════════════════════════════════════════════════════════════════════════
-- Sécurité — RLS
--
-- Toutes les lectures et écritures passent par le serveur Next.js avec la clé
-- secrète. RLS est activée SANS aucune policy pour anon/authenticated :
-- tout accès direct depuis le navigateur est refusé par défaut.
-- C'est une défense en profondeur, pas le mécanisme principal.
--
-- ATTENTION : l'autre application a des policies pour `authenticated` dans
-- `public`. Elles ne concernent pas `santa`, mais cela montre que le rôle
-- `authenticated` est utilisé — d'où l'importance de ne rien accorder à ce
-- rôle sur nos tables.
-- ═══════════════════════════════════════════════════════════════════════════
alter table santa.participants    enable row level security;
alter table santa.restrictions    enable row level security;
alter table santa.wishlist_items  enable row level security;
alter table santa.draws           enable row level security;
alter table santa.app_settings    enable row level security;

-- Les rôles `anon` et `authenticated` sont créés par Supabase et n'existent pas
-- dans une installation Postgres standard. Les REVOKE sont donc conditionnels :
-- le schéma reste exécutable et testable ailleurs, et s'applique intégralement
-- chez Supabase où les rôles existent.
do $$
declare
  v_table text;
  v_role  text;
begin
  foreach v_table in array array[
    'participants', 'restrictions', 'wishlist_items', 'draws', 'app_settings'
  ] loop
    foreach v_role in array array['anon', 'authenticated'] loop
      if exists (select 1 from pg_roles where rolname = v_role) then
        execute format('revoke all on table santa.%I from %I', v_table, v_role);
      end if;
    end loop;
  end loop;
end
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- Privilèges du rôle serveur
--
-- Supabase n'accorde PAS automatiquement les privilèges sur les tables créées
-- depuis le SQL Editor. Sans ces GRANT, la clé secrète reçoit
-- « 403 permission denied for table participants » et l'application ne peut
-- rien lire. Constaté sur le projet réel, pas supposé.
--
-- C'est le seul rôle auquel on accorde quelque chose : il fait tous les accès de
-- l'app, depuis le serveur uniquement.
-- ═══════════════════════════════════════════════════════════════════════════
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant usage on schema santa to service_role';
    execute 'grant all on all tables    in schema santa to service_role';
    execute 'grant all on all sequences in schema santa to service_role';
    execute 'grant all on all functions in schema santa to service_role';

    -- Idem pour les tables créées plus tard (migrations, ajouts).
    execute 'alter default privileges in schema santa '
         || 'grant all on tables to service_role';
    execute 'alter default privileges in schema santa '
         || 'grant all on sequences to service_role';
    execute 'alter default privileges in schema santa '
         || 'grant all on functions to service_role';
  end if;
end
$$;

-- ───────────────────────────────────────────────────────────────────────────
-- Fonctions serveur
--
-- `security definer` + `search_path` figé : elles sont appelables uniquement
-- depuis le serveur (clé service_role) et ne sont pas exposées au public.
-- ───────────────────────────────────────────────────────────────────────────

-- Ouverture des tirages : remplace intégralement le batch courant.
-- L'affectation est calculée et validée par draw.ts ; cette fonction se charge
-- de l'écriture atomique. Toute violation de contrainte annule la transaction.
create or replace function santa.open_draw(p_assignments jsonb)
returns void
language plpgsql
security definer
set search_path = santa
as $$
declare
  v_batch        uuid;
  v_expected     integer;
  v_actual       integer;
  v_self_draws   integer;
  v_restricted   integer;
begin
  -- Verrouille la ligne singleton pour toute la durée de la transaction.
  select batch into v_batch from santa.app_settings where id = 1 for update;
  if v_batch is null then
    raise exception 'Configuration absente : la ligne app_settings id=1 est requise.';
  end if;

  select count(*) into v_expected from santa.participants;
  select count(*) into v_actual from jsonb_array_elements(p_assignments);
  if v_expected = 0 then
    raise exception 'Aucun participant : ajoutez au moins deux participants avant d''ouvrir le tirage.';
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
  join santa.restrictions r
    on r.a_id = least((a->>'giver_id')::uuid, (a->>'recipient_id')::uuid)
   and r.b_id = greatest((a->>'giver_id')::uuid, (a->>'recipient_id')::uuid);
  if v_restricted > 0 then
    raise exception 'Tirage interdit par les restrictions configurées (%cas).', v_restricted;
  end if;

  -- Les unicités (batch, giver) et (batch, recipient) garantissent R1 et R2.
  insert into santa.draws (batch, giver_id, recipient_id)
  select v_batch, (a->>'giver_id')::uuid, (a->>'recipient_id')::uuid
  from jsonb_array_elements(p_assignments) a;

  update santa.app_settings set draws_open = true where id = 1;
end;
$$;

-- Réinitialisation : nouveau batch, tirage refermé. L'historique est conservé (R7).
create or replace function santa.reset_draws()
returns void
language plpgsql
security definer
set search_path = santa
as $$
begin
  delete from santa.draws;

  update santa.app_settings
     set batch = gen_random_uuid(), draws_open = false
   where id = 1;

  if not found then
    raise exception 'Configuration absente : la ligne app_settings id=1 est requise.';
  end if;
end;
$$;

-- Un participant est-il déjà impliqué dans le batch courant ?
-- L'admin s'en sert pour refuser une suppression qui casserait la bijectivité.
create or replace function santa.participant_is_drawn(p_participant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = santa
as $$
  select exists (
    select 1
      from santa.draws d
      join santa.app_settings s on s.id = 1 and s.batch = d.batch
     where d.giver_id = p_participant_id
        or d.recipient_id = p_participant_id
  );
$$;

-- Aucun rôle public ne doit pouvoir appeler ces fonctions.
do $$
declare
  v_fn   text;
  v_role text;
begin
  foreach v_fn in array array[
    'open_draw(jsonb)', 'reset_draws()', 'participant_is_drawn(uuid)'
  ] loop
    execute format('revoke all on function santa.%s from public', v_fn);
    foreach v_role in array array['anon', 'authenticated'] loop
      if exists (select 1 from pg_roles where rolname = v_role) then
        execute format('revoke all on function santa.%s from %I', v_fn, v_role);
      end if;
    end loop;
  end loop;
end
$$;
