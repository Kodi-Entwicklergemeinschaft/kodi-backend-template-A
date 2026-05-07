#!/usr/bin/env bash
#
# KODI - Full seed orchestrator
# --------------------------------
# This script runs every seed/upload script required to bootstrap a fresh
# environment. Each step is executed via the existing seed-wrapper so that
# environment variables and host-to-container DB host mapping are handled
# consistently.
#
# Usage:
#   bash scripts/seed-all.sh
#   npm run seed:all -- --skip upload:tile-assets --skip seed:firebase-project
#
# Options:
#   --list            Show the ordered pipeline and exit
#   --skip <steps>    Comma-separated list of step names to skip
#   --only <steps>    Comma-separated list of step names to run
#   -h | --help       Show this help text
#
# Environment:
#   SEED_BOOTSTRAP_SKIP   Extra comma-separated step names to skip
#
# Step names align with the npm script names (e.g. seed:terms).

set -uo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SEED_WRAPPER="$ROOT_DIR/scripts/seed-wrapper.sh"

if [[ ! -f "$SEED_WRAPPER" ]]; then
  echo "❌ seed-wrapper.sh not found at $SEED_WRAPPER" >&2
  exit 1
fi

cd "$ROOT_DIR"

mapfile -t PIPELINE <<'EOF'
seed:terms|scripts/seed-terms.ts|Seed global terms of use for the users service
seed:initial-admin|scripts/seed-initial-admin.ts|Create Super Admin, City Admin, and Kodi city
seed:permissions|scripts/seed-permissions.ts|Seed RBAC permissions and role mappings
seed:salutations|scripts/seed-salutations.ts|Seed localized salutations for user profiles
seed:categories|scripts/seed-categories.ts|Seed core categories and subcategories
upload:category-assets|scripts/upload-category-assets.ts|Upload category and city header assets
seed:city-categories|scripts/seed-city-categories.ts|Link Kodi city to curated categories
seed:tiles|scripts/seed-tiles.ts|Seed default promotional tiles for Kodi
upload:tile-assets|scripts/upload-tile-assets.ts|Upload tile creative assets
seed:default-listing-image|scripts/seed-default-listing-image.ts|Seed default listing placeholder image to storage
seed:schedules|scripts/seed-schedules.ts|Seed default scheduled tasks (e.g., favorite event reminders)
seed:firebase-project|scripts/seed-firebase-project.ts|Seed Firebase project configuration
EOF

declare -A SKIP_STEPS=()
declare -A ONLY_STEPS=()
declare -a FAILED_STEPS=()

trim() {
  local value="$1"
  value="${value#"${value%%[![:space:]]*}"}"
  value="${value%"${value##*[![:space:]]}"}"
  printf '%s' "$value"
}

add_steps_to_map() {
  local list="$1"
  local -n map_ref="$2"
  IFS=',' read -ra entries <<<"$list"
  for entry in "${entries[@]}"; do
    local trimmed
    trimmed="$(trim "$entry")"
    if [[ -n "$trimmed" ]]; then
      map_ref["$trimmed"]=1
    fi
  done
}

list_steps() {
  echo "📋 Seed pipeline:"
  for entry in "${PIPELINE[@]}"; do
    IFS='|' read -r name _ desc <<<"$entry"
    printf '  • %-24s %s\n' "$name" "$desc"
  done
}

usage() {
  cat <<'USAGE'
Usage: scripts/seed-all.sh [options]
Options:
  --list                 Show the ordered pipeline and exit
  --skip <steps>         Comma-separated list of step names to skip
  --only <steps>         Comma-separated list of step names to run
  -h, --help             Show this help text

Environment:
  SEED_BOOTSTRAP_SKIP    Additional comma-separated steps to skip

Examples:
  bash scripts/seed-all.sh
  bash scripts/seed-all.sh --skip seed:firebase-project
  npm run seed:all -- --only seed:terms,seed:initial-admin
USAGE
}

if [[ -n "${SEED_BOOTSTRAP_SKIP:-}" ]]; then
  add_steps_to_map "$SEED_BOOTSTRAP_SKIP" SKIP_STEPS
fi

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip)
      shift
      [[ $# -gt 0 ]] || { echo "Missing value for --skip" >&2; exit 1; }
      add_steps_to_map "$1" SKIP_STEPS
      ;;
    --skip=*)
      add_steps_to_map "${1#*=}" SKIP_STEPS
      ;;
    --only)
      shift
      [[ $# -gt 0 ]] || { echo "Missing value for --only" >&2; exit 1; }
      add_steps_to_map "$1" ONLY_STEPS
      ;;
    --only=*)
      add_steps_to_map "${1#*=}" ONLY_STEPS
      ;;
    --list)
      list_steps
      exit 0
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
  shift
done

should_run() {
  local name="$1"
  if [[ ${#ONLY_STEPS[@]} -gt 0 ]]; then
    [[ -n "${ONLY_STEPS[$name]:-}" ]] || return 1
  fi
  if [[ -n "${SKIP_STEPS[$name]:-}" ]]; then
    return 1
  fi
  return 0
}

echo "🌱 Starting full KODI seed pipeline..."
list_steps
echo

for entry in "${PIPELINE[@]}"; do
  IFS='|' read -r name script desc <<<"$entry"

  if ! should_run "$name"; then
    echo "⏭️  Skipping $name — $desc"
    continue
  fi

  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "▶️  $name"
  echo "   $desc"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  # Execute script and capture exit code
  if bash "$SEED_WRAPPER" "$script"; then
    echo "✓ $name completed successfully"
  else
    exit_code=$?
    echo "❌ $name failed with exit code $exit_code"
    FAILED_STEPS+=("$name")
  fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [[ ${#FAILED_STEPS[@]} -eq 0 ]]; then
  echo "✅ Completed seed pipeline - All steps succeeded"
  exit 0
else
  echo "⚠️  Completed seed pipeline with ${#FAILED_STEPS[@]} failure(s):"
  for failed in "${FAILED_STEPS[@]}"; do
    echo "   • $failed"
  done
  echo ""
  echo "Some steps failed, but pipeline continued. Review errors above."
  exit 1
fi
