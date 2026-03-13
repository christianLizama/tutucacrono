<template>
  <v-app-bar app color="#3f51b5" dark>
    <v-toolbar-title>Tutuca MTB</v-toolbar-title>
    <v-spacer></v-spacer>
    <v-btn
      v-for="category in categories"
      :key="category"
      text
      @click="navigateToCategory(category)"
    >
      {{ category }}
    </v-btn>
  </v-app-bar>
</template>

<script>
export default {
  name: 'NavbarComponent',
  data() {
    return {
      categories: [
        'Kids', 'Infantil', 'Junior', 'Damas', 'Novicios', 'Rígido', 'Experto', 'Elite', 'Master A', 'Open Master', 'E-bike Varones', 'E-bike Damas' ,'Corredores'
      ],
    };
  },
  methods: {
    navigateToCategory(category) {
      if (category === 'Corredores') {
        this.$router.push({ name: 'corredores' });
        return; 
      }

      this.$router.push({ name: 'category', params: { category } });
    },
  },
};
</script>
