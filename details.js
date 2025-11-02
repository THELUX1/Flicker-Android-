import { moviesData, seriesData, getAvailableSimilar } from './data.js';
import { moviesLinks } from './movies-links.js';

// Elementos DOM
const backBtn = document.getElementById('back-btn');
const loading = document.getElementById('loading');
const detailsContainer = document.getElementById('details-container');
const similarContainer = document.getElementById('similar-container');
const notification = document.getElementById('notification');
const notificationText = document.getElementById('notification-text');

// API de TMDB
const API_KEY = '995449ccaf6d840acc029f95c7d210dd';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

// Obtener parámetros de la URL
const urlParams = new URLSearchParams(window.location.search);
const type = urlParams.get('type');
const id = urlParams.get('id');

// Inicializar la página de detalles
document.addEventListener('DOMContentLoaded', () => {
    if (!type || !id) {
        showError('Parámetros de URL inválidos');
        return;
    }
    
    loadMediaDetails();
    setupEventListeners();
});

// Configurar event listeners
function setupEventListeners() {
    backBtn.addEventListener('click', () => {
        window.history.back();
    });
}

// Cargar detalles del medio (película o serie)
async function loadMediaDetails() {
    try {
        // Primero buscar en nuestros datos locales
        const localData = type === 'movie' 
            ? moviesData.find(movie => movie.id.toString() === id)
            : seriesData.find(series => series.id.toString() === id);
        
        if (!localData) {
            showError('Contenido no encontrado');
            return;
        }
        
        // Luego obtener datos adicionales de TMDB
        const endpoint = type === 'movie' ? `/movie/${id}` : `/tv/${id}`;
        const response = await fetch(`${BASE_URL}${endpoint}?api_key=${API_KEY}&language=es-ES&append_to_response=videos,credits`);
        
        if (!response.ok) {
            throw new Error('Error al cargar detalles');
        }
        
        const tmdbData = await response.json();
        
        // Combinar datos locales con datos de TMDB
        const mediaDetails = {
            ...localData,
            ...tmdbData
        };
        
        renderMediaDetails(mediaDetails);
        loadSimilarContent();
        
    } catch (error) {
        console.error('Error al cargar detalles:', error);
        // Mostrar datos locales aunque falle la API
        const localData = type === 'movie' 
            ? moviesData.find(movie => movie.id.toString() === id)
            : seriesData.find(series => series.id.toString() === id);
        
        if (localData) {
            renderMediaDetails(localData);
            loadSimilarContent();
        } else {
            showError('Error al cargar detalles');
        }
    }
}

// Renderizar detalles del medio
function renderMediaDetails(details) {
    loading.style.display = 'none';
    detailsContainer.style.display = 'block';
    
    // Verificar si la película está disponible para reproducir
    const movieLinks = type === 'movie' ? moviesLinks[id] : null;
    const hasMovieSource = movieLinks && movieLinks.sources && movieLinks.sources.length > 0;
    
    // Encontrar el trailer (si existe)
    const trailer = details.videos?.results?.find(video => 
        video.type === 'Trailer' && video.site === 'YouTube'
    );
    
    // Formatear fecha de lanzamiento
    const releaseDate = type === 'movie' 
        ? details.release_date 
        : details.first_air_date;
    const formattedDate = releaseDate ? new Date(releaseDate).toLocaleDateString('es-ES') : 'Próximamente';
    
    // Construir el HTML
    detailsContainer.innerHTML = `
        <div class="details-hero">
            ${details.backdrop_path ? `
                <img src="${IMAGE_BASE_URL}/w1280${details.backdrop_path}" alt="${details.title}" class="details-backdrop">
            ` : `
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); height: 100%;"></div>
            `}
            <div class="details-hero-overlay"></div>
            
            <!-- Botón de reproducir en el centro del hero -->
            <div class="hero-play-btn-container">
                <button class="hero-play-btn ${!hasMovieSource ? 'disabled' : ''}" 
                        id="hero-play-btn" 
                        ${!hasMovieSource ? 'disabled' : ''}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 5V19L19 12L8 5Z" fill="currentColor"/>
                    </svg>
                    ${hasMovieSource ? 'Reproducir' : 'No disponible'}
                </button>
            </div>
        </div>
        
        <div class="details-content">
            <div class="details-poster-container">
                <img src="${details.poster_path ? IMAGE_BASE_URL + '/w500' + details.poster_path : details.image}" 
                     alt="${details.title}" class="details-poster">
            </div>
            
            <div class="details-main-info">
                <h1 class="details-title">${details.title || details.name}</h1>
                
                <div class="details-meta">
                    <span class="details-year">${details.year || formattedDate.split('-')[0]}</span>
                    ${details.runtime ? `<span class="details-runtime">${formatRuntime(details.runtime)}</span>` : ''}
                    ${details.vote_average ? `
                        <span class="details-rating">
                            <span class="rating-star">★</span>
                            ${details.vote_average.toFixed(1)}
                        </span>
                    ` : ''}
                </div>
                
                ${details.genres && details.genres.length > 0 ? `
                    <div class="details-genres">
                        ${details.genres.map(genre => 
                            `<span class="details-genre">${typeof genre === 'string' ? genre : genre.name}</span>`
                        ).join('')}
                    </div>
                ` : ''}
                
                <!-- Botón de reproducir secundario (para móviles con pantalla pequeña) -->
                <div class="secondary-play-btn-container">
                    <button class="secondary-play-btn ${!hasMovieSource ? 'disabled' : ''}" 
                            id="secondary-play-btn" 
                            ${!hasMovieSource ? 'disabled' : ''}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8 5V19L19 12L8 5Z" fill="currentColor"/>
                        </svg>
                        ${hasMovieSource ? 'Reproducir' : 'No disponible'}
                    </button>
                </div>
                
                ${details.overview ? `
                    <div class="details-section">
                        <h2 class="details-section-title">Sinopsis</h2>
                        <p class="details-overview">${details.overview}</p>
                    </div>
                ` : ''}
                
                ${trailer ? `
                    <div class="details-section">
                        <h2 class="details-section-title">Tráiler</h2>
                        <div class="trailer-container">
                            <iframe class="trailer-iframe" 
                                    src="https://www.youtube.com/embed/${trailer.key}" 
                                    frameborder="0" 
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                    allowfullscreen>
                            </iframe>
                        </div>
                    </div>
                ` : ''}
                
                ${details.credits && details.credits.cast && details.credits.cast.length > 0 ? `
                    <div class="details-section">
                        <h2 class="details-section-title">Reparto</h2>
                        <div class="cast-container">
                            ${details.credits.cast.slice(0, 10).map(actor => `
                                <div class="cast-member">
                                    <img src="${actor.profile_path ? IMAGE_BASE_URL + '/w185' + actor.profile_path : 'https://via.placeholder.com/100x100/2a2a2a/666666?text=?'}" 
                                         alt="${actor.name}" class="cast-photo">
                                    <p class="cast-name">${actor.name}</p>
                                    <p class="cast-character">${actor.character}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
    
    // Agregar event listeners a los botones de reproducir
    const heroPlayBtn = document.getElementById('hero-play-btn');
    const secondaryPlayBtn = document.getElementById('secondary-play-btn');
    
    if (heroPlayBtn && !heroPlayBtn.disabled) {
        heroPlayBtn.addEventListener('click', handlePlayButton);
    }
    
    if (secondaryPlayBtn && !secondaryPlayBtn.disabled) {
        secondaryPlayBtn.addEventListener('click', handlePlayButton);
    }
}

// Manejar clic en el botón de reproducir
function handlePlayButton() {
    const movieLinks = moviesLinks[id];
    
    if (movieLinks && movieLinks.sources && movieLinks.sources.length > 0) {
        // Redirigir al reproductor
        window.location.href = `reproductor.html?id=${id}`;
    } else {
        // Mostrar notificación de no disponible
        showNotification('Esta película no está disponible en este momento');
    }
}

// Cargar contenido similar
function loadSimilarContent() {
    const similarItems = getAvailableSimilar(id, type);
    
    if (similarItems.length === 0) {
        similarContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No hay contenido similar disponible</p>';
        return;
    }
    
    similarContainer.innerHTML = '';
    
    similarItems.forEach(item => {
        const similarCard = document.createElement('div');
        similarCard.className = 'similar-card';
        similarCard.addEventListener('click', () => {
            window.location.href = item.link;
        });
        
        similarCard.innerHTML = `
            <img src="${item.image}" alt="${item.title}" class="similar-image">
            <div class="similar-info">
                <h3 class="similar-title">${item.title}</h3>
                <p class="similar-year">${item.year}</p>
            </div>
        `;
        
        similarContainer.appendChild(similarCard);
    });
}

// Formatear duración en minutos a formato legible
function formatRuntime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) {
        return `${mins}m`;
    }
    
    return `${hours}h ${mins}m`;
}

// Mostrar error
function showError(message) {
    loading.style.display = 'none';
    detailsContainer.style.display = 'block';
    detailsContainer.innerHTML = `
        <div style="text-align: center; padding: 3rem;">
            <h2 style="color: var(--text-secondary); margin-bottom: 1rem;">${message}</h2>
            <button onclick="window.history.back()" style="background: var(--primary-color); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: var(--border-radius); cursor: pointer;">
                Volver
            </button>
        </div>
    `;
}

// Mostrar notificación flotante
function showNotification(message) {
    // Crear notificación si no existe
    let notification = document.getElementById('notification');
    let notificationText = document.getElementById('notification-text');
    
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.className = 'notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background-color: var(--primary-color);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: var(--border-radius);
            z-index: 1000;
            box-shadow: var(--shadow);
            animation: slideDown 0.3s ease-out;
        `;
        
        notificationText = document.createElement('span');
        notificationText.id = 'notification-text';
        notification.appendChild(notificationText);
        
        document.body.appendChild(notification);
        
        // Agregar animación CSS
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideDown {
                from {
                    opacity: 0;
                    transform: translateX(-50%) translateY(-20px);
                }
                to {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    notificationText.textContent = message;
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}