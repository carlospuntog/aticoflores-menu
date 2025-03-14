document.addEventListener('DOMContentLoaded', function() {
    const navLinksContainer = document.getElementById('menu-links');
    const menuContent = document.getElementById('menu-content');
    let isNavbarFixed = false;
    let isScrollingFromClick = false;

    // Cargar datos desde menu.yml sin caché
    fetch(`assets/data/menu.yml?nocache=${Date.now()}`)
        .then(response => response.text())
        .then(yamlText => {
            const data = jsyaml.load(yamlText);

            // Obtener la hora actual del cliente
            const now = new Date();
            const currentHour = now.getHours();

            // Definir franjas horarias (ajusta según necesites)
            const timeSlotsOrder = [
                { slot: 'Desayuno', start: 6, end: 11 },
                { slot: 'Comida', start: 12, end: 16 },
                { slot: 'Merienda', start: 17, end: 5 }
            ];

            // Determinar la franja horaria actual
            let currentSlot = null;
            for (const slot of timeSlotsOrder) {
                if (currentHour >= slot.start && currentHour <= slot.end) {
                    currentSlot = slot.slot;
                    break;
                }
            }
            if (!currentSlot) currentSlot = null; // Sin franja si no coincide

            // Ordenar categorías
            const sortedData = data.sort((a, b) => {
                // 1. Orden por franja horaria
                const aSlotIndex = a.timeSlot ? timeSlotsOrder.findIndex(s => s.slot === a.timeSlot) : -1;
                const bSlotIndex = b.timeSlot ? timeSlotsOrder.findIndex(s => s.slot === b.timeSlot) : -1;
                const aIsCurrent = a.timeSlot === currentSlot;
                const bIsCurrent = b.timeSlot === currentSlot;

                // Priorizar la franja actual, luego el orden definido, y Sin Franja al final
                if (aIsCurrent && !bIsCurrent) return -1;
                if (!aIsCurrent && bIsCurrent) return 1;
                if (aSlotIndex !== bSlotIndex) {
                    if (aSlotIndex === -1) return 1; // Sin franja al final
                    if (bSlotIndex === -1) return -1;
                    return aSlotIndex - bSlotIndex;
                }

                // 2. Dentro de la misma franja, prioridad primero
                if (a.priority && !b.priority) return -1;
                if (!a.priority && b.priority) return 1;

                // 3. Si no hay prioridad, orden aleatorio dentro de la franja
                return Math.random() - 0.5;
            });

            // Generar DOM con los datos ordenados
            sortedData.forEach((category, index) => {
                const navLink = document.createElement('a');
                navLink.href = `#${category.id}`;
                navLink.className = `nav-link${index === 0 ? ' active' : ''}`;
                navLink.innerHTML = `
                    <img src="${category.image}" alt="${category.name}">
                    <span class="nav-text">${category.name}</span>
                `;
                navLinksContainer.appendChild(navLink);

                const categoryDiv = document.createElement('div');
                categoryDiv.id = category.id;
                categoryDiv.className = 'menu-category';
                let itemsHtml = category.items.map(item => `
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
                    <h2 class="section-title">${category.name}</h2>
                    <div class="menu-items">${itemsHtml}</div>
                `;
                if (category.id === 'desayunos') {
                    categoryDiv.innerHTML = `
                        <h2 class="section-title">${category.name}</h2>
                        <p class="availability">Disponible de 8:00 a 11:00</p>
                        <h3 class="subsection-title">Tostadas</h3>
                        <div class="menu-items">${itemsHtml}</div>
                    `;
                }
                menuContent.appendChild(categoryDiv);
            });

            setupEvents();
        })
        .catch(error => console.error('Error al cargar menu.yml:', error));

    function setupEvents() {
        const navLinks = document.querySelectorAll('.nav-link');
        const navbar = document.querySelector('.navbar');
        const menuLinks = document.querySelector('.menu-links');
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
                const sectionId = currentSection.getAttribute('id');
                const activeLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);
                if (activeLink) activeLink.classList.add('active');
            }

            ticking = false;
        }

        function handleScroll() {
            lastScrollPosition = window.scrollY;
            if (!ticking && !isScrollingFromClick) {
                window.requestAnimationFrame(() => {
                    setActiveLink();
                    const bannerHeight = document.querySelector('.brand-header').offsetHeight;
                    const topNavbarHeight = document.querySelector('.top-navbar').offsetHeight;
                    const navbarHeight = navbar.offsetHeight;

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
                const targetId = this.getAttribute('href');
                const targetElement = document.querySelector(targetId);

                if (targetElement) {
                    const navbarHeight = navbar.offsetHeight;
                    const topNavbarHeight = document.querySelector('.top-navbar').offsetHeight;
                    const targetPosition = targetElement.offsetTop - topNavbarHeight - navbarHeight - 40;
                    const minScrollPosition = firstCategory.offsetTop - topNavbarHeight - navbarHeight;

                    if (!isNavbarFixed) {
                        navbar.classList.add('fixed');
                        isNavbarFixed = true;
                    }

                    isScrollingFromClick = true;
                    window.scrollTo(0, Math.max(targetPosition, minScrollPosition));
                    navLinks.forEach(navLink => navLink.classList.remove('active'));
                    this.classList.add('active');

                    setTimeout(() => {
                        isScrollingFromClick = false;
                    }, 100);
                }
            });
        });

        menuLinks.addEventListener('wheel', function(e) {
            if (window.innerWidth > 576) {
                e.preventDefault();
                const scrollAmount = e.deltaY * 1.5;
                menuLinks.scrollLeft += scrollAmount;
            }
        });
    }
});
