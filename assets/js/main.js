import { moviesData, seriesData } from './data.js';

// Variables globales
let currentMovies = [];
let currentSeries = [];
const allGenres = [...new Set([...moviesData.flatMap(m => m.genres), ...seriesData.flatMap(s => s.genres)])].sort();

// Variables para la instalación de PWA
let deferredPrompt;
let installButton;

// Ruta base para GitHub Pages
const BASE_PATH = '/Flicker-Android-/';

document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

function initApp() {
    // Crear botón de instalación dinámicamente
    createInstallButton();
    
    loadInitialContent();
    setupSearch();
    setupCategories();
    setupOverlay();
    setupPWA();
    
    // Verificar estado de PWA después de un tiempo
    setTimeout(checkPWAStatus, 2000);
}

function createInstallButton() {
    // Crear el botón de instalación
    installButton = document.createElement('button');
    installButton.id = 'installButton';
    installButton.className = 'install-btn';
    installButton.style.display = 'none';
    installButton.innerHTML = `
        <i class="fas fa-download"></i>
        <span>Instalar App</span>
    `;
    
    // Insertar el botón en el header (después del search container)
    const searchContainer = document.querySelector('.search-container');
    searchContainer.parentNode.insertBefore(installButton, searchContainer.nextSibling);
    
    // Añadir evento de clic
    installButton.addEventListener('click', async () => {
        await installPWA();
    });
}

function setupPWA() {
    // Registrar Service Worker con la ruta correcta
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            const swUrl = `${BASE_PATH}sw.js`;
            
            navigator.serviceWorker.register(swUrl)
                .then(registration => {
                    console.log('SW registered: ', registration);
                    
                    // Forzar la verificación de actualizaciones
                    registration.update();
                    
                    // Verificar el estado periódicamente
                    setInterval(() => {
                        registration.update();
                    }, 60 * 60 * 1000); // Cada hora
                })
                .catch(registrationError => {
                    console.log('SW registration failed: ', registrationError);
                    // Intentar con ruta relativa si falla
                    navigator.serviceWorker.register('./sw.js')
                        .then(registration => {
                            console.log('SW registered with relative path: ', registration);
                        })
                        .catch(error => {
                            console.log('SW registration completely failed: ', error);
                        });
                });
        });
    }
    
    // Evento que se dispara cuando la app es instalable
    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevenir que el mini-infobar aparezca en mobile
        e.preventDefault();
        // Guardar el evento para que pueda ser activado después
        deferredPrompt = e;
        // Mostrar el botón de instalación
        installButton.style.display = 'flex';
        
        console.log('PWA install prompt available');
    });
    
    // Evento que se dispara cuando la PWA está instalada
    window.addEventListener('appinstalled', () => {
        // Ocultar el botón de instalación
        installButton.style.display = 'none';
        // Resetear deferredPrompt
        deferredPrompt = null;
        console.log('PWA was installed');
    });
    
    // Verificar si la app ya está instalada
    checkIfAppIsInstalled();
}

async function installPWA() {
    if (!deferredPrompt) return;
    
    // Mostrar el prompt de instalación
    deferredPrompt.prompt();
    
    // Esperar a que el usuario responda al prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log(`User response to the install prompt: ${outcome}`);
    
    // Ya hemos usado el prompt, no lo podemos usar again
    deferredPrompt = null;
    
    // Ocultar el botón de instalación
    installButton.style.display = 'none';
}

function checkIfAppIsInstalled() {
    // Verificar si la app ya está instalada
    if (window.matchMedia('(display-mode: standalone)').matches || 
        window.navigator.standalone === true) {
        installButton.style.display = 'none';
    }
}

function checkPWAStatus() {
    console.log('Checking PWA status...');
    
    // Verificar Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration()
            .then(registration => {
                if (registration) {
                    console.log('Service Worker registered:', registration);
                    installButton.style.display = 'none';
                } else {
                    console.log('No Service Worker registration found');
                }
            });
    } else {
        console.log('Service Workers not supported');
    }
    
    // Verificar antes de instalar prompt
    window.addEventListener('beforeinstallprompt', (e) => {
        console.log('beforeinstallprompt event fired');
    });
    
    // Verificar si ya está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('Running in standalone mode');
        installButton.style.display = 'none';
    }
    
    // Verificar manifest
    const manifestLink = document.querySelector('link[rel="manifest"]');
    if (manifestLink) {
        fetch(manifestLink.href)
            .then(response => response.json())
            .then(manifest => {
                console.log('Manifest loaded successfully:', manifest);
            })
            .catch(error => {
                console.error('Error loading manifest:', error);
            });
    }
}

function loadInitialContent() {
    currentMovies = [...moviesData];
    currentSeries = [...seriesData];
    renderContent();
}

function renderContent() {
    renderMoviesByGenre();
    renderSeriesByGenre();
}

function renderMoviesByGenre() {
    const container = document.getElementById('movies-container');
    if (!container) return;
    
    container.innerHTML = '';

    allGenres.forEach(genre => {
        const moviesInGenre = currentMovies.filter(movie => 
            movie.genres && movie.genres.includes(genre)
        ).slice(0, 10);

        if (moviesInGenre.length > 0) {
            const section = document.createElement('section');
            section.className = 'genre-section';
            section.innerHTML = `
                <h2><span>${genre}</span> <a href="#movies-container" class="see-all">Ver todas</a></h2>
                <div class="carousel-container">
                    <div class="carousel-track" id="movies-${genre.toLowerCase().replace(/\s+/g, '-')}"></div>
                </div>
            `;
            container.appendChild(section);

            const carousel = document.getElementById(`movies-${genre.toLowerCase().replace(/\s+/g, '-')}`);
            moviesInGenre.forEach(movie => {
                carousel.appendChild(createMediaCard(movie));
            });
        }
    });
}

function renderSeriesByGenre() {
    const container = document.getElementById('series-container');
    if (!container) return;
    
    container.innerHTML = '';

    allGenres.forEach(genre => {
        const seriesInGenre = currentSeries.filter(series => 
            series.genres && series.genres.includes(genre)
        ).slice(0, 10);

        if (seriesInGenre.length > 0) {
            const section = document.createElement('section');
            section.className = 'genre-section';
            section.innerHTML = `
                <h2><span>${genre}</span> <a href="#series-container" class="see-all">Ver todas</a></h2>
                <div class="carousel-container">
                    <div class="carousel-track" id="series-${genre.toLowerCase().replace(/\s+/g, '-')}"></div>
                </div>
            `;
            container.appendChild(section);

            const carousel = document.getElementById(`series-${genre.toLowerCase().replace(/\s+/g, '-')}`);
            seriesInGenre.forEach(series => {
                carousel.appendChild(createMediaCard(series));
            });
        }
    });
}

function createMediaCard(item) {
    const card = document.createElement('div');
    card.className = 'media-card';
    if (item.isNew) card.classList.add('new-item');

    const link = document.createElement('a');
    link.href = item.link;
    link.addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = item.link;
    });

    const imageContainer = document.createElement('div');
    imageContainer.className = 'image-container';
    
    const image = document.createElement('img');
    image.src = item.image;
    image.alt = item.title;
    image.loading = 'lazy';
    
    if (item.isNew) {
        const newBadge = document.createElement('div');
        newBadge.className = 'new-badge';
        newBadge.innerHTML = '<i class="fas fa-star"></i> NUEVO';
        imageContainer.appendChild(newBadge);
    }
    
    imageContainer.appendChild(image);
    link.appendChild(imageContainer);

    const info = document.createElement('div');
    info.className = 'card-info';

    const title = document.createElement('h3');
    title.textContent = item.title;

    const meta = document.createElement('div');
    meta.className = 'card-meta';
    
    const year = document.createElement('span');
    year.className = 'year';
    year.textContent = item.year;
    
    const genres = document.createElement('span');
    genres.className = 'genres';
    genres.textContent = item.genres.join(', ');

    meta.appendChild(year);
    meta.appendChild(genres);
    info.appendChild(title);
    info.appendChild(meta);
    card.appendChild(link);
    card.appendChild(info);

    return card;
}

function setupSearch() {
    const searchBtn = document.querySelector('.search-btn');
    if (searchBtn) {
        searchBtn.addEventListener('click', openSearch);
    }
}

function setupCategories() {
    const categoriesBtn = document.querySelector('.categories-btn');
    if (categoriesBtn) {
        categoriesBtn.addEventListener('click', toggleCategoriesMenu);
        createCategoriesMenu();
        
        const categoriesMenu = document.querySelector('.categories-menu');
        if (categoriesMenu) {
            const resetBtn = document.createElement('button');
            resetBtn.className = 'category-item reset-btn';
            resetBtn.textContent = 'Mostrar todo';
            resetBtn.addEventListener('click', resetToInitialContent);
            categoriesMenu.appendChild(resetBtn);
        }
    }
}

function setupOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    document.body.appendChild(overlay);
    
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            const searchContainer = document.querySelector('.search-container');
            if (searchContainer && searchContainer.classList.contains('search-active')) {
                closeSearch();
            }
            closeCategoriesMenu();
        }
    });
}

function createCategoriesMenu() {
    const categoriesMenu = document.createElement('div');
    categoriesMenu.className = 'categories-menu';
    
    allGenres.forEach(genre => {
        const btn = document.createElement('button');
        btn.className = 'category-item';
        btn.textContent = genre;
        btn.addEventListener('click', () => filterByGenre(genre));
        categoriesMenu.appendChild(btn);
    });
    
    document.body.appendChild(categoriesMenu);
}

function openSearch() {
    const searchContainer = document.querySelector('.search-container');
    const overlay = document.querySelector('.overlay');
    
    if (!searchContainer || !overlay) return;
    
    searchContainer.classList.add('search-active');
    searchContainer.innerHTML = `
        <div class="search-wrapper">
            <input type="text" class="search-input" placeholder="Buscar películas y series..." autocomplete="off">
            <button class="close-search">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="search-results-container">
            <div class="search-results"></div>
        </div>
    `;
    
    overlay.classList.add('active');
    
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.focus();
    }
    
    // Event listeners
    const closeBtn = document.querySelector('.close-search');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeSearch);
    }
    
    if (searchInput) {
        searchInput.addEventListener('input', handleSearchInput);
    }
    
    // Configurar scroll en resultados
    const resultsContainer = document.querySelector('.search-results-container');
    if (resultsContainer) {
        resultsContainer.addEventListener('wheel', function(e) {
            e.stopPropagation();
        }, { passive: true });
    }
}

function closeSearch() {
    const searchContainer = document.querySelector('.search-container');
    const overlay = document.querySelector('.overlay');
    
    if (!searchContainer || !overlay) return;
    
    searchContainer.classList.remove('search-active');
    searchContainer.innerHTML = `
        <button class="search-btn">
            <i class="fas fa-search"></i>
        </button>
    `;
    
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    
    // Restaurar event listener del botón de búsqueda
    const searchBtn = document.querySelector('.search-btn');
    if (searchBtn) {
        searchBtn.addEventListener('click', openSearch);
    }
}

function handleSearchInput(e) {
    const query = e.target.value.trim().toLowerCase();
    const resultsContainer = document.querySelector('.search-results');
    
    if (!resultsContainer) return;
    
    if (query.length > 0) {
        const allMedia = [...moviesData, ...seriesData];
        const matches = allMedia.filter(item => {
            const titleMatch = item.title && item.title.toLowerCase().includes(query);
            
            let genreMatch = false;
            if (item.genres && Array.isArray(item.genres)) {
                genreMatch = item.genres.some(g => 
                    g && g.toLowerCase().includes(query)
                );
            }
            
            return titleMatch || genreMatch;
        });
        
        resultsContainer.innerHTML = '';
        
        if (matches.length === 0) {
            resultsContainer.innerHTML = '<div class="no-results">No se encontraron resultados</div>';
        } else {
            matches.slice(0, 20).forEach(item => {
                const resultItem = document.createElement('div');
                resultItem.className = 'search-result-item';
                
                const link = document.createElement('a');
                link.href = item.link;
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    closeSearch();
                    window.location.href = item.link;
                });
                
                const genresText = item.genres && Array.isArray(item.genres) 
                    ? item.genres.join(', ') 
                    : '';
                
                link.innerHTML = `
                    <img src="${item.image}" alt="${item.title}" loading="lazy">
                    <div class="result-info">
                        <h4>${item.title}</h4>
                        <span>${item.year} • ${genresText}</span>
                    </div>
                `;
                
                resultItem.appendChild(link);
                resultsContainer.appendChild(resultItem);
            });
            
            if (matches.length > 20) {
                const moreResults = document.createElement('div');
                moreResults.className = 'no-results';
                moreResults.textContent = `Mostrando 20 de ${matches.length} resultados`;
                resultsContainer.appendChild(moreResults);
            }
        }
    } else {
        resultsContainer.innerHTML = '<div class="no-results">Escribe para buscar</div>';
    }
}

function toggleCategoriesMenu() {
    const categoriesMenu = document.querySelector('.categories-menu');
    const overlay = document.querySelector('.overlay');
    
    if (!categoriesMenu || !overlay) return;
    
    categoriesMenu.classList.toggle('active');
    overlay.classList.toggle('active');
}

function closeAllMenus() {
    closeSearch();
    closeCategoriesMenu();
}

function closeCategoriesMenu() {
    const categoriesMenu = document.querySelector('.categories-menu');
    const overlay = document.querySelector('.overlay');
    
    if (!categoriesMenu || !overlay) return;
    
    categoriesMenu.classList.remove('active');
    overlay.classList.remove('active');
}

function filterByGenre(genre) {
    currentMovies = moviesData.filter(movie => 
        movie.genres && movie.genres.includes(genre)
    );
    currentSeries = seriesData.filter(series => 
        series.genres && series.genres.includes(genre)
    );
    renderContent();
    closeCategoriesMenu();
}

function resetToInitialContent() {
    currentMovies = [...moviesData];
    currentSeries = [...seriesData];
    renderContent();
    closeCategoriesMenu();
}