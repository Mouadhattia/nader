#!/usr/bin/env bash
# Smoke-test the live deployment. Safe to run from any machine (no writes).
#
#   ./deploy/verify.sh
#
# Every line should read PASS. Anything else points at the fix noted beside it.

APEX="https://mouadhattia.xyz"
API="https://api.mouadhattia.xyz"

pass_fail() { if [ "$1" = "$2" ]; then echo "PASS  $3"; else echo "FAIL  $3 (got '$1', want '$2')"; fi; }

echo "--- DNS ---"
for host in mouadhattia.xyz www.mouadhattia.xyz api.mouadhattia.xyz; do
  ip=$(getent hosts "$host" 2>/dev/null | awk '{print $1}' | head -1)
  echo "      $host -> ${ip:-unresolved}"
done

echo "--- Frontend ---"
code=$(curl -sS -m 30 -o /dev/null -w "%{http_code}" "$APEX/")
pass_fail "$code" "200" "$APEX/ serves the app"

code=$(curl -sS -m 30 -o /dev/null -w "%{http_code}" "$APEX/guest")
pass_fail "$code" "200" "$APEX/guest SPA route resolves"

if curl -sS -m 30 "$APEX/" | grep -q "remote:start_recording"; then
  echo "PASS  frontend bundle contains the socket.io listener"
else
  echo "FAIL  frontend bundle has NO socket.io listener -> rebuild: npm run build"
fi

echo "--- API ---"
code=$(curl -sS -m 30 -o /dev/null -w "%{http_code}" "$API/health")
pass_fail "$code" "200" "$API/health"

code=$(curl -sS -m 30 -o /dev/null -w "%{http_code}" -H "Origin: $APEX" "$API/api/events")
pass_fail "$code" "200" "CORS from apex origin"

code=$(curl -sS -m 30 -o /dev/null -w "%{http_code}" -H "Origin: https://www.mouadhattia.xyz" "$API/api/events")
pass_fail "$code" "200" "CORS from www origin"

echo "--- Socket.IO (the Raspberry Pi bridge) ---"
body=$(curl -sS -m 30 "$API/socket.io/?EIO=4&transport=polling")
if printf '%s' "$body" | grep -q '"sid"'; then
  echo "PASS  socket.io handshake returns a session id"
else
  echo "FAIL  socket.io handshake did not return a sid"
  echo "      -> backend is running old code (git pull + npm install + pm2 restart),"
  echo "         or nginx has no /socket.io/ location block"
fi
