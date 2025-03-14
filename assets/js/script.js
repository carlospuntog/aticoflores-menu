document.addEventListener('DOMContentLoaded', function() {
    const navLinksContainer = document.getElementById('menu-links');
    const menuContent = document.getElementById('menu-content');
    let isNavbarFixed = false;
    let isScrollingFromClick = false;

    fetch(`assets/data/menu.yml?nocache=${Date.now()}`)
        .then(response => response.text())
        .then(yamlText => {
            const data = jsyaml.load(yamlText);
            const now = new Date();
            const currentHour = now.getHours();

            const timeSlotsOrder = [
                { slot: 'Desayuno', start: 6, end: 11 },
                { slot: 'Comida', start: 12, end: 16 },
                { slot: 'Merienda', start: 17, end: 20 }
            ];

            let currentSlot = null;
            for (const slot of timeSlotsOrder) {
                if (currentHour >= slot.start && currentHour <= slot.end) {
                    currentSlot = slot.slot;
                    break;
                }
            }
            if (!currentSlot) currentSlot = null;

            const sortedData = data.sort((a, b) => {
                const aSlotIndex = a.timeSlot ? timeSlotsOrder.findIndex(s => s.slot === a.timeSlot) : -1;
                const bSlotIndex = b.timeSlot ? timeSlotsOrder.findIndex(s => s.slot === b.timeSlot) : -1;
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

            navLinksContainer.innerHTML = '';
            menuContent.innerHTML = '';

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

                if (isNavbarFixed && activeLink) {
                    const linkRect = activeLink.getBoundingClientRect();
                    const containerRect = menuLinks.getBoundingClientRect();
                    const scrollLeft = activeLink.offsetLeft - (containerRect.width / 2) + (linkRect.width / 2);
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
                    const titleHeight = targetElement.querySelector('.section-title').offsetHeight;
                    const targetPosition = targetElement.offsetTop - topNavbarHeight - navbarHeight - titleHeight - 10;

                    if (!isNavbarFixed) {
                        navbar.classList.add('fixed');
                        isNavbarFixed = true;
                    }

                    isScrollingFromClick = true;
                    window.scrollTo(0, Math.max(targetPosition, firstCategory.offsetTop - topNavbarHeight - navbarHeight));
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
            const scrollAmount = e.deltaY * 1.5;
            const currentScroll = menuLinks.scrollLeft;
            menuLinks.scrollTo({
                left: currentScroll + scrollAmount,
                behavior: 'smooth'
            });
        });
    }
});
