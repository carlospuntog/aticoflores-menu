#!/usr/bin/env bash
#
# Pone la fecha y la hora detras del css y del js en index.html.
#
# GitHub Pages sirve los ficheros con cache-control: max-age=600, y el
# index.html tambien. Sin version, durante esos diez minutos un navegador
# que ya habia estado puede coger el html nuevo con el javascript viejo, o
# al reves. Lo que se ve entonces no es ninguna de las dos versiones y no
# hay forma de depurarlo.
#
# Se pasa ANTES de commitear, siempre que se toque assets/css o assets/js:
#   ./scripts/sellar.sh && git add -A && git commit
#
set -euo pipefail
cd "$(dirname "$0")/.."
V=$(date -u +%Y%m%d%H%M)
perl -0pi -e "s{(assets/(?:css|js)/[a-z0-9.-]+\.(?:css|js))(\?v=[0-9]+)?}{\$1?v=$V}g" index.html
echo "  sellado con v=$V"
grep -o 'assets/[a-z]*/[a-z0-9.-]*\.\(css\|js\)?v=[0-9]*' index.html | sed 's/^/    /'
