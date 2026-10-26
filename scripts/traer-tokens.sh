#!/usr/bin/env bash
#
# Trae el sistema de diseño v8 desde el tema de aticoflores.com.
#
# La carta vive en otro repositorio que la tienda, pero el sistema de diseño
# es el mismo y tiene un solo dueño: atico-tokens-v8.css en el tema hijo de
# Kadence. Aqui no se edita, se copia.
#
# Se copia ENTERO y tal cual, sin recortar lo que no se usa. Copiar solo un
# trozo es como se desincronizan los sistemas de diseño: el dia que alguien
# cambia un token que aqui no estaba, la carta se queda con el valor viejo y
# nadie se entera. El fichero son 23 KB y no trae fuentes ni imagenes.
#
# Uso:  ./scripts/traer-tokens.sh            desde el repo del tema en local
#       ./scripts/traer-tokens.sh --remoto   bajandolo de produccion
#
set -euo pipefail

DESTINO="$(cd "$(dirname "$0")/.." && pwd)/assets/css/atico-tokens-v8.css"
TEMA="$HOME/projects/aticoflores_ecommerce/app/public/wp-content/themes/kadence-child/assets/css/atico-tokens-v8.css"
URL="https://aticoflores.com/wp-content/themes/kadence-child/assets/css/atico-tokens-v8.css"

if [ "${1:-}" = "--remoto" ] || [ ! -f "$TEMA" ]; then
  echo "  bajando de $URL"
  curl -fsS "$URL" -o "$DESTINO.tmp"
else
  echo "  copiando de $TEMA"
  cp "$TEMA" "$DESTINO.tmp"
fi

# Un fichero vacio o una pagina de error de 404 no deben pisar al bueno.
if ! grep -q -- "--v8-ink:" "$DESTINO.tmp"; then
  echo "  lo que ha llegado no son los tokens v8. No se toca nada."
  rm -f "$DESTINO.tmp"; exit 1
fi

if [ -f "$DESTINO" ] && cmp -s "$DESTINO.tmp" "$DESTINO"; then
  rm -f "$DESTINO.tmp"
  echo "  ya estaban al dia"
else
  mv "$DESTINO.tmp" "$DESTINO"
  echo "  actualizados ($(wc -l < "$DESTINO" | tr -d ' ') lineas)"
  echo "  revisa la carta antes de publicar: un token puede haber cambiado de valor."
fi
