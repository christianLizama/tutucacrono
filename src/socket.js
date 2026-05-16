import { reactive } from "vue";
import { io } from "socket.io-client";
import store from "./store";

export const state = reactive({
  connected: false,
});

// URL del servidor WebSocket
const URL = process.env.NODE_ENV === "production" ? undefined : "http://localhost:81";

export const socket = io(URL, {
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
});

socket.on("connect", () => {
  state.connected = true;
  store.commit("SET_WS_CONNECTED", true);
  console.log("[WS] Conectado:", socket.id);
});

socket.on("disconnect", () => {
  state.connected = false;
  store.commit("SET_WS_CONNECTED", false);
  console.log("[WS] Desconectado");
});

// Escuchar actualizaciones de carrera desde el servidor
socket.on("carreraUpdate", (carrera) => {
  console.log("[WS] carreraUpdate recibido:", carrera?.nombre);
  store.dispatch("handleCarreraUpdate", carrera);
});

// Reconexión: solicitar sync
socket.on("reconnect", () => {
  console.log("[WS] Reconectado, solicitando sync...");
  const carreraActual = store.getters.carreraActual;
  if (carreraActual) {
    socket.emit("requestCarreraSync", { carreraId: carreraActual._id });
    // También recargar vía HTTP para asegurar datos frescos
    store.dispatch("cargarCarrera", carreraActual._id);
  }
});
