import { hiddenMovies, manualMovies, accionMovies, dramaMovies } from './moviesData.js';
import { profileManager } from './profileManager.js';
import UserTracker from './userTracking.js';

const DEBUG_MODE = false;
let movieAddOrder = 0;
let currentRecommendations = [];

function classifyMoviesByGenre(movies, isManual = false) {
    movies.forEach(movie => {
        movie.addOrder = movieAddOrder++;
        if (movie.genres) {
            movie.genres.forEach(genre => {
                if (!genreCategories[genre]) {
                    genreCategories[genre] = [];
                }
                if (isManual) {
                    genreCategories[genre].unshift(movie);
                } else {
                    genreCategories[genre].push(movie);
                }
            });
        }
    });
}

const genreCategories = {};
classifyMoviesByGenre(manualMovies, true);
classifyMoviesByGenre(accionMovies);
classifyMoviesByGenre(dramaMovies);
classifyMoviesByGenre(hiddenMovies);

function getUniqueMovies(movieLists) {
    const uniqueMovies = [];
    const seenIds = new Set();
    
    movieLists.forEach(list => {
        list.forEach(movie => {
            if (!seenIds.has(movie.id)) {
                seenIds.add(movie.id);
                uniqueMovies.push(movie);
            }
        });
    });
    
    return uniqueMovies;
}

function generarContenido(container, forceRefresh = false) {
    if (forceRefresh) {
        UserTracker.refreshRecommendations();
    }

    const continueWatchingMovies = getContinueWatchingMovies();
    const allMovies = [...manualMovies, ...accionMovies, ...dramaMovies, ...hiddenMovies];
    const currentProfile = profileManager.getCurrentProfile();
    
    const baseCategories = {
        "🎬 Novedades": [...manualMovies].slice(0, 12),
        "💥 Acción y Aventura": getUniqueMovies([
            accionMovies,
            allMovies.filter(m => m.genres?.includes("Aventura"))
        ]).slice(0, 12),
        "🎭 Drama y Romance": getUniqueMovies([
            dramaMovies,
            allMovies.filter(m => m.genres?.includes("Romance"))
        ]).slice(0, 12)
    };

    const personalizedCategories = {};
    const trackingData = UserTracker.getTrackingData();
    const hasViewingHistory = currentProfile && UserTracker.hasSufficientHistory();
    
    if (hasViewingHistory) {
        currentRecommendations = UserTracker.getRecommendedMovies(allMovies);
        
        if (currentRecommendations.length > 0) {
            personalizedCategories["🌟 Para ti"] = currentRecommendations;
            const recommendedIds = new Set(currentRecommendations.map(m => m.id));

            const newInGenres = allMovies.filter(movie => {
                const isNew = movie.year && (movie.year == new Date().getFullYear() || 
                                           movie.year == new Date().getFullYear() - 1);
                const hasFavoriteGenre = movie.genres?.some(g => 
                    UserTracker.getTopGenres().includes(g));
                return isNew && hasFavoriteGenre && !recommendedIds.has(movie.id);
            }).slice(0, 8);

            if (newInGenres.length > 0) {
                personalizedCategories["✨ Novedades en tus gustos"] = newInGenres;
            }
        }

        const topGenres = UserTracker.getTopGenres(3, 'likes');
        topGenres.forEach(genre => {
            const genreMovies = allMovies.filter(movie => 
                movie.genres?.includes(genre) &&
                !trackingData.viewedMovies.includes(movie.id)
            ).slice(0, 8);
            
            if (genreMovies.length > 0) {
                personalizedCategories[`🎭 Más ${genre}`] = genreMovies;
            }
        });
    }

    const allCategories = {
        ...(continueWatchingMovies.length > 0 ? {"▶️ Continúa viendo": continueWatchingMovies} : {}),
        ...(hasViewingHistory ? personalizedCategories : {}),
        ...baseCategories,
        ...Object.fromEntries(
            Object.entries(genreCategories)
                .filter(([genre]) => !personalizedCategories[`🎭 Más ${genre}`])
                .map(([genre, movies]) => [`🎭 ${genre}`, movies.slice(0, 8)])
        )
    };

    const categoryOrder = [
        "▶️ Continúa viendo",
        "🌟 Para ti",
        "✨ Novedades en tus gustos",
        ...Object.keys(personalizedCategories)
            .filter(k => k !== "🌟 Para ti" && k !== "✨ Novedades en tus gustos"),
        ...Object.keys(baseCategories),
        ...Object.keys(genreCategories)
            .filter(genre => !personalizedCategories[`🎭 Más ${genre}`])
            .map(genre => `🎭 ${genre}`)
    ];

    container.innerHTML = categoryOrder
        .filter(category => allCategories[category]?.length > 0)
        .map(category => generateCategorySection(category, allCategories[category]))
        .join('');

    setupRemoveButtons();
    setupLazyLoading();
    if (hasViewingHistory) {
        setupRecommendationTooltips();
        highlightNewRecommendations();
    }
}

// Generar sección de categoría
function generateCategorySection(category, items) {
    const isPersonalized = category === "Para ti" || 
                         category.startsWith("Similar") || 
                         category.startsWith("Más") ||
                         category.startsWith("Con tus") ||
                         category.startsWith("Dirigida");
    
    const titleClass = isPersonalized ? 'personalized' : '';
    const icon = isPersonalized ? '<i class="fas fa-user-circle"></i> ' : '';
    const isContinueWatching = category === "Continúa viendo";
    
    return `
        <section class="movie-section">
            <h2 class="section-title ${titleClass}">${icon}${category}</h2>
            <div class="movies-container ${isContinueWatching ? 'continue-watching' : ''}">
                ${items.length > 0 ? items.map(item => createMovieCard(item)).join('') : '<p class="no-movies">No hay películas disponibles.</p>'}
            </div>
        </section>
    `;
}

// Crear tarjeta de película
function createMovieCard(movie) {
    // Calcular el porcentaje de progreso
    let progressPercentage = 0;
    let showProgress = false;
    
    if (movie.progress && movie.duration) {
        const maxValidProgress = movie.duration * 0.99;
        const validProgress = Math.min(movie.progress, maxValidProgress);
        progressPercentage = (validProgress / movie.duration) * 100;
        showProgress = true;
    }

    const isRecommended = movie.reasons && movie.reasons.length > 0;
    const recommendationAttrs = isRecommended ? 
        `data-reasons='${JSON.stringify(movie.reasons)}' data-score="${movie.recommendationScore}"` : '';

    const progressBar = showProgress ? `
        <div class="continue-progress" data-progress="${Math.round(progressPercentage)}%">
            <div class="continue-progress-bar" style="width: ${progressPercentage}%"></div>
        </div>
    ` : '';

    const removeButton = showProgress ? `
        <button class="remove-button" data-media-id="${movie.id}" data-media-type="movie" aria-label="Eliminar de Continuar viendo">
            <i class="fas fa-trash"></i>
        </button>
    ` : '';

    const nearEndBadge = (progressPercentage > 80 && progressPercentage <= 95) ? `
        <div class="near-end-badge">Casi terminada</div>
    ` : '';

    const recommendationBadge = isRecommended ? `
        <div class="recommendation-badge" title="Recomendado para ti">
            <i class="fas fa-star"></i>
        </div>
    ` : '';

    return `
        <div class="movie-card ${isRecommended ? 'recommended' : ''}" 
             data-media-id="${movie.id}" data-media-type="movie" ${recommendationAttrs}>
            <a href="${movie.link || `detalles.html?type=movie&id=${movie.id}`}" class="movie-link">
                <div class="movie-image-container">
                    <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 450'%3E%3C/svg%3E" 
                         data-src="${movie.image}" 
                         alt="${movie.title}" 
                         loading="lazy"
                         class="lazy-image">
                    ${nearEndBadge}
                    ${recommendationBadge}
                </div>
                <div class="movie-info">
                    <div class="movie-title">${movie.title}</div>
                    ${movie.year ? `<div class="movie-year">${movie.year}</div>` : ''}
                </div>
                ${progressBar}
            </a>
            ${removeButton}
        </div>
    `;
}

// Configurar tooltips de recomendaciones
function setupRecommendationTooltips() {
    document.querySelectorAll('.movie-card[data-reasons]').forEach(card => {
        const reasons = JSON.parse(card.getAttribute('data-reasons'));
        const tooltip = document.createElement('div');
        tooltip.className = 'recommendation-tooltip';
        tooltip.innerHTML = `<strong>Similar:</strong> ${reasons.join('<br>• ')}`;
        card.appendChild(tooltip);
        
        card.addEventListener('mouseenter', () => {
            tooltip.style.visibility = 'visible';
            tooltip.style.opacity = '1';
        });
        
        card.addEventListener('mouseleave', () => {
            tooltip.style.visibility = 'hidden';
            tooltip.style.opacity = '0';
        });
    });
}

// Resaltar recomendaciones nuevas
function highlightNewRecommendations() {
    const lastVisit = localStorage.getItem('lastHomeVisit') || 0;
    const now = Date.now();
    
    document.querySelectorAll('.movie-card.recommended').forEach(card => {
        const movieId = card.getAttribute('data-media-id');
        const movie = [...manualMovies, ...accionMovies, ...dramaMovies].find(m => m.id == movieId);
        
        if (movie && movie.addOrder * 1000 > lastVisit) {
            card.classList.add('highlight');
        }
    });
    
    localStorage.setItem('lastHomeVisit', now);
}

// Configurar carga diferida de imágenes
function setupLazyLoading() {
    const lazyImages = document.querySelectorAll('.lazy-image');
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy-image');
                    img.classList.add('loaded-image');
                    observer.unobserve(img);
                }
            });
        }, {
            rootMargin: '200px 0px',
            threshold: 0.1
        });

        lazyImages.forEach(img => {
            imageObserver.observe(img);
        });
    } else {
        lazyImages.forEach(img => {
            img.src = img.dataset.src;
            img.classList.remove('lazy-image');
            img.classList.add('loaded-image');
        });
    }
}

// Obtener películas "Continúa viendo"
function getContinueWatchingMovies() {
    const continueWatching = [];
    const currentProfile = profileManager.getCurrentProfile();
    
    if (!currentProfile) return continueWatching;

    const now = Date.now();
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        
        if (key.startsWith(`profile_${currentProfile.id}_progress_`)) {
            const movieId = key.split('_')[3];
            const currentTime = parseFloat(localStorage.getItem(key));
            const movie = [...manualMovies, ...accionMovies, ...dramaMovies].find(m => m.id == movieId);
            
            if (movie && currentTime > 0) {
                continueWatching.push({
                    ...movie,
                    progress: currentTime,
                    duration: 120 * 60, // Duración por defecto (2 horas)
                    type: 'movie'
                });
            }
        }
    }
    
    // Ordenar por último visto
    return continueWatching.sort((a, b) => {
        const aKey = `profile_${currentProfile.id}_progress_${a.id}`;
        const bKey = `profile_${currentProfile.id}_progress_${b.id}`;
        const aTimestamp = localStorage.getItem(aKey + '_timestamp') || 0;
        const bTimestamp = localStorage.getItem(bKey + '_timestamp') || 0;
        
        return bTimestamp - aTimestamp;
    });
}

// Mostrar modal de confirmación
function showConfirmModal(title, callback) {
    const modal = document.getElementById('confirm-modal');
    const confirmMessage = document.getElementById('confirm-message');
    const confirmYes = document.getElementById('confirm-yes');
    const confirmNo = document.getElementById('confirm-no');

    if (modal) {
        modal.style.zIndex = '1000';
        modal.style.display = 'flex';
        modal.setAttribute('aria-hidden', 'false');
    }

    if (confirmMessage) {
        confirmMessage.innerHTML = `
            <p>¿Eliminar <strong>"${title}"</strong> de tu lista de progreso?</p>
            <small>Esto borrará todos los datos de reproducción guardados.</small>
        `;
    }

    const cleanUpEvents = () => {
        if (confirmYes) confirmYes.onclick = null;
        if (confirmNo) confirmNo.onclick = null;
        document.onkeydown = null;
    };

    if (confirmYes) {
        confirmYes.onclick = () => {
            cleanUpEvents();
            modal.style.display = 'none';
            modal.setAttribute('aria-hidden', 'true');
            callback(true);
        };
    }

    if (confirmNo) {
        confirmNo.onclick = () => {
            cleanUpEvents();
            modal.style.display = 'none';
            modal.setAttribute('aria-hidden', 'true');
            callback(false);
        };
    }

    document.onkeydown = (e) => {
        if (e.key === 'Escape') {
            cleanUpEvents();
            modal.style.display = 'none';
            modal.setAttribute('aria-hidden', 'true');
            callback(false);
        }
    };
}

// Configurar botones de eliminación
function setupRemoveButtons() {
    document.querySelectorAll('.remove-button').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const movieId = button.getAttribute('data-media-id');
            const movie = [...manualMovies, ...accionMovies, ...dramaMovies]
                         .find(m => m.id == movieId);

            if (!movie) return;

            showConfirmModal(movie.title, (confirmed) => {
                if (confirmed) {
                    const card = button.closest('.movie-card');
                    if (card) {
                        card.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
                        card.style.transform = 'scale(0.8)';
                        card.style.opacity = '0';
                        
                        setTimeout(() => {
                            card.remove();
                            removeFromContinueWatching(movieId, 'movie');
                        }, 300);
                    }
                }
            });
        });
    });
}

// Eliminar de "Continúa viendo"
function removeFromContinueWatching(movieId, mediaType) {
    const currentProfile = profileManager.getCurrentProfile();
    if (!currentProfile) return;
    
    localStorage.removeItem(`profile_${currentProfile.id}_progress_${movieId}`);
    sessionStorage.setItem(`deleted_${movieId}`, 'true');
    showToast(`Película eliminada de "Continúa viendo"`, 'success');
}

// Mostrar notificación toast
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Buscar películas
function searchMovies(query) {
    const normalizedQuery = query
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

    const results = [...manualMovies, ...accionMovies, ...dramaMovies, ...hiddenMovies].filter(movie => {
        const normalizedTitle = movie.title
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();
        
        return normalizedTitle.includes(normalizedQuery) ||
               movie.year?.toString().includes(query) ||
               (movie.genres && movie.genres.some(g => g.toLowerCase().includes(normalizedQuery)));
    });

    // Eliminar duplicados y ordenar por coincidencia exacta primero
    const uniqueResults = [];
    const seenIds = new Set();
    
    results.forEach(movie => {
        if (!seenIds.has(movie.id)) {
            seenIds.add(movie.id);
            
            const titleMatch = movie.title.toLowerCase() === query.toLowerCase();
            if (titleMatch) {
                uniqueResults.unshift(movie);
            } else {
                uniqueResults.push(movie);
            }
        }
    });
    
    return uniqueResults;
}

// Mostrar resultados de búsqueda
function displayResults(results) {
    const searchResults = document.querySelector('.search-results');
    searchResults.innerHTML = '';

    if (results.length === 0) {
        searchResults.innerHTML = '<div class="no-results">No se encontraron resultados</div>';
        searchResults.style.display = 'block';
        return;
    }

    results.forEach(movie => {
        const itemElement = document.createElement('div');
        itemElement.className = 'search-result-item';
        
        itemElement.innerHTML = `
            <img src="${movie.image}" alt="${movie.title}" loading="lazy">
            <div class="search-result-info">
                <h3><i class="fas fa-film" style="margin-right: 5px;"></i>${movie.title}</h3>
                ${movie.year ? `<p>${movie.year}</p>` : ''}
                <p class="search-result-type">Película</p>
                ${movie.genres ? `<div class="search-result-genres">${movie.genres.slice(0, 2).join(' • ')}</div>` : ''}
            </div>
        `;
        
        itemElement.addEventListener('click', () => {
            const currentProfile = profileManager.getCurrentProfile();
            if (currentProfile) {
                localStorage.setItem(`profile_${currentProfile.id}_lastViewed`, movie.id);
            }
            window.location.href = movie.link || `detalles.html?type=movie&id=${movie.id}`;
        });
        
        searchResults.appendChild(itemElement);
    });

    searchResults.style.display = 'block';
}

// Configurar búsqueda
function setupSearch() {
    const searchIconButton = document.querySelector('.search-icon-button');
    const searchWrapper = document.querySelector('.search-wrapper');
    const searchInput = document.querySelector('.search-input');
    const searchButton = document.querySelector('.search-button.close-search');
    const searchResults = document.querySelector('.search-results');
    let searchTimeout;

    searchIconButton?.addEventListener('click', (e) => {
        e.preventDefault();
        searchWrapper.style.display = 'flex';
        searchInput.focus();
    });

    searchButton?.addEventListener('click', (e) => {
        e.preventDefault();
        hideSearch();
    });

    document.addEventListener('click', (e) => {
        const isClickInsideSearch = searchWrapper.contains(e.target) || searchIconButton.contains(e.target);
        if (!isClickInsideSearch && searchInput.value.trim() === '' && searchResults.innerHTML === '') {
            hideSearch();
        }
    });

    searchInput?.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim().toLowerCase();

        if (query.length === 0) {
            clearSearch();
            return;
        }

        searchTimeout = setTimeout(() => {
            const results = searchMovies(query);
            displayResults(results);
        }, 300);
    });

    function hideSearch() {
        searchWrapper.style.display = 'none';
        clearSearch();
    }

    function clearSearch() {
        searchInput.value = '';
        searchResults.innerHTML = '';
        searchResults.style.display = 'none';
    }
}

// Configurar actualización de recomendaciones
function setupRecommendationUpdates() {
    profileManager.onProfileChange(() => {
        generarContenido(document.getElementById('content'), true);
    });
    
    window.addEventListener('recommendationsUpdated', () => {
        generarContenido(document.getElementById('content'), true);
    });
    
    setInterval(() => {
        generarContenido(document.getElementById('content'), true);
    }, 30000);
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    UserTracker.init();
    const content = document.getElementById('content');
    if (content) generarContenido(content);

    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'none';

    setupSearch();
    setupRecommendationUpdates();
    localStorage.setItem('lastHomeVisit', Date.now());
});

export { 
    generarContenido, 
    setupSearch, 
    createMovieCard,
    getContinueWatchingMovies,
    removeFromContinueWatching,
    showToast
};