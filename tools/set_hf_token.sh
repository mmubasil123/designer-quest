#!/bin/zsh
# Writes HF_TOKEN into the project .env without echoing it or touching shell history.
cd "${0:A:h}/.." || exit 1
read -rs "t?Paste HF token, then Enter: "
echo
[[ $t == hf_* ]] || { echo "That does not start with hf_, .env unchanged."; exit 1; }
printf 'HF_TOKEN=%s\n' "$t" > .env && chmod 600 .env && echo "Saved to $(pwd)/.env"
