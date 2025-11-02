import { moviesLinks } from './movies-links.js';
import { moviesData } from './data.js';

// Elementos DOM
const videoPlayer = document.getElementById('video-player');
const videoContainer = document.getElementById('video-container');
const customLoader = document.getElementById('custom-loader');
const customControls = document.getElementById('custom-controls');
const errorOverlay = document.getElementById('error-overlay');
const retryBtn = document.getElementById('retry-btn');
const playerBackBtn = document.getElementById('player-back-btn');
const videoTitle = document.getElementById('video-title');
const qualityBtn = document.getElementById('quality-btn');
const qualityMenu = document.getElementById('quality-menu');
const qualityOptions = document.getElementById('quality-options');
const playPauseBtn = document.getElementById('play-pause-btn');
const playIcon = playPauseBtn.querySelector('.play-icon');
const pauseIcon = playPauseBtn.querySelector('.pause-icon');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');
const progressBar = document.getElementById('progress-bar');
const progressFilled = document.getElementById('progress-filled');
const progressThumb = document.getElementById('progress-thumb');
const volumeBtn = document.getElementById('volume-btn');
const volumeHigh = volumeBtn.querySelector('.volume-high');
const volumeMute = volumeBtn.querySelector('.volume-mute');
const fullscreenBtn = document.getElementById('fullscreen-btn');
const fullscreenEnter = fullscreenBtn.querySelector('.fullscreen-enter');
const fullscreenExit = fullscreenBtn.querySelector('.fullscreen-exit');
const watchingNotification = document.getElementById('watching-notification');
const watchingText = document.getElementById('watching-text');

// Variables de estado
let currentMovieId = null;
let currentSources = [];
let currentQuality = 'HD';
let movieData = null;
let isSeeking = false;
let controlsTimeout = null;
let isFullscreen = true; // Iniciar en pantalla completa

// Inicializar el reproductor
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const movieId = urlParams.get('id');
    
    if (!movieId) {
        showError('ID de película no especificado');
        return;
    }
    
    // Forzar orientación horizontal y pantalla completa
    lockOrientation();
    enterFullscreen();
    
    loadMovie(movieId);
    setupEventListeners();
    setupVideoEvents();
});

// Bloquear orientación horizontal
function lockOrientation() {
    if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(error => {
            console.log('No se pudo bloquear la orientación:', error);
        });
    }
    
    // Forzar estilo horizontal
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
}

// Entrar en pantalla completa automáticamente
function enterFullscreen() {
    if (videoContainer.requestFullscreen) {
        videoContainer.requestFullscreen().catch(error => {
            console.log('Error al entrar en pantalla completa:', error);
        });
    } else if (videoContainer.webkitRequestFullscreen) {
        videoContainer.webkitRequestFullscreen();
    } else if (videoContainer.msRequestFullscreen) {
        videoContainer.msRequestFullscreen();
    }
    
    isFullscreen = true;
    fullscreenEnter.style.display = 'none';
    fullscreenExit.style.display = 'block';
}

// Configurar event listeners
function setupEventListeners() {
    // Navegación
    playerBackBtn.addEventListener('click', () => {
        exitFullscreen();
        setTimeout(() => {
            window.history.back();
        }, 300);
    });
    
    // Reintentar
    retryBtn.addEventListener('click', () => {
        if (currentMovieId) {
            loadMovie(currentMovieId);
        }
    });
    
    // Calidad
    qualityBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        qualityMenu.style.display = qualityMenu.style.display === 'none' ? 'block' : 'none';
        showControls(); // Mostrar controles al interactuar con calidad
        hideControlsAfterTimeout(); // Y programar para ocultar
    });
    
    // Play/Pause
    playPauseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePlayPause();
        showControls(); // Mostrar controles al interactuar
        hideControlsAfterTimeout(); // Y programar para ocultar
    });
    
    // Volumen
    volumeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMute();
        showControls(); // Mostrar controles al interactuar
        hideControlsAfterTimeout(); // Y programar para ocultar
    });
    
    // Pantalla completa
    fullscreenBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isFullscreen) {
            exitFullscreen();
        } else {
            enterFullscreen();
        }
        showControls(); // Mostrar controles al interactuar
        hideControlsAfterTimeout(); // Y programar para ocultar
    });
    
    // Barra de progreso
    progressBar.addEventListener('click', (e) => {
        if (!videoPlayer.duration) return;
        
        const rect = progressBar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        videoPlayer.currentTime = percent * videoPlayer.duration;
        showControls(); // Mostrar controles al interactuar
        hideControlsAfterTimeout(); // Y programar para ocultar
    });
    
    progressBar.addEventListener('mousedown', (e) => {
        startSeeking(e);
        showControls(); // Mostrar controles durante seek
    });
    
    progressBar.addEventListener('touchstart', (e) => {
        startSeeking(e);
        showControls(); // Mostrar controles durante seek
    });
    
    document.addEventListener('mousemove', (e) => {
        if (isSeeking) {
            handleSeeking(e);
            showControls(); // Mantener controles visibles durante seek
        }
    });
    
    document.addEventListener('touchmove', (e) => {
        if (isSeeking) {
            handleSeeking(e);
            showControls(); // Mantener controles visibles durante seek
        }
    });
    
    document.addEventListener('mouseup', () => {
        if (isSeeking) {
            stopSeeking();
            hideControlsAfterTimeout(); // Ocultar después de seek
        }
    });
    
    document.addEventListener('touchend', () => {
        if (isSeeking) {
            stopSeeking();
            hideControlsAfterTimeout(); // Ocultar después de seek
        }
    });
    
    // Mostrar/ocultar controles con movimiento del mouse/touch
    videoContainer.addEventListener('mousemove', () => {
        if (!videoPlayer.paused) {
            showControls();
            hideControlsAfterTimeout();
        }
    });
    
    videoContainer.addEventListener('touchstart', () => {
        if (!videoPlayer.paused) {
            showControls();
            hideControlsAfterTimeout();
        }
    });
    
    videoContainer.addEventListener('click', (e) => {
        // Solo toggle play/pause si no se hizo click en un control
        if (!e.target.closest('.control-btn') && !e.target.closest('.quality-menu')) {
            togglePlayPause();
            showControls();
            hideControlsAfterTimeout();
        }
    });
    
    // Cerrar menús al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (!qualityBtn.contains(e.target) && !qualityMenu.contains(e.target)) {
            qualityMenu.style.display = 'none';
        }
    });
    
    // Teclado
    document.addEventListener('keydown', handleKeyboard);
    
    // Detectar cambios de pantalla completa
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);
    
    // Eventos para detectar inactividad
    document.addEventListener('mouseleave', () => {
        if (!videoPlayer.paused && !isSeeking) {
            hideControlsAfterTimeout();
        }
    });
}

// Salir de pantalla completa
function exitFullscreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
    }
    isFullscreen = false;
    fullscreenEnter.style.display = 'block';
    fullscreenExit.style.display = 'none';
}

// Manejar cambios de pantalla completa
function handleFullscreenChange() {
    isFullscreen = !!document.fullscreenElement;
    if (isFullscreen) {
        fullscreenEnter.style.display = 'none';
        fullscreenExit.style.display = 'block';
    } else {
        fullscreenEnter.style.display = 'block';
        fullscreenExit.style.display = 'none';
    }
}

// Configurar eventos del video
function setupVideoEvents() {
    videoPlayer.addEventListener('loadstart', () => {
        customLoader.style.display = 'flex';
        errorOverlay.style.display = 'none';
        customControls.style.display = 'none';
    });
    
    videoPlayer.addEventListener('canplay', () => {
        customLoader.style.display = 'none';
        customControls.style.display = 'flex';
        updateDuration();
        
        // Mostrar controles temporalmente y luego ocultar
        showControlsTemporarily();
        
        // Reproducir automáticamente cuando esté listo
        videoPlayer.play().catch(error => {
            console.log('Reproducción automática bloqueada:', error);
            // Si la reproducción automática falla, mantener controles visibles
            showControls();
        });
    });
    
    videoPlayer.addEventListener('playing', () => {
        videoContainer.classList.add('playing');
        videoContainer.classList.remove('paused');
        hideControlsAfterTimeout(); // Ocultar controles después de empezar a reproducir
    });
    
    videoPlayer.addEventListener('pause', () => {
        videoContainer.classList.add('paused');
        videoContainer.classList.remove('playing');
        showControls(); // Mostrar controles cuando se pausa
    });
    
    videoPlayer.addEventListener('timeupdate', updateProgress);
    videoPlayer.addEventListener('volumechange', updateVolumeIcon);
    
    videoPlayer.addEventListener('waiting', () => {
        customLoader.style.display = 'flex';
        showControls(); // Mostrar controles durante buffering
    });
    
    videoPlayer.addEventListener('seeking', () => {
        customLoader.style.display = 'flex';
        showControls(); // Mostrar controles durante seek
    });
    
    videoPlayer.addEventListener('seeked', () => {
        customLoader.style.display = 'none';
        hideControlsAfterTimeout(); // Ocultar después de seek
    });
    
    videoPlayer.addEventListener('error', () => {
        customLoader.style.display = 'none';
        errorOverlay.style.display = 'flex';
    });
    
    videoPlayer.addEventListener('ended', () => {
        videoContainer.classList.add('paused');
        videoContainer.classList.remove('playing');
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
        showControls(); // Mostrar controles al finalizar
    });
}

// Mostrar controles temporalmente (3 segundos)
function showControlsTemporarily() {
    showControls();
    setTimeout(() => {
        if (!videoPlayer.paused && !isSeeking) {
            hideControls();
        }
    }, 3000);
}

// Mostrar controles
function showControls() {
    customControls.classList.add('visible');
    clearTimeout(controlsTimeout);
}

// Ocultar controles
function hideControls() {
    customControls.classList.remove('visible');
}

// Ocultar controles después de timeout
function hideControlsAfterTimeout() {
    clearTimeout(controlsTimeout);
    if (!videoPlayer.paused && !isSeeking) {
        controlsTimeout = setTimeout(() => {
            if (!videoPlayer.paused && !isSeeking) {
                hideControls();
            }
        }, 3000);
    }
}

// Cargar película
function loadMovie(movieId) {
    currentMovieId = movieId;
    
    // Buscar en moviesLinks
    const movieLinks = moviesLinks[movieId];
    
    if (!movieLinks || !movieLinks.sources || movieLinks.sources.length === 0) {
        showError('Película no disponible');
        return;
    }
    
    // Buscar información adicional en moviesData
    movieData = moviesData.find(movie => movie.id.toString() === movieId);
    
    // Actualizar UI
    updateMovieInfo(movieLinks, movieData);
    
    // Mostrar notificación
    showWatchingNotification(movieLinks.title);
    
    // Cargar fuentes de video
    currentSources = movieLinks.sources;
    loadVideoSource();
    
    // Configurar opciones de calidad
    setupQualityOptions();
}

// Actualizar información de la película
function updateMovieInfo(movieLinks, movieData) {
    const title = movieLinks.title || (movieData ? movieData.title : 'Película');
    videoTitle.textContent = title;
}

// Mostrar notificación "Estás viendo"
function showWatchingNotification(title) {
    watchingText.textContent = `Estás viendo ${title}`;
    watchingNotification.classList.remove('hide');
    watchingNotification.classList.add('show');
    
    setTimeout(() => {
        watchingNotification.classList.remove('show');
        watchingNotification.classList.add('hide');
    }, 3000);
}

// Cargar fuente de video
function loadVideoSource() {
    const source = currentSources.find(s => s.quality === currentQuality) || currentSources[0];
    
    if (!source || !source.url) {
        showError('Fuente de video no disponible');
        return;
    }
    
    customLoader.style.display = 'flex';
    errorOverlay.style.display = 'none';
    
    // Configurar el video player
    videoPlayer.innerHTML = '';
    
    const sourceElement = document.createElement('source');
    sourceElement.src = source.url;
    
    // Detectar tipo MIME
    if (source.url.includes('.m3u8')) {
        sourceElement.type = 'application/x-mpegURL';
    } else if (source.url.includes('.mp4')) {
        sourceElement.type = 'video/mp4';
    } else if (source.url.includes('.webm')) {
        sourceElement.type = 'video/webm';
    }
    
    videoPlayer.appendChild(sourceElement);
    videoPlayer.load();
    
    // Intentar reproducir automáticamente
    const playPromise = videoPlayer.play();
    if (playPromise !== undefined) {
        playPromise.catch(error => {
            console.log('Reproducción automática bloqueada:', error);
            // Mostrar controles para que el usuario inicie manualmente
            showControls();
        });
    }
}

// Configurar opciones de calidad
function setupQualityOptions() {
    qualityOptions.innerHTML = '';
    
    currentSources.forEach(source => {
        const button = document.createElement('button');
        button.className = `quality-option ${source.quality === currentQuality ? 'active' : ''}`;
        button.textContent = source.quality;
        button.addEventListener('click', () => {
            changeQuality(source.quality);
        });
        qualityOptions.appendChild(button);
    });
}

// Cambiar calidad
function changeQuality(quality) {
    if (quality === currentQuality) return;
    
    currentQuality = quality;
    loadVideoSource();
    setupQualityOptions();
    qualityMenu.style.display = 'none';
}

// Toggle play/pause
function togglePlayPause() {
    if (videoPlayer.paused || videoPlayer.ended) {
        videoPlayer.play();
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'block';
    } else {
        videoPlayer.pause();
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
    }
    showControls();
}

// Toggle mute
function toggleMute() {
    videoPlayer.muted = !videoPlayer.muted;
    updateVolumeIcon();
}

// Actualizar icono de volumen
function updateVolumeIcon() {
    if (videoPlayer.muted || videoPlayer.volume === 0) {
        volumeHigh.style.display = 'none';
        volumeMute.style.display = 'block';
    } else {
        volumeHigh.style.display = 'block';
        volumeMute.style.display = 'none';
    }
}

// Toggle pantalla completa
function toggleFullscreen() {
    if (!isFullscreen) {
        enterFullscreen();
    } else {
        exitFullscreen();
    }
}

// Actualizar duración
function updateDuration() {
    const duration = videoPlayer.duration;
    if (duration) {
        durationEl.textContent = formatTime(duration);
    }
}

// Actualizar progreso
function updateProgress() {
    if (!videoPlayer.duration || isSeeking) return;
    
    const percent = (videoPlayer.currentTime / videoPlayer.duration) * 100;
    progressFilled.style.width = `${percent}%`;
    progressThumb.style.left = `${percent}%`;
    currentTimeEl.textContent = formatTime(videoPlayer.currentTime);
}

// Formatear tiempo
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// Buscar en el video
function startSeeking(e) {
    isSeeking = true;
    handleSeeking(e);
}

function handleSeeking(e) {
    if (!isSeeking || !videoPlayer.duration) return;
    
    const rect = progressBar.getBoundingClientRect();
    const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    
    progressFilled.style.width = `${percent * 100}%`;
    progressThumb.style.left = `${percent * 100}%`;
    currentTimeEl.textContent = formatTime(percent * videoPlayer.duration);
}

function stopSeeking() {
    if (!isSeeking || !videoPlayer.duration) return;
    
    isSeeking = false;
    const percent = parseFloat(progressFilled.style.width) / 100;
    videoPlayer.currentTime = percent * videoPlayer.duration;
}

// Manejar teclado
function handleKeyboard(e) {
    if (!videoPlayer) return;
    
    switch(e.key.toLowerCase()) {
        case ' ':
        case 'k':
            e.preventDefault();
            togglePlayPause();
            showControls();
            hideControlsAfterTimeout();
            break;
        case 'f':
            e.preventDefault();
            toggleFullscreen();
            showControls();
            hideControlsAfterTimeout();
            break;
        case 'm':
            e.preventDefault();
            toggleMute();
            showControls();
            hideControlsAfterTimeout();
            break;
        case 'arrowleft':
            e.preventDefault();
            videoPlayer.currentTime = Math.max(0, videoPlayer.currentTime - 10);
            showControls();
            hideControlsAfterTimeout();
            break;
        case 'arrowright':
            e.preventDefault();
            videoPlayer.currentTime = Math.min(videoPlayer.duration, videoPlayer.currentTime + 10);
            showControls();
            hideControlsAfterTimeout();
            break;
        case 'arrowup':
            e.preventDefault();
            videoPlayer.volume = Math.min(1, videoPlayer.volume + 0.1);
            updateVolumeIcon();
            showControls();
            hideControlsAfterTimeout();
            break;
        case 'arrowdown':
            e.preventDefault();
            videoPlayer.volume = Math.max(0, videoPlayer.volume - 0.1);
            updateVolumeIcon();
            showControls();
            hideControlsAfterTimeout();
            break;
        case 'escape':
            // No hacer nada con Escape para mantener pantalla completa
            e.preventDefault();
            break;
        case 'c':
            // Tecla 'c' para mostrar/ocultar controles manualmente
            e.preventDefault();
            if (customControls.classList.contains('visible')) {
                hideControls();
            } else {
                showControls();
                hideControlsAfterTimeout();
            }
            break;
    }
}

// Mostrar error
function showError(message) {
    customLoader.style.display = 'none';
    errorOverlay.style.display = 'flex';
    console.error('Error en el reproductor:', message);
}