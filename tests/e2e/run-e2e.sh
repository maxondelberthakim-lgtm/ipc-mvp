#!/bin/bash
pkill -f "wrangler dev" 2>/dev/null; pkill -f workerd 2>/dev/null; sleep 1
rm -rf /home/claude/ipc-repo/cloudflare/.wrangler/state
(curl -s -o /dev/null http://127.0.0.1:8090/ || (cd /home/claude && setsid nohup python3 -m http.server 8090 --bind 127.0.0.1 --directory /home/claude/pwa-cf > /tmp/claude-0/http.log 2>&1 < /dev/null & disown)); sleep 1
cd /home/claude/ipc-repo/cloudflare && (setsid nohup npx wrangler dev --port 8787 --local > /tmp/claude-0/wrangler.log 2>&1 < /dev/null & disown)
for i in $(seq 1 40); do sleep 1; grep -q "Ready on" /tmp/claude-0/wrangler.log && break; done
cd /home/claude && timeout 400 node e2e-v11.mjs 2>&1
