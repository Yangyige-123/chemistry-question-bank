#!/bin/bash
cd "$(dirname "$0")" || exit 1
if ! command -v node >/dev/null 2>&1; then
  echo "Please install Node.js LTS from https://nodejs.org/ first."
  read -r -p "Press Return to close..." _
  exit 1
fi
node tools/check-resources.mjs || { read -r -p "Press Return to close..." _; exit 1; }
CHEM_OPEN=1 node tools/serve.mjs
read -r -p "Press Return to close..." _
