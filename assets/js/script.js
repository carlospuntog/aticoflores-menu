/**
 * Carta de Ático Flores.
 *
 * Pinta la carta a partir de assets/data/menu.yml y marca en la tira de
 * secciones por donde va la lectura.
 *
 * De donde salen los datos
 * ------------------------
 * Hoy, del fichero YAML de este repositorio. UltraFlower ya tiene el editor
 * de la carta y un endpoint que genera este mismo YAML desde su base de
 * datos (/api/menu/public), pero ese endpoint todavia pide identificarse,
 * asi que apuntar ahi dejaria la carta en blanco.
 *
 * Cuando se abra, basta con poner la direccion en ORIGEN_REMOTO: el fichero
 * de este repositorio se queda como respaldo y la carta sigue abriendo
 * aunque UltraFlower este caido, que en una tienda es justo lo que hace
 * falta. Por eso se intenta el remoto con un tiempo limite corto en vez de
 * esperar a que el navegador se canse.
 */

/* Vacio A PROPOSITO. El endpoint ya esta abierto y contesta, pero las
 * tablas de Supabase tienen todavia una carta vieja: 8 secciones y 34
 * platos, sin cafes especiales, ni smoothies, ni sin gluten.
 *
 * Al apuntar aqui el 26-10-2026, la carta publica paso a servir esa. El
 * respaldo no salto porque no tenia por que: lo que llegaba era un YAML
 * perfectamente valido, solo que de otra carta. La comprobacion sabe
 * distinguir basura de carta, no una carta de otra, y eso no se arregla
 * desde aqui.
 *
 * Se vuelve a poner la direccion DESPUES de pasar supabase/seed-carta.sql
 * y de comprobar que el endpoint devuelve 13 secciones y 84 platos. */
var ORIGEN_REMOTO = '';
var ORIGEN_LOCAL  = 'assets/data/menu.yml';
var ESPERA_REMOTO = 2500;                     // ms antes de tirar del respaldo

document.addEventListener('DOMContentLoaded', function () {
    var contenedor = document.getElementById('carta');
    var navegacion = document.getElementById('carta-nav');
    var cargando   = document.getElementById('carta-cargando');

    traerCarta()
        .then(function (datos) {
            pintar(datos.filter(activa), contenedor, navegacion);
            if (cargando) cargando.remove();
            vigilarScroll(navegacion);
        })
        .catch(function (error) {
            console.error('No se ha podido cargar la carta:', error);
            if (cargando) {
                cargando.textContent = 'No hemos podido cargar la carta. Pregúntanos y te la damos en papel.';
            }
        });

    /* "active: YES" lo lee el YAML como booleano; de UltraFlower puede
     * llegar como cadena. Se aceptan los dos y, si no viene, se muestra. */
    function activa(cat) {
        if (cat.active === undefined || cat.active === null) return true;
        if (typeof cat.active === 'string') return cat.active.toLowerCase() !== 'no' && cat.active !== 'false';
        return cat.active !== false;
    }
});

function traerCarta() {
    if (!ORIGEN_REMOTO) return local();

    var aTiempo = new Promise(function (_, falla) {
        setTimeout(function () { falla(new Error('ha tardado mas de ' + ESPERA_REMOTO + ' ms')); }, ESPERA_REMOTO);
    });

    return Promise.race([fetch(ORIGEN_REMOTO).then(carta), aTiempo])
        .catch(function (error) {
            console.warn('Carta remota no disponible, se usa la del repositorio:', error.message);
            return local();
        });

    function local() {
        return fetch(ORIGEN_LOCAL + '?v=' + Date.now()).then(carta);
    }

    /* No basta con que la respuesta sea 200.
     *
     * Mientras /api/menu/public pida identificarse, UltraFlower contesta 200
     * con el HTML de su pantalla de acceso, porque fetch sigue la redireccion
     * sin rechistar. Si solo se mirara el codigo, eso se daria por buena
     * carta, el YAML no cuajaria y el cliente se quedaria mirando un hueco.
     *
     * Asi que se comprueba lo unico que importa: que lo que ha llegado es una
     * lista de categorias con platos dentro. Si no, se trata como un fallo y
     * salta el respaldo. */
    function carta(r) {
        if (!r.ok) throw new Error('respuesta ' + r.status);
        return r.text().then(function (texto) {
            var datos;
            try {
                datos = jsyaml.load(texto);
            } catch (e) {
                throw new Error('lo que ha llegado no es YAML');
            }
            if (!Array.isArray(datos) || !datos.length) throw new Error('la carta ha venido vacia');
            if (!datos.some(function (c) { return c && Array.isArray(c.items) && c.items.length; })) {
                throw new Error('la carta no trae ni un plato');
            }
            return datos;
        });
    }
}

function pintar(datos, contenedor, navegacion) {
    var fragmentoCarta = document.createDocumentFragment();
    var fragmentoNav   = document.createDocumentFragment();

    datos.forEach(function (cat, i) {
        var id = 'sec-' + (cat.id || i);

        var li = document.createElement('li');
        var a  = document.createElement('a');
        a.className = 'carta-nav__pill';
        a.href = '#' + id;
        a.textContent = cat.name || '';
        if (i === 0) a.setAttribute('aria-current', 'location');
        li.appendChild(a);
        fragmentoNav.appendChild(li);

        fragmentoCarta.appendChild(seccion(cat, id));
    });

    navegacion.appendChild(fragmentoNav);
    contenedor.appendChild(fragmentoCarta);
}

function seccion(cat, id) {
    var sec = document.createElement('section');
    sec.className = 'carta-seccion';
    sec.id = id;

    var cab = document.createElement('div');
    cab.className = 'carta-seccion__cab';

    var h2 = document.createElement('h2');
    h2.className = 'carta-seccion__titulo';
    h2.textContent = cat.name || '';
    cab.appendChild(h2);

    if (cat.extended_title) {
        var sub = document.createElement('p');
        sub.className = 'carta-seccion__sub';
        sub.textContent = cat.extended_title;
        cab.appendChild(sub);
    }
    sec.appendChild(cab);

    var ul = document.createElement('ul');
    ul.className = 'carta-platos';
    (cat.items || []).forEach(function (item) { ul.appendChild(plato(item)); });
    sec.appendChild(ul);

    if (cat.note) {
        var nota = document.createElement('p');
        nota.className = 'carta-seccion__nota';
        nota.textContent = cat.note;
        sec.appendChild(nota);
    }

    return sec;
}

function plato(item) {
    var li = document.createElement('li');
    li.className = 'carta-plato';

    var nombre = document.createElement('p');
    nombre.className = 'carta-plato__nombre';
    nombre.textContent = item.name || '';

    /* El picante se dice con una palabra, no con un emoji: el emoji se ve
     * distinto en cada telefono y el lector de pantalla no lo lee. */
    if (item.tags) {
        String(item.tags).split(',').forEach(function (t) {
            t = t.trim();
            if (!t) return;
            var marca = document.createElement('span');
            marca.className = 'carta-plato__marca';
            marca.textContent = t;
            nombre.appendChild(marca);
        });
    }
    li.appendChild(nombre);

    var precio = document.createElement('p');
    precio.className = 'carta-plato__precio';
    /* El precio se imprime tal cual viene del YAML. No se formatea aqui a
     * proposito: lo que se cobra en la barra tiene que ser exactamente lo
     * que hay escrito en el fichero, sin que lo toque ningun redondeo. */
    precio.textContent = item.price || '';
    li.appendChild(precio);

    if (item.description) {
        var desc = document.createElement('p');
        desc.className = 'carta-plato__desc';
        desc.textContent = item.description;
        li.appendChild(desc);
    }

    return li;
}

/* Marca en la tira la seccion que se esta leyendo.
 *
 * Con IntersectionObserver y no escuchando el scroll: son trece secciones
 * y el scroll dispara decenas de veces por segundo. */
function vigilarScroll(navegacion) {
    var secciones = document.querySelectorAll('.carta-seccion');
    if (!secciones.length || !('IntersectionObserver' in window)) return;

    var pills = {};
    navegacion.querySelectorAll('.carta-nav__pill').forEach(function (p) {
        pills[p.getAttribute('href').slice(1)] = p;
    });

    var vigia = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (e) {
            if (!e.isIntersecting) return;
            var pill = pills[e.target.id];
            if (!pill || pill.getAttribute('aria-current') === 'location') return;
            navegacion.querySelectorAll('[aria-current]').forEach(function (p) {
                p.removeAttribute('aria-current');
            });
            pill.setAttribute('aria-current', 'location');
            /* La tira se mueve sola para que el pill marcado se vea: con
             * trece secciones, la de "Sin gluten" esta fuera de pantalla. */
            if (navegacion.scrollWidth > navegacion.clientWidth) {
                pill.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
            }
        });
    }, {
        /* La franja activa es la parte alta de la pantalla, justo debajo de
         * la tira de pills: es donde esta mirando quien lee. */
        rootMargin: '-25% 0px -70% 0px'
    });

    secciones.forEach(function (s) { vigia.observe(s); });
}
