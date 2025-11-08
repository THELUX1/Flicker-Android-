const TMDB_API_KEY = "995449ccaf6d840acc029f95c7d210dd";
// const BASE_URL = "https://raw.githubusercontent.com/THELUX1/Flicker-Android-/main/";
const DATA_URL = `./data.json?nocache=${Date.now()}`;
const MOVIES_LINKS_URL = `./movies-links.json?nocache=${Date.now()}`;

let allMovies = [];
let currentSearchTerm = '';
let moviesLinksData = {};
let isInDetailsView = false;

// Variables simplificadas para carouseles
let carousels = {};

// Función para alternar la visibilidad del buscador
function toggleSearch() {
  const searchContainer = document.getElementById('searchContainer');
  const isActive = searchContainer.classList.contains('active');
  
  if (!isActive) {
    searchContainer.classList.add('active');
    setTimeout(() => {
      document.getElementById('search').focus();
    }, 100);
  } else {
    closeSearch();
  }
}

// Función para cerrar la búsqueda
function closeSearch() {
  const searchContainer = document.getElementById('searchContainer');
  const searchInput = document.getElementById('search');
  
  searchContainer.classList.remove('active');
  searchInput.value = '';
  currentSearchTerm = '';
  
  // Restaurar vista normal si estaba en búsqueda
  if (allMovies.length > 0) {
    renderAllSections();
  }
}

// Cerrar buscador al hacer clic fuera o con Escape
document.addEventListener('click', (e) => {
  const searchContainer = document.getElementById('searchContainer');
  const searchToggle = document.querySelector('.search-toggle');
  const searchClose = document.querySelector('.search-close');
  
  if (!searchContainer.contains(e.target) && 
      !searchToggle.contains(e.target) && 
      !searchClose.contains(e.target)) {
    closeSearch();
  }
});

// Cerrar con tecla Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const searchContainer = document.getElementById('searchContainer');
    if (searchContainer.classList.contains('active')) {
      closeSearch();
    }
  }
});

// ===================================================
// CARGA DE PELÍCULAS
// ===================================================
async function loadMovies() {
  try {
    showLoading();
    const res = await fetch(DATA_URL);
    const data = await res.json();
    allMovies = data.moviesData || data;
    
    renderAllSections();
    initializeCarouselControls();
    
  } catch (err) {
    console.error('Error al cargar películas:', err);
    showError();
  }
}

function showLoading() {
  document.getElementById("movies").innerHTML = `
    <div style="grid-column: 1 / -1; text-align: center; padding: 60px; color: var(--texto-secundario);">
      <div style="font-size: 1.5rem;">Cargando películas...</div>
    </div>
  `;
}

function showError() {
  document.getElementById("movies").innerHTML = `
    <div style="grid-column: 1 / -1; text-align: center; padding: 60px; color: var(--texto-secundario);">
      <p style="font-size: 1.3rem; margin-bottom: 15px;">⚠️ Error al cargar películas</p>
      <button onclick="loadMovies()" style="margin-top: 20px; padding: 12px 24px; background: var(--rojo); color: white; border: none; border-radius: 25px; cursor: pointer;">
        Reintentar
      </button>
    </div>
  `;
}

function updateMoviesCount(count) {
  document.getElementById('moviesCount').textContent = `${count} ${count === 1 ? 'película' : 'películas'}`;
}

// ===================================================
// RENDERIZADO DE SECCIONES
// ===================================================
function renderAllSections() {
  renderMovies(allMovies);
  renderNewReleases();
  updateMoviesCount(allMovies.length);
}

function renderNewReleases() {
  const newReleases = allMovies.filter(movie => movie.isNew);
  const carousel = document.getElementById('newReleasesCarousel');
  const section = document.getElementById('newReleasesSection');
  
  if (newReleases.length === 0) {
    section.style.display = 'none';
    return;
  }
  
  section.style.display = 'block';
  carousel.innerHTML = '';
  
  newReleases.forEach((movie, index) => {
    const carouselItem = createCarouselItem(movie, index);
    carousel.appendChild(carouselItem);
  });
  
  // Inicializar carousel
  initializeCarousel('newReleases', newReleases.length);
}

function createCarouselItem(movie, index) {
  const carouselItem = document.createElement('div');
  carouselItem.className = 'carousel-item';
  carouselItem.style.animationDelay = `${(index % 8) * 0.05}s`;
  
  carouselItem.innerHTML = `
    ${movie.isNew ? '<div class="new-badge">NUEVO</div>' : ''}
    <img src="${movie.image}" alt="${movie.title}" class="carousel-poster" 
         onerror="this.src='https://via.placeholder.com/300x450/2d2d2d/ffffff?text=Imagen+No+Disponible'"
         loading="lazy">
    <div class="carousel-info">
      <div class="carousel-title">${movie.title}</div>
      <div class="carousel-year">${movie.year}</div>
    </div>
  `;
  carouselItem.onclick = () => showDetails(movie);
  return carouselItem;
}

function renderMovies(movies) {
  const moviesContainer = document.getElementById("movies");
  
  if (movies.length === 0) {
    moviesContainer.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px; color: var(--texto-secundario);">
        <p style="font-size: 1.3rem; margin-bottom: 15px;">🔍 No se encontraron películas</p>
      </div>
    `;
    updateMoviesCount(0);
    return;
  }
  
  moviesContainer.innerHTML = '';
  movies.forEach((movie, index) => {
    const movieCard = createMovieCard(movie, index);
    moviesContainer.appendChild(movieCard);
  });
  
  updateMoviesCount(movies.length);
}

function createMovieCard(movie, index) {
  const movieCard = document.createElement("div");
  movieCard.className = "movie-card";
  movieCard.style.animationDelay = `${(index % 8) * 0.05}s`;
  
  movieCard.innerHTML = `
    ${movie.isNew ? '<div class="new-badge">NUEVO</div>' : ''}
    <img src="${movie.image}" alt="${movie.title}" class="movie-poster" 
         onerror="this.src='https://via.placeholder.com/300x450/2d2d2d/ffffff?text=Imagen+No+Disponible'"
         loading="lazy">
    <div class="movie-info">
      <div class="movie-title">${movie.title}</div>
      <div class="movie-year">${movie.year}</div>
    </div>
  `;
  movieCard.onclick = () => showDetails(movie);
  return movieCard;
}

// ===================================================
// SISTEMA DE CAROUSEL SIMPLIFICADO
// ===================================================
function initializeCarousel(name, itemCount) {
  const container = document.getElementById(`${name}CarouselContainer`);
  const element = document.getElementById(`${name}Carousel`);
  
  if (!container || !element) return;
  
  carousels[name] = {
    element: element,
    position: 0,
    maxPosition: calculateMaxPosition(container, itemCount)
  };
}

function calculateMaxPosition(container, itemCount) {
  const containerWidth = container.offsetWidth;
  const itemWidth = 220 + 15; // 180px + 20px gap
  const visibleItems = Math.floor(containerWidth / itemWidth);
  return Math.max(0, itemCount - visibleItems);
}

function initializeCarouselControls() {
  // Controles para estrenos
  document.getElementById('newReleasesPrev').addEventListener('click', () => moveCarousel('newReleases', -1));
  document.getElementById('newReleasesNext').addEventListener('click', () => moveCarousel('newReleases', 1));
}

function moveCarousel(name, direction) {
  const carousel = carousels[name];
  if (!carousel) return;
  
  const newPosition = carousel.position + direction;
  
  if (newPosition >= 0 && newPosition <= carousel.maxPosition) {
    carousel.position = newPosition;
    updateCarouselPosition(carousel);
  }
}

function updateCarouselPosition(carousel) {
  const translateX = -carousel.position * (180 + 20);
  carousel.element.style.transform = `translateX(${translateX}px)`;
}

// ===================================================
// SISTEMA DE BÚSQUEDA
// ===================================================
function setupSearch() {
  const searchInput = document.getElementById("search");
  
  searchInput.addEventListener("input", (e) => {
    currentSearchTerm = e.target.value.trim().toLowerCase();
    
    if (currentSearchTerm === '') {
      renderAllSections();
      return;
    }
    
    const filteredMovies = allMovies.filter(movie => 
      movie.title.toLowerCase().includes(currentSearchTerm) ||
      (movie.genres && movie.genres.some(genre => 
        genre.toLowerCase().includes(currentSearchTerm)
      ))
    );
    
    renderMovies(filteredMovies);
    document.getElementById('newReleasesSection').style.display = 'none';
  });
}

// ===================================================
// SISTEMA MEJORADO DE BÚSQUEDA DE TRAILERS
// ===================================================

async function getMovieTrailer(movieId, movieTitle) {
  try {
    // Intentar múltiples estrategias en paralelo
    const [tmdbVideos, tmdbAlternative, youtubeSearch] = await Promise.allSettled([
      // 1. Búsqueda principal en TMDB (español)
      fetch(`https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=${TMDB_API_KEY}&language=es-ES`).then(res => res.json()),
      
      // 2. Búsqueda alternativa en TMDB (inglés)
      fetch(`https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=${TMDB_API_KEY}&language=en-US`).then(res => res.json()),
      
      // 3. Búsqueda en YouTube por título (fallback)
      searchYouTubeTrailer(movieTitle + " trailer oficial")
    ]);

    // Procesar resultados de TMDB (español)
    if (tmdbVideos.status === 'fulfilled' && tmdbVideos.value.results) {
      const trailer = findBestTrailer(tmdbVideos.value.results);
      if (trailer) {
        console.log(`✅ Trailer encontrado en TMDB (ES) para: ${movieTitle}`);
        return trailer;
      }
    }

    // Procesar resultados de TMDB (inglés)
    if (tmdbAlternative.status === 'fulfilled' && tmdbAlternative.value.results) {
      const trailer = findBestTrailer(tmdbAlternative.value.results);
      if (trailer) {
        console.log(`✅ Trailer encontrado en TMDB (EN) para: ${movieTitle}`);
        return trailer;
      }
    }

    // Usar búsqueda de YouTube como último recurso
    if (youtubeSearch.status === 'fulfilled' && youtubeSearch.value) {
      console.log(`✅ Trailer encontrado en YouTube para: ${movieTitle}`);
      return youtubeSearch.value;
    }

    console.log(`❌ No se encontró trailer para: ${movieTitle}`);
    return null;
  } catch (err) {
    console.error('Error en búsqueda de trailer:', err);
    return null;
  }
}

function findBestTrailer(videos) {
  if (!videos || !videos.length) return null;

  // Orden de prioridad para tipos de video
  const typePriority = [
    { type: "Trailer", site: "YouTube" },
    { type: "Teaser", site: "YouTube" },
    { type: "Trailer", site: "Vimeo" },
    { type: "Teaser", site: "Vimeo" },
    { type: "Clip", site: "YouTube" },
    { type: "Featurette", site: "YouTube" }
  ];

  for (const priority of typePriority) {
    const trailer = videos.find(v => 
      v.type === priority.type && 
      v.site === priority.site &&
      v.key
    );
    if (trailer) return trailer;
  }

  // Si no encuentra según prioridad, devolver el primer trailer de YouTube
  const youTubeTrailer = videos.find(v => 
    v.site === "YouTube" && 
    (v.type.includes("Trailer") || v.type.includes("Teaser")) &&
    v.key
  );

  return youTubeTrailer || null;
}

async function searchYouTubeTrailer(searchQuery) {
  try {
    // Nota: Esto requiere una API Key de YouTube Data API v3
    // Puedes obtener una gratis desde Google Cloud Console
    const YOUTUBE_API_KEY = "AIzaSyANgjmGO7XL44r2-g9kJMEW5LNAmTwCK-s"; // Reemplazar con tu API key
    
    // Si no hay API key configurada, retornar null
    if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY === "AIzaSyANgjmGO7XL44r2-g9kJMEW5LNAmTwCK-s") {
      return null;
    }

    const encodedQuery = encodeURIComponent(searchQuery + " español latino");
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodedQuery}&type=video&videoCategoryId=1&maxResults=3&key=${YOUTUBE_API_KEY}`
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (data.items && data.items.length > 0) {
      const video = data.items[0];
      return {
        key: video.id.videoId,
        site: "YouTube",
        type: "Trailer",
        name: video.snippet.title
      };
    }

    return null;
  } catch (err) {
    console.error('Error en búsqueda de YouTube:', err);
    return null;
  }
}

// ===================================================
// VISTA DE DETALLES
// ===================================================
async function showDetails(movie) {
  isInDetailsView = true;
  
  // Ocultar header y main container
  document.getElementById("header").classList.add("hidden");
  document.getElementById("mainContainer").classList.add("hidden");
  
  // Ocultar menú inferior
  document.querySelector('.bottom-nav').style.display = 'none';
  
  history.pushState({ detailView: true }, '', `#${movie.id}`);
  
  const detailsContainer = document.getElementById("details");
  const detailsContent = document.getElementById("details-content");
  
  // Mostrar loading
  detailsContent.innerHTML = `
    <div style="display: flex; justify-content: center; align-items: center; height: 100vh; background: var(--negro);">
      <div style="text-align: center; color: var(--texto-secundario);">
        <div style="font-size: 1.5rem; margin-bottom: 15px;">Cargando detalles...</div>
        <div style="width: 40px; height: 40px; border: 3px solid var(--gris-claro); border-top: 3px solid var(--rojo); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
      </div>
    </div>
  `;
  
  detailsContainer.style.display = 'block';
  await loadMovieDetails(movie);
}

async function loadMovieDetails(movie) {
  try {
    const detailsContent = document.getElementById("details-content");
    
    const [movieDetails, trailer] = await Promise.all([
      fetch(`https://api.themoviedb.org/3/movie/${movie.id}?api_key=${TMDB_API_KEY}&language=es-ES`).then(res => res.json()),
      getMovieTrailer(movie.id, movie.title)
    ]);
    
    // Calcular duración en formato legible
    const duration = movieDetails.runtime ? 
      `${Math.floor(movieDetails.runtime / 60)}h ${movieDetails.runtime % 60}m` : 
      'No disponible';
    
    // Formatear fecha de lanzamiento
    const releaseDate = movieDetails.release_date ?
      new Date(movieDetails.release_date).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) : 'No disponible';
    
    // Generar HTML del trailer
    const trailerHTML = generateTrailerHTML(trailer, movie.title);
    
    detailsContent.innerHTML = `
      <button class="back-button" onclick="showList()">←</button>
      
      <div class="details-hero">
        <div class="trailer-hero">
          ${trailerHTML}
        </div>
        <div class="hero-gradient"></div>
        <div class="hero-overlay"></div>
      </div>
      
      <div class="details-content">
        <div class="details-info">
          <h1 class="details-title">${movie.title}</h1>
          
          <div class="details-meta">
            <span class="details-year">${movie.year}</span>
            <div class="details-genres">
              ${(movie.genres || []).map(genre => `<span class="details-genre">${genre}</span>`).join('')}
            </div>
          </div>
          
          <p class="details-overview">${movieDetails.overview || "Sin descripción disponible."}</p>
          
          <div class="details-actions">
            <button class="play-btn" onclick="playMovieWithOptions(${movie.id}, '${movie.title.replace(/'/g, "\\'")}')">
              <span style="font-size: 1.4rem;">▶</span> Reproducir
            </button>
            <button class="secondary-btn" onclick="showMoreInfo(${movie.id}, 'movie')">
              <span style="font-size: 1.2rem;">ⓘ</span> Más información
            </button>
          </div>
          
          <div class="details-extra">
            <h3 class="extra-title">Información de la película</h3>
            <div class="extra-grid">
              <div class="extra-item">
                <span class="extra-label">Duración</span>
                <span class="extra-value">${duration}</span>
              </div>
              <div class="extra-item">
                <span class="extra-label">Fecha de estreno</span>
                <span class="extra-value">${releaseDate}</span>
              </div>
              <div class="extra-item">
                <span class="extra-label">Calificación</span>
                <span class="extra-value">${movieDetails.vote_average ? movieDetails.vote_average.toFixed(1) + '/10' : 'No disponible'}</span>
              </div>
              <div class="extra-item">
                <span class="extra-label">Presupuesto</span>
                <span class="extra-value">${movieDetails.budget ? '$' + (movieDetails.budget / 1000000).toFixed(1) + 'M' : 'No disponible'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    console.error('Error al cargar detalles:', err);
    showDetailsError();
  }
}

function generateTrailerHTML(trailer, title) {
  if (trailer) {
    return `
      <iframe class="trailer-frame" 
              src="https://www.youtube.com/embed/${trailer.key}?autoplay=1&mute=1&controls=1&showinfo=0&rel=0" 
              frameborder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowfullscreen
              title="Tráiler de ${title}">
      </iframe>
    `;
  } else {
    return `
      <div class="trailer-placeholder">
        <div style="text-align: center; padding: 60px 20px;">
          <div style="font-size: 4rem; margin-bottom: 20px;">🎬</div>
          <div style="font-size: 1.3rem; margin-bottom: 15px; color: var(--texto-secundario);">
            Tráiler no disponible
          </div>
          <div style="font-size: 1rem; color: var(--texto-terciario); max-width: 300px; margin: 0 auto; line-height: 1.5;">
            No hemos encontrado un tráiler para esta película
          </div>
        </div>
      </div>
    `;
  }
}

function showDetailsError() {
  const detailsContent = document.getElementById("details-content");
  detailsContent.innerHTML = `
    <div style="text-align: center; padding: 80px; color: var(--texto-secundario); background: var(--negro); min-height: 100vh;">
      <button class="back-button" onclick="showList()">←</button>
      <p style="font-size: 1.3rem; margin-bottom: 15px;">⚠️ Error al cargar detalles</p>
      <button onclick="showList()" style="margin-top: 20px; padding: 12px 24px; background: var(--rojo); color: white; border: none; border-radius: 25px; cursor: pointer;">
        Volver al catálogo
      </button>
    </div>
  `;
}

function showList() {
  isInDetailsView = false;
  
  const detailsContainer = document.getElementById("details");
  const mainContainer = document.getElementById("mainContainer");
  const header = document.getElementById("header");
  const bottomNav = document.querySelector('.bottom-nav');
  
  detailsContainer.classList.add('hiding');
  
  setTimeout(() => {
    detailsContainer.style.display = 'none';
    detailsContainer.classList.remove('hiding');
    
    header.classList.remove('hidden');
    mainContainer.classList.remove('hidden');
    bottomNav.style.display = 'flex';
    
    if (currentSearchTerm === '') {
      renderNewReleases();
    }
    
    document.getElementById('search').value = '';
    currentSearchTerm = '';
    renderMovies(allMovies);
  }, 400);
}

// ===================================================
// REPRODUCCIÓN
// ===================================================
async function loadMoviesLinks() {
  try {
    const res = await fetch(MOVIES_LINKS_URL);
    moviesLinksData = await res.json();
  } catch (err) {
    console.error('Error al cargar enlaces:', err);
  }
}

async function playMovieWithOptions(id, title) {
  try {
    const movieData = moviesLinksData[id];
    
    if (movieData?.sources?.length > 0) {
      const source = movieData.sources.find(s => s.url) || movieData.sources[0];
      
      if (source?.url) {
        if (window.AppCreator24?.playVideo) {
          window.AppCreator24.playVideo(source.url, title);
        } else if (window.android?.playVideo) {
          window.android.playVideo(source.url, title);
        } else {
          window.open(source.url, '_blank');
        }
        return;
      }
    }
    alert(`No hay enlace disponible para: ${title}`);
  } catch (err) {
    console.error('Error al reproducir:', err);
    alert(`Error al reproducir: ${title}`);
  }
}

// Función placeholder para más información
function showMoreInfo(id, type) {
  alert('Función de más información en desarrollo');
}

// ===================================================
// INICIALIZACIÓN
// ===================================================
document.addEventListener("DOMContentLoaded", () => {
  setupSearch();
  loadMovies();
  loadMoviesLinks();
  
  // Manejar botón atrás
  window.addEventListener('popstate', () => {
    if (isInDetailsView) showList();
  });
  
  // Tecla Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isInDetailsView) showList();
  });
});

// Agregar estilo para spinner
const style = document.createElement('style');
style.textContent = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
document.head.appendChild(style);

// Recalcular carousels al redimensionar
window.addEventListener('resize', () => {
  if (!isInDetailsView) {
    renderNewReleases();
  }
});