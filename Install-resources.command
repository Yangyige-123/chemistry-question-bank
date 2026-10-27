#!/bin/bash
cd "$(dirname "$0")" || exit 1
if ! command -v node >/dev/null 2>&1; then
 echo "Please install Node.js LTS from https://nodejs.org/ first."
else
 node tools/install-resources.mjs
fi
read -r -p "Press Return to close..." _
