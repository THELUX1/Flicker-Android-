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
const qualityBadge = document.getElementById('quality-badge');
const qualityMenu = document.getElementById('quality-menu');
const qualityOptions = document.getElementById('quality-options');
const playPauseBtn = document.getElementById('play-pause-btn');
const playIcon = playPauseBtn.querySelector('.play-icon');
const pauseIcon = playPauseBtn.querySelector('.pause-icon');
const skipBackBtn = document.getElementById('skip-back-btn');
const skipForwardBtn = document.getElementById('skip-forward-btn');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');
const progressBar = document.getElementById('progress-bar');
const progressFilled = document.getElementById('progress-filled');
const progressBuffer = document.getElementById('progress-buffer');
const progressThumb = document.getElementById('progress-thumb');
const volumeBtn = document.getElementById('volume-btn');
const volumeHigh = volumeBtn.querySelector('.volume-high');
const volumeMute = volumeBtn.querySelector('.volume-mute');
const volumeSliderContainer = document.getElementById('volume-slider-container');
const volumeSlider = document.getElementById('volume-slider');
const volumeLevel = document.getElementById('volume-level');
const volumeThumb = document.getElementById('volume-thumb');
const fullscreenBtn = document.getElementById('fullscreen-btn');
const fullscreenEnter = fullscreenBtn.querySelector('.fullscreen-enter');
const fullscreenExit = fullscreenBtn.querySelector('.fullscreen-exit');
const watchingNotification = document.getElementById('watching-notification');
const watchingText = document.getElementById('watching-text');
const gestureOverlay = document.getElementById('gesture-overlay');

// Variables de estado
let currentMovieId = null;
let currentSources = [];
let currentQuality = 'HD';
let movieData = null;
let isSeeking = false;
let isVolumeSliding = false;
let controlsTimeout = null;
let isFullscreen = false;
let isControlsVisible = false;
let savedProgress = 0;
let hasShownContinueDialog = false;
let isVolumeMenuOpen = false;
let lastTapTime = 0;
let doubleTapTimeout = null;
let gestureFeedback = null;

// Inicializar el reproductor
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const movieId = urlParams.get('id');
    
    if (!movieId) {
        showError('ID de película no especificado');
        return;
    }
    
    // Cargar progreso guardado
    loadSavedProgress(movieId);
    
    loadMovie(movieId);
    setupEventListeners();
    setupVideoEvents();
    setupGestureControls();
    
    // Crear elemento de feedback para gestos
    createGestureFeedback();
});

// Crear elemento de feedback para gestos
function createGestureFeedback() {
    gestureFeedback = document.createElement('div');
    gestureFeedback.className = 'gesture-feedback';
    gestureFeedback.innerHTML = `
        <div class="gesture-icon"></div>
        <div class="gesture-text"></div>
    `;
    gestureFeedback.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        display: none;
        align-items: center;
        gap: 0.75rem;
        z-index: 10000;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
    `;
    document.body.appendChild(gestureFeedback);
}

// Cargar progreso guardado desde localStorage
function loadSavedProgress(movieId) {
    const progressData = localStorage.getItem(`movieProgress_${movieId}`);
    if (progressData) {
        const data = JSON.parse(progressData);
        // Solo cargar progreso si la película se vio por más de 30 segundos
        if (data.progress > 30 && data.progress < data.duration - 60) {
            savedProgress = data.progress;
        }
    }
}

// Guardar progreso en localStorage
function saveProgress(movieId, currentTime, duration) {
    const progressData = {
        progress: currentTime,
        duration: duration,
        timestamp: Date.now(),
        movieId: movieId
    };
    localStorage.setItem(`movieProgress_${movieId}`, JSON.stringify(progressData));
}

// Mostrar diálogo para continuar o reiniciar
function showContinueDialog() {
    if (hasShownContinueDialog || savedProgress === 0) return;
    
    const dialog = document.createElement('div');
    dialog.className = 'continue-dialog';
    dialog.innerHTML = `
        <div class="dialog-content">
            <div class="dialog-icon">🎬</div>
            <h3>¿Continuar viendo?</h3>
            <p>Tienes progreso guardado de esta película. ¿Quieres continuar desde donde quedaste o empezar de nuevo?</p>
            <div class="dialog-buttons">
                <button class="dialog-btn continue-btn">Continuar</button>
                <button class="dialog-btn restart-btn">Empezar de nuevo</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(dialog);
    
    // Event listeners para los botones
    dialog.querySelector('.continue-btn').addEventListener('click', () => {
        videoPlayer.currentTime = savedProgress;
        videoPlayer.play();
        dialog.remove();
        hasShownContinueDialog = true;
        showControls();
        resetControlsTimeout();
    });
    
    dialog.querySelector('.restart-btn').addEventListener('click', () => {
        // Limpiar progreso guardado
        localStorage.removeItem(`movieProgress_${currentMovieId}`);
        savedProgress = 0;
        videoPlayer.currentTime = 0;
        videoPlayer.play();
        dialog.remove();
        hasShownContinueDialog = true;
        showControls();
        resetControlsTimeout();
    });
    
    // Mostrar diálogo con animación
    setTimeout(() => {
        dialog.classList.add('show');
    }, 100);
}

// Configurar event listeners
function setupEventListeners() {
    // Navegación
    playerBackBtn.addEventListener('click', () => {
        if (isFullscreen) {
            exitFullscreen();
        }
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
        toggleQualityMenu();
        showControls();
        resetControlsTimeout();
    });
    
    // Play/Pause
    playPauseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePlayPause();
        showControls();
        resetControlsTimeout();
    });
    
    // Skip controls
    skipBackBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        skipBackward();
        showControls();
        resetControlsTimeout();
    });
    
    skipForwardBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        skipForward();
        showControls();
        resetControlsTimeout();
    });
    
    // Volumen
    volumeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleVolumeMenu();
        showControls();
        resetControlsTimeout();
    });
    
    // Pantalla completa
    fullscreenBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isFullscreen) {
            exitFullscreen();
        } else {
            enterFullscreen();
        }
        showControls();
        resetControlsTimeout();
    });
    
    // Barra de progreso
    progressBar.addEventListener('click', (e) => {
        if (!videoPlayer.duration) return;
        
        const rect = progressBar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        videoPlayer.currentTime = percent * videoPlayer.duration;
        showControls();
        resetControlsTimeout();
    });
    
    let isDragging = false;
    
    progressBar.addEventListener('mousedown', (e) => {
        isDragging = true;
        startSeeking(e);
        showControls();
    });
    
    progressBar.addEventListener('touchstart', (e) => {
        isDragging = true;
        startSeeking(e);
        showControls();
    });
    
    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            handleSeeking(e);
            showControls();
        }
    });
    
    document.addEventListener('touchmove', (e) => {
        if (isDragging) {
            handleSeeking(e);
            showControls();
        }
    });
    
    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            stopSeeking();
            resetControlsTimeout();
        }
    });
    
    document.addEventListener('touchend', () => {
        if (isDragging) {
            isDragging = false;
            stopSeeking();
            resetControlsTimeout();
        }
    });
    
    // Volume slider
    setupVolumeSlider();
    
    // Mostrar controles al mover el mouse o tocar
    videoContainer.addEventListener('mousemove', () => {
        if (!videoPlayer.paused) {
            showControls();
            resetControlsTimeout();
        }
    });
    
    videoContainer.addEventListener('touchstart', () => {
        if (!videoPlayer.paused) {
            showControls();
            resetControlsTimeout();
        }
    });
    
    // Toggle play/pause al hacer click en el video
    videoContainer.addEventListener('click', (e) => {
        // Solo toggle play/pause si no se hizo click en un control
        if (!e.target.closest('.control-btn') && 
            !e.target.closest('.quality-menu') && 
            !e.target.closest('.progress-container') &&
            !e.target.closest('.volume-slider-container')) {
            togglePlayPause();
            showControls();
            resetControlsTimeout();
        }
    });
    
    // Cerrar menús al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (!qualityBtn.contains(e.target) && !qualityMenu.contains(e.target)) {
            hideQualityMenu();
        }
        
        if (!volumeBtn.contains(e.target) && !volumeSliderContainer.contains(e.target)) {
            hideVolumeMenu();
        }
    });
    
    // Teclado
    document.addEventListener('keydown', handleKeyboard);
    
    // Detectar cambios de pantalla completa
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);
    
    // Detectar cambios de orientación sin recargar
    window.addEventListener('orientationchange', handleOrientationChange);
    screen.orientation?.addEventListener('change', handleOrientationChange);
}

// Configurar controles de gestos para móviles
function setupGestureControls() {
    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let currentY = 0;
    let isSwiping = false;
    let swipeType = null; // 'volume', 'brightness', 'seek'
    
    gestureOverlay.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            currentX = startX;
            currentY = startY;
            isSwiping = true;
            
            // Detectar doble tap
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTapTime;
            if (tapLength < 300 && tapLength > 0) {
                // Doble tap detectado
                clearTimeout(doubleTapTimeout);
                handleDoubleTap(e);
                lastTapTime = 0;
            } else {
                doubleTapTimeout = setTimeout(() => {
                    lastTapTime = currentTime;
                }, 300);
            }
        }
    });
    
    gestureOverlay.addEventListener('touchmove', (e) => {
        if (!isSwiping || e.touches.length !== 1) return;
        
        currentX = e.touches[0].clientX;
        currentY = e.touches[0].clientY;
        
        const deltaX = currentX - startX;
        const deltaY = currentY - startY;
        
        // Determinar tipo de gesto después de un umbral mínimo
        if (!swipeType && (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)) {
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                swipeType = 'seek';
            } else {
                // Izquierda: brillo, Derecha: volumen
                if (startX < window.innerWidth / 2) {
                    swipeType = 'brightness';
                } else {
                    swipeType = 'volume';
                }
            }
        }
        
        if (swipeType === 'seek') {
            handleSeekGesture(deltaX);
        } else if (swipeType === 'volume') {
            handleVolumeGesture(deltaY);
        } else if (swipeType === 'brightness') {
            handleBrightnessGesture(deltaY);
        }
        
        showControls();
        resetControlsTimeout();
    });
    
    gestureOverlay.addEventListener('touchend', () => {
        if (isSwiping) {
            isSwiping = false;
            swipeType = null;
            hideGestureFeedback();
        }
    });
}

function handleDoubleTap(e) {
    const tapX = e.touches ? e.touches[0].clientX : e.clientX;
    const screenWidth = window.innerWidth;
    
    if (tapX < screenWidth / 2) {
        // Tap izquierdo: retroceder 10s
        skipBackward();
    } else {
        // Tap derecho: avanzar 10s
        skipForward();
    }
    
    showControls();
    resetControlsTimeout();
}

function handleSeekGesture(deltaX) {
    if (!videoPlayer.duration) return;
    
    const seekAmount = (deltaX / window.innerWidth) * videoPlayer.duration * 0.5;
    const newTime = Math.max(0, Math.min(videoPlayer.duration, videoPlayer.currentTime + seekAmount));
    
    // Mostrar feedback visual del seek
    showSeekFeedback(seekAmount > 0 ? 'forward' : 'backward', Math.abs(seekAmount));
    
    // Aplicar el seek
    videoPlayer.currentTime = newTime;
}

function handleVolumeGesture(deltaY) {
    const volumeChange = -deltaY / window.innerHeight;
    const newVolume = Math.max(0, Math.min(1, videoPlayer.volume + volumeChange));
    videoPlayer.volume = newVolume;
    updateVolumeSlider();
    updateVolumeIcon();
    
    // Mostrar feedback visual del volumen
    showVolumeFeedback(newVolume);
}

function handleBrightnessGesture(deltaY) {
    // Nota: El control de brillo requiere una API específica que puede no estar disponible
    // Esta es una implementación de ejemplo
    const brightnessChange = -deltaY / window.innerHeight;
    // En una implementación real, aquí controlarías el brillo de la pantalla
    console.log('Brightness change:', brightnessChange);
    showBrightnessFeedback(brightnessChange);
}

function showSeekFeedback(direction, amount) {
    if (!gestureFeedback) return;
    
    const seconds = Math.round(amount);
    const icon = direction === 'forward' ? '⏩' : '⏪';
    
    gestureFeedback.querySelector('.gesture-icon').textContent = icon;
    gestureFeedback.querySelector('.gesture-text').textContent = `${seconds}s`;
    gestureFeedback.style.display = 'flex';
    
    // Auto-ocultar después de 1 segundo
    clearTimeout(gestureFeedback.timeout);
    gestureFeedback.timeout = setTimeout(() => {
        gestureFeedback.style.display = 'none';
    }, 1000);
}

function showVolumeFeedback(volume) {
    if (!gestureFeedback) return;
    
    const level = Math.round(volume * 100);
    const icon = volume === 0 ? '🔇' : volume < 0.5 ? '🔈' : '🔊';
    
    gestureFeedback.querySelector('.gesture-icon').textContent = icon;
    gestureFeedback.querySelector('.gesture-text').textContent = `${level}%`;
    gestureFeedback.style.display = 'flex';
    
    // Auto-ocultar después de 1 segundo
    clearTimeout(gestureFeedback.timeout);
    gestureFeedback.timeout = setTimeout(() => {
        gestureFeedback.style.display = 'none';
    }, 1000);
}

function showBrightnessFeedback(change) {
    if (!gestureFeedback) return;
    
    const icon = change > 0 ? '🔆' : '🔅';
    
    gestureFeedback.querySelector('.gesture-icon').textContent = icon;
    gestureFeedback.querySelector('.gesture-text').textContent = 'Brillo';
    gestureFeedback.style.display = 'flex';
    
    // Auto-ocultar después de 1 segundo
    clearTimeout(gestureFeedback.timeout);
    gestureFeedback.timeout = setTimeout(() => {
        gestureFeedback.style.display = 'none';
    }, 1000);
}

function hideGestureFeedback() {
    if (gestureFeedback) {
        gestureFeedback.style.display = 'none';
    }
}

function skipBackward() {
    if (!videoPlayer.duration) return;
    videoPlayer.currentTime = Math.max(0, videoPlayer.currentTime - 10);
    showSeekFeedback('backward', 10);
}

function skipForward() {
    if (!videoPlayer.duration) return;
    videoPlayer.currentTime = Math.min(videoPlayer.duration, videoPlayer.currentTime + 10);
    showSeekFeedback('forward', 10);
}

// Configurar el control deslizante de volumen
function setupVolumeSlider() {
    volumeSlider.addEventListener('mousedown', startVolumeSliding);
    volumeSlider.addEventListener('touchstart', startVolumeSliding);
    
    document.addEventListener('mousemove', handleVolumeSliding);
    document.addEventListener('touchmove', handleVolumeSliding);
    
    document.addEventListener('mouseup', stopVolumeSliding);
    document.addEventListener('touchend', stopVolumeSliding);
}

function startVolumeSliding(e) {
    isVolumeSliding = true;
    handleVolumeSliding(e);
    showVolumeMenu();
}

function handleVolumeSliding(e) {
    if (!isVolumeSliding) return;
    
    const rect = volumeSlider.getBoundingClientRect();
    const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    
    videoPlayer.volume = percent;
    updateVolumeSlider();
    updateVolumeIcon();
}

function stopVolumeSliding() {
    isVolumeSliding = false;
}

function updateVolumeSlider() {
    const percent = videoPlayer.volume * 100;
    volumeLevel.style.width = `${percent}%`;
    volumeThumb.style.left = `${percent}%`;
}

// Control del menú de volumen
function toggleVolumeMenu() {
    if (isVolumeMenuOpen) {
        hideVolumeMenu();
    } else {
        showVolumeMenu();
    }
}

function showVolumeMenu() {
    volumeSliderContainer.classList.add('visible');
    isVolumeMenuOpen = true;
    updateVolumeSlider();
}

function hideVolumeMenu() {
    volumeSliderContainer.classList.remove('visible');
    isVolumeMenuOpen = false;
}

// Control del menú de calidad
function toggleQualityMenu() {
    if (qualityMenu.classList.contains('visible')) {
        hideQualityMenu();
    } else {
        showQualityMenu();
    }
}

function showQualityMenu() {
    qualityMenu.classList.add('visible');
}

function hideQualityMenu() {
    qualityMenu.classList.remove('visible');
}

// Manejar cambio de orientación
function handleOrientationChange() {
    // No recargar el video, solo ajustar la UI si es necesario
    console.log('Orientación cambiada:', screen.orientation?.type);
    // El video sigue reproduciéndose sin interrupciones
}

// Entrar en pantalla completa con rotación horizontal
function enterFullscreen() {
    const element = videoContainer;
    
    // Intentar bloquear orientación horizontal
    if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(error => {
            console.log('No se pudo bloquear la orientación:', error);
        });
    }
    
    // Entrar en pantalla completa
    if (element.requestFullscreen) {
        element.requestFullscreen().catch(error => {
            console.log('Error al entrar en pantalla completa:', error);
        });
    } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
    }
}

// Salir de pantalla completa
function exitFullscreen() {
    // Desbloquear orientación
    if (screen.orientation && screen.orientation.unlock) {
        screen.orientation.unlock();
    }
    
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
    }
}

// Manejar cambios de pantalla completa
function handleFullscreenChange() {
    const wasFullscreen = isFullscreen;
    isFullscreen = !!document.fullscreenElement;
    
    if (isFullscreen && !wasFullscreen) {
        // Acaba de entrar en pantalla completa
        fullscreenEnter.style.display = 'none';
        fullscreenExit.style.display = 'block';
        
        // Intentar bloquear orientación cuando entre en pantalla completa
        if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('landscape').catch(error => {
                console.log('No se pudo bloquear la orientación:', error);
            });
        }
    } else if (!isFullscreen && wasFullscreen) {
        // Acaba de salir de pantalla completa
        fullscreenEnter.style.display = 'block';
        fullscreenExit.style.display = 'none';
        
        // Desbloquear orientación al salir de pantalla completa
        if (screen.orientation && screen.orientation.unlock) {
            screen.orientation.unlock();
        }
    }
}

// Configurar eventos del video
function setupVideoEvents() {
    videoPlayer.addEventListener('loadstart', () => {
        customLoader.style.display = 'flex';
        errorOverlay.style.display = 'none';
        hideControls();
    });
    
    videoPlayer.addEventListener('loadeddata', () => {
        // El video está cargado, mostrar diálogo si hay progreso guardado
        if (savedProgress > 0 && !hasShownContinueDialog) {
            showContinueDialog();
        }
    });
    
    videoPlayer.addEventListener('canplay', () => {
        customLoader.style.display = 'none';
        updateDuration();
        
        // Mostrar controles temporalmente al cargar
        showControlsTemporarily();
        
        // Si no hay progreso guardado o el usuario eligió no continuar, reproducir desde el inicio
        if (savedProgress === 0 || hasShownContinueDialog) {
            videoPlayer.play().catch(error => {
                console.log('Reproducción automática bloqueada:', error);
                showControls();
            });
        }
    });
    
    videoPlayer.addEventListener('playing', () => {
        videoContainer.classList.add('playing');
        videoContainer.classList.remove('paused');
        hideControlsAfterTimeout();
    });
    
    videoPlayer.addEventListener('pause', () => {
        videoContainer.classList.add('paused');
        videoContainer.classList.remove('playing');
        showControls();
        
        // Guardar progreso al pausar
        if (currentMovieId && videoPlayer.duration) {
            saveProgress(currentMovieId, videoPlayer.currentTime, videoPlayer.duration);
        }
    });
    
    videoPlayer.addEventListener('timeupdate', () => {
        updateProgress();
        
        // Guardar progreso cada 10 segundos
        if (currentMovieId && videoPlayer.duration && Math.floor(videoPlayer.currentTime) % 10 === 0) {
            saveProgress(currentMovieId, videoPlayer.currentTime, videoPlayer.duration);
        }
    });
    
    videoPlayer.addEventListener('volumechange', updateVolumeIcon);
    
    videoPlayer.addEventListener('waiting', () => {
        customLoader.style.display = 'flex';
        showControls();
    });
    
    videoPlayer.addEventListener('seeking', () => {
        customLoader.style.display = 'flex';
        showControls();
    });
    
    videoPlayer.addEventListener('seeked', () => {
        customLoader.style.display = 'none';
        hideControlsAfterTimeout();
    });
    
    videoPlayer.addEventListener('error', () => {
        customLoader.style.display = 'none';
        errorOverlay.style.display = 'flex';
        showControls();
    });
    
    videoPlayer.addEventListener('ended', () => {
        videoContainer.classList.add('paused');
        videoContainer.classList.remove('playing');
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
        showControls();
        
        // Limpiar progreso guardado cuando termine la película
        if (currentMovieId) {
            localStorage.removeItem(`movieProgress_${currentMovieId}`);
        }
    });
    
    // Progress buffer events
    videoPlayer.addEventListener('progress', () => {
        updateBufferProgress();
    });
    
    // Guardar progreso cuando se cierre la página
    window.addEventListener('beforeunload', () => {
        if (currentMovieId && videoPlayer.duration && !videoPlayer.ended) {
            saveProgress(currentMovieId, videoPlayer.currentTime, videoPlayer.duration);
        }
    });
    
    // Guardar progreso cuando se cambie de pestaña
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && currentMovieId && videoPlayer.duration && !videoPlayer.ended) {
            saveProgress(currentMovieId, videoPlayer.currentTime, videoPlayer.duration);
        }
    });
}

// Actualizar progreso del buffer
function updateBufferProgress() {
    if (videoPlayer.buffered.length > 0 && videoPlayer.duration > 0) {
        const bufferedEnd = videoPlayer.buffered.end(videoPlayer.buffered.length - 1);
        const bufferPercent = (bufferedEnd / videoPlayer.duration) * 100;
        progressBuffer.style.width = `${bufferPercent}%`;
    }
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
    if (!isControlsVisible) {
        customControls.classList.add('visible');
        isControlsVisible = true;
    }
    clearTimeout(controlsTimeout);
}

// Ocultar controles
function hideControls() {
    if (isControlsVisible) {
        customControls.classList.remove('visible');
        isControlsVisible = false;
    }
    clearTimeout(controlsTimeout);
}

// Resetear timeout de controles
function resetControlsTimeout() {
    clearTimeout(controlsTimeout);
    if (!videoPlayer.paused && !isSeeking) {
        controlsTimeout = setTimeout(() => {
            if (!videoPlayer.paused && !isSeeking) {
                hideControls();
            }
        }, 3000);
    }
}

// Ocultar controles después de timeout
function hideControlsAfterTimeout() {
    resetControlsTimeout();
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
    }, 5000);
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
    
    // Actualizar badge de calidad
    qualityBadge.textContent = source.quality;
    
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
    qualityBadge.textContent = quality;
    loadVideoSource();
    setupQualityOptions();
    hideQualityMenu();
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
    progressBar.classList.add('active');
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
    progressBar.classList.remove('active');
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
            resetControlsTimeout();
            break;
        case 'f':
            e.preventDefault();
            if (isFullscreen) {
                exitFullscreen();
            } else {
                enterFullscreen();
            }
            showControls();
            resetControlsTimeout();
            break;
        case 'm':
            e.preventDefault();
            toggleMute();
            showControls();
            resetControlsTimeout();
            break;
        case 'arrowleft':
            e.preventDefault();
            skipBackward();
            showControls();
            resetControlsTimeout();
            break;
        case 'arrowright':
            e.preventDefault();
            skipForward();
            showControls();
            resetControlsTimeout();
            break;
        case 'arrowup':
            e.preventDefault();
            videoPlayer.volume = Math.min(1, videoPlayer.volume + 0.1);
            updateVolumeSlider();
            updateVolumeIcon();
            showControls();
            resetControlsTimeout();
            break;
        case 'arrowdown':
            e.preventDefault();
            videoPlayer.volume = Math.max(0, videoPlayer.volume - 0.1);
            updateVolumeSlider();
            updateVolumeIcon();
            showControls();
            resetControlsTimeout();
            break;
        case 'escape':
            if (isFullscreen) {
                e.preventDefault();
                exitFullscreen();
            }
            break;
        case 'c':
            e.preventDefault();
            if (isControlsVisible) {
                hideControls();
            } else {
                showControls();
                resetControlsTimeout();
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