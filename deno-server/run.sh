deno run \
  --import-map=deno-server/import-map.json \
  --unstable-sloppy-imports \
  --unstable-kv \
  --unstable-broadcast-channel \
  --unstable-cron \
  --unstable-http \
  --watch \
  --allow-env \
  --allow-sys \
  --allow-read \
  --allow-write=${HOME}/.local/share/dist-app \
  --allow-net \
  --no-prompt \
  --allow-import \
  ./deno-server/server.ts
