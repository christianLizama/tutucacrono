<template>
  <div>
    <TimerHeader />
    <PersonTimer v-for="person in persons" :key="person._id" :person="person" />
  </div>
</template>

<script>
import PersonTimer from '@/components/PersonTimer.vue';
import TimerHeader from '@/components/TimerHeader.vue';
import axios from 'axios';

export default {
  name: 'CategoryView',
  components: {
    PersonTimer,
    TimerHeader,
  },
  props: ['category'],
  data() {
    return {
      persons: [],
    };
  },
  mounted() {
    // Escuchar el evento de teclado para prevenir el refresh
    window.addEventListener('keydown', this.preventRefresh);
    window.addEventListener('beforeunload', this.showUnloadWarning);
  },
  beforeUnmount() {
    // Limpiar el listener cuando el componente se destruya
    window.removeEventListener('keydown', this.preventRefresh);
    window.removeEventListener('beforeunload', this.showUnloadWarning);
  },
  async created() {
    await this.fetchPersons(this.category);
  },
  methods: {
    async fetchPersons(category) {
      try {
        const response = await axios.get(`http://127.0.0.1:3030/corredores/categoria/${category}`);
        this.persons = response.data.corredores;
      } catch (error) {
        console.error('Error fetching persons:', error);
      }
    },
    preventRefresh(event) {
      if (event.key === 'F5' || (event.ctrlKey && event.key === 'r')) {
        event.preventDefault();
        alert('Recargar está deshabilitado mientras el cronómetro está corriendo.');
      }
    },
    showUnloadWarning(event) {
      // Mostrar advertencia cuando el usuario intenta salir
      event.preventDefault();
      event.returnValue = ''; // Esto muestra la advertencia en navegadores modernos
    }
  },
  watch: {
    category(newCategory) {
      this.fetchPersons(newCategory);
    },
  },
};
</script>
