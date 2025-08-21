let commentsListener = null;
let repliesListener = null;
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
        
        // ✅ Configurar botones de login
        setupLoginButtons();
        
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
        
        // Si no hay usuario, mostrar modal de login después de un tiempo
        if (!user) {
            setTimeout(showLoginModal, 3000);
        }
    });
}

// Mostrar modal de login
function showLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal && !currentUser) {
        modal.style.display = 'block';
    }
}

// Configurar botones de login
// ... código anterior sin cambios ...

// Configurar botones de login
function setupLoginButtons() {
    // Cerrar modal
    const closeBtn = document.querySelector('.close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            document.getElementById('login-modal').style.display = 'none';
        });
    }
    
    // Eliminado: Login con Google
    
    // Login con email
    const emailLoginBtn = document.getElementById('email-login');
    if (emailLoginBtn) {
        emailLoginBtn.addEventListener('click', () => {
            // En lugar de mostrar mensaje de desarrollo, ahora abrirá el formulario de email
            showEmailLoginForm();
        });
    }
    
    // Cerrar modal al hacer clic fuera
    window.addEventListener('click', (event) => {
        const modal = document.getElementById('login-modal');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Función para mostrar formulario de login con email
function showEmailLoginForm() {
    const modalContent = document.querySelector('.modal-content');
    modalContent.innerHTML = `
        <span class="close">&times;</span>
        <h2>Iniciar sesión con Email</h2>
        <div class="email-login-form">
            <div class="form-group">
                <label for="login-email">Email</label>
                <input type="email" id="login-email" placeholder="tu@email.com" required>
            </div>
            <div class="form-group">
                <label for="login-password">Contraseña</label>
                <input type="password" id="login-password" placeholder="Tu contraseña" required>
            </div>
            <button id="submit-email-login" class="email-login-btn">
                <i class="fas fa-envelope"></i> Iniciar sesión
            </button>
            <p class="login-note">¿No tienes cuenta? <a href="#" id="show-register">Regístrate aquí</a></p>
        </div>
    `;
    
    // Configurar eventos
    document.querySelector('.close').addEventListener('click', () => {
        document.getElementById('login-modal').style.display = 'none';
    });
    
    document.getElementById('submit-email-login').addEventListener('click', handleEmailLogin);
    document.getElementById('show-register').addEventListener('click', showRegisterForm);
}

// Función para mostrar formulario de registro
function showRegisterForm(e) {
    e.preventDefault();
    const modalContent = document.querySelector('.modal-content');
    modalContent.innerHTML = `
        <span class="close">&times;</span>
        <h2>Crear cuenta</h2>
        <div class="email-login-form">
            <div class="form-group">
                <label for="register-name">Nombre</label>
                <input type="text" id="register-name" placeholder="Tu nombre" required>
            </div>
            <div class="form-group">
                <label for="register-email">Email</label>
                <input type="email" id="register-email" placeholder="tu@email.com" required>
            </div>
            <div class="form-group">
                <label for="register-password">Contraseña</label>
                <input type="password" id="register-password" placeholder="Mínimo 6 caracteres" required>
            </div>
            <button id="submit-register" class="email-login-btn">
                <i class="fas fa-user-plus"></i> Crear cuenta
            </button>
            <p class="login-note">¿Ya tienes cuenta? <a href="#" id="show-login">Inicia sesión aquí</a></p>
        </div>
    `;
    
    // Configurar eventos
    document.querySelector('.close').addEventListener('click', () => {
        document.getElementById('login-modal').style.display = 'none';
    });
    
    document.getElementById('submit-register').addEventListener('click', handleEmailRegister);
    document.getElementById('show-login').addEventListener('click', (e) => {
        e.preventDefault();
        showEmailLoginForm();
    });
}

// Función para manejar login con email
function handleEmailLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    if (!email || !password) {
        showAlert('Por favor, completa todos los campos', 'error');
        return;
    }
    
    // Iniciar sesión con Firebase
    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            document.getElementById('login-modal').style.display = 'none';
            showAlert('Sesión iniciada correctamente', 'success');
        })
        .catch((error) => {
            console.error("Error en login:", error);
            showAlert(getAuthErrorMessage(error), 'error');
        });
}

// Función para manejar registro con email
function handleEmailRegister() {
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    
    if (!name || !email || !password) {
        showAlert('Por favor, completa todos los campos', 'error');
        return;
    }
    
    if (password.length < 6) {
        showAlert('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }
    
    // Crear usuario con Firebase
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Actualizar perfil del usuario
            return userCredential.user.updateProfile({
                displayName: name
            });
        })
        .then(() => {
            document.getElementById('login-modal').style.display = 'none';
            showAlert('Cuenta creada correctamente', 'success');
        })
        .catch((error) => {
            console.error("Error en registro:", error);
            showAlert(getAuthErrorMessage(error), 'error');
        });
}

// Función para obtener mensajes de error legibles
function getAuthErrorMessage(error) {
    switch (error.code) {
        case 'auth/invalid-email':
            return 'El formato del email no es válido';
        case 'auth/user-disabled':
            return 'Esta cuenta ha sido deshabilitada';
        case 'auth/user-not-found':
            return 'No existe una cuenta con este email';
        case 'auth/wrong-password':
            return 'Contraseña incorrecta';
        case 'auth/email-already-in-use':
            return 'Este email ya está registrado';
        case 'auth/weak-password':
            return 'La contraseña es demasiado débil';
        default:
            return 'Error al autenticar. Intenta nuevamente.';
    }
}

// Función para mostrar alertas
function showAlert(message, type = 'info') {
    const alert = document.createElement('div');
    alert.className = `alert-toast ${type}`;
    alert.innerHTML = `
        <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 
                          type === 'success' ? 'check-circle' : 
                          type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(alert);
    
    // Eliminar el alert después de 3 segundos
    setTimeout(() => {
        if (alert.parentNode) {
            alert.parentNode.removeChild(alert);
        }
    }, 3000);
}

// Eliminado: función signInWithGoogle()

// ... resto del código sin cambios ...

// Actualizar UI basado en estado de autenticación
function updateCommentUI() {
    const commentInput = document.getElementById('comment-input');
    const submitButton = document.getElementById('submit-comment');
    
    if (currentUser) {
        commentInput.disabled = false;
        commentInput.placeholder = "Añade un comentario público...";
        submitButton.disabled = false;
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
        submitButton.disabled = length === 0 || length > 500 || !currentUser;
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
        userDisplayName: currentUser.displayName || "Usuario",
        userPhotoURL: currentUser.photoURL || "",
        mediaType: type,
        mediaId: id,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        likes: 0,
        likedBy: [],
        replyCount: 0
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
            ${comment.userPhotoURL ? 
                `<img src="${comment.userPhotoURL}" alt="${comment.userDisplayName}">` : 
                `<i class="fas fa-user"></i>`
            }
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
                <button class="comment-action-btn reply-btn" data-comment-id="${commentId}">
                    <i class="fas fa-reply"></i>
                    <span>Responder</span>
                </button>
                ${comment.replyCount > 0 ? `
                    <button class="comment-action-btn view-replies-btn" data-comment-id="${commentId}">
                        <i class="fas fa-comments"></i>
                        <span>Ver respuestas (${comment.replyCount})</span>
                    </button>
                ` : ''}
            </div>
            <div class="replies-container" id="replies-${commentId}"></div>
        </div>
    `;
    
    commentsList.appendChild(commentElement);
    
    // Configurar eventos
    const likeBtn = commentElement.querySelector('.like-btn');
    likeBtn.addEventListener('click', () => handleLike(commentId));
    
    const replyBtn = commentElement.querySelector('.reply-btn');
    replyBtn.addEventListener('click', () => showReplyForm(commentId, comment.userDisplayName));
    
    if (comment.replyCount > 0) {
        const viewRepliesBtn = commentElement.querySelector('.view-replies-btn');
        viewRepliesBtn.addEventListener('click', () => toggleReplies(commentId));
        
        // Cargar respuestas
        loadReplies(commentId);
    }
}

// Función para mostrar formulario de respuesta
function showReplyForm(commentId, username) {
    if (!currentUser) {
        showLoginModal();
        return;
    }
    
    // Ocultar otros formularios de respuesta
    document.querySelectorAll('.reply-form').forEach(form => form.remove());
    
    const replyContainer = document.querySelector(`#replies-${commentId}`);
    const replyForm = document.createElement('div');
    replyForm.className = 'reply-form';
    replyForm.innerHTML = `
        <div class="comment-form">
            <div class="user-avatar">
                ${currentUser.photoURL ? 
                    `<img src="${currentUser.photoURL}" alt="${currentUser.displayName}">` : 
                    `<i class="fas fa-user"></i>`
                }
            </div>
            <div class="comment-input-container">
                <textarea placeholder="Responder a ${username}..." maxlength="500"></textarea>
                <div class="comment-actions">
                    <span class="char-count">0/500</span>
                    <button class="submit-reply-btn" data-comment-id="${commentId}">Responder</button>
                    <button class="cancel-reply-btn">Cancelar</button>
                </div>
            </div>
        </div>
    `;
    
    replyContainer.appendChild(replyForm);
    
    // Configurar eventos del formulario de respuesta
    const textarea = replyForm.querySelector('textarea');
    const charCount = replyForm.querySelector('.char-count');
    const submitBtn = replyForm.querySelector('.submit-reply-btn');
    const cancelBtn = replyForm.querySelector('.cancel-reply-btn');
    
    textarea.addEventListener('input', function() {
        const length = this.value.length;
        charCount.textContent = `${length}/500`;
        submitBtn.disabled = length === 0 || length > 500;
    });
    
    submitBtn.addEventListener('click', () => {
        submitReply(commentId, textarea.value.trim());
    });
    
    cancelBtn.addEventListener('click', () => {
        replyForm.remove();
    });
}

// Función para enviar respuesta
function submitReply(commentId, text) {
    if (!text || !currentUser) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    const id = urlParams.get('id');
    
    if (!type || !id) return;
    
    // Crear respuesta
    const reply = {
        text: text,
        userId: currentUser.uid,
        userDisplayName: currentUser.displayName || "Usuario",
        userPhotoURL: currentUser.photoURL || "",
        mediaType: type,
        mediaId: id,
        parentCommentId: commentId,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        likes: 0,
        likedBy: []
    };
    
    const submitBtn = document.querySelector(`.submit-reply-btn[data-comment-id="${commentId}"]`);
    submitBtn.disabled = true;
    submitBtn.textContent = "Publicando...";
    
    // Guardar en Firestore
    db.collection("replies").add(reply)
        .then(() => {
            // Actualizar contador de respuestas en el comentario principal
            db.collection("comments").doc(commentId).update({
                replyCount: firebase.firestore.FieldValue.increment(1)
            });
            
            // Limpiar formulario
            document.querySelector(`#replies-${commentId} .reply-form`).remove();
        })
        .catch((error) => {
            console.error("Error al publicar respuesta:", error);
            alert("Error al publicar la respuesta. Intenta nuevamente.");
            submitBtn.disabled = false;
            submitBtn.textContent = "Responder";
        });
}

// Función para cargar respuestas
function loadReplies(commentId) {
    const repliesContainer = document.getElementById(`replies-${commentId}`);
    
    // Configurar listener en tiempo real para respuestas
    if (repliesListener) {
        repliesListener(); // Limpiar listener anterior
    }
    
    repliesListener = db.collection("replies")
        .where("parentCommentId", "==", commentId)
        .orderBy("timestamp", "asc")
        .onSnapshot((snapshot) => {
            repliesContainer.innerHTML = '';
            
            if (snapshot.empty) return;
            
            snapshot.forEach((doc) => {
                const reply = doc.data();
                addReplyToUI(reply, doc.id, commentId);
            });
        }, (error) => {
            console.error("Error al cargar respuestas:", error);
        });
}

// Alternar visualización de respuestas
function toggleReplies(commentId) {
    const repliesContainer = document.getElementById(`replies-${commentId}`);
    const viewRepliesBtn = document.querySelector(`.view-replies-btn[data-comment-id="${commentId}"]`);
    
    if (repliesContainer.style.display === 'none' || !repliesContainer.style.display) {
        repliesContainer.style.display = 'block';
        viewRepliesBtn.innerHTML = '<i class="fas fa-comments"></i> <span>Ocultar respuestas</span>';
    } else {
        repliesContainer.style.display = 'none';
        viewRepliesBtn.innerHTML = '<i class="fas fa-comments"></i> <span>Ver respuestas</span>';
    }
}

// Función para añadir respuesta a la UI
function addReplyToUI(reply, replyId, commentId) {
    const repliesContainer = document.getElementById(`replies-${commentId}`);
    
    const replyElement = document.createElement('div');
    replyElement.className = 'reply-item';
    
    const date = reply.timestamp ? reply.timestamp.toDate() : new Date();
    const timeAgo = getTimeAgo(date);
    
    replyElement.innerHTML = `
        <div class="comment-avatar">
            ${reply.userPhotoURL ? 
                `<img src="${reply.userPhotoURL}" alt="${reply.userDisplayName}">` : 
                `<i class="fas fa-user"></i>`
            }
        </div>
        <div class="comment-content">
            <div class="comment-header">
                <span class="comment-author">${reply.userDisplayName}</span>
                <span class="comment-time">${timeAgo}</span>
            </div>
            <p class="comment-text">${escapeHtml(reply.text)}</p>
            <div class="comment-actions">
                <button class="comment-action-btn like-reply-btn" data-reply-id="${replyId}">
                    <i class="fas fa-thumbs-up"></i>
                    <span>${reply.likes || 0}</span>
                </button>
            </div>
        </div>
    `;
    
    repliesContainer.appendChild(replyElement);
    
    // Configurar like para respuesta
    const likeBtn = replyElement.querySelector('.like-reply-btn');
    likeBtn.addEventListener('click', () => handleReplyLike(replyId));
}

// Función para manejar likes en respuestas
function handleReplyLike(replyId) {
    if (!currentUser) {
        showLoginModal();
        return;
    }
    
    const replyRef = db.collection("replies").doc(replyId);
    
    db.runTransaction((transaction) => {
        return transaction.get(replyRef).then((doc) => {
            if (!doc.exists) {
                throw new Error("La respuesta no existe");
            }
            
            const reply = doc.data();
            const likedBy = reply.likedBy || [];
            const userId = currentUser.uid;
            
            if (likedBy.includes(userId)) {
                // Quitar like
                transaction.update(replyRef, {
                    likes: (reply.likes || 0) - 1,
                    likedBy: firebase.firestore.FieldValue.arrayRemove(userId)
                });
            } else {
                // Añadir like
                transaction.update(replyRef, {
                    likes: (reply.likes || 0) + 1,
                    likedBy: firebase.firestore.FieldValue.arrayUnion(userId)
                });
            }
        });
    }).catch((error) => {
        console.error("Error al actualizar like:", error);
    });
}

// Función para manejar likes
function handleLike(commentId) {
    if (!currentUser) {
        showLoginModal();
        return;
    }
    
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

// Limpiar listeners cuando sea necesario
function cleanupComments() {
    if (commentsListener) {
        commentsListener();
    }
    if (repliesListener) {
        repliesListener();
    }
}