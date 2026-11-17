#!/bin/sh
set -e

# Container entrypoint for both Dockerfiles. `exec` makes the CMD
# (`node dist/index.js`) PID 1, so it receives SIGTERM from Cloud Run and the
# server closes cleanly (server/src/index.ts). Keep `exec "$@"` last.
exec "$@"
