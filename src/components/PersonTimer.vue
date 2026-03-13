<template>
  <v-card class="mb-3">
    <v-card-text class="d-flex align-items-center">
      <div class="d-flex align-items-center justify-start" style="width: 30%">
        <span class="person-name">{{ person.nombre }}</span>
      </div>
      <div class="d-flex align-items-center justify-start" style="width: 30%">
        <span class="person-name">{{ person.team }}</span>
      </div>
      <div class="d-flex align-items-center justify-start" style="width: 10%">
        <v-chip class="ma-2" color="primary" text-color="white">{{ person.numero }}</v-chip>
      </div>
      <div class="d-flex align-items-center justify-start" style="width: 30%">
        <v-chip class="ma-2">{{ formatTime(displayTime) }}</v-chip>
      </div>
      <div class="d-flex align-items-center justify-center" style="width: 30%">
        <v-btn
          @click="startStopTimer"
          class="ma-2"
          :color="running ? 'error' : 'success'"
          dark
        >
          <v-icon>{{ running ? "mdi-stop" : "mdi-play" }}</v-icon>
        </v-btn>
        <v-btn
          @click="resetTimer"
          class="ma-2"
          color="secondary"
          dark
          :disabled="running"
        >
          <v-icon>mdi-restart</v-icon>
        </v-btn>
        <v-btn
          @click="saveTimeInBD"
          class="ma-2"
          :color="timeSaved ? 'success' : ''"
          dark
          :disabled="running"
        >
          <v-icon>{{ timeSaved ? 'mdi-check' : 'mdi-inbox-arrow-up' }}</v-icon>
        </v-btn>
      </div>
    </v-card-text>

    <v-snackbar v-model="snackbar" :timeout="3000" color="success">
      {{ snackbarText }}
      <template v-slot:action="{ attrs }">
        <v-btn text v-bind="attrs" @click="snackbar = false">Cerrar</v-btn>
      </template>
    </v-snackbar>
  </v-card>
</template>

<script>
import axios from "axios";

export default {
  name: "PersonTimer",
  props: {
    person: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      elapsedTime: 0,      // Tiempo total acumulado (ms)
      displayTime: 0,      // Tiempo que se muestra en pantalla
      running: false,
      startTimestamp: null,
      rafId: null,         // requestAnimationFrame ID
      snackbar: false,
      snackbarText: '',
      timeSaved: false,
    };
  },
  methods: {
    formatTime(ms) {
      const mins = Math.floor(ms / 60000);
      const secs = Math.floor((ms % 60000) / 1000);
      const millis = Math.floor(ms % 1000);
      return `${mins}:${secs.toString().padStart(2, "0")}:${millis.toString().padStart(3, "0")}`;
    },
    startStopTimer() {
      if (this.running) {
        // Detener cronómetro
        this.elapsedTime += performance.now() - this.startTimestamp;
        this.running = false;
        this.startTimestamp = null;
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
        this.displayTime = this.elapsedTime;
        this.saveTime();
      } else {
        // Iniciar cronómetro
        this.startTimestamp = performance.now();
        this.running = true;
        this.updateDisplayTime(); // Lanzar el loop de animación
      }
    },
    updateDisplayTime() {
      if (!this.running) return;
      const now = performance.now();
      this.displayTime = this.elapsedTime + (now - this.startTimestamp);
      this.rafId = requestAnimationFrame(this.updateDisplayTime);
    },
    resetTimer() {
      this.elapsedTime = 0;
      this.displayTime = 0;
      this.running = false;
      this.startTimestamp = null;
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
      this.saveTime();
    },
    async saveTimeInBD() {
      try {
        const tiempo = Math.floor(this.displayTime);
        await axios.patch(`http://127.0.0.1:3030/corredores/enviarTiempo/${this.person._id}`, {
          tiempo,
        });
        this.timeSaved = true;
        this.snackbarText = "Tiempo guardado exitosamente!";
        this.snackbar = true;
      } catch (error) {
        this.snackbarText = "Error al guardar el tiempo.";
        this.snackbar = true;
        console.error("Error al guardar el tiempo:", error);
      }
    },
    saveTime() {
      const storedTimes = JSON.parse(localStorage.getItem("timers")) || {};
      storedTimes[this.person.id] = {
        elapsedTime: this.elapsedTime,
        running: this.running,
      };
      localStorage.setItem("timers", JSON.stringify(storedTimes));
    },
    loadTime() {
      const storedTimes = JSON.parse(localStorage.getItem("timers")) || {};
      const saved = storedTimes[this.person.id];
      if (saved) {
        this.elapsedTime = saved.elapsedTime || 0;
        this.displayTime = this.elapsedTime;
        this.running = saved.running || false;
        if (this.running) {
          this.startTimestamp = performance.now();
          this.updateDisplayTime();
        }
      }
    },
  },
  mounted() {
    this.loadTime();
  },
  beforeUnmount() {
    cancelAnimationFrame(this.rafId);
    this.saveTime();
  },
};
</script>

<style scoped>
.v-card {
  padding: 0;
}

.person-name {
  display: flex;
  align-items: center;
  height: 100%;
}
</style>
