// Verificar si estamos en index.html
const isIndexPage = window.location.pathname.endsWith('index.html') || 
                    window.location.pathname.endsWith('/');

if (isIndexPage) {
    document.addEventListener('DOMContentLoaded', function() {
        // ================= CONFIGURACIÓN DEL SISTEMA =================
        // Crear contenedor de notificaciones
        const toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 9999;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
            pointer-events: none;
        `;
        document.body.appendChild(toastContainer);

        // Añadir estilos CSS
        const style = document.createElement('style');
        style.textContent = `
            .movie-notification {
                background: rgba(20, 20, 20, 0.97);
                color: white;
                padding: 16px 20px;
                border-radius: 10px;
                display: flex;
                align-items: center;
                gap: 16px;
                max-width: 380px;
                width: max-content;
                box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
                border-left: 5px solid #FFA500;
                animation: toastIn 0.4s ease-out forwards;
                pointer-events: auto;
            }
            
            .movie-notification img {
                width: 70px;
                height: 100px;
                object-fit: cover;
                border-radius: 6px;
            }
            
            .notification-info {
                flex: 1;
                min-width: 0;
            }
            
            .notification-header {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 6px;
            }
            
            .notification-badge {
                background: #FFA500;
                color: black;
                font-size: 12px;
                font-weight: bold;
                padding: 3px 8px;
                border-radius: 12px;
                text-transform: uppercase;
            }
            
            .notification-title {
                font-weight: 700;
                font-size: 18px;
                margin-bottom: 6px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            .notification-details {
                font-size: 14px;
                opacity: 0.9;
                display: flex;
                gap: 10px;
            }
            
            @keyframes toastIn {
                from {
                    opacity: 0;
                    transform: translateY(30px) scale(0.95);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }
            
            @keyframes toastOut {
                to {
                    opacity: 0;
                    transform: translateY(-30px) scale(0.95);
                }
            }
        `;
        document.head.appendChild(style);

        // ================= EJEMPLO DE PELÍCULA =================
        const ejemploPelicula = {
            title: "Duna: Parte Dos",
            duration: "2h 46m",
            genre: "Ciencia ficción",
            imageUrl: "https://image.tmdb.org/t/p/w200/d5NXSklXo0qyIYkgV94XAgMIckC.jpg",
            description: "Sigue el viaje de Paul Atreides mientras se une a los Fremen para vengar a su familia."
        };

        // ================= FUNCIONALIDAD =================
        let activeNotification = null;

        // Función pública para mostrar notificaciones
        window.showMovieNotification = function({title, duration, genre, imageUrl}) {
    // Evitar que se muestre más de una vez
    if (localStorage.getItem('movieNotificationShown') === 'true') {
        return;
    }

    // Guardar que ya se mostró
    localStorage.setItem('movieNotificationShown', 'true');

    // Eliminar notificación anterior si existe
    if (activeNotification) {
        activeNotification.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = 'movie-notification';
    
    const defaultImg = 'data:image/svg+xml;base64,...'; // tu imagen por defecto
    
    toast.innerHTML = `
        <img src="${imageUrl || defaultImg}" onerror="this.src='${defaultImg}'">
        <div class="notification-info">
            <div class="notification-header">
                <span class="notification-badge">Recién agregada</span>
            </div>
            <div class="notification-title">${title}</div>
            <div class="notification-details">
                <span>${duration}</span>
                <span>•</span>
                <span>${genre}</span>
            </div>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    activeNotification = toast;

    setTimeout(() => {
        toast.style.animation = 'toastOut 0.3s ease-out forwards';
        toast.addEventListener('animationend', () => {
            toast.remove();
            if (activeNotification === toast) {
                activeNotification = null;
            }
        });
    }, 8000);
};

        // ================= EJEMPLO DE USO =================
        // Para probar manualmente desde la consola:
        window.mostrarEjemplo = function() {
            showMovieNotification(ejemploPelicula);
        };
        
        // O para mostrar automáticamente al cargar (solo en desarrollo):
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            setTimeout(() => {
                showMovieNotification(ejemploPelicula);
            }, 1500);
        }
    });
}
