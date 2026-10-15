#!/usr/bin/env bash
# Vérifie docs/DATA-MODEL.sql puis docs/VERIFY-DATA-MODEL.sql sur un Postgres
# local jetable, sans toucher à une base existante.
#
#   ./scripts/db-verify.sh
#
# Nécessite un Postgres local (Homebrew : `brew install postgresql@16`).
# Le contrôle le plus utile : les scripts ne dépendent QUE du core Postgres,
# donc le schéma est vérifiable ici avant d'être collé dans Supabase.

set -euo pipefail

PORT="${PGPORT_TEST:-55432}"
DB="santa_verify_$$"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

PSQL_BIN="$(command -v psql || true)"
if [ -z "$PSQL_BIN" ]; then
  for candidate in /opt/homebrew/opt/postgresql@16/bin/psql /usr/local/opt/postgresql@16/bin/psql; do
    [ -x "$candidate" ] && PSQL_BIN="$candidate" && break
  done
fi
if [ -z "$PSQL_BIN" ]; then
  echo "psql introuvable — installe postgresql@16 ou renseigne le chemin." >&2
  exit 1
fi

run() { "$PSQL_BIN" -h /tmp -p "$PORT" -U postgres "$@"; }

cleanup() { run -q -c "drop database if exists $DB;" >/dev/null 2>&1 || true; }
trap cleanup EXIT

echo "→ Base jetable $DB sur le port $PORT"
run -q -c "create database $DB;"

echo "→ Application de DATA-MODEL.sql"
run -v ON_ERROR_STOP=1 -q -d "$DB" -f "$ROOT/docs/DATA-MODEL.sql"
echo "  schéma appliqué"

echo "→ Exécution de VERIFY-DATA-MODEL.sql"
run -v ON_ERROR_STOP=1 -d "$DB" -f "$ROOT/docs/VERIFY-DATA-MODEL.sql"
