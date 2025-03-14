document.addEventListener('DOMContentLoaded', function() {
    const navLinksContainer = document.getElementById('menu-links');
    const menuContent = document.getElementById('menu-content');
    let isNavbarFixed = false;

    // Cargar datos desde menu.yml sin caché
    fetch(`assets/data/menu.yml?nocache=${Date.now()}`)
        .then(response => response.text())
        .then(yamlText => {
            const data = jsyaml.load(yamlText);
            data.forEach((category, index) => {
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
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    setActiveLink();
                    const bannerHeight = document.querySelector('.brand-header').offsetHeight;
                    const topNavbarHeight = document.querySelector('.top-navbar').offsetHeight;
                    const navbarHeight = navbar.offsetHeight;

                    // Fijar el menú cuando pasa el banner
                    if (lastScrollPosition > bannerHeight && !isNavbarFixed) {
                        navbar.classList.add('fixed');
                        isNavbarFixed = true;
                    }

                    // Limitar scroll hacia arriba para mostrar el primer título como tope
                    if (isNavbarFixed && lastScrollPosition < firstCategory.offsetTop - topNavbarHeight - navbarHeight) {
                        window.scrollTo({
                            top: firstCategory.offsetTop - topNavbarHeight - navbarHeight,
                            behavior: 'instant' // Sin animación para evitar temblores
                        });
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

                    // Fijar el menú inmediatamente al hacer clic
                    if (!isNavbarFixed) {
                        navbar.classList.add('fixed');
                        isNavbarFixed = true;
                    }

                    // Desplazar suavemente al objetivo, respetando el límite superior
                    window.scrollTo({
                        top: Math.max(targetPosition, minScrollPosition),
                        behavior: 'smooth'
                    });

                    // Actualizar clase active
                    navLinks.forEach(navLink => navLink.classList.remove('active'));
                    this.classList.add('active');
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
