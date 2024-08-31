<template>
  <div>
    <h1 class="text-center mt-3">Race Leaderboard</h1>
    <div v-if="updateTimeEvents.length > 0">
      <v-list>
        <transition-group name="slide-fade" tag="div">
          <v-list-item
            v-for="(event, index) in sortedUpdateTimeEvents"
            :key="event.rut"
            class="mx-4 my-2"
            :color="getColor(index)"
            elevation="2"
          >
            <v-row class="align-center">
              <!-- Posición -->
              <v-col class="text-center" cols="1">
                <v-avatar color="primary" size="40">
                  <span class="white--text">{{ index + 1 }}</span>
                </v-avatar>
              </v-col>
              
              <!-- Nombre -->
              <v-col cols="3">
                <v-list-item-title>{{ event.nombre }}</v-list-item-title>
              </v-col>

              <!-- RUT -->
              <v-col cols="3">
                <v-list-item-subtitle>RUT: {{ event.rut }}</v-list-item-subtitle>
              </v-col>

              <!-- Equipo -->
              <v-col cols="3">
                <v-list-item-subtitle>Team: {{ event.team }}</v-list-item-subtitle>
              </v-col>

              <!-- Tiempo -->
              <v-col cols="2" class="text-right">
                <v-list-item-subtitle>{{ formatTime(event.tiempo) }}</v-list-item-subtitle>
              </v-col>
            </v-row>
          </v-list-item>
        </transition-group>
      </v-list>
    </div>
    <div v-else>
      <p class="text-center">No update time events yet.</p>
    </div>
  </div>
</template>

<script>
import { state } from '@/socket';

export default {
  name: "RankView",
  data() {
    return {
      updateTimeEvents: state.updateTimeEvents // Vincula los eventos updateTime al estado local
    };
  },
  computed: {
    // Computed property para ordenar los eventos por tiempo (ascendente)
    sortedUpdateTimeEvents() {
      return this.updateTimeEvents.slice().sort((a, b) => a.tiempo - b.tiempo);
    }
  },
  watch: {
    // Observa cambios en los eventos updateTime para actualizar el componente
    "state.updateTimeEvents"(newEvents) {
      this.updateTimeEvents = newEvents;
    }
  },
  methods: {
    // Método para formatear el tiempo en minutos:segundos:milisegundos
    formatTime(ms) {
      const minutes = Math.floor(ms / 60000);
      const seconds = ((ms % 60000) / 1000).toFixed(2);
      return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    },
    // Método para obtener el color de la lista según la posición
    getColor(index) {
      if (index === 0) return "green lighten-3";
      if (index === 1) return "blue lighten-3";
      if (index === 2) return "orange lighten-3";
      return "grey lighten-3";
    }
  }
};
</script>

<style scoped>
/* Transición personalizada para desvanecimiento y deslizamiento */
.slide-fade-enter-active, .slide-fade-leave-active {
  transition: all 0.5s ease;
}
.slide-fade-enter-from, .slide-fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
