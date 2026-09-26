# 🧠 ¿Quién conoce mejor a...? — Juego multijugador

Juego de fiesta para adivinar qué tan bien conocés a alguien.
- El **host** crea la sala, carga preguntas y maneja el ritmo.
- Los **jugadores** entran con un código desde el celu.
- La **Pantalla Grande (TV)** muestra el ranking en vivo, carteles y sonidos.

## 🚀 Demo / Deploy en GitHub Pages

1. Forkeá o cloná este repo.
2. Configurá tu proyecto de Firebase (ver abajo).
3. Activá GitHub Pages: Settings → Pages → Source: `main` / `root`.
4. Listo: `https://TU_USUARIO.github.io/quien-conoce-mejor/`

## 🔥 Firebase Setup

1. Entrá a [console.firebase.google.com](https://console.firebase.google.com), creá un proyecto.
2. Activá **Realtime Database** en modo test.
3. Copiá las credenciales en `firebase-config.js`.
4. Reglas recomendadas (desarrollo):
   ```json
   {
     "rules": {
       "salas": {
         "$salaId": {
           ".read": true,
           ".write": true
         }
       }
     }
   }