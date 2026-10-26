# Carta de Ático Flores

La carta que se ve al escanear el QR de la tienda: **https://menu.aticoflores.com**

Se publica sola con GitHub Pages desde `main`. No hay build ni dependencias
que instalar: es HTML, CSS y un javascript de 8 KB.

## Dónde se cambia la carta

En `assets/data/menu.yml`. Un plato son tres líneas:

```yaml
    - name: Café bombón
      description: Opcional, una frase.
      price: 2,50 €
      tags: picante          # opcional, sale como etiqueta junto al nombre
```

El precio se escribe tal cual se quiere ver, con coma y espacio antes del €.
La página lo imprime sin tocarlo: lo que se cobra en barra es exactamente lo
que pone aquí.

Al guardar y hacer push, GitHub Pages republica en un par de minutos.

## El diseño

Sale del sistema de diseño de aticoflores.com. `assets/css/atico-tokens-v8.css`
es una **copia** del fichero del tema de la tienda, no se edita aquí:

```bash
./scripts/traer-tokens.sh            # desde el repo del tema en local
./scripts/traer-tokens.sh --remoto   # bajándolo de producción
```

`assets/css/styles.css` es lo propio de la carta y no tiene ni un color ni un
tamaño suelto: todo sale de los tokens.

## Lo que falta para que la edite UltraFlower

UltraFlower ya tiene el editor de la carta (`/menu`), las tablas en Supabase
y un endpoint `/api/menu/public` que genera este mismo YAML. Faltan tres
cosas, por orden:

1. Cargar los 84 platos de `menu.yml` en las tablas de Supabase.
2. Sacar `/api/menu/public` de la lista de rutas protegidas del middleware de
   UltraFlower. Hoy pide identificarse, así que apuntar ahí dejaría la carta
   en blanco.
3. Poner la dirección del endpoint en `ORIGEN_REMOTO`, arriba de
   `assets/js/script.js`.

Hecho eso, la carta se edita desde UltraFlower sin tocar git, y este fichero
YAML se queda como respaldo: si UltraFlower no contesta en 2,5 segundos, la
página tira de él y la carta abre igual.

## Las fotos

`assets/images2/` son 19,3 MB de PNG de la versión anterior. La carta de hoy
es de texto y no pide ninguna, pero **no se borran**: el editor de UltraFlower
las usa en sus vistas previas.
