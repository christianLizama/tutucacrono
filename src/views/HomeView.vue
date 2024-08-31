<template>
  <div class="mt-2">
    <TimerHeader />
    <PersonTimer v-for="person in persons" :key="person.id" :person="person" />
  </div>
</template>

<script>
import PersonTimer from '@/components/PersonTimer.vue';
import TimerHeader from '@/components/TimerHeader.vue';
export default {
  name: 'HomeView',
  components: {
    PersonTimer,
    TimerHeader,
  },
  data() {
    return {
      selectedCategory: '', // Categoría seleccionada
      // Lista de personas con sus nombres y IDs únicos
      persons: [
        { id: 1, name: 'Gonzalo Aliaga' },
        { id: 2, name: 'Samuel Guzman' },
        { id: 3, name: 'Ñapitan' },
      ],
    };
  },
  methods: {
    handleCategorySelected(category) {
      this.selectedCategory = category;
    },
  },
};
</script>
