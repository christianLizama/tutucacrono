<template>
  <v-card class="mb-1 timer-header" elevation="0" color="grey-lighten-4">
    <v-card-text class="d-flex align-center pa-4 font-weight-bold text-h6">
      <!-- Posición -->
      <div class="d-flex align-center justify-center" style="width: 80px">
        <span>Pos</span>
      </div>
      <!-- Nombre -->
      <div class="d-flex align-center justify-start" style="width: 25%">
        <span>Piloto</span>
      </div>
      <!-- Team -->
      <div class="d-flex align-center justify-start" style="width: 15%">
        <span>Team</span>
      </div>
      <!-- Número -->
      <div class="d-flex align-center justify-center" style="width: 10%">
        <span>Nº</span>
      </div>
      <!-- Tiempo -->
      <div class="d-flex align-center justify-center" style="width: 22%">
        <span>Tiempo (min:seg:mil)</span>
      </div>
      <!-- Estado -->
      <div class="d-flex align-center justify-center" style="width: 10%">
        <span>Estado</span>
      </div>
      <!-- Acciones -->
      <div class="d-flex align-center justify-end ga-2" style="width: 18%">
        <span>Acciones</span>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
export default {
  name: "TimerHeader",
};
</script>

<style scoped>
.timer-header {
  border-bottom: 2px solid #e0e0e0;
}
</style>
