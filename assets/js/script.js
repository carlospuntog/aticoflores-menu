document.addEventListener('DOMContentLoaded', function() {
    const navLinksContainer = document.getElementById('menu-links');
    const menuContent      = document.getElementById('menu-content');

    // Referencias del modal
    const modal            = document.getElementById('product-modal');
    const modalImg         = document.getElementById('modal-img');
    const modalName        = document.getElementById('modal-name');
    const modalPrice       = document.getElementById('modal-price');
    const modalDescription = document.getElementById('modal-description');
    const modalAllergens   = document.getElementById('modal-allergens');
    const modalAllergensContainer = document.getElementById('modal-allergens-container');

    let isNavbarFixed      = false;
    let isScrollingFromClick = false;

    // 1) Cargar el YAML y renderizar categorías/items
    fetch(`assets/data/menu.yml?nocache=${Date.now()}`)
        .then(response => response.text())
        .then(yamlText => {
            const data = jsyaml.load(yamlText);
            const now = new Date();
            const currentHour = now.getHours();

            const timeSlotsOrder = [
                { slot: 'Desayuno', start: 6,  end: 11 },
                { slot: 'Comida',   start: 12, end: 16 },
                { slot: 'Merienda', start: 17, end: 20 }
            ];

            // Determinar la franja horaria actual
            let currentSlot = null;
            for (const slot of timeSlotsOrder) {
                if (currentHour >= slot.start && currentHour <= slot.end) {
                    currentSlot = slot.slot;
                    break;
                }
            }

            // Ordenar categorías según timeSlot, prioridad y aleatorio
            const sortedData = data.sort((a, b) => {
                const aSlotIndex = a.timeSlot
                  ? timeSlotsOrder.findIndex(s => s.slot === a.timeSlot)
                  : -1;
                const bSlotIndex = b.timeSlot
                  ? timeSlotsOrder.findIndex(s => s.slot === a.timeSlot)
                  : -1;
                const aIsCurrent = a.timeSlot === currentSlot;
                const bIsCurrent = b.timeSlot === currentSlot;

                if (aIsCurrent && !bIsCurrent) return -1;
                if (!aIsCurrent && bIsCurrent) return 1;
                if (aSlotIndex !== bSlotIndex) {
                    if (aSlotIndex === -1) return 1;
                    if (bSlotIndex === -1) return -1;
                    return aSlotIndex - bSlotIndex;
                }
                if (a.priority && !b.priority) return -1;
                if (!a.priority && b.priority) return 1;
                return Math.random() - 0.5;
            });

            // Limpiar contenedores
            navLinksContainer.innerHTML = '';
            menuContent.innerHTML = '';

            // Renderizar cada categoría activa
            sortedData
                .filter(category => category.active === "YES")
                .forEach((category, index) => {
                    // 1a) Crear enlace de categoría en la barra (nav-link)
                    const navLink = document.createElement('a');
                    navLink.href = `#${category.id}`;
                    navLink.className = `nav-link${index === 0 ? ' active' : ''}`;
                    navLink.innerHTML = `
                        <img src="${category.image}" alt="${category.name}">
                        <span class="nav-text">${category.name}</span>
                    `;
                    navLinksContainer.appendChild(navLink);

                    // 1b) Crear contenedor de sección de esta categoría
                    const categoryDiv = document.createElement('div');
                    categoryDiv.id = category.id;

                    // Si la categoría tiene fondo/color, aplica la clase correspondiente
                    let categoryClasses = 'menu-category';
                    if (category.hasBackground) {
                        categoryClasses += ' with-background';
                        const bgKey = (category.backgroundColor || '').trim();
                        if (bgKey === 'accent') {
                            categoryClasses += ' bg-accent';
                        } else if (bgKey === 'accent-light') {
                            categoryClasses += ' bg-accent-light';
                        } else if (bgKey === 'soft-pink') {
                            categoryClasses += ' bg-soft-pink';
                        } else if (bgKey === 'soft-green') {
                            categoryClasses += ' bg-soft-green';
                        } else if (bgKey === 'soft-blue-gray') {
                            categoryClasses += ' bg-soft-blue-gray';
                        }
                    }
                    categoryDiv.className = categoryClasses;

                    // 1c) Generar HTML de los items
                    const itemsHtml = category.items.map(item => `
                        <div class="menu-item">
                            <div class="item-details">
                                <h3 class="item-title">${item.name}</h3>
                                <p class="item-description">${item.description}</p>
                                <span class="item-price">${item.price}</span>
                            </div>
                            <img src="${item.image}" alt="${item.name}" class="item-image">
                        </div>
                    `).join('');

                    categoryDiv.innerHTML = `
                        <h2 class="section-title">${category.extended_title || category.name}</h2>
                        <div class="menu-items">${itemsHtml}</div>
                    `;
                    menuContent.appendChild(categoryDiv);

                    // 1d) Cada .menu-item abre el modal al hacer clic
                    const menuItems = categoryDiv.querySelectorAll('.menu-item');
                    category.items.forEach((item, idx) => {
                        const menuItemElem = menuItems[idx];
                        menuItemElem.addEventListener('click', () => openModal(item, category));
                    });
                });

            setupEvents();
        })
        .catch(error => console.error('Error al cargar menu.yml:', error));

    // ───────── Función para abrir el modal ─────────
    function openModal(item, category) {
        // Verificar que el modal existe
        if (!modal) {
            console.error('Modal no encontrado');
            return;
        }

        // Imagen del producto
        if (modalImg) {
            modalImg.src = item.image;
            modalImg.alt = item.name;
        }

        // Nombre del producto
        if (modalName) {
            modalName.textContent = item.name || '—';
        }

        // Precio
        if (modalPrice) {
            modalPrice.textContent = item.price || '';
        }

        // Descripción/Ingredientes
        if (modalDescription) {
            modalDescription.textContent =
                (item.description && item.description.trim())
                    ? item.description.trim()
                    : '';
        }

        // Alérgenos - ocultar si no hay datos válidos
        const hasAllergens = item.allergens &&
                             item.allergens.trim() &&
                             item.allergens.trim() !== 'XXX' &&
                             item.allergens.trim() !== '';

        if (modalAllergensContainer) {
            if (hasAllergens && modalAllergens) {
                modalAllergens.textContent = item.allergens.trim();
                modalAllergensContainer.style.display = 'flex';
            } else {
                modalAllergensContainer.style.display = 'none';
            }
        }

        // Mostrar modal
        modal.classList.add('is-open');
        document.body.style.overflow = 'hidden';
    }

    // ───────── Función para cerrar el modal ─────────
    function closeModal() {
        modal.classList.remove('is-open');
        document.body.style.overflow = '';
    }

    // 3) Listeners para cerrar el modal (clic en overlay o tecla Esc)
    modal.addEventListener('click', e => {
      if (e.target.dataset.close !== undefined) {
        closeModal();
      }
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && modal.classList.contains('is-open')) {
            closeModal();
        }
    });

    // ───────── Lógica de scroll y navbar (mantener tu código existente) ─────────
    function setupEvents() {
        const navLinks      = document.querySelectorAll('.nav-link');
        const navbar        = document.querySelector('.navbar');
        const menuLinks     = document.querySelector('.menu-links');
        const firstCategory = document.querySelector('.menu-category');
        let lastScrollPosition = 0;
        let ticking = false;

        function setActiveLink() {
            const scrollPosition = window.scrollY + 80;
            const sections = document.querySelectorAll('.menu-category');
            let currentSection = null;

            for (let i = sections.length - 1; i >= 0; i--) {
                const section = sections[i];
                const sectionTop = section.offsetTop - 80;
                if (scrollPosition >= sectionTop) {
                    currentSection = section;
                    break;
                }
            }
            if (!currentSection && sections.length > 0) {
                currentSection = sections[0];
            }

            navLinks.forEach(link => link.classList.remove('active'));
            if (currentSection) {
                const sectionId  = currentSection.getAttribute('id');
                const activeLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);
                if (activeLink) activeLink.classList.add('active');

                if (isNavbarFixed && activeLink) {
                    const linkRect      = activeLink.getBoundingClientRect();
                    const containerRect = menuLinks.getBoundingClientRect();
                    const scrollLeft    = activeLink.offsetLeft - (containerRect.width / 2) + (linkRect.width / 2);
                    menuLinks.scrollTo({
                        left: scrollLeft,
                        behavior: 'smooth'
                    });
                }
            }
            ticking = false;
        }

        function handleScroll() {
            lastScrollPosition = window.scrollY;
            if (!ticking && !isScrollingFromClick) {
                window.requestAnimationFrame(() => {
                    setActiveLink();
                    const bannerHeight    = document.querySelector('.brand-header').offsetHeight;
                    const topNavbarHeight = document.querySelector('.top-navbar').offsetHeight;
                    const navbarHeight    = navbar.offsetHeight;

                    if (lastScrollPosition > bannerHeight && !isNavbarFixed) {
                        navbar.classList.add('fixed');
                        isNavbarFixed = true;
                    }
                    if (isNavbarFixed && lastScrollPosition < firstCategory.offsetTop - topNavbarHeight - navbarHeight) {
                        window.scrollTo(0, firstCategory.offsetTop - topNavbarHeight - navbarHeight);
                    }
                    ticking = false;
                });
                ticking = true;
            }
        }

        window.addEventListener('scroll', handleScroll);
        setActiveLink();

        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId      = this.getAttribute('href');
                const targetElement = document.querySelector(targetId);

                if (targetElement) {
                    const navbarHeight    = navbar.offsetHeight;
                    const topNavbarHeight = document.querySelector('.top-navbar').offsetHeight;
                    const baseOffset      = firstCategory.offsetTop - topNavbarHeight - navbarHeight;
                    const targetPosition  = targetElement.offsetTop - topNavbarHeight - navbarHeight - (firstCategory.offsetTop - targetElement.offsetTop > 0 ? 0 : 20);

                    if (!isNavbarFixed) {
                        navbar.classList.add('fixed');
                        isNavbarFixed = true;
                    }
                    isScrollingFromClick = true;
                    window.scrollTo(0, Math.max(targetPosition, baseOffset));
                    navLinks.forEach(navLink => navLink.classList.remove('active'));
                    this.classList.add('active');

                    setTimeout(() => {
                        isScrollingFromClick = false;
                    }, 100);
                }
            });
        });

        menuLinks.addEventListener('wheel', function(e) {
            e.preventDefault();
            const scrollAmount  = e.deltaY * 3;
            const currentScroll = menuLinks.scrollLeft;
            menuLinks.scrollTo({
                left: currentScroll + scrollAmount,
                behavior: 'smooth'
            });
        });
    }
});
