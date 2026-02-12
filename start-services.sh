#!/bin/bash
# Spire dev services startup script
set -e

export PATH=/usr/local/go/bin:$PATH
cd /home/go/src

echo "[startup] Starting Go backend on :3010..."
go run main.go http:serve --port 3010 > /tmp/backend-http.log 2>&1 &
BACKEND_PID=$!
echo "[startup] Backend PID: $BACKEND_PID"

echo "[startup] Starting Vue frontend on :8080..."
cd frontend
npm run serve -- --host 0.0.0.0 --port 8080 > /tmp/frontend-http.log 2>&1 &
FRONTEND_PID=$!
echo "[startup] Frontend PID: $FRONTEND_PID"

echo "[startup] Both services started. Tailing logs..."
tail -f /tmp/backend-http.log /tmp/frontend-http.log
