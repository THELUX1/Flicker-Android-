// script.js - versión con manejo de botón atrás reforzado y logs para debugging
const DATA_URL = "https://raw.githubusercontent.com/THELUX1/Flicker-Android-/refs/heads/main/data.json";
const TMDB_API_KEY = "995449ccaf6d840acc029f95c7d210dd";
const MOVIES_LINKS_URL = "https://raw.githubusercontent.com/THELUX1/Flicker-Android-/refs/heads/main/movies-links.json";

let allMovies = [];
let currentSearchTerm = '';
let moviesLinksData = {};
let isInDetailsView = false;

// Función para alternar el buscador
function toggleSearch() {
  const searchContainer = document.getElementById('searchContainer');
  searchContainer.classList.toggle('active');
  
  if (searchContainer.classList.contains('active')) {
    setTimeout(() => document.getElementById('search').focus(), 100);
  }
}

// Cerrar buscador al clic fuera
document.addEventListener('click', (e) => {
  const searchContainer = document.getElementById('searchContainer');
  const searchToggle = document.querySelector('.search-toggle');
  if (!searchContainer.contains(e.target) && !searchToggle.contains(e.target)) {
    searchContainer.classList.remove('active');
  }
});

// -------------------------
// BACK BUTTON: inicialización y handler
// -------------------------
function initializeBackButton() {
  console.log('[Flicker] initializeBackButton');

  // popstate para navegación con historial (web / history API)
  window.addEventListener('popstate', function(event) {
    console.log('[Flicker] popstate event, state:', event.state, 'location.hash:', location.hash, 'isInDetailsView:', isInDetailsView);
    // Si venimos de un estado de detalles, mostrar la lista
    if (isInDetailsView) {
      showList();
      return;
    }

    // Si no estamos en detalles y el estado es 'list' no hacer nada
    // (se quedó en la lista)
  });

  // backbutton físico (Cordova/WebView). Puede no existir en entorno web.
  if (document && document.addEventListener) {
    document.addEventListener('backbutton', handleBackButton, false);
    console.log('[Flicker] backbutton listener registrado en document');
  } else {
    console.log('[Flicker] document.addEventListener no disponible (entorno web?)');
  }

  // tecla Escape para desktop
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isInDetailsView) {
      showList();
    }
  });
}

// Handler del back físico
function handleBackButton(event) {
  console.log('[Flicker] handleBackButton - isInDetailsView:', isInDetailsView);
  // Evitar comportamiento por defecto si hay evento
  if (event && typeof event.preventDefault === 'function') {
    try { event.preventDefault(); } catch (err) { /* ignorar */ }
  }

  if (isInDetailsView) {
    // Usar history.back() para provocar popstate y manejar transición de forma homogénea.
    console.log('[Flicker] Retrocediendo en historial (history.back())');
    try {
      history.back();
    } catch (err) {
      console.warn('[Flicker] history.back() falló:', err);
      showList();
    }
  } else {
    // En la lista: confirmar salida (evita cierre accidental)
    console.log('[Flicker] En lista - solicitar confirmación para salir');
    const exit = confirm("¿Deseas salir de Flicker?");
    if (exit) {
      // Intentar métodos de salida conocidos
      if (navigator.app && typeof navigator.app.exitApp === 'function') {
        navigator.app.exitApp();
      } else if (window.Android && typeof window.Android.exitApp === 'function') {
        // fallback para WebView que expone Android
        try { window.Android.exitApp(); } catch (e) { console.warn(e); window.close(); }
      } else {
        try { window.close(); } catch (e) { console.warn('No se pudo cerrar la ventana', e); }
      }
    } else {
      // Si no quiere salir, evitamos cerrar la app
      // y dejamos el estado tal cual.
      console.log('[Flicker] Usuario canceló salida');
    }
  }

  return false;
}

// -------------------------
// CARGA Y RENDER
// -------------------------
async function loadMovies() {
  try {
    document.getElementById("movies").innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--texto-secundario);"><div class="loading" style="font-size:1.5rem;">Cargando películas...</div></div>`;
    const res = await fetch(DATA_URL);
    const data = await res.json();
    allMovies = data.moviesData || data;
    renderMovies(allMovies);
    updateMoviesCount(allMovies.length);
  } catch (err) {
    console.error('Error al cargar películas:', err);
    document.getElementById("movies").innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px; color: var(--texto-secundario);">
        <p style="font-size: 1.3rem; margin-bottom: 15px;">⚠️ Error al cargar películas</p>
        <p style="font-size: 1rem;">Intenta recargar la página o verifica tu conexión</p>
        <button onclick="loadMovies()" style="margin-top:20px;padding:12px 24px;background:var(--rojo);color:white;border:none;border-radius:25px;cursor:pointer;font-size:1rem;">Reintentar</button>
      </div>
    `;
  }
}

function updateMoviesCount(count) {
  const el = document.getElementById('moviesCount');
  if (el) el.textContent = `${count} ${count === 1 ? 'película disponible' : 'películas disponibles'}`;
}

function renderMovies(movies) {
  const grid = document.getElementById("movies");
  if (!grid) return;
  grid.innerHTML = "";

  if (!movies || movies.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--texto-secundario);"><p style="font-size:1.3rem;margin-bottom:15px;">🎬 No se encontraron películas</p><p style="font-size:1rem;">Intenta con otros términos de búsqueda</p></div>`;
    updateMoviesCount(0);
    return;
  }

  movies.forEach(movie => {
    const movieCard = document.createElement("div");
    movieCard.className = "movie-card";

    const genres = movie.genres || [];
    const genresToShow = genres.slice(0,2);
    const remainingGenres = genres.length > 2 ? genres.length - 2 : 0;

    movieCard.innerHTML = `
      ${movie.isNew ? '<div class="new-badge">NUEVO</div>' : ''}
      <img src="${movie.image}" alt="${movie.title}" class="movie-poster" onerror="this.src='https://via.placeholder.com/300x450/2d2d2d/ffffff?text=Imagen+No+Disponible'" loading="lazy">
      <div class="movie-info">
        <div class="movie-title">${movie.title}</div>
        <div class="movie-year">${movie.year}</div>
        <div class="movie-genres">
          ${genresToShow.map(g => `<span class="genre-tag">${g}</span>`).join('')}
          ${remainingGenres > 0 ? `<span class="genre-tag">+${remainingGenres}</span>` : ''}
        </div>
      </div>
    `;
    movieCard.onclick = () => showDetails(movie);
    grid.appendChild(movieCard);
  });

  updateMoviesCount(movies.length);
}

// -------------------------
// DETALLES
// -------------------------
async function showDetails(movie) {
  console.log('[Flicker] showDetails', movie?.id);
  isInDetailsView = true;

  // Pushear solo al abrir detalles
  try {
    history.pushState({ page: 'details', movieId: movie.id }, '', `#${movie.id}`);
  } catch (err) {
    console.warn('[Flicker] history.pushState falló:', err);
  }

  const detailsContent = document.getElementById("details-content");
  if (detailsContent) {
    detailsContent.innerHTML = `<div style="text-align:center;padding:100px;color:var(--texto-secundario);"><div class="loading" style="font-size:1.5rem;">Cargando detalles...</div></div>`;
  }

  document.getElementById("header")?.classList.add("hidden");
  document.getElementById("mainContainer")?.classList.add("hidden");
  document.getElementById("details").style.display = "block";

  try {
    const [movieRes, trailerRes] = await Promise.all([
      fetch(`https://api.themoviedb.org/3/movie/${movie.id}?api_key=${TMDB_API_KEY}&language=es-ES`),
      fetch(`https://api.themoviedb.org/3/movie/${movie.id}/videos?api_key=${TMDB_API_KEY}&language=es-ES`)
    ]);

    const data = await movieRes.json();
    const trailerData = await trailerRes.json();
    const trailer = trailerData.results?.find(v => v.type === "Trailer" && v.site === "YouTube");

    document.getElementById("details-content").innerHTML = `
      <div class="details-hero" style="background-image: url('${movie.image}')">
        <div class="details-content">
          <div class="details-info">
            <h1 class="details-title">${movie.title}</h1>
            <div class="details-meta">
              <span class="details-year">${movie.year}</span>
              <div class="details-genres">
                ${(movie.genres || []).map(g => `<span class="details-genre">${g}</span>`).join('')}
              </div>
            </div>
            <p class="details-overview">${data.overview || "Sin descripción disponible."}</p>
            <button class="play-btn" onclick="playMovieWithOptions(${movie.id}, '${movie.title.replace(/'/g, "\\'")}')"><span>▶</span> Ver ahora</button>
          </div>
        </div>
      </div>
      <div class="trailer-container">
        <div class="trailer-content">
          <h3 class="trailer-title">Tráiler</h3>
          ${trailer ? `<iframe class="trailer-frame" src="https://www.youtube.com/embed/${trailer.key}" frameborder="0" allowfullscreen></iframe>` : '<div class="no-trailer">🎬 Tráiler no disponible</div>'}
        </div>
      </div>
    `;
  } catch (err) {
    console.error('Error al cargar detalles:', err);
    document.getElementById("details-content").innerHTML = `<div style="text-align:center;padding:80px;color:var(--texto-secundario);"><p style="font-size:1.3rem;margin-bottom:15px;">⚠️ Error al cargar detalles</p><p style="font-size:1rem;">Intenta nuevamente más tarde</p></div>`;
  }
}

// -------------------------
// VOLVER AL CATÁLOGO (NO crear nuevo estado)
// -------------------------
function showList() {
  console.log('[Flicker] showList llamado');
  isInDetailsView = false;

  // Reemplazar el estado actual por 'list' (no push) para mantener historial coherente
  try {
    history.replaceState({ page: 'list' }, '', '#');
  } catch (err) {
    console.warn('[Flicker] history.replaceState falló:', err);
  }

  document.getElementById("header")?.classList.remove("hidden");
  document.getElementById("mainContainer")?.classList.remove("hidden");
  document.getElementById("details").style.display = "none";

  document.getElementById('search').value = '';
  currentSearchTerm = '';
  renderMovies(allMovies);
}

// -------------------------
// ENLACES / REPRODUCCIÓN
// -------------------------
async function loadMoviesLinks() {
  try {
    const res = await fetch(MOVIES_LINKS_URL);
    moviesLinksData = await res.json();
    console.log('[Flicker] Enlaces cargados');
  } catch (err) {
    console.error('Error al cargar enlaces de películas:', err);
  }
}

async function playMovieWithOptions(id, title) {
  try {
    const movieData = moviesLinksData[id];
    if (movieData && movieData.sources && movieData.sources.length > 0) {
      const availableSource = movieData.sources.find(s => s.url) || movieData.sources[0];
      if (availableSource && availableSource.url) {
        if (window.AppCreator24 && window.AppCreator24.playVideo) {
          window.AppCreator24.playVideo(availableSource.url, title);
        } else if (window.android && window.android.playVideo) {
          window.android.playVideo(availableSource.url, title);
        } else {
          window.open(availableSource.url, '_blank');
        }
      } else {
        alert(`No hay enlace disponible para: ${title}`);
      }
    } else {
      alert(`No se encontraron enlaces para: ${title}`);
    }
  } catch (err) {
    console.error('Error al reproducir película:', err);
    alert(`Error al reproducir: ${title}`);
  }
}

// -------------------------
// INICIALIZACIÓN (esperar deviceready si existe)
// -------------------------
function onAppReady() {
  initializeBackButton();

  // Estado inicial del historial
  try {
    if (window.location.hash) {
      history.replaceState({ page: 'list' }, '', '#');
    } else {
      history.replaceState({ page: 'list' }, '', '');
    }
  } catch (err) {
    console.warn('[Flicker] history.replaceState inicial falló:', err);
  }

  loadMovies();
  loadMoviesLinks();
}

window.addEventListener('load', function() {
  // Algunos WebViews emiten 'deviceready' (Cordova). Si existe, preferimos esperar.
  if (document && typeof document.addEventListener === 'function' && typeof window.cordova !== 'undefined') {
    console.log('[Flicker] cordova detectado, esperando deviceready');
    document.addEventListener('deviceready', onAppReady, false);
  } else {
    // Si no hay cordova/Plugin, inicializamos directamente (web/localhost)
    onAppReady();
  }
});

// Buscador
document.getElementById("search").addEventListener("input", (e) => {
  const term = e.target.value.toLowerCase().trim();
  currentSearchTerm = term;
  const filtered = allMovies.filter(m =>
    m.title?.toLowerCase().includes(term) ||
    (m.genres || []).some(genre => genre.toLowerCase().includes(term)) ||
    (m.year && m.year.toString().includes(term))
  );
  renderMovies(filtered);
});

// Reset al cerrar
window.addEventListener('beforeunload', function() {
  isInDetailsView = false;
});