#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

FILES=(manifest.json config.js background.js content.js popup.html popup.js icon16.png icon48.png icon128.png)

# Chrome — ship manifest.json as-is
zip -j savebot-chrome.zip "${FILES[@]}"

# Firefox — swap manifest-firefox.json → manifest.json
tmp=$(mktemp -d)
cp manifest-firefox.json "$tmp/manifest.json"
for f in "${FILES[@]}"; do
  [[ "$f" == "manifest.json" ]] && continue
  cp "$f" "$tmp/"
done
(cd "$tmp" && zip -j "$OLDPWD/savebot-firefox.zip" *)
rm -rf "$tmp"

echo "Built savebot-chrome.zip and savebot-firefox.zip"
