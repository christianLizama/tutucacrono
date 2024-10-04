<template>
  <v-card class="mb-3">
    <v-card-text class="d-flex align-items-center">
      <div class="d-flex align-items-center justify-start" style="width: 10%">
        <v-chip class="ma-2" color="primary" text-color="white">{{ person.numero }}</v-chip>
      </div>
      <div class="d-flex align-items-center justify-start" style="width: 30%">
        <span class="person-name">{{ person.nombre }}</span>
      </div>
      <div class="d-flex align-items-center justify-start" style="width: 30%">
        <span class="person-name">{{ person.team }}</span>
      </div>
      <div class="d-flex align-items-center justify-start" style="width: 30%">
        <v-chip class="ma-2">{{ formatTime(time) }}</v-chip>
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
          :disabled="isSavedAndRunning()"
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
import axios from 'axios';

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
      time: 0, // El tiempo en milisegundos
      running: false,
      interval: null,
      snackbar: false, // Controla la visibilidad de la notificación
      snackbarText: '', // Texto de la notificación
      timeSaved: false // Estado de guardado del tiempo
    };
  },
  mounted() {
    this.loadTime();
  },
  methods: {
    isSavedAndRunning() {
      return this.running;
    },
    startStopTimer() {
      if (this.running) {
        clearInterval(this.interval);
      } else {
        this.interval = setInterval(() => {
          this.time += 10; // Incrementamos por 10 milisegundos
          this.saveTime();
        }, 10);
      }
      this.running = !this.running;
      this.saveTime();
    },
    resetTimer() {
      this.time = 0;
      clearInterval(this.interval);
      this.running = false;
      this.saveTime();
    },
    formatTime(milliseconds) {
      const mins = Math.floor(milliseconds / 60000);
      const secs = Math.floor((milliseconds % 60000) / 1000);
      const millis = milliseconds % 1000;
      return `${mins}:${secs < 10 ? "0" : ""}${secs}:${millis < 100 ? (millis < 10 ? "00" : "0") : ""}${millis}`;
    },
    saveTime() {
      const storedTimes = JSON.parse(localStorage.getItem("timers")) || {};
      storedTimes[this.person.id] = {
        time: this.time,
        running: this.running,
      };
      localStorage.setItem("timers", JSON.stringify(storedTimes));
    },
    async saveTimeInBD() {
      try {
        const response = await axios.patch(
          `http://127.0.0.1:3030/corredores/enviarTiempo/${this.person._id}`,
          { tiempo: this.time } // Aquí se envía el campo "tiempo" con el valor actual
        );
        console.log("Tiempo guardado en BD:", response.data);
        this.timeSaved = true; // Cambia el estado a guardado
        this.snackbarText = 'Tiempo guardado exitosamente!';
        this.snackbar = true; // Muestra la notificación
      } catch (error) {
        console.error("Error al guardar el tiempo en BD:", error);
        this.snackbarText = 'Error al guardar el tiempo.';
        this.snackbar = true; // Muestra un mensaje de error
      }
    },
    loadTime() {
      const storedTimes = JSON.parse(localStorage.getItem("timers")) || {};
      if (storedTimes[this.person.id]) {
        const { time, running } = storedTimes[this.person.id];
        this.time = time;
        this.running = running;
        if (running) {
          this.interval = setInterval(() => {
            this.time += 10;
            this.saveTime();
          }, 10);
        }
      }
    },
  },
  beforeUnmount() {
    clearInterval(this.interval);
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
