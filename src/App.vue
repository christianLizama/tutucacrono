<template>
  <v-app>
    <Navbar @category-selected="handleCategorySelected" />
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script>
import Navbar from './components/NavbarComponent.vue';

export default {
  name: 'App',
  components: {
    Navbar,
  },
  data() {
    return {
      selectedCategory: '',
    };
  },
  methods: {
    handleCategorySelected(category) {
      this.selectedCategory = category;
    },
  },
};
</script>

<style>

</style>
