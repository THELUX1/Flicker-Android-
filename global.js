// Función para manejar el botón "atrás"
function setupBackButton() {
    // Agregar una entrada al historial de navegación para la página principal
    window.history.pushState({ page: "main" }, "", "index.html");

    // Manejar el evento de retroceso
    window.onpopstate = function (event) {
        if (event.state && event.state.page === "main") {
            // Redirigir a la página principal
            window.location.href = "index.html";
        } else {
            // Si el usuario presiona "atrás" de nuevo, salir de la página
            window.history.back();
        }
    };
}

// Inicializar la función cuando la página cargue
document.addEventListener("DOMContentLoaded", function () {
    // Verificar si no estamos en la página principal (index.html)
    if (window.location.pathname !== "/index.html" && window.location.pathname !== "/") {
        setupBackButton();
    }
});