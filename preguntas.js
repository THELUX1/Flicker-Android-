// preguntas.js
// ============================================================
// Preguntas de EJEMPLO que el host puede cargar rápido.
// El juego realmente usa las preguntas que se guardan en
// /salas/{id}/preguntas (cargadas desde el panel del host).
// ============================================================

export const PREGUNTAS_EJEMPLO = [
  {
    pregunta: "¿Cuál es su comida favorita?",
    opciones: ["Pizza", "Sushi", "Asado", "Pastas"],
    correcta: 1,
    explicacion: "Dijo sushi porque podría comerlo todos los días."
  },
  {
    pregunta: "¿Qué canción podría escuchar 20 veces seguidas?",
    opciones: ["Bohemian Rhapsody", "Tití Me Preguntó", "Yellow", "Ciudad Mágica"],
    correcta: 3,
    explicacion: "La escucha siempre en el auto."
  },
  {
    pregunta: "¿Qué cosa le da más paja hacer?",
    opciones: ["Lavar platos", "Ir al gimnasio", "Responder mensajes", "Estudiar"],
    correcta: 2,
    explicacion: "Deja todos los chats en visto por días."
  },
  {
    pregunta: "¿Qué suele pedir cuando tiene hambre a las 2 AM?",
    opciones: ["Pizza", "Hamburguesa", "Empanadas", "Fideos"],
    correcta: 1,
    explicacion: "Siempre termina pidiendo una hamburguesa doble."
  },
  {
    pregunta: "Si pudiera viajar mañana, ¿a dónde iría?",
    opciones: ["Japón", "París", "Nueva York", "Bariloche"],
    correcta: 0,
    explicacion: "Sueña con ir a Japón desde hace años."
  },
  {
    pregunta: "¿Qué compraría aunque no lo necesite?",
    opciones: ["Zapatillas", "Libros", "Plantas", "Tecnología"],
    correcta: 0,
    explicacion: "Tiene 30 pares y sigue comprando."
  },
  {
    pregunta: "¿Qué haría primero si le regalaran $1.000.000?",
    opciones: ["Comprar ropa", "Viajar", "Comprar un auto", "Guardarlo"],
    correcta: 1,
    explicacion: "Viajar, sin dudarlo."
  },
  {
    pregunta: "¿Cuál es una frase que dice muchísimo?",
    opciones: ["'Posta'", "'Literal'", "'Nada que ver'", "'Todo bien'"],
    correcta: 1,
    explicacion: "Dice 'literal' cada dos palabras."
  },
  {
    pregunta: "¿Qué le da vergüenza admitir que le gusta?",
    opciones: ["Reggaetón viejo", "Novelas turcas", "Comida de McDonald's", "Streams de ajedrez"],
    correcta: 2,
    explicacion: "Se come un McTrío a escondidas."
  },
  {
    pregunta: "¿Qué pequeño detalle le cambia el humor?",
    opciones: ["Un café", "Un mensaje lindo", "Que haga frío", "Que le hablen mucho"],
    correcta: 1,
    explicacion: "Un mensaje random le arregla el día."
  },
  {
    pregunta: "¿Cuál fue su momento más vergonzoso?",
    opciones: [
      "Saludar a alguien que no era",
      "Caerse en público",
      "Llamar a la maestra 'mamá'",
      "Mandó un mensaje al chat equivocado"
    ],
    correcta: 3,
    explicacion: "Todavía se acuerda y se muere de vergüenza."
  },
  {
    pregunta: "¿Qué cosa hace cuando está incómodo/a y cree que nadie se da cuenta?",
    opciones: ["Se ríe nervioso", "Mira el celular", "Se toca el pelo", "Se muerde las uñas"],
    correcta: 1,
    explicacion: "Agarra el celular aunque no tenga notificaciones."
  },
  {
    pregunta: "¿Qué mentira piadosa suele decir?",
    opciones: ["'Ya salgo'", "'Estoy llegando'", "'Te aviso después'", "'No me molestó'"],
    correcta: 3,
    explicacion: "Siempre dice que no le molestó, aunque sí."
  },
  {
    pregunta: "Si tuviera que eliminar una app del celular para siempre, ¿cuál sería?",
    opciones: ["Instagram", "TikTok", "WhatsApp", "Twitter/X"],
    correcta: 1,
    explicacion: "Odia TikTok pero lo usa 3hs por día."
  },
  {
    pregunta: "¿Cuál es una opinión suya que casi nadie conoce?",
    opciones: [
      "Que las series son mejores que las películas",
      "Que el invierno es mejor que el verano",
      "Que el mate es overrated",
      "Que Messi no es el mejor"
    ],
    correcta: 2,
    explicacion: "Lo admite solo cuando está muy relajado/a."
  },
  {
    pregunta: "Si pudiera borrar un recuerdo, ¿cuál sería?",
    opciones: [
      "Un papelón en el colegio",
      "Una pelea con alguien que quiere",
      "Un rechazo amoroso",
      "Una vez que se cayó en público"
    ],
    correcta: 0,
    explicacion: "Nunca lo contó pero todavía le da vueltas la cabeza."
  }
];

// ============================================================
// 🎯 Puntaje por respuesta correcta
// ============================================================
export const PUNTOS_POR_ACIERTO = 100;

// ============================================================
// ⏱️ Duración de cada fase del juego (en segundos)
// ============================================================
export const TIEMPO_RESPUESTA = 60; // Tiempo para responder la pregunta
export const TIEMPO_REVELADO  = 20;  // Tiempo mostrando la respuesta antes de avanzar