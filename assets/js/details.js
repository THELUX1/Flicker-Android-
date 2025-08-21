let commentsListener = null;
let currentUser = null;
import { moviesData, seriesData } from './data.js';

// Firebase Configuración (compat)
const firebaseConfig = {
  apiKey: "AIzaSyAZGrc0UB86ZeWY4eW9zqMjqGZoIuEsZA8",
  authDomain: "webapp-9b392.firebaseapp.com",
  projectId: "webapp-9b392",
  storageBucket: "webapp-9b392.firebasestorage.app",
  messagingSenderId: "580583351950",
  appId: "1:580583351950:web:83022ad86313928c9c4bdf",
  measurementId: "G-X4J2V1ZGXH"
};

// Inicializar Firebase (compat)
if (!firebase.apps?.length) {
  firebase.initializeApp(firebaseConfig);
}

// Referencias de servicios compat
const auth = firebase.auth();
const db = firebase.firestore();

// Resto del código original

const TMDB = {
    API_KEY: '995449ccaf6d840acc029f95c7d210dd',
    BASE_URL: 'https://api.themoviedb.org/3',
    YOUTUBE_URL: 'https://www.youtube.com/embed/',
    IMAGE_URL: 'https://image.tmdb.org/t/p/w300',
    LANGUAGE: 'es-MX'
};

// Variables globales
let autoplayOverlayShown = false;
let userInteracted = false;

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
        
        // Intentar reproducir con sonido después de una interacción del usuario
        setupAutoplayWithSound();

        // ✅ Inicializar comentarios
        initCommentsSystem();
        
    } catch (error) {
        console.error('Error:', error);
        // Usar datos locales como fallback
        renderMediaDetails(localData, []);
        const availableSimilar = getAvailableSimilar(id, type);
        renderSimilarMedia(availableSimilar);
        showError('Error al cargar detalles adicionales. Mostrando información básica.');
    }
});

// Configurar autoplay con sonido después de interacción del usuario
function setupAutoplayWithSound() {
    const trailerContainer = document.getElementById('trailer-container');
    const iframe = trailerContainer.querySelector('iframe');
    
    if (!iframe) return;
    
    // Intentar reproducir con sonido después de cualquier interacción del usuario
    const enableSound = function() {
        if (userInteracted) return;
        
        userInteracted = true;
        const src = iframe.src;
        
        // Habilitar sonido si está muteado
        if (src.includes('mute=1')) {
            iframe.src = src.replace('mute=1', 'mute=0');
            
            // Mostrar indicador de sonido activado
            showSoundEnabledIndicator();
        }
        
        // Remover listeners después de la primera interacción
        document.removeEventListener('click', enableSound);
        document.removeEventListener('keydown', enableSound);
        document.removeEventListener('touchstart', enableSound);
    };
    
    // Agregar listeners para eventos de interacción del usuario
    document.addEventListener('click', enableSound);
    document.addEventListener('keydown', enableSound);
    document.addEventListener('touchstart', enableSound);
    
    // También permitir habilitar sonido desde el iframe directamente
    iframe.addEventListener('load', function() {
        try {
            this.contentWindow.postMessage('{"event":"command","func":"unMute","args":""}', '*');
        } catch (e) {
            console.log('No se pudo acceder al iframe por políticas de seguridad');
        }
    });
}

// Mostrar indicador de sonido activado
function showSoundEnabledIndicator() {
    const trailerContainer = document.getElementById('trailer-container');
    
    const soundIndicator = document.createElement('div');
    soundIndicator.className = 'sound-indicator';
    soundIndicator.innerHTML = `
        <div class="sound-indicator-content">
            <i class="fas fa-volume-up"></i>
            <span>Sonido activado</span>
        </div>
    `;
    
    trailerContainer.appendChild(soundIndicator);
    
    // Ocultar después de 2 segundos
    setTimeout(() => {
        soundIndicator.classList.add('fade-out');
        setTimeout(() => soundIndicator.remove(), 1000);
    }, 2000);
}

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
    
    // Configurar tráiler con autoplay
    const trailerKey = getTrailerKey(videos);
    const trailerContainer = document.getElementById('trailer-container');
    
    if (trailerKey) {
        // Iniciar con autoplay pero muteado (para cumplir con políticas de navegadores)
        trailerContainer.innerHTML = `
            <iframe src="${TMDB.YOUTUBE_URL}${trailerKey}?autoplay=1&mute=1&controls=1&showinfo=0&rel=0&modestbranding=1&enablejsapi=1" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen></iframe>
        `;
        
        // Añadir overlay con indicador de reproducción automática (solo una vez)
        if (!autoplayOverlayShown) {
            const overlay = document.createElement('div');
            overlay.className = 'autoplay-overlay';
            overlay.innerHTML = `
                <div class="autoplay-indicator">
                    <i class="fas fa-play-circle"></i>
                    <span>Reproduciendo automáticamente</span>
                    <div class="unmute-hint">Haz clic para activar el sonido</div>
                </div>
            `;
            trailerContainer.appendChild(overlay);
            
            // Ocultar el indicador después de 5 segundos
            setTimeout(() => {
                overlay.classList.add('fade-out');
                setTimeout(() => {
                    overlay.remove();
                    autoplayOverlayShown = true;
                }, 1000);
            }, 5000);
        }
        
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
// Función para inicializar el sistema de comentarios
function initCommentsSystem() {
    setupAuthState();
    setupCommentForm();
    loadComments();
}

// Configurar el estado de autenticación
function setupAuthState() {
    auth.onAuthStateChanged((user) => {
        currentUser = user;
        updateCommentUI();
    });
    
    // Para modo demo: autenticación anónima automática
    auth.signInAnonymously().catch((error) => {
        console.error("Error en autenticación anónima:", error);
    });
}

// Actualizar UI basado en estado de autenticación
function updateCommentUI() {
    const commentInput = document.getElementById('comment-input');
    const submitButton = document.getElementById('submit-comment');
    
    if (currentUser) {
        commentInput.disabled = false;
        commentInput.placeholder = "Añade un comentario público...";
    } else {
        commentInput.disabled = true;
        commentInput.placeholder = "Inicia sesión para comentar...";
        submitButton.disabled = true;
    }
}

// Configurar el formulario de comentarios
function setupCommentForm() {
    const commentInput = document.getElementById('comment-input');
    const submitButton = document.getElementById('submit-comment');
    const charCount = document.querySelector('.char-count');
    
    // Contador de caracteres
    commentInput.addEventListener('input', function() {
        const length = this.value.length;
        charCount.textContent = `${length}/500`;
        
        // Habilitar/deshabilitar botón según contenido
        submitButton.disabled = length === 0 || length > 500;
    });
    
    // Enviar comentario
    submitButton.addEventListener('click', submitComment);
    commentInput.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'Enter') {
            submitComment();
        }
    });
}

// Enviar comentario a Firebase
function submitComment() {
    const commentInput = document.getElementById('comment-input');
    const text = commentInput.value.trim();
    
    if (!text || !currentUser) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    const id = urlParams.get('id');
    
    if (!type || !id) return;
    
    // Crear comentario
    const comment = {
        text: text,
        userId: currentUser.uid,
        userDisplayName: currentUser.isAnonymous ? "Usuario Anónimo" : (currentUser.displayName || "Usuario"),
        mediaType: type,
        mediaId: id,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        likes: 0,
        likedBy: []
    };
    
    // Deshabilitar UI temporalmente
    const submitButton = document.getElementById('submit-comment');
    submitButton.disabled = true;
    submitButton.textContent = "Publicando...";
    
    // Guardar en Firestore
    db.collection("comments").add(comment)
        .then(() => {
            commentInput.value = "";
            document.querySelector('.char-count').textContent = "0/500";
        })
        .catch((error) => {
            console.error("Error al publicar comentario:", error);
            alert("Error al publicar el comentario. Intenta nuevamente.");
        })
        .finally(() => {
            submitButton.disabled = false;
            submitButton.textContent = "Comentar";
        });
}

// Cargar comentarios desde Firebase
function loadComments() {
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    const id = urlParams.get('id');
    
    if (!type || !id) return;
    
    const commentsList = document.getElementById('comments-list');
    
    // Configurar listener en tiempo real
    commentsListener = db.collection("comments")
        .where("mediaType", "==", type)
        .where("mediaId", "==", id)
        .orderBy("timestamp", "desc")
        .onSnapshot((snapshot) => {
            commentsList.innerHTML = "";
            
            if (snapshot.empty) {
                commentsList.innerHTML = `
                    <div class="no-comments">
                        <i class="fas fa-comments"></i>
                        <p>No hay comentarios aún. ¡Sé el primero en comentar!</p>
                    </div>
                `;
                return;
            }
            
            snapshot.forEach((doc) => {
                const comment = doc.data();
                addCommentToUI(comment, doc.id);
            });
        }, (error) => {
            console.error("Error al cargar comentarios:", error);
            commentsList.innerHTML = `
                <div class="no-comments">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Error al cargar los comentarios.</p>
                </div>
            `;
        });
}

// Añadir comentario a la UI
function addCommentToUI(comment, commentId) {
    const commentsList = document.getElementById('comments-list');
    
    const commentElement = document.createElement('div');
    commentElement.className = 'comment-item';
    commentElement.id = `comment-${commentId}`;
    
    // Formatear fecha
    const date = comment.timestamp ? comment.timestamp.toDate() : new Date();
    const timeAgo = getTimeAgo(date);
    
    commentElement.innerHTML = `
        <div class="comment-avatar">
            <i class="fas fa-user"></i>
        </div>
        <div class="comment-content">
            <div class="comment-header">
                <span class="comment-author">${comment.userDisplayName}</span>
                <span class="comment-time">${timeAgo}</span>
            </div>
            <p class="comment-text">${escapeHtml(comment.text)}</p>
            <div class="comment-actions">
                <button class="comment-action-btn like-btn" data-comment-id="${commentId}">
                    <i class="fas fa-thumbs-up"></i>
                    <span>${comment.likes || 0}</span>
                </button>
            </div>
        </div>
    `;
    
    commentsList.appendChild(commentElement);
    
    // Configurar evento de like
    const likeBtn = commentElement.querySelector('.like-btn');
    likeBtn.addEventListener('click', () => handleLike(commentId));
}

// Función para manejar likes
function handleLike(commentId) {
    if (!currentUser) return;
    
    const commentRef = db.collection("comments").doc(commentId);
    
    // Usar transacción para evitar condiciones de carrera
    db.runTransaction((transaction) => {
        return transaction.get(commentRef).then((doc) => {
            if (!doc.exists) {
                throw new Error("El comentario no existe");
            }
            
            const comment = doc.data();
            const likedBy = comment.likedBy || [];
            const userId = currentUser.uid;
            
            if (likedBy.includes(userId)) {
                // Quitar like
                transaction.update(commentRef, {
                    likes: (comment.likes || 0) - 1,
                    likedBy: firebase.firestore.FieldValue.arrayRemove(userId)
                });
            } else {
                // Añadir like
                transaction.update(commentRef, {
                    likes: (comment.likes || 0) + 1,
                    likedBy: firebase.firestore.FieldValue.arrayUnion(userId)
                });
            }
        });
    }).catch((error) => {
        console.error("Error al actualizar like:", error);
    });
}

// Utilidad: Obtener tiempo relativo (hace x tiempo)
function getTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return "justo ahora";
    if (diffInSeconds < 3600) return `hace ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `hace ${Math.floor(diffInSeconds / 3600)} h`;
    if (diffInSeconds < 2592000) return `hace ${Math.floor(diffInSeconds / 86400)} días`;
    
    return date.toLocaleDateString();
}

// Utilidad: Escapar HTML para prevenir XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Limpiar listener cuando sea necesario
function cleanupComments() {
    if (commentsListener) {
        commentsListener();
    }
}
