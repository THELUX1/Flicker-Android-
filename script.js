const DATA_URL = "https://raw.githubusercontent.com/THELUX1/Flicker-Android-/refs/heads/main/data.json";
    const TMDB_API_KEY = "995449ccaf6d840acc029f95c7d210dd";
    let allMovies = [];
    let currentSearchTerm = '';

    // Función para alternar la visibilidad del buscador
    function toggleSearch() {
      const searchContainer = document.getElementById('searchContainer');
      searchContainer.classList.toggle('active');
      
      // Si se abre, enfocar el input
      if (searchContainer.classList.contains('active')) {
        setTimeout(() => {
          document.getElementById('search').focus();
        }, 100);
      }
    }

    // Cerrar buscador al hacer clic fuera
    document.addEventListener('click', (e) => {
      const searchContainer = document.getElementById('searchContainer');
      const searchToggle = document.querySelector('.search-toggle');
      
      if (!searchContainer.contains(e.target) && !searchToggle.contains(e.target)) {
        searchContainer.classList.remove('active');
      }
    });

    async function loadMovies() {
      try {
        const res = await fetch(DATA_URL);
        const data = await res.json();
        // Extraer solo las películas del JSON
        allMovies = data.moviesData || data;
        renderMovies(allMovies);
        updateMoviesCount(allMovies.length);
      } catch (err) {
        console.error('Error al cargar películas:', err);
        document.getElementById("movies").innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--texto-secundario);">
            <p style="font-size: 1.2rem; margin-bottom: 10px;">Error al cargar películas</p>
            <p>Intenta recargar la página</p>
          </div>
        `;
      }
    }

    function updateMoviesCount(count) {
      document.getElementById('moviesCount').textContent = `${count} películas disponibles`;
    }

    function renderMovies(movies) {
      const grid = document.getElementById("movies");
      grid.innerHTML = "";
      
      if (!movies.length) {
        grid.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--texto-secundario);">
            <p style="font-size: 1.2rem; margin-bottom: 10px;">No se encontraron películas</p>
            <p>Intenta con otros términos de búsqueda</p>
          </div>
        `;
        updateMoviesCount(0);
        return;
      }

      movies.forEach(movie => {
        const movieCard = document.createElement("div");
        movieCard.className = "movie-card";
        movieCard.innerHTML = `
          ${movie.isNew ? '<div class="new-badge">NUEVO</div>' : ''}
          <img src="${movie.image}" alt="${movie.title}" class="movie-poster" onerror="this.src='https://via.placeholder.com/160x240/2d2d2d/ffffff?text=No+Image'">
          <div class="movie-info">
            <div class="movie-title">${movie.title}</div>
            <div class="movie-year">${movie.year}</div>
            <div class="movie-genres">
              ${(movie.genres || []).slice(0, 2).map(genre => 
                `<span class="genre-tag">${genre}</span>`
              ).join('')}
              ${(movie.genres || []).length > 2 ? '<span class="genre-tag">+</span>' : ''}
            </div>
          </div>
        `;
        movieCard.onclick = () => showDetails(movie);
        grid.appendChild(movieCard);
      });

      updateMoviesCount(movies.length);
    }

    async function showDetails(movie) {
      // Ocultar header y buscador
      document.getElementById("header").classList.add("hidden");
      document.getElementById("mainContainer").classList.add("hidden");
      
      const details = document.getElementById("details");
      details.style.display = "block";

      try {
        const res = await fetch(`https://api.themoviedb.org/3/movie/${movie.id}?api_key=${TMDB_API_KEY}&language=es-ES`);
        const data = await res.json();

        const trailerRes = await fetch(`https://api.themoviedb.org/3/movie/${movie.id}/videos?api_key=${TMDB_API_KEY}&language=es-ES`);
        const trailerData = await trailerRes.json();
        const trailer = trailerData.results.find(v => v.type === "Trailer" && v.site === "YouTube");

        document.getElementById("details-content").innerHTML = `
          <div class="details-hero" style="background-image: url('${movie.image}')">
            <div class="details-content">
              <div class="details-info">
                <h1 class="details-title">${movie.title}</h1>
                <div class="details-meta">
                  <span class="details-year">${movie.year}</span>
                  <div class="details-genres">
                    ${(movie.genres || []).map(genre => 
                      `<span class="details-genre">${genre}</span>`
                    ).join('')}
                  </div>
                </div>
                <p class="details-overview">${data.overview || "Sin descripción disponible."}</p>
                <button class="play-btn" onclick="playMovie(${movie.id}, '${movie.title.replace(/'/g, "\\'")}')">
                  <span>▶</span> Ver ahora
                </button>
              </div>
            </div>
          </div>
          <div class="trailer-container">
            <div class="trailer-content">
              <h3 class="trailer-title">Tráiler</h3>
              ${trailer ? 
                `<iframe class="trailer-frame" src="https://www.youtube.com/embed/${trailer.key}" frameborder="0" allowfullscreen></iframe>` : 
                '<div class="no-trailer">Tráiler no disponible</div>'
              }
            </div>
          </div>
        `;
      } catch (err) {
        console.error('Error al cargar detalles:', err);
        document.getElementById("details-content").innerHTML = `
          <div style="text-align: center; padding: 40px; color: var(--texto-secundario);">
            <p style="font-size: 1.2rem; margin-bottom: 10px;">Error al cargar detalles</p>
            <p>Intenta nuevamente más tarde</p>
          </div>
        `;
      }
    }

    function showList() {
      // Mostrar header y contenido principal
      document.getElementById("header").classList.remove("hidden");
      document.getElementById("mainContainer").classList.remove("hidden");
      
      document.getElementById("details").style.display = "none";
      
      // Limpiar búsqueda y mostrar todas las películas
      document.getElementById('search').value = '';
      currentSearchTerm = '';
      renderMovies(allMovies);
    }

    // Agrega esta variable al inicio con las demás
const MOVIES_LINKS_URL = "https://raw.githubusercontent.com/THELUX1/Flicker-Android-/refs/heads/main/movies-links.json";
let moviesLinksData = {};

// Función para cargar los enlaces de películas
async function loadMoviesLinks() {
    try {
        const res = await fetch(MOVIES_LINKS_URL);
        moviesLinksData = await res.json();
    } catch (err) {
        console.error('Error al cargar enlaces de películas:', err);
    }
}

// Modifica la función playMovie
async function playMovie(id, title) {
    try {
        // Buscar la película en movies-links.json
        const movieData = moviesLinksData[id];
        
        if (movieData && movieData.sources && movieData.sources.length > 0) {
            // Tomar la primera fuente disponible (HD preferentemente)
            const videoUrl = movieData.sources[0].url;
            
            if (videoUrl) {
                // Verificar si estamos en AppCreator24
                if (window.AppCreator24 && window.AppCreator24.playVideo) {
                    // Usar el reproductor nativo de AppCreator24
                    window.AppCreator24.playVideo(videoUrl, title);
                } else if (window.android && window.android.playVideo) {
                    // Alternativa para Android WebView
                    window.android.playVideo(videoUrl, title);
                } else {
                    // Fallback: abrir en una nueva pestaña o mostrar alerta
                    window.open(videoUrl, '_blank');
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

// También puedes mejorar la función para mostrar opciones de calidad
async function playMovieWithOptions(id, title) {
    try {
        const movieData = moviesLinksData[id];
        
        if (movieData && movieData.sources && movieData.sources.length > 0) {
            // Si hay múltiples calidades, mostrar selector
            if (movieData.sources.length > 1) {
                // Crear diálogo de selección de calidad
                const qualityOptions = movieData.sources.map(source => 
                    `${source.quality} - ${source.url ? 'Disponible' : 'No disponible'}`
                ).join('\n');
                
                // En AppCreator24 puedes usar un diálogo nativo
                if (window.AppCreator24 && window.AppCreator24.showDialog) {
                    window.AppCreator24.showDialog(
                        `Selecciona calidad para: ${title}`,
                        qualityOptions,
                        (selectedIndex) => {
                            const selectedSource = movieData.sources[selectedIndex];
                            if (selectedSource && selectedSource.url) {
                                window.AppCreator24.playVideo(selectedSource.url, title);
                            }
                        }
                    );
                } else {
                    // Usar la primera fuente disponible por defecto
                    const availableSource = movieData.sources.find(source => source.url) || movieData.sources[0];
                    if (availableSource && availableSource.url) {
                        if (window.AppCreator24 && window.AppCreator24.playVideo) {
                            window.AppCreator24.playVideo(availableSource.url, title);
                        } else {
                            window.open(availableSource.url, '_blank');
                        }
                    }
                }
            } else {
                // Solo una fuente disponible
                const videoUrl = movieData.sources[0].url;
                if (videoUrl) {
                    if (window.AppCreator24 && window.AppCreator24.playVideo) {
                        window.AppCreator24.playVideo(videoUrl, title);
                    } else {
                        window.open(videoUrl, '_blank');
                    }
                }
            }
        } else {
            alert(`No se encontraron enlaces para: ${title}`);
        }
    } catch (err) {
        console.error('Error al reproducir película:', err);
        alert(`Error al reproducir: ${title}`);
    }
}

// Actualiza la llamada en showDetails
// En la parte donde generas el HTML del botón, cambia a:
// <button class="play-btn" onclick="playMovieWithOptions(${movie.id}, '${movie.title.replace(/'/g, "\\'")}')">

// Cargar los enlaces cuando se inicie la aplicación
loadMoviesLinks();

    // Buscador dinámico
    document.getElementById("search").addEventListener("input", (e) => {
      const term = e.target.value.toLowerCase().trim();
      currentSearchTerm = term;
      const filtered = allMovies.filter(m => 
        m.title?.toLowerCase().includes(term) ||
        (m.genres || []).some(genre => genre.toLowerCase().includes(term)) ||
        m.year?.includes(term)
      );
      renderMovies(filtered);
    });

    // Cargar películas al iniciar
    loadMovies();
// Detectar botón "atrás" del sistema en Android / WebView
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" || e.key === "Backspace") {
    handleBackButton();
  }
});

// También funciona para WebView con historial
window.addEventListener("popstate", handleBackButton);

function handleBackButton() {
  const detailsVisible = document.getElementById("details").style.display === "block";
  if (detailsVisible) {
    // Si estamos viendo una película, volvemos al catálogo
    showList();
    // Evitamos que Android cierre la app
    history.pushState(null, "", location.href);
  } else {
    // Si ya estamos en el catálogo, dejamos que Android cierre la app
    return false;
  }
}

// Para asegurar que haya un estado inicial
history.pushState(null, "", location.href);
