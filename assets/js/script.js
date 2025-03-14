document.addEventListener('DOMContentLoaded', function() {
    const navLinksContainer = document.getElementById('menu-links');
    const menuContent = document.getElementById('menu-content');
    let isNavbarFixed = false;

    // Cargar datos desde menu.yml
    fetch('assets/data/menu.yml')
        .then(response => response.text())
        .then(yamlText => {
            const data = jsyaml.load(yamlText); // Convertir YAML a JSON
            // Generar enlaces de navegación
            data.forEach((category, index) => {
                const navLink = document.createElement('a');
                navLink.href = `#${category.id}`;
                navLink.className = `nav-link${index === 0 ? ' active' : ''}`;
                navLink.innerHTML = `
                    <img src="assets/images/${category.image}" alt="${category.name}">
                    <span class="nav-text">${category.name}</span>
                `;
                navLinksContainer.appendChild(navLink);

                // Generar contenido de categoría
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
                        <img src="assets/images/${item.image}" alt="${item.name}" class="item-image">
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

            // Configurar eventos después de generar el DOM
            setupEvents();
        })
        .catch(error => console.error('Error al cargar menu.yml:', error));

    function setupEvents() {
        const navLinks = document.querySelectorAll('.nav-link');
        const navbar = document.querySelector('.navbar');
        const menuLinks = document.querySelector('.menu-links');
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
                    if (lastScrollPosition > bannerHeight && !isNavbarFixed) {
                        navbar.classList.add('fixed');
                        isNavbarFixed = true;
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
                    const startPosition = window.scrollY;
                    const navbarHeight = navbar.offsetHeight;
                    const targetPosition = isNavbarFixed
                        ? targetElement.offsetTop - navbarHeight - 40
                        : targetElement.offsetTop - navbarHeight - 40;

                    const distance = targetPosition - startPosition;
                    const duration = 800;
                    let start = null;

                    function step(timestamp) {
                        if (!start) start = timestamp;
                        const progress = timestamp - start;
                        const percentage = Math.min(progress / duration, 1);
                        const easeInOutQuad = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
                        window.scrollTo(0, startPosition + distance * easeInOutQuad(percentage));
                        if (progress < duration) window.requestAnimationFrame(step);
                    }

                    window.requestAnimationFrame(step);
                    navLinks.forEach(navLink => navLink.classList.remove('active'));
                    this.classList.add('active');
                    navbar.classList.add('fixed');
                    isNavbarFixed = true;
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
