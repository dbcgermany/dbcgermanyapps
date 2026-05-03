#!/usr/bin/env bash
# Live acceptance test runner: mints a 1-cent QA tier on the production
# tickets app, prints the checkout URL for a human to walk through with
# a real card, and offers a cleanup path that archives the Stripe
# entities and deletes the tier when done.
#
# Usage:
#   ./scripts/acceptance-test.sh open   <event_slug>   # mint tier + print URL
#   ./scripts/acceptance-test.sh close  <tier_id>      # archive + delete
#
# Prerequisites:
#   - QA_TIER_ADMIN_TOKEN already set on Vercel (it is, as of 2026-05-03).
#   - VERCEL_TOKEN exported in your shell (or use the value in
#     cred/credentials.md → Vercel API Token).
#   - The tickets Vercel project ID = prj_wrJNDjQVFDOmaEq95OHvEDz4dFgt.
#   - Run is gated by setting ALLOW_QA_TIER=1 — this script does that for you
#     and unsets it on close. Without ALLOW_QA_TIER=1 the endpoint always 403s.
set -euo pipefail

CMD="${1:-help}"
ARG="${2:-}"

VERCEL_PROJ="prj_wrJNDjQVFDOmaEq95OHvEDz4dFgt"
VERCEL_TEAM="team_EEPrSTrl7mHIWDZmZhIbtlUb"
TICKETS_URL="https://tickets.dbc-germany.com"

# Read the QA token + Vercel token. Prefer env, fall back to credentials.md.
QA_TOKEN="${QA_TIER_ADMIN_TOKEN:-}"
VC="${VERCEL_TOKEN:-}"
CRED="$(cd "$(dirname "$0")/../../cred" && pwd)/credentials.md"
if [[ -z "$QA_TOKEN" && -f "$CRED" ]]; then
  QA_TOKEN=$(grep -A 1 'QA_TIER_ADMIN_TOKEN' "$CRED" 2>/dev/null | grep -oE '[a-f0-9]{64}' | head -1 || true)
fi
if [[ -z "$VC" && -f "$CRED" ]]; then
  VC=$(grep -oE 'vcp_[A-Za-z0-9]+' "$CRED" | head -1)
fi

if [[ -z "$QA_TOKEN" || -z "$VC" ]]; then
  echo "ERROR: need QA_TIER_ADMIN_TOKEN + VERCEL_TOKEN in env or in cred/credentials.md"
  exit 1
fi

set_env() {
  local key="$1" value="$2" type="$3"
  local body
  body=$(python3 -c "import json,sys; print(json.dumps({'key':sys.argv[1],'value':sys.argv[2],'type':sys.argv[3],'target':['production','preview']}))" "$key" "$value" "$type")
  curl -s -X POST "https://api.vercel.com/v10/projects/${VERCEL_PROJ}/env?teamId=${VERCEL_TEAM}&upsert=true" \
    -H "Authorization: Bearer $VC" -H "Content-Type: application/json" -d "$body" \
    | python3 -c "import json,sys; d=json.load(sys.stdin); print(f'  ENV {sys.argv[1]}: ' + (d.get(\"error\",{}).get('code') or 'ok'))" "$key"
}

unset_env() {
  local key="$1"
  # Look up the env id then DELETE it
  local id
  id=$(curl -s "https://api.vercel.com/v9/projects/${VERCEL_PROJ}/env?teamId=${VERCEL_TEAM}" \
    -H "Authorization: Bearer $VC" \
    | python3 -c "import json,sys; d=json.load(sys.stdin); [print(e['id']) for e in d.get('envs',[]) if e.get('key')==sys.argv[1]]" "$key" | head -1)
  if [[ -n "$id" ]]; then
    curl -s -X DELETE "https://api.vercel.com/v9/projects/${VERCEL_PROJ}/env/${id}?teamId=${VERCEL_TEAM}" \
      -H "Authorization: Bearer $VC" > /dev/null
    echo "  ENV $key: removed"
  fi
}

trigger_deploy() {
  local sha
  sha=$(git -C "$(dirname "$0")/.." rev-parse HEAD)
  local dpl
  dpl=$(curl -s -X POST "https://api.vercel.com/v13/deployments?teamId=${VERCEL_TEAM}&forceNew=1&skipAutoDetectionConfirmation=1" \
    -H "Authorization: Bearer $VC" -H "Content-Type: application/json" \
    -d "{\"name\":\"dbcgermanyapps-tickets\",\"project\":\"${VERCEL_PROJ}\",\"target\":\"production\",\"gitSource\":{\"type\":\"github\",\"repoId\":1208995711,\"ref\":\"main\",\"sha\":\"$sha\"}}" \
    | python3 -c "import json,sys; print(json.load(sys.stdin)['id'])")
  echo "  deploy $dpl … waiting for READY"
  while true; do
    state=$(curl -s "https://api.vercel.com/v13/deployments/${dpl}?teamId=${VERCEL_TEAM}" -H "Authorization: Bearer $VC" \
      | python3 -c "import json,sys; print(json.load(sys.stdin).get('readyState',''))")
    [[ "$state" == "READY" ]] && break
    [[ "$state" == "ERROR" || "$state" == "CANCELED" ]] && { echo "  deploy $state"; exit 1; }
    sleep 25
  done
  echo "  deploy READY"
}

case "$CMD" in
  open)
    [[ -z "$ARG" ]] && { echo "Usage: $0 open <event_slug>"; exit 1; }
    echo "[1/4] enabling ALLOW_QA_TIER on Vercel + redeploying"
    set_env "ALLOW_QA_TIER" "1" "plain"
    trigger_deploy
    echo ""
    echo "[2/4] minting 1-cent QA tier"
    OUT=$(curl -s -X POST "${TICKETS_URL}/api/dev/qa-tier" \
      -H "Authorization: Bearer $QA_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"event_slug\":\"${ARG}\"}")
    echo "  $OUT"
    TIER_ID=$(echo "$OUT" | python3 -c "import json,sys; print(json.load(sys.stdin).get('tier_id',''))")
    [[ -z "$TIER_ID" ]] && { echo "FAIL — tier not created"; exit 1; }
    echo ""
    echo "[3/4] making tier public so checkout shows it (1 sale only)"
    # Note: keep this manual — direct UPDATE via supabase API would belong
    # here. The QA tier was created with is_public=false; flip it to true:
    SBP=$(grep -oE 'sbp_[a-f0-9]+' "$CRED" | head -1)
    curl -s -X POST "https://api.supabase.com/v1/projects/rcqgsexfuaoiiuqcqeka/database/query" \
      -H "Authorization: Bearer $SBP" -H "Content-Type: application/json" \
      -d "{\"query\":\"UPDATE ticket_tiers SET is_public=true WHERE id='${TIER_ID}';\"}" > /dev/null
    echo "  tier ${TIER_ID} flipped to is_public=true"
    echo ""
    echo "[4/4] open this URL in a browser, complete checkout with a real card:"
    echo "    ${TICKETS_URL}/de/checkout/${ARG}?tier=qa-${TIER_ID}"
    echo ""
    echo "After buying + verifying ticket emails arrive + admin shows the order paid:"
    echo "    $0 close ${TIER_ID}"
    ;;
  close)
    [[ -z "$ARG" ]] && { echo "Usage: $0 close <tier_id>"; exit 1; }
    echo "[1/3] archiving Stripe Product/Price + deleting tier row"
    curl -s -X DELETE "${TICKETS_URL}/api/dev/qa-tier" \
      -H "Authorization: Bearer $QA_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"tier_id\":\"${ARG}\"}" \
      | python3 -m json.tool
    echo ""
    echo "[2/3] disabling ALLOW_QA_TIER on Vercel"
    unset_env "ALLOW_QA_TIER"
    echo ""
    echo "[3/3] redeploying tickets"
    trigger_deploy
    echo ""
    echo "DONE — production is back to normal."
    ;;
  *)
    cat <<USAGE
Acceptance test runner (live €0.01 ticket on production tickets app).

  $0 open  <event_slug>   # enable QA, mint 1¢ tier, print checkout URL
  $0 close <tier_id>      # archive Stripe entities, delete tier, disable QA

State that survives between calls: QA_TIER_ADMIN_TOKEN on Vercel (encrypted),
the live tier row + Stripe Product/Price (visible in Stripe Dashboard).
USAGE
    ;;
esac
