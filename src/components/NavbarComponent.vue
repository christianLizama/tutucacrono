<template>
  <v-app-bar app color="#3f51b5" dark>
    <v-toolbar-title
      class="cursor-pointer"
      @click="$router.push({ name: 'home' })"
    >
      Tutuca MTB
    </v-toolbar-title>
    <v-spacer />

    <!-- Menú de categorías agrupado -->
    <v-menu>
      <template v-slot:activator="{ props }">
        <v-btn v-bind="props" text prepend-icon="mdi-bike-fast">
          Categorías
          <v-icon end>mdi-chevron-down</v-icon>
        </v-btn>
      </template>
      <v-list>
        <v-list-item
          v-for="cat in raceCategories"
          :key="cat"
          @click="navigateToCategory(cat)"
        >
          <v-list-item-title>{{ cat }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>

    <v-btn text @click="$router.push({ name: 'rankings' })" prepend-icon="mdi-trophy">
      Rankings
    </v-btn>

    <v-btn text @click="$router.push({ name: 'corredores' })" prepend-icon="mdi-account-group">
      Corredores
    </v-btn>

    <!-- Indicador WebSocket -->
    <v-chip
      :color="wsConnected ? 'green' : 'red'"
      size="x-small"
      variant="elevated"
      class="ml-2 mr-2"
    >
      <v-icon size="small">{{ wsConnected ? 'mdi-wifi' : 'mdi-wifi-off' }}</v-icon>
    </v-chip>
  </v-app-bar>
</template>

<script>
export default {
  name: 'NavbarComponent',
  data() {
    return {
      raceCategories: [
        'Kids', 'Infantil', 'Junior', 'Damas', 'Novicios',
        'Rígido', 'Experto', 'Elite', 'Master A', 'Open Master',
        'E-bike Varones', 'E-bike Damas',
      ],
    };
  },
  computed: {
    wsConnected() {
      return this.$store.getters.wsConnected;
    },
  },
  methods: {
    navigateToCategory(category) {
      this.$router.push({ name: 'category', params: { category } });
    },
  },
};
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
