#!/usr/bin/env bash
# Start Expo with file watching (hot reload) for Expo Go on LAN.
# Needs sudo once to raise Linux inotify limits (otherwise Metro crashes with ENOSPC).

set -euo pipefail
cd "$(dirname "$0")/.."

echo "Raising file-watcher limits (needed for live reload)…"
sudo sysctl -w fs.inotify.max_user_watches=524288
sudo sysctl -w fs.inotify.max_user_instances=1024

# Persist across reboots (best-effort)
if [ ! -f /etc/sysctl.d/40-max-user-watches.conf ]; then
  echo fs.inotify.max_user_watches=524288 | sudo tee /etc/sysctl.d/40-max-user-watches.conf >/dev/null
fi

# Ensure nvm Node/npx is on PATH in non-login shells (set -u trips nvm.sh).
if ! command -v npx >/dev/null 2>&1; then
  if [ -d "$HOME/.nvm/versions/node" ]; then
    LATEST_NODE="$(ls -1v "$HOME/.nvm/versions/node" | tail -n 1)"
    export PATH="$HOME/.nvm/versions/node/$LATEST_NODE/bin:${PATH:-}"
  fi
fi
unset CI

IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
echo ""
echo "Starting Expo (watch mode ON)…"
echo "On phone → Expo Go → open:"
echo "  exp://${IP:-YOUR_LAN_IP}:8081"
echo ""

# Pass --clear to wipe Metro cache when UI stops refreshing:
#   ./scripts/start-expo-lan.sh --clear
exec npx expo start --lan --port 8081 "$@"
