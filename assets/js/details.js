// Configuración global
// details.js
import { moviesData, seriesData } from './data.js';
const TMDB = {
    API_KEY: '995449ccaf6d840acc029f95c7d210dd', // Reemplaza con tu API key
    BASE_URL: 'https://api.themoviedb.org/3',
    YOUTUBE_URL: 'https://www.youtube.com/embed/',
    IMAGE_URL: 'https://image.tmdb.org/t/p/w300',
    LANGUAGE: 'es-MX'
};

// Función principal
document.addEventListener('DOMContentLoaded', async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    const id = urlParams.get('id');
    
    if (!type || !id) {
        return showError('URL inválida. Faltan parámetros type o id.');
    }
    
    // Verificar si el ID existe en nuestros datos
    const localData = getMediaByIdAndType(id, type);
    if (!localData) {
        return showError('Este contenido no está disponible en nuestro catálogo.');
    }
    
    try {
        showLoadingState();
        
        // Cargar detalles y tráiler desde TMDB
        const [details, videos] = await Promise.all([
            fetchTMDB(`${type}/${id}`),
            fetchTMDB(`${type}/${id}/videos`)
        ]);
        
        // Renderizar con los datos combinados (API + locales)
        renderMediaDetails({...details, ...localData}, videos.results);
        setupPlayButton(getTrailerKey(videos.results));
        
        // Obtener similares disponibles en nuestro catálogo
        const availableSimilar = getAvailableSimilar(id, type);
        renderSimilarMedia(availableSimilar);
        
    } catch (error) {
        console.error('Error:', error);
        // Usar datos locales como fallback
        renderMediaDetails(localData, []);
        const availableSimilar = getAvailableSimilar(id, type);
        renderSimilarMedia(availableSimilar);
        showError('Error al cargar detalles adicionales. Mostrando información básica.');
    }
});

// Función para hacer requests a TMDB
async function fetchTMDB(endpoint) {
    const url = `${TMDB.BASE_URL}/${endpoint}?api_key=${TMDB.API_KEY}&language=${TMDB.LANGUAGE}`;
    const response = await fetch(url);
    
    if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
}

// Función para renderizar los detalles principales
function renderMediaDetails(details, videos) {
    // Actualizar texto
    document.getElementById('media-title').textContent = details.title || details.name;
    document.getElementById('media-rating').textContent = details.vote_average?.toFixed(1) || 'N/A';
    document.getElementById('media-year').textContent = details.year || getYear(details);
    document.getElementById('media-duration').textContent = getDuration(details);
    document.getElementById('media-synopsis').textContent = details.overview || 'Sin sinopsis disponible.';
    
    // Configurar tráiler
    const trailerKey = getTrailerKey(videos);
    const trailerContainer = document.getElementById('trailer-container');
    
    if (trailerKey) {
        trailerContainer.innerHTML = `
            <iframe src="${TMDB.YOUTUBE_URL}${trailerKey}?autoplay=0&controls=1&showinfo=0&rel=0" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen></iframe>
        `;
    } else {
        trailerContainer.innerHTML = `
            <div class="trailer-placeholder">
                <i class="fas fa-film"></i>
                <p>Tráiler no disponible</p>
            </div>
        `;
    }
}

// Función para renderizar títulos similares
function renderSimilarMedia(similarItems) {
    const similarCarousel = document.getElementById('similar-carousel');
    similarCarousel.innerHTML = '';
    
    if (similarItems.length === 0) {
        similarCarousel.innerHTML = '<p class="no-similar">No hay títulos similares disponibles</p>';
        return;
    }
    
    similarItems.forEach(item => {
        const card = document.createElement('div');
        card.className = 'media-card similar-card';
        
        const link = document.createElement('a');
        link.href = item.link;
        
        const image = document.createElement('img');
        image.src = item.image;
        image.alt = item.title;
        image.loading = 'lazy';
        
        const info = document.createElement('div');
        info.className = 'card-info';
        
        const title = document.createElement('h3');
        title.textContent = item.title;
        
        const year = document.createElement('p');
        year.className = 'year';
        year.textContent = item.year;
        
        info.appendChild(title);
        info.appendChild(year);
        link.appendChild(image);
        card.appendChild(link);
        card.appendChild(info);
        
        similarCarousel.appendChild(card);
    });
}

// Función para configurar el botón de reproducción
function setupPlayButton() {
    const playBtn = document.querySelector('.play-btn');
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    const id = urlParams.get('id');
    
    playBtn.disabled = false;
    playBtn.innerHTML = '<i class="fas fa-play"></i> Reproducir';
    
    playBtn.addEventListener('click', () => {
        if (type === 'movie') {
            window.location.href = `player.html?type=movie&id=${id}`;
        } else if (type === 'tv') {
            // Para series, redirigir al primer episodio de la primera temporada
            window.location.href = `player.html?type=tv&id=${id}&season=1&episode=1`;
        }
    });
}

// Función para obtener el key del tráiler principal
function getTrailerKey(videos) {
    if (!videos || videos.length === 0) return null;
    
    // Preferir tráiler oficial en español
    const trailer = videos.find(video => 
        video.type === 'Trailer' && 
        (video.iso_639_1 === 'es' || video.iso_639_1 === 'en')
    );
    
    return trailer ? trailer.key : videos[0].key;
}

// Función para extraer el año de lanzamiento
function getYear(media) {
    if (media.release_date) {
        return media.release_date.split('-')[0];
    } else if (media.first_air_date) {
        const startYear = media.first_air_date.split('-')[0];
        const endYear = media.last_air_date?.split('-')[0];
        return endYear ? `${startYear}-${endYear}` : startYear;
    }
    return 'N/A';
}

// Función para formatear la duración
function getDuration(media) {
    if (media.runtime) {
        const hours = Math.floor(media.runtime / 60);
        const mins = media.runtime % 60;
        return `${hours}h ${mins}m`;
    } else if (media.episode_run_time?.length > 0) {
        return `${media.episode_run_time[0]}m/ep`;
    }
    return '';
}

// Función para mostrar estado de carga
function showLoadingState() {
    document.getElementById('media-title').textContent = 'Cargando...';
    document.querySelector('.play-btn').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cargando';
}

// Función para mostrar errores
function showError(message = 'Ocurrió un error al cargar el contenido.') {
    const main = document.querySelector('main');
    main.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            <h2>Error</h2>
            <p>${message}</p>
            <a href="index.html" class="back-home">Volver al inicio</a>
        </div>
    `;
}

// Funciones para acceder a los datos locales desde data.js
function getMediaByIdAndType(id, type) {
    const collection = type === 'movie' ? moviesData : seriesData;
    return collection.find(item => item.id.toString() === id.toString());
}

function getAvailableSimilar(currentId, currentType) {
    const allMedia = [...moviesData, ...seriesData];
    return allMedia
        .filter(item => 
            item.id.toString() !== currentId.toString() && 
            (currentType === 'movie' ? moviesData : seriesData).some(m => m.id === item.id)
        )
        .sort(() => 0.5 - Math.random())
        .slice(0, 5);
}