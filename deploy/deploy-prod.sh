#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Деплой прода jt-design.ru.
#
# Файл живёт на сервере по пути /opt/docker/jt-site/deploy-prod.sh
# (владелец root:root, права 755 — чтобы ключ CI не мог его подменить).
# Ключ GitHub Actions посажен ровно на этот скрипт:
#   command="/opt/docker/jt-site/deploy-prod.sh",no-port-forwarding,no-X11-forwarding,no-agent-forwarding,no-pty ssh-ed25519 ...
#
# Обновляет ТОЛЬКО сервис jt-site-prod: staging (jt-site-staging) не затрагивается.
# Проверка версии на живом сайте — отдельным шагом в workflow.
# ---------------------------------------------------------------------------
set -euo pipefail

COMPOSE_DIR="/opt/docker/jt-site"
COMPOSE=(docker compose -f docker-compose.prod.yml -f docker-compose.staging.yml)

cd "$COMPOSE_DIR"

echo "== было:"
"${COMPOSE[@]}" ps --format '{{.Name}} | {{.Image}} | {{.Status}}' jt-site-prod

echo "== подтягиваю образ из GHCR:"
"${COMPOSE[@]}" pull jt-site-prod

echo "== пересоздаю контейнер:"
"${COMPOSE[@]}" up -d jt-site-prod

sleep 5

echo "== стало:"
"${COMPOSE[@]}" ps --format '{{.Name}} | {{.Image}} | {{.Status}}' jt-site-prod

echo "== версия внутри контейнера:"
docker exec jt-site-prod grep -o 'carousel.css?v=[a-f0-9]*' /usr/share/nginx/html/index.html | head -1
