#!/usr/bin/env bash
# Push гілки main на GitHub без інтерактивного логіну.
# Варіант 1 (рекомендовано): додай SSH-ключ з ~/.ssh/id_ed25519_lc_lostchronicles.pub
# як Deploy key з «Allow write access» у репозиторії, потім: git push -u origin main --force-with-lease
#
# Варіант 2: fine-grained або classic PAT з правом на repo (contents: write):
#   export GITHUB_TOKEN=ghp_xxxxxxxx
#   ./scripts/push-github.sh

set -euo pipefail
cd "$(dirname "$0")/.."

if [[ -n "${GITHUB_TOKEN:-}" ]]; then
  export GIT_TERMINAL_PROMPT=0
  # Віддалена історія на GitHub старіша за локальну feature-гілку — потрібен force-with-lease.
  git push "https://git:${GITHUB_TOKEN}@github.com/WayZeman/LostChronicles2026.git" main --force-with-lease
  git remote set-url origin https://github.com/WayZeman/LostChronicles2026.git
  echo "OK: push виконано (remote залишено на HTTPS без токена в URL)."
  exit 0
fi

echo "GITHUB_TOKEN не задано."
echo "Або виконай у терміналі (один рядок, підстав свій токен):"
echo '  export GITHUB_TOKEN=ghp_ВАШ_ТОКЕН && ./scripts/push-github.sh'
echo "Або додай SSH deploy key (вміст ~/.ssh/id_ed25519_lc_lostchronicles.pub) на GitHub → Settings → Deploy keys."
exit 1
