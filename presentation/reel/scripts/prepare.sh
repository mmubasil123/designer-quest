#!/bin/sh
# Copies the MoMu photos, fonts and logo the reel uses from mockups/ into public/momu/ (git-ignored), so the repo
# keeps one copy of each. Run from presentation/reel/: sh scripts/prepare.sh
set -e
M=../../mockups/assets
mkdir -p public/momu
cp $M/src/ST503.jpg $M/src/ST2407_1-2.jpg $M/src/ST80881_1024.jpg $M/src/ST81190.jpg public/momu/
cp $M/fonts/hanken-grotesk.woff2 $M/fonts/source-serif-4-italic.woff2 public/momu/
cp $M/brand/momu-logo.svg public/momu/
echo "public/momu ready"
