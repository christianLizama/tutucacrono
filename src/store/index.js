import { createStore } from 'vuex'
import axios from 'axios'

const API_URL = 'http://127.0.0.1:3030'

export default createStore({
  state: {
    // Carrera activa actualmente en pantalla
    carreraActual: null,

    // Lista de carreras de una categoría
    carrerasCategoria: [],

    // Categoría activa
    categoriaActiva: null,

    // Timestamps locales de los cronómetros (por corredorId)
    // { [corredorId]: { startTimestamp, elapsedTime, running } }
    timersLocales: {},

    // Estado de conexión WebSocket
    wsConnected: false,
  },

  getters: {
    carreraActual: (state) => state.carreraActual,
    carrerasCategoria: (state) => state.carrerasCategoria,
    categoriaActiva: (state) => state.categoriaActiva,
    wsConnected: (state) => state.wsConnected,

    // Obtener el resultado de un corredor específico en la carrera actual
    resultadoCorredor: (state) => (corredorId) => {
      if (!state.carreraActual) return null;
      return state.carreraActual.resultados.find(
        (r) => {
          const id = r.corredor?._id || r.corredor;
          return id === corredorId;
        }
      );
    },

    // Timer local de un corredor
    timerLocal: (state) => (corredorId) => {
      return state.timersLocales[corredorId] || {
        startTimestamp: null,
        elapsedTime: 0,
        running: false,
      };
    },

    // ¿La carrera está en curso?
    carreraEnCurso: (state) => {
      return state.carreraActual?.estado === 'en_curso';
    },

    // ¿La carrera es una qualy?
    esQualy: (state) => {
      return state.carreraActual?.fase === 'qualy';
    },

    // ¿La carrera está finalizada?
    carreraFinalizada: (state) => {
      return state.carreraActual?.estado === 'finalizada';
    },

    // Resultados ordenados por posición inicial de largada (sin reordenar dinámicamente)
    resultadosOrdenados: (state) => {
      if (!state.carreraActual) return [];
      return [...state.carreraActual.resultados].sort((a, b) => {
        if (a.posicion === 0) return 1;
        if (b.posicion === 0) return -1;
        return a.posicion - b.posicion;
      });
    },
  },

  mutations: {
    SET_CARRERA_ACTUAL(state, carrera) {
      state.carreraActual = carrera;
    },

    SET_CARRERAS_CATEGORIA(state, carreras) {
      state.carrerasCategoria = carreras;
    },

    SET_CATEGORIA_ACTIVA(state, categoria) {
      state.categoriaActiva = categoria;
    },

    SET_WS_CONNECTED(state, connected) {
      state.wsConnected = connected;
    },

    // ─── Timers Locales ──────────────────────────────────────────

    INICIAR_TIMER_LOCAL(state, { corredorId }) {
      state.timersLocales = {
        ...state.timersLocales,
        [corredorId]: {
          startTimestamp: performance.now(),
          elapsedTime: 0,
          running: true,
        },
      };
    },

    ACTUALIZAR_ELAPSED_LOCAL(state, { corredorId, elapsedTime }) {
      if (state.timersLocales[corredorId]) {
        state.timersLocales[corredorId].elapsedTime = elapsedTime;
      }
    },

    DETENER_TIMER_LOCAL(state, { corredorId, finalTime }) {
      if (state.timersLocales[corredorId]) {
        state.timersLocales[corredorId] = {
          startTimestamp: null,
          elapsedTime: finalTime,
          running: false,
        };
      }
    },

    RESET_TIMER_LOCAL(state, { corredorId }) {
      state.timersLocales = {
        ...state.timersLocales,
        [corredorId]: {
          startTimestamp: null,
          elapsedTime: 0,
          running: false,
        },
      };
    },

    LIMPIAR_TIMERS_LOCALES(state) {
      state.timersLocales = {};
    },
  },

  actions: {
    // ─── Cargar Carrera ──────────────────────────────────────────

    async cargarCarreraActiva({ commit }, categoria) {
      try {
        commit('SET_CATEGORIA_ACTIVA', categoria);
        const response = await axios.get(
          `${API_URL}/carreras/categoria/${categoria}/activa`
        );
        commit('SET_CARRERA_ACTUAL', response.data.data);
        return response.data.data;
      } catch (error) {
        console.error('Error cargando carrera activa:', error);
        commit('SET_CARRERA_ACTUAL', null);
        return null;
      }
    },

    async cargarCarrera({ commit }, carreraId) {
      try {
        const response = await axios.get(`${API_URL}/carreras/${carreraId}`);
        commit('SET_CARRERA_ACTUAL', response.data.data);
        return response.data.data;
      } catch (error) {
        console.error('Error cargando carrera:', error);
        return null;
      }
    },

    async cargarCarrerasCategoria({ commit }, categoria) {
      try {
        const response = await axios.get(
          `${API_URL}/carreras/categoria/${categoria}`
        );
        commit('SET_CARRERAS_CATEGORIA', response.data.data);
        return response.data.data;
      } catch (error) {
        console.error('Error cargando carreras:', error);
        return [];
      }
    },

    // ─── Crear Carrera (Qualy) ───────────────────────────────────

    async crearCarrera({ commit }, { nombre, categoria, fase }) {
      try {
        const response = await axios.post(`${API_URL}/carreras`, {
          nombre,
          categoria,
          fase: fase || 'qualy',
        });
        commit('SET_CARRERA_ACTUAL', response.data.data);
        return response.data.data;
      } catch (error) {
        console.error('Error creando carrera:', error);
        throw error;
      }
    },

    // ─── Iniciar Carrera ─────────────────────────────────────────

    async iniciarCarrera({ commit, state }) {
      if (!state.carreraActual) return;
      try {
        const response = await axios.patch(
          `${API_URL}/carreras/${state.carreraActual._id}/iniciar`
        );
        commit('SET_CARRERA_ACTUAL', response.data.data);
        commit('LIMPIAR_TIMERS_LOCALES');
        return response.data.data;
      } catch (error) {
        console.error('Error iniciando carrera:', error);
        throw error;
      }
    },

    // ─── Finalizar Carrera ───────────────────────────────────────

    async finalizarCarrera({ commit, state }) {
      if (!state.carreraActual) return;
      try {
        const response = await axios.patch(
          `${API_URL}/carreras/${state.carreraActual._id}/finalizar`
        );
        commit('SET_CARRERA_ACTUAL', response.data.data);
        commit('LIMPIAR_TIMERS_LOCALES');
        return response.data.data;
      } catch (error) {
        console.error('Error finalizando carrera:', error);
        throw error;
      }
    },

    // ─── Timer Individual ────────────────────────────────────────

    async iniciarTimerCorredor({ commit, state }, corredorId) {
      if (!state.carreraActual) return;
      try {
        const response = await axios.patch(
          `${API_URL}/carreras/${state.carreraActual._id}/corredor/${corredorId}/iniciar`
        );
        commit('SET_CARRERA_ACTUAL', response.data.data);
        commit('INICIAR_TIMER_LOCAL', { corredorId });
        return response.data.data;
      } catch (error) {
        console.error('Error iniciando timer:', error);
        throw error;
      }
    },

    async registrarTiempo({ commit, state }, { corredorId, tiempo }) {
      if (!state.carreraActual) return;
      try {
        const response = await axios.patch(
          `${API_URL}/carreras/${state.carreraActual._id}/corredor/${corredorId}/tiempo`,
          { tiempo }
        );
        commit('SET_CARRERA_ACTUAL', response.data.data);
        commit('DETENER_TIMER_LOCAL', { corredorId, finalTime: tiempo });
        return response.data.data;
      } catch (error) {
        console.error('Error registrando tiempo:', error);
        throw error;
      }
    },

    async marcarEstadoCorredor({ commit, state }, { corredorId, estado }) {
      if (!state.carreraActual) return;
      try {
        const response = await axios.patch(
          `${API_URL}/carreras/${state.carreraActual._id}/corredor/${corredorId}/estado`,
          { estado }
        );
        commit('SET_CARRERA_ACTUAL', response.data.data);
        commit('RESET_TIMER_LOCAL', { corredorId });
        return response.data.data;
      } catch (error) {
        console.error('Error marcando estado:', error);
        throw error;
      }
    },

    async reiniciarTimerCorredor({ commit, state }, corredorId) {
      if (!state.carreraActual) return;
      try {
        const response = await axios.patch(
          `${API_URL}/carreras/${state.carreraActual._id}/corredor/${corredorId}/reiniciar`
        );
        commit('SET_CARRERA_ACTUAL', response.data.data);
        commit('RESET_TIMER_LOCAL', { corredorId });
        return response.data.data;
      } catch (error) {
        console.error('Error reiniciando timer:', error);
        throw error;
      }
    },

    // ─── Generar Final ───────────────────────────────────────────

    async generarFinal({ commit, state }) {
      if (!state.carreraActual) return;
      try {
        const response = await axios.post(
          `${API_URL}/carreras/${state.carreraActual._id}/generar-final`
        );
        commit('SET_CARRERA_ACTUAL', response.data.data);
        commit('LIMPIAR_TIMERS_LOCALES');
        return response.data.data;
      } catch (error) {
        console.error('Error generando final:', error);
        throw error;
      }
    },

    // ─── Eliminar Carrera ────────────────────────────────────────

    async eliminarCarrera({ commit, state }, carreraId) {
      try {
        await axios.delete(`${API_URL}/carreras/${carreraId || state.carreraActual?._id}`);
        commit('SET_CARRERA_ACTUAL', null);
        commit('LIMPIAR_TIMERS_LOCALES');
      } catch (error) {
        console.error('Error eliminando carrera:', error);
        throw error;
      }
    },

    // ─── WebSocket Update ────────────────────────────────────────

    handleCarreraUpdate({ commit, state }, carrera) {
      // Solo actualizar si es la misma carrera que estamos viendo
      // o si es la misma categoría
      if (
        state.carreraActual &&
        state.carreraActual._id === carrera._id
      ) {
        commit('SET_CARRERA_ACTUAL', carrera);
      }
    },
  },

  modules: {},
})
