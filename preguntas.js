// preguntas.js
// Preguntas de EJEMPLO que el host puede cargar rápido.
// El juego realmente usa las preguntas que se guardan en /salas/{id}/preguntas

export const PREGUNTAS_EJEMPLO = [
  {
    nivel: "facil",
    pregunta: "¿Cuál es su comida favorita?",
    opciones: ["Pizza", "Sushi", "Asado", "Pastas"],
    correcta: 1,
    explicacion: "Dijo sushi porque podría comerlo todos los días."
  },
  {
    nivel: "facil",
    pregunta: "¿Qué canción podría escuchar 20 veces seguidas?",
    opciones: ["Bohemian Rhapsody", "Tití Me Preguntó", "Yellow", "Ciudad Mágica"],
    correcta: 3,
    explicacion: "La escucha siempre en el auto."
  },
  {
    nivel: "facil",
    pregunta: "¿Qué cosa le da más paja hacer?",
    opciones: ["Lavar platos", "Ir al gimnasio", "Responder mensajes", "Estudiar"],
    correcta: 2,
    explicacion: "Deja todos los chats en visto por días."
  },
  {
    nivel: "medio",
    pregunta: "Si pudiera viajar mañana, ¿a dónde iría?",
    opciones: ["Japón", "París", "Nueva York", "Bariloche"],
    correcta: 0,
    explicacion: "Sueña con ir a Japón desde hace años."
  },
  {
    nivel: "medio",
    pregunta: "¿Qué compraría aunque no lo necesite?",
    opciones: ["Zapatillas", "Libros", "Plantas", "Tecnología"],
    correcta: 0,
    explicacion: "Tiene 30 pares y sigue comprando."
  },
  {
    nivel: "medio",
    pregunta: "¿Qué haría primero si le regalaran $1.000.000?",
    opciones: ["Comprar ropa", "Viajar", "Comprar un auto", "Guardarlo"],
    correcta: 1,
    explicacion: "Viajar, sin dudarlo."
  },
  {
    nivel: "dificil",
    pregunta: "¿Qué le da vergüenza admitir que le gusta?",
    opciones: ["Reggaetón viejo", "Novelas turcas", "Comida de McDonald's", "Streams de ajedrez"],
    correcta: 2,
    explicacion: "Se come un McTrío a escondidas."
  },
  {
    nivel: "dificil",
    pregunta: "¿Qué pequeño detalle le cambia el humor?",
    opciones: ["Un café", "Un mensaje lindo", "Que haga frío", "Que le hablen mucho"],
    correcta: 1,
    explicacion: "Un mensaje random le arregla el día."
  },
  {
    nivel: "brutal",
    pregunta: "¿Qué mentira piadosa suele decir?",
    opciones: ["'Ya salgo'", "'Estoy llegando'", "'Te aviso después'", "'No me molestó'"],
    correcta: 3,
    explicacion: "Siempre dice que no le molestó, aunque sí."
  },
  {
    nivel: "brutal",
    pregunta: "Si tuviera que eliminar una app del celular para siempre, ¿cuál sería?",
    opciones: ["Instagram", "TikTok", "WhatsApp", "Twitter/X"],
    correcta: 1,
    explicacion: "Odia TikTok pero lo usa 3hs por día."
  }
];

export const NIVEL_MULTIPLICADOR = {
  facil: 1,
  medio: 1.2,
  dificil: 1.5,
  brutal: 2
};