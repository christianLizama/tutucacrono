import { reactive } from "vue";
import {io} from "socket.io-client";

export const state = reactive({
  connected: false,
  fooEvents: [],
  barEvents: [],
  updateTimeEvents: [] // Agrega un nuevo array para almacenar los eventos 'updateTime'
});

// "undefined" means the URL will be computed from the `window.location` object
const URL = process.env.NODE_ENV === "production" ? undefined : "http://localhost:81";

export const socket = io(URL);

socket.on("connect", () => {
  state.connected = true;
});

socket.on("disconnect", () => {
  state.connected = false;
});

// Escuchar el evento 'updateTime' que se emite desde el servidor
socket.on("updateTime", (data) => {
  state.updateTimeEvents.push(data);
  console.log('updateTime received:', data);
});
