<template>
  <div>
    <h1 class="text-center mt-3">Resultados Categoría {{ selectedCategory}}</h1>

    <!-- Seleccionador de categorías -->
    <v-select
      v-model="selectedCategory"
      :items="categories"
      item-title="value"
      label="Seleccionar categoría"
      class="mx-4 my-3"
      @change="fetchData"
      
    ></v-select>

    <div>
      <v-list>
        <transition-group>
          <v-list-item
            v-for="(event, index) in updateTimeEvents"
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
                <v-list-item-subtitle class="font-weight-bold">{{ formatTime(event.tiempo) }}</v-list-item-subtitle>
              </v-col>
            </v-row>
          </v-list-item>
        </transition-group>
      </v-list>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: "RankView",
  data() {
    return {
      updateTimeEvents: [],
      selectedCategory: 'Infantil', // Valor inicial de categoría
      categories: [
        { text: 'Kids', value: 'Kids' },
        { text: 'Infantil', value: 'Infantil' },
        { text: 'Junior', value: 'Junior' },
        { text: 'Damas', value: 'Damas' },
        { text: 'Novicios', value: 'Novicios' },
        { text: 'Rígido', value: 'Rígido' },
        { text: 'Experto', value: 'Experto' },
        { text: 'Elite', value: 'Elite' },
        { text: 'Master A', value: 'Master A' },
        { text: 'Open Master', value: 'Open Master' }
      ],
    };
  },
  created() {
    this.fetchData(); // Llama a la función cuando el componente es montado
    // this.interval = setInterval(this.fetchData, 20000); // Consulta cada 10 segundos
  },
  watch: {
    selectedCategory(newValue){
      if(newValue){
        this.fetchData();
      }
    }
  },
  methods: {
    // Método para obtener los datos de la API en función de la categoría seleccionada
    async fetchData() {
      console.log("obteniedo datos");
      try {
        const response = await axios.get(`http://127.0.0.1:3030/corredores/categoria/${this.selectedCategory}/tiempo`);
        // Verificar si hay cambios en los tiempos
        if (JSON.stringify(this.updateTimeEvents) !== JSON.stringify(response.data.corredores)) {
          this.updateTimeEvents = response.data.corredores; // Actualiza con los nuevos datos

        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    },
    // Método para formatear el tiempo en minutos:segundos:milisegundos
    formatTime(ms) {
      const mins = Math.floor(ms / 60000);
      const secs = Math.floor((ms % 60000) / 1000);
      const millis = Math.floor(ms % 1000);
      return `${mins}:${secs.toString().padStart(2, "0")}:${millis.toString().padStart(3, "0")}`;
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
