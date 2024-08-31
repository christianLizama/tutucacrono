<template>
  <v-card class="mb-3">
    <v-card-text class="d-flex align-items-center header-content">
      <div
        class="d-flex align-items-center justify-start header-title"
        style="width: 10%"
      >
        <span class="header-chip">Número</span>
      </div>
      <div
        class="d-flex align-items-center justify-start header-title"
        style="width: 30%"
      >
        <span class="header-chip">Persona</span>
      </div>
      <div
        class="d-flex align-items-center justify-start header-title"
        style="width: 30%"
      >
        <span class="header-chip">Tiempo (min:seg:mil)</span>
      </div>
      <div
        class="d-flex align-items-center justify-center header-title"
        style="width: 30%"
      >
        <span class="header-chip">Acciones</span>
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
.v-card {
  padding: 0;
  background-color: #f5f5f5; /* Color de fondo para diferenciar la cabecera */
}
.v-card-text {
  font-weight: bold; /* Texto en negrita */
}
.header-content {
  height: 100%;
}
.header-title {
  height: 100%;
}
.header-chip {
  display: flex;
  align-items: center;
  height: 100%;
}
</style>
