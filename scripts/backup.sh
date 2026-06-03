#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="$ROOT_DIR/backups"
DATA_DIR="$ROOT_DIR/data"
STAMP="$(date +%Y%m%d-%H%M%S)"
TARGET="$BACKUP_DIR/hao-kitchen-$STAMP.tar.gz"

mkdir -p "$BACKUP_DIR"

if [[ ! -d "$DATA_DIR" ]]; then
  echo "No data directory found at $DATA_DIR" >&2
  exit 1
fi

tar -czf "$TARGET" -C "$ROOT_DIR" data/hao-kitchen.sqlite data/uploads
echo "Backup written to $TARGET"
