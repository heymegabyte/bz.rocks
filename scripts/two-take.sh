#!/usr/bin/env bash
# scripts/two-take.sh — generate TWO MiniMax Hailuo variants of a shot (or shots)
# for the approve-one-at-a-time review loop, then build A, B, and a scored
# side-by-side 2-up (left = A, right = B) and drop all three on ~/Desktop so you
# can watch and pick.
#
#   MINIMAX_API_KEY=<key>      bash scripts/two-take.sh wake-up-algenib w1,w2   # native rail
#   FAL_ADMIN_API_KEY=<key>    bash scripts/two-take.sh wake-up-algenib w1,w2   # fal rail
#
# Pick A or B, tell me, and we move to the next beat (same command, next shots).
set -euo pipefail

source "$HOME/.claude/hooks/style.sh" 2>/dev/null || true
type emdash_header  >/dev/null 2>&1 || emdash_header(){  printf '\n== %s ==\n' "$*"; }
type emdash_log     >/dev/null 2>&1 || emdash_log(){     printf '  - %s\n' "$1"; }
type emdash_error   >/dev/null 2>&1 || emdash_error(){   printf 'ERROR: %s\n' "$*" >&2; }
type emdash_success >/dev/null 2>&1 || emdash_success(){ printf 'OK: %s\n' "$*"; }

FILM="${1:?usage: two-take.sh <film-id> <shots, e.g. w1,w2>}"
SHOTS="${2:?usage: two-take.sh <film-id> <shots, e.g. w1,w2>}"
ROOT="/Users/Apple/emdash/repositories/bz.rocks"
cd "$ROOT"

MANIFEST="scripts/films/$FILM/manifest.json"
[ -f "$MANIFEST" ] || { emdash_error "no manifest: $MANIFEST"; exit 1; }
command -v ffmpeg  >/dev/null || { emdash_error "ffmpeg required"; exit 1; }
command -v ffprobe >/dev/null || { emdash_error "ffprobe required"; exit 1; }

# Pick the rail from whichever key is present inline (native MiniMax preferred).
if   [ -n "${MINIMAX_API_KEY:-}" ];   then RAIL="MINIMAX=1"
elif [ -n "${FAL_ADMIN_API_KEY:-}" ]; then RAIL="MINIMAX_FAL=1"
else
  emdash_error "Set a key inline first — MINIMAX_API_KEY (native) or FAL_ADMIN_API_KEY (fal)."
  emdash_error "fal keys: https://fal.ai/dashboard/keys   |   MiniMax: https://www.minimax.io/platform"
  exit 1
fi
emdash_log "rail: $RAIL"

CLIPS=".cache/veo/$FILM/clips"
OUT=".cache/veo/$FILM/two-take"; mkdir -p "$OUT"
AUDIO="public/audio/${FILM}-mix.mp3"; [ -f "$AUDIO" ] || AUDIO="public/audio/${FILM}.mp3"
IFS=',' read -ra SH <<< "$SHOTS"

gen() { # $1 = variant label (A|B)
  local v="$1"
  emdash_header "Variant $v — shots $SHOTS"
  for s in "${SH[@]}"; do rm -f "$CLIPS/$s.mp4"; done   # force a fresh generation
  # shellcheck disable=SC2086
  env $RAIL FILM_ID="$FILM" SHOTS="$SHOTS" node scripts/veo-film.mjs
  : > "$OUT/list_$v.txt"
  for s in "${SH[@]}"; do
    [ -s "$CLIPS/$s.mp4" ] || { emdash_error "missing clip $s after run"; exit 1; }
    printf "file '%s'\n" "$ROOT/$CLIPS/$s.mp4" >> "$OUT/list_$v.txt"
  done
  ffmpeg -nostdin -y -f concat -safe 0 -i "$OUT/list_$v.txt" -an \
    -c:v libx264 -crf 18 -pix_fmt yuv420p "$OUT/variant_$v.silent.mp4"
  local dur fo
  dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT/variant_$v.silent.mp4")
  fo=$(awk "BEGIN{d=$dur-1.2; print (d>0)?d:0}")
  ffmpeg -nostdin -y -i "$OUT/variant_$v.silent.mp4" -i "$AUDIO" \
    -filter_complex "[1:a]atrim=0:${dur},afade=t=in:st=0:d=0.5,afade=t=out:st=${fo}:d=1.2,loudnorm=I=-14:TP=-1.5:LRA=11[a]" \
    -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart "$OUT/variant_$v.mp4"
  cp "$OUT/variant_$v.mp4" "$HOME/Desktop/${FILM}_variant_${v}.mp4"
  emdash_success "Variant $v -> ~/Desktop/${FILM}_variant_${v}.mp4"
}

gen A
gen B

# Scored side-by-side (left = A, right = B) for the quick pick.
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT/variant_A.silent.mp4")
ffmpeg -nostdin -y -i "$OUT/variant_A.silent.mp4" -i "$OUT/variant_B.silent.mp4" -i "$AUDIO" \
  -filter_complex "[0:v]scale=960:-2[a];[1:v]scale=960:-2[b];[a][b]hstack=inputs=2[v];[2:a]atrim=0:${D},afade=t=in:st=0:d=0.5,loudnorm=I=-14:TP=-1.5:LRA=11[au]" \
  -map "[v]" -map "[au]" -shortest -c:v libx264 -crf 18 -pix_fmt yuv420p -c:a aac -movflags +faststart "$OUT/2up.mp4"
cp "$OUT/2up.mp4" "$HOME/Desktop/${FILM}_${SHOTS//,/-}_2up.mp4"
emdash_success "Side-by-side (A left | B right) -> ~/Desktop/${FILM}_${SHOTS//,/-}_2up.mp4"
emdash_log "Watch it, then tell me A or B — we lock it and move to the next beat."
