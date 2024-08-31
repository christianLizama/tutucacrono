<template>
  <v-card class="mb-3">
    <v-card-text class="d-flex align-items-center">
      <div class="d-flex align-items-center justify-start" style="width: 10%;">
        <v-chip class="ma-2" color="primary" text-color="white">{{ person.id }}</v-chip>
      </div>
      <div class="d-flex align-items-center justify-start" style="width: 30%;">
        <span class="person-name">{{ person.name }}</span>
      </div>
      <div class="d-flex align-items-center justify-start" style="width: 30%;">
        <v-chip class="ma-2">{{ formatTime(time) }}</v-chip>
      </div>
      <div class="d-flex align-items-center justify-center" style="width: 30%;">
        <v-btn @click="startStopTimer" class="ma-2" :color="running ? 'error' : 'success'" dark>
          <v-icon>{{ running ? 'mdi-stop' : 'mdi-play' }}</v-icon>
        </v-btn>
        <v-btn @click="resetTimer" class="ma-2" color="secondary" dark :disabled="running">
          <v-icon>mdi-restart</v-icon>
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
export default {
  name: 'PersonTimer',
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
    };
  },
  mounted() {
    this.loadTime();
  },
  methods: {
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
      return `${mins}:${secs < 10 ? '0' : ''}${secs}:${millis < 100 ? millis < 10 ? '00' : '0' : ''}${millis}`;
    },
    saveTime() {
      const storedTimes = JSON.parse(localStorage.getItem('timers')) || {};
      storedTimes[this.person.id] = {
        time: this.time,
        running: this.running,
      };
      localStorage.setItem('timers', JSON.stringify(storedTimes));
    },
    loadTime() {
      const storedTimes = JSON.parse(localStorage.getItem('timers')) || {};
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
