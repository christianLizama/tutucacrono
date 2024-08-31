<template>
  <v-app-bar app color="#3f51b5" dark>
    <v-toolbar-title>Tutuca MTB</v-toolbar-title>
    <v-spacer></v-spacer>
    <v-btn
      v-for="category in categories"
      :key="category"
      text
      @click="selectCategory(category)"
    >
      {{ category }}
    </v-btn>
  </v-app-bar>
</template>

<script>
export default {
  name: "NavbarComponent",
  data() {
    return {
      categories: ["Kids","Infantil","Junior", "Damas", "Novicios","Rigido","Experto","Elite", "Master A", "Open Master", ],
    };
  },
  methods: {
    selectCategory(category) {
      // Aquí podrías manejar la lógica para cambiar de categoría, por ejemplo, emitir un evento
      this.$emit("category-selected", category);
    },
  },
};
</script>

<style scoped>
/* El estilo en scoped se mantiene similar */
</style>
