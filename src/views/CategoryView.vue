<template>
  <div class="category-view">
    <!-- Controles de la carrera -->
    <RaceControls :categoria="category" />

    <!-- Lista de corredores con timer -->
    <template v-if="carrera && carrera.resultados && carrera.resultados.length > 0">
      <TimerHeader />
      <PersonTimer
        v-for="resultado in resultadosOrdenados"
        :key="getCorredorId(resultado)"
        :resultado="resultado"
      />
    </template>

    <!-- Mensaje cuando no hay carrera -->
    <template v-else-if="!carrera">
      <v-card class="mt-4 text-center pa-8" elevation="0" color="grey-lighten-5">
        <v-icon size="80" color="grey-lighten-2">mdi-bike-fast</v-icon>
        <h3 class="text-h6 mt-4 text-grey">{{ category }}</h3>
        <p class="text-body-2 text-grey mt-2">
          Crea una Qualy desde el panel superior para comenzar.
        </p>
      </v-card>
    </template>
  </div>
</template>

<script>
import PersonTimer from '@/components/PersonTimer.vue';
import TimerHeader from '@/components/TimerHeader.vue';
import RaceControls from '@/components/RaceControls.vue';

export default {
  name: 'CategoryView',
  components: {
    PersonTimer,
    TimerHeader,
    RaceControls,
  },
  props: ['category'],

  computed: {
    carrera() {
      return this.$store.getters.carreraActual;
    },
    resultadosOrdenados() {
      return this.$store.getters.resultadosOrdenados;
    },
  },

  async created() {
    await this.loadRace(this.category);
  },

  mounted() {
    // Prevenir recarga accidental mientras hay cronómetros corriendo
    window.addEventListener('keydown', this.preventRefresh);
    window.addEventListener('beforeunload', this.showUnloadWarning);
  },

  beforeUnmount() {
    window.removeEventListener('keydown', this.preventRefresh);
    window.removeEventListener('beforeunload', this.showUnloadWarning);
  },

  methods: {
    async loadRace(category) {
      await this.$store.dispatch('cargarCarreraActiva', category);
    },

    getCorredorId(resultado) {
      return resultado.corredor?._id || resultado.corredor;
    },

    preventRefresh(event) {
      if (event.key === 'F5' || (event.ctrlKey && event.key === 'r')) {
        // Solo prevenir si hay una carrera en curso
        if (this.$store.getters.carreraEnCurso) {
          event.preventDefault();
          alert('Recargar está deshabilitado mientras la carrera está en curso.');
        }
      }
    },

    showUnloadWarning(event) {
      if (this.$store.getters.carreraEnCurso) {
        event.preventDefault();
        event.returnValue = '';
      }
    },
  },

  watch: {
    category(newCategory) {
      this.loadRace(newCategory);
    },
  },
};
</script>

<style scoped>
.category-view {
  padding: 16px;
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
}
</style>
