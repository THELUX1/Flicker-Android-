import { db } from "./firebase-config.js";
import {
  ref, set, get, update, onValue, push, remove, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { PREGUNTAS_EJEMPLO, TIEMPO_REVELADO, PUNTOS_POR_ACIERTO } from "./preguntas.js";

// ===== CLAVE DE PERSISTENCIA =====
const STORAGE_KEY = "qcm_host_session";

const state = {
  miId: null,
  salaId: null,
  nombre: null,
  preguntas: [],
  timerAvance: null,
  ultimaRondaRevelada: -1
};

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

function mostrarPantalla(id) {
  $$(".host-pantalla").forEach(p => p.classList.remove("activa"));
  $(`#${id}`).classList.add("activa");
}

// ============================================================
// PERSISTENCIA
// ============================================================
function guardarSesion() {
  if (!state.salaId || !state.miId) {
    console.warn("⚠️ No se puede guardar sesión: falta salaId o miId");
    return;
  }
  const data = {
    salaId: state.salaId,
    miId: state.miId,
    nombre: state.nombre,
    guardadoEn: Date.now()
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    const check = localStorage.getItem(STORAGE_KEY);
    console.log("💾 Sesión guardada:", check ? "OK" : "FALLÓ", data);
  } catch (e) {
    console.error("❌ Error guardando sesión:", e);
    alert("⚠️ No se pudo guardar la sesión. Puede que estés en modo incógnito o con bloqueo de cookies.");
  }
}

function cargarSesion() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data.salaId || !data.miId) return null;
    if (Date.now() - (data.guardadoEn || 0) > 7 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return data;
  } catch (err) {
    console.error("❌ Error leyendo sesión:", err);
    return null;
  }
}

function borrarSesion() {
  localStorage.removeItem(STORAGE_KEY);
}

// ============================================================
// CREAR SALA
// ============================================================
$("#host-crear").onclick = async () => {
  const nombre = $("#host-nombre").value.trim();
  if (!nombre) return alert("Poné tu nombre");

  state.miId = crypto.randomUUID();
  const codigo = generarCodigo();
  state.salaId = codigo;
  state.nombre = nombre;

  await set(ref(db, `salas/${codigo}`), {
    creada: serverTimestamp(),
    estado: "lobby",
    preguntaActual: -1,
    orden: [],
    preguntas: {},
    ajustes: { urlFoto: "", mensaje: "" },
    _revealTick: 0,
    _rondaCalculada: false,
    _estadisticas: null,
    jugadores: {
      [state.miId]: {
        nombre: `${nombre} (host)`,
        puntos: 0, aciertos: 0, total: 0, racha: 0, rachaMax: 0,
        respuesta: null, respondio: false, ultimoDelta: 0, esHost: true
      }
    }
  });

  console.log("🏗️ Sala creada:", codigo, "| miId:", state.miId);
  guardarSesion();
  entrarAlPanel(codigo);
};

// ============================================================
// RECONECTAR A SALA EXISTENTE
// ============================================================
async function reconectarSala(salaId, miId, nombre) {
  const snap = await get(ref(db, `salas/${salaId}`));
  if (!snap.exists()) {
    alert("Esa sala ya no existe 😢");
    borrarSesion();
    return false;
  }

  const sala = snap.val();
  state.salaId = salaId;
  state.miId = miId;
  state.nombre = nombre;

  const jugadores = sala.jugadores || {};
  if (!jugadores[miId]) {
    await update(ref(db, `salas/${salaId}/jugadores/${miId}`), {
      nombre: `${nombre} (host)`,
      puntos: 0, aciertos: 0, total: 0, racha: 0, rachaMax: 0,
      respuesta: null, respondio: false, ultimoDelta: 0, esHost: true
    });
  }

  guardarSesion();
  entrarAlPanel(salaId);
  return true;
}

// ============================================================
// UNIRSE COMO HOST A SALA EXISTENTE
// ============================================================
$("#host-join").onclick = async () => {
  const nombre = $("#host-nombre").value.trim();
  const codigo = $("#host-join-codigo").value.trim().toUpperCase();
  if (!nombre) return alert("Poné tu nombre");
  if (!codigo) return alert("Poné el código");

  const snap = await get(ref(db, `salas/${codigo}`));
  if (!snap.exists()) return alert("Esa sala no existe 😢");

  state.miId = crypto.randomUUID();
  await reconectarSala(codigo, state.miId, nombre);
};

// ============================================================
// ENTRAR AL PANEL
// ============================================================
function entrarAlPanel(codigo) {
  mostrarPantalla("host-panel");
  $("#host-codigo").textContent = codigo;
  conectarSala();
}

// ============================================================
// BOTONES DE RECONEXIÓN
// ============================================================
$("#host-reconectar").onclick = async () => {
  const sesion = cargarSesion();
  if (!sesion) return;
  await reconectarSala(sesion.salaId, sesion.miId, sesion.nombre);
};

$("#host-olvidar").onclick = () => {
  if (!confirm("¿Olvidar esta sala? Las preguntas seguirán en Firebase, pero no vas a poder reconectarte automáticamente.")) return;
  borrarSesion();
  $("#host-reconectar-box").style.display = "none";
};

// ============================================================
// DETECCIÓN DE SESIÓN AL CARGAR
// ============================================================
async function chequearSesionPrevia() {
  console.log("🔍 Buscando sesión previa...");

  const sesion = cargarSesion();
  if (!sesion) {
    console.log("ℹ️ No hay sesión guardada en localStorage");
    return;
  }

  console.log("📦 Sesión encontrada:", sesion);

  try {
    const snap = await get(ref(db, `salas/${sesion.salaId}`));
    if (!snap.exists()) {
      console.log("⚠️ La sala", sesion.salaId, "ya no existe en Firebase");
      borrarSesion();
      return;
    }

    const sala = snap.val();
    const cantidadJugadores = Object.keys(sala.jugadores || {}).length;

    console.log("✅ Sala válida:", sesion.salaId, "- Jugadores:", cantidadJugadores);

    $("#host-reconectar-box").style.display = "block";
    $("#host-reconectar-codigo").textContent = sesion.salaId;
    $("#host-reconectar-jugadores").textContent =
      cantidadJugadores === 1
        ? `1 jugador · ${sala.estado}`
        : `${cantidadJugadores} jugadores · ${sala.estado}`;

    $("#host-nombre").value = sesion.nombre || "";

    console.log("🎨 Cartel de reconexión mostrado");
  } catch (err) {
    console.error("❌ Error al chequear sesión:", err);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", chequearSesionPrevia);
} else {
  chequearSesionPrevia();
}

// ============================================================
// GENERAR CÓDIGO
// ============================================================
function generarCodigo() {
  const letras = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  let c = "";
  for (let i = 0; i < 6; i++) c += letras[Math.floor(Math.random() * letras.length)];
  return c;
}

// ============================================================
// TABS
// ============================================================
$$(".tab").forEach(tab => {
  tab.onclick = () => {
    $$(".tab").forEach(t => t.classList.remove("activo"));
    $$(".tab-panel").forEach(p => p.classList.remove("activo"));
    tab.classList.add("activo");
    $(`#tab-${tab.dataset.tab}`).classList.add("activo");
  };
});

// ============================================================
// ABRIR TV
// ============================================================
$("#btn-abrir-tv").onclick = () => {
  window.open(`tv.html?sala=${state.salaId}`, "_blank");
};

// ============================================================
// CARGAR EJEMPLOS
// ============================================================
$("#btn-cargar-ejemplos").onclick = async () => {
  if (!confirm("Esto va a reemplazar las preguntas actuales. ¿Seguir?")) return;
  const obj = {};
  PREGUNTAS_EJEMPLO.forEach(p => {
    const id = crypto.randomUUID();
    obj[id] = p;
  });
  await update(ref(db, `salas/${state.salaId}`), { preguntas: obj });
  alert("Preguntas cargadas ✅");
};

// ============================================================
// AGREGAR PREGUNTA
// ============================================================
$("#form-pregunta").onsubmit = async (e) => {
  e.preventDefault();

  const pregunta = $("#fp-pregunta").value.trim();
  const explicacion = $("#fp-explicacion").value.trim();
  const opciones = Array.from($$(".fp-opcion-texto")).map(i => i.value.trim());
  const correctaRadio = document.querySelector('input[name="fp-correcta"]:checked');
  const correcta = correctaRadio ? parseInt(correctaRadio.value) : -1;

  if (!pregunta) return alert("Falta la pregunta");
  if (opciones.some(o => !o)) return alert("Completá todas las opciones");
  if (correcta < 0) return alert("Marcá la opción correcta");

  const nuevaRef = push(ref(db, `salas/${state.salaId}/preguntas`));
  await set(nuevaRef, { pregunta, opciones, correcta, explicacion });

  $("#fp-pregunta").value = "";
  $("#fp-explicacion").value = "";
  $$(".fp-opcion-texto").forEach(i => i.value = "");
  document.querySelectorAll('input[name="fp-correcta"]').forEach(r => r.checked = false);
  $("#fp-pregunta").focus();
};

// ============================================================
// AJUSTES (foto grupal, mensaje)
// ============================================================
function cargarAjustesEnFormulario(sala) {
  const ajustes = sala.ajustes || {};
  const inputFoto = $("#ajuste-url-foto");
  const inputMsg = $("#ajuste-mensaje");
  if (inputFoto && document.activeElement !== inputFoto) {
    inputFoto.value = ajustes.urlFoto || "";
  }
  if (inputMsg && document.activeElement !== inputMsg) {
    inputMsg.value = ajustes.mensaje || "";
  }
}

$("#btn-guardar-ajustes").onclick = async () => {
  const urlFoto = $("#ajuste-url-foto").value.trim();
  const mensaje = $("#ajuste-mensaje").value.trim();

  await update(ref(db, `salas/${state.salaId}`), {
    ajustes: { urlFoto, mensaje }
  });

  alert("Ajustes guardados ✅");
};

// ============================================================
// CONEXIÓN A SALA
// ============================================================
function conectarSala() {
  onValue(ref(db, `salas/${state.salaId}`), (snap) => {
    const sala = snap.val();
    if (!sala) return;

    state.preguntas = Object.entries(sala.preguntas || {}).map(([id, p]) => ({ id, ...p }));

    renderJugadores(sala.jugadores || {}, sala.estado);
    renderPreguntas(state.preguntas);
    renderControl(sala);
    cargarAjustesEnFormulario(sala);
    $("#host-estado").textContent =
      sala.estado === "jugando" ? `Pregunta ${sala.preguntaActual + 1}` : sala.estado;

    controlarAutoAvance(sala);
  });
}

// ============================================================
// AUTO-AVANCE Y CÁLCULO DE PUNTOS
// ============================================================
async function controlarAutoAvance(sala) {
  if (sala.estado !== "jugando") return;
  if (!sala._revealTick) return;

  if (state.ultimaRondaRevelada === sala.preguntaActual) return;
  state.ultimaRondaRevelada = sala.preguntaActual;

  await calcularPuntosRonda(sala);

  clearTimeout(state.timerAvance);
  state.timerAvance = setTimeout(async () => {
    const s = (await get(ref(db, `salas/${state.salaId}`))).val();
    if (!s || s.estado !== "jugando") return;
    if (s.preguntaActual !== sala.preguntaActual) return;

    const next = s.preguntaActual + 1;
    if (next >= s.orden.length) {
      await update(ref(db, `salas/${state.salaId}`), { estado: "final" });
    } else {
      await update(ref(db, `salas/${state.salaId}`), {
        preguntaActual: next,
        _revealTick: 0,
        _rondaCalculada: false
      });
    }
  }, TIEMPO_REVELADO * 1000);
}

async function calcularPuntosRonda(sala) {
  if (sala._rondaCalculada === true) {
    console.log("⚠️ Ronda ya calculada, saltando.");
    return;
  }

  const preg = sala.preguntas[sala.orden[sala.preguntaActual]];
  if (!preg) return;

  console.log("🧮 Calculando puntos ronda", sala.preguntaActual, "correcta:", preg.correcta);

  const updates = {};
  const jugadoresReales = Object.entries(sala.jugadores).filter(([id, j]) => !j.esHost);

  let aciertosRonda = 0;
  let fallosRonda = 0;
  const acertaron = [];
  const fallaron = [];

  jugadoresReales.forEach(([id, j]) => {
    const acierto = j.respuesta === preg.correcta;
    const delta = acierto ? PUNTOS_POR_ACIERTO : 0;

    const nuevosPuntos = (j.puntos || 0) + delta;
    const nuevaRacha = acierto ? (j.racha || 0) + 1 : 0;

    updates[`salas/${state.salaId}/jugadores/${id}/puntos`]      = nuevosPuntos;
    updates[`salas/${state.salaId}/jugadores/${id}/aciertos`]    = (j.aciertos || 0) + (acierto ? 1 : 0);
    updates[`salas/${state.salaId}/jugadores/${id}/total`]       = (j.total || 0) + 1;
    updates[`salas/${state.salaId}/jugadores/${id}/racha`]       = nuevaRacha;
    updates[`salas/${state.salaId}/jugadores/${id}/rachaMax`]    = Math.max(j.rachaMax || 0, nuevaRacha);
    updates[`salas/${state.salaId}/jugadores/${id}/ultimoDelta`] = delta;

    if (acierto) {
      aciertosRonda++;
      acertaron.push({ id, nombre: j.nombre });
    } else {
      fallosRonda++;
      fallaron.push({ id, nombre: j.nombre });
    }
  });

  // ===== GUARDAR ESTADÍSTICAS DE LA RONDA =====
  const totalJugadores = jugadoresReales.length;
  const porcentajeAciertos = totalJugadores > 0
    ? Math.round((aciertosRonda / totalJugadores) * 100)
    : 0;

  const estadisticaRonda = {
    numeroPregunta: sala.preguntaActual + 1,
    pregunta: preg.pregunta,
    opcionCorrecta: preg.opciones[preg.correcta],
    totalJugadores,
    aciertos: aciertosRonda,
    fallos: fallosRonda,
    porcentajeAciertos,
    acertaron: acertaron.map(a => a.nombre),
    fallaron: fallaron.map(a => a.nombre),
    unicoAcierto: acertaron.length === 1 ? acertaron[0].nombre : null,
    todosFallaron: aciertosRonda === 0 && fallosRonda > 0,
    todosAcertaron: fallosRonda === 0 && aciertosRonda > 0
  };

  updates[`salas/${state.salaId}/_estadisticas/${sala.preguntaActual}`] = estadisticaRonda;
  updates[`salas/${state.salaId}/_rondaCalculada`] = true;

  await update(ref(db), updates);
  console.log("✅ Puntos y estadísticas guardados");
}

// ============================================================
// DETECCIÓN "TODOS RESPONDIERON"
// ============================================================
let unsubJugadores = null;
function suscribirAutoRevelar() {
  if (unsubJugadores) unsubJugadores();

  unsubJugadores = onValue(ref(db, `salas/${state.salaId}/jugadores`), async (snap) => {
    const jugadores = snap.val() || {};
    const salaSnap = await get(ref(db, `salas/${state.salaId}`));
    const sala = salaSnap.val();
    if (!sala || sala.estado !== "jugando") return;

    if (sala._revealTick) return;

    const ids = Object.keys(jugadores).filter(id => !jugadores[id].esHost);
    if (ids.length === 0) return;

    const todos = ids.every(id => jugadores[id].respondio === true);
    if (todos) {
      await update(ref(db, `salas/${state.salaId}`), { _revealTick: Date.now() });
    }
  });
}

// ============================================================
// RENDER JUGADORES
// ============================================================
function renderJugadores(jugadores, estado) {
  const lista = Object.entries(jugadores);
  const ul = $("#host-lista-jugadores");
  if (lista.length === 0) {
    ul.innerHTML = `<li class="sin-jugadores">Nadie se unió todavía…</li>`;
  } else {
    ul.innerHTML = lista.map(([id, j]) =>
      `<li><span>👤 ${j.nombre}</span><span>${j.puntos || 0} pts</span></li>`
    ).join("");
  }

  const btn = $("#btn-empezar");
  const jugadoresReales = lista.filter(([id, j]) => !j.esHost);
  const puede = jugadoresReales.length >= 1 && estado === "lobby" && state.preguntas.length >= 1;
  btn.disabled = !puede;
  if (state.preguntas.length === 0) {
    btn.textContent = "Cargá al menos 1 pregunta";
  } else if (jugadoresReales.length < 1) {
    btn.textContent = "Necesitás al menos 1 jugador";
  } else {
    btn.textContent = "▶️ Empezar partida";
  }
}

// ============================================================
// RENDER PREGUNTAS
// ============================================================
function renderPreguntas(preguntas) {
  const ol = $("#host-lista-preguntas");
  if (preguntas.length === 0) {
    ol.innerHTML = `<li style="opacity:.5">Todavía no cargaste preguntas.</li>`;
    return;
  }
  ol.innerHTML = preguntas.map((p) =>
    `<li>
      <button class="p-remove" data-id="${p.id}">🗑️</button>
      <strong>${p.pregunta}</strong><br>
      <span class="p-correcta">✔ ${p.opciones[p.correcta]}</span>
    </li>`
  ).join("");

  $$(".p-remove").forEach(btn => {
    btn.onclick = async () => {
      if (!confirm("¿Eliminar esta pregunta?")) return;
      await remove(ref(db, `salas/${state.salaId}/preguntas/${btn.dataset.id}`));
    };
  });
}

// ============================================================
// EMPEZAR
// ============================================================
$("#btn-empezar").onclick = async () => {
  const sala = (await get(ref(db, `salas/${state.salaId}`))).val();
  const ids = Object.keys(sala.preguntas || {});
  if (ids.length === 0) return alert("Cargá preguntas primero");

  const updates = {};
  Object.keys(sala.jugadores).forEach(id => {
    updates[`salas/${state.salaId}/jugadores/${id}/respondio`]   = false;
    updates[`salas/${state.salaId}/jugadores/${id}/respuesta`]   = null;
    updates[`salas/${state.salaId}/jugadores/${id}/ultimoDelta`] = 0;
  });
  updates[`salas/${state.salaId}/estado`]          = "jugando";
  updates[`salas/${state.salaId}/preguntaActual`]  = 0;
  updates[`salas/${state.salaId}/orden`]           = ids.sort(() => Math.random() - 0.5);
  updates[`salas/${state.salaId}/_revealTick`]     = 0;
  updates[`salas/${state.salaId}/_rondaCalculada`] = false;
  updates[`salas/${state.salaId}/_estadisticas`]   = null;

  state.ultimaRondaRevelada = -1;
  await update(ref(db), updates);

  suscribirAutoRevelar();
};

// ============================================================
// CONTROL
// ============================================================
function renderControl(sala) {
  const cont = $("#control-contenido");
  cont.innerHTML = "";

  if (sala.estado === "lobby") {
    cont.innerHTML = `<p class="hint">La partida no empezó. Cargá preguntas y tocá "Empezar" en la pestaña Jugadores.</p>`;
    return;
  }

  if (sala.estado === "jugando") {
    const jugadores = Object.entries(sala.jugadores).filter(([id, j]) => !j.esHost);
    const respondieron = jugadores.filter(([id, j]) => j.respondio === true).length;
    const total = jugadores.length;
    const revelado = !!sala._revealTick;

    const fase = revelado ? "🎯 Revelado" :
                 respondieron === total && total > 0 ? "✅ Todos respondieron" :
                 "⏳ Esperando respuestas";

    cont.innerHTML = `
      <div class="host-fase">
        <strong>${fase}</strong>
        <span>${respondieron}/${total} respondieron</span>
      </div>
      <button id="btn-revelar" class="btn-secundario" ${revelado ? "disabled" : ""}>
        👁️ Revelar respuesta ya
      </button>
      <button id="btn-siguiente" class="btn-primario">
        ➡️ Siguiente pregunta
      </button>
      <button id="btn-terminar" class="btn-secundario">🏁 Terminar partida</button>
      <button id="btn-reset" class="btn-secundario" style="background:rgba(220,38,38,.25)">🔄 Reiniciar ronda</button>
    `;

    $("#btn-revelar").onclick = async () => {
      await update(ref(db, `salas/${state.salaId}`), { _revealTick: Date.now() });
    };

    $("#btn-siguiente").onclick = async () => {
      clearTimeout(state.timerAvance);
      const s = (await get(ref(db, `salas/${state.salaId}`))).val();
      const next = s.preguntaActual + 1;
      if (next >= s.orden.length) {
        await update(ref(db, `salas/${state.salaId}`), { estado: "final" });
      } else {
        await update(ref(db, `salas/${state.salaId}`), {
          preguntaActual: next,
          _revealTick: 0,
          _rondaCalculada: false
        });
      }
    };

    $("#btn-terminar").onclick = async () => {
      if (!confirm("¿Terminar la partida ya?")) return;
      await update(ref(db, `salas/${state.salaId}`), { estado: "final" });
    };

    $("#btn-reset").onclick = async () => {
      const s = (await get(ref(db, `salas/${state.salaId}`))).val();
      const updates = {};
      Object.keys(s.jugadores).forEach(id => {
        updates[`salas/${state.salaId}/jugadores/${id}/respuesta`] = null;
        updates[`salas/${state.salaId}/jugadores/${id}/respondio`] = false;
      });
      updates[`salas/${state.salaId}/_revealTick`]     = 0;
      updates[`salas/${state.salaId}/_rondaCalculada`] = false;
      await update(ref(db), updates);
    };
  }

  if (sala.estado === "final") {
    cont.innerHTML = `
      <button id="btn-volver-lobby" class="btn-primario">🛋️ Volver al lobby (mismas preguntas)</button>
      <button id="btn-nueva-partida" class="btn-secundario">✨ Nueva partida (resetea puntos)</button>
    `;

    $("#btn-volver-lobby").onclick = async () => {
      await update(ref(db, `salas/${state.salaId}`), {
        estado: "lobby",
        preguntaActual: -1,
        _revealTick: 0,
        _rondaCalculada: false
      });
    };
    $("#btn-nueva-partida").onclick = async () => {
      const s = (await get(ref(db, `salas/${state.salaId}`))).val();
      const updates = {
        estado: "lobby",
        preguntaActual: -1,
        _revealTick: 0,
        _rondaCalculada: false,
        _estadisticas: null
      };
      Object.keys(s.jugadores).forEach(id => {
        updates[`jugadores/${id}/puntos`]      = 0;
        updates[`jugadores/${id}/aciertos`]    = 0;
        updates[`jugadores/${id}/total`]       = 0;
        updates[`jugadores/${id}/racha`]       = 0;
        updates[`jugadores/${id}/rachaMax`]    = 0;
        updates[`jugadores/${id}/respuesta`]   = null;
        updates[`jugadores/${id}/respondio`]   = false;
        updates[`jugadores/${id}/ultimoDelta`] = 0;
      });
      await update(ref(db, `salas/${state.salaId}`), updates);
    };
  }
}

// ============================================================
// AVISO AL CERRAR CON PARTIDA ACTIVA
// ============================================================
window.addEventListener("beforeunload", (e) => {
  if (state.salaId && state.preguntas.length > 0) {
    guardarSesion();
    e.preventDefault();
    e.returnValue = "Si cerrás, los jugadores van a quedar esperando. ¿Seguro?";
  }
});