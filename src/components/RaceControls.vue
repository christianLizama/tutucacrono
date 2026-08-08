<template>
  <v-card class="mb-4 race-controls" elevation="3">
    <!-- Sin carrera activa -->
    <template v-if="!carrera">
      <v-card-text class="text-center pa-6">
        <v-icon size="64" color="grey-lighten-1" class="mb-3">mdi-flag-checkered</v-icon>
        <h3 class="text-h6 mb-2">No hay carrera activa para esta categoría</h3>
        <p class="text-body-2 text-grey mb-4">
          Crea una nueva Qualy para comenzar la clasificación.
        </p>
        <v-btn
          color="primary"
          size="large"
          prepend-icon="mdi-plus"
          @click="showCrearDialog = true"
        >
          Crear Qualy
        </v-btn>
      </v-card-text>
    </template>

    <!-- Con carrera activa -->
    <template v-else>
      <v-card-title class="d-flex align-center justify-space-between pa-4">
        <div class="d-flex align-center ga-3">
          <v-chip
            :color="faseColor"
            variant="elevated"
            size="large"
            class="font-weight-bold"
          >
            <v-icon start>{{ faseIcon }}</v-icon>
            {{ carrera.fase === 'qualy' ? 'QUALY' : 'FINAL' }}
          </v-chip>
          <span class="text-h6">{{ carrera.nombre }}</span>
          <v-chip
            :color="estadoColor"
            variant="tonal"
            size="small"
          >
            {{ estadoTexto }}
          </v-chip>
        </div>

        <div class="d-flex ga-2">
          <!-- Botón Iniciar -->
          <v-btn
            v-if="carrera.estado === 'pendiente'"
            color="success"
            prepend-icon="mdi-play"
            @click="iniciarCarrera"
            :loading="loading"
          >
            Iniciar {{ carrera.fase === 'qualy' ? 'Qualy' : 'Final' }}
          </v-btn>

          <!-- Botón Finalizar/Cerrar -->
          <v-btn
            v-if="carrera.estado === 'en_curso'"
            color="error"
            prepend-icon="mdi-stop"
            @click="confirmarFinalizar"
            :loading="loading"
          >
            Cerrar {{ carrera.fase === 'qualy' ? 'Qualy' : 'Final' }}
          </v-btn>

          <!-- Botón Generar Final (solo si es qualy finalizada) -->
          <v-btn
            v-if="carrera.fase === 'qualy' && carrera.estado === 'finalizada'"
            color="primary"
            prepend-icon="mdi-arrow-right-bold"
            @click="generarFinal"
            :loading="loading"
          >
            Generar Final
          </v-btn>

          <!-- Botón Ir a la Final (si ya existe) -->
          <v-btn
            v-if="finalDisponible"
            color="deep-purple"
            prepend-icon="mdi-flag-checkered"
            @click="irAFinal"
          >
            Ver Final
          </v-btn>

          <!-- Menú de opciones -->
          <v-menu>
            <template v-slot:activator="{ props }">
              <v-btn icon v-bind="props" variant="text">
                <v-icon>mdi-dots-vertical</v-icon>
              </v-btn>
            </template>
            <v-list>
              <v-list-item
                @click="exportarGrilla"
                prepend-icon="mdi-file-pdf-box"
              >
                <v-list-item-title>Exportar Grilla (PDF)</v-list-item-title>
              </v-list-item>
              <v-list-item
                @click="verHistorial"
                prepend-icon="mdi-history"
              >
                <v-list-item-title>Ver historial de carreras</v-list-item-title>
              </v-list-item>
              <v-list-item
                v-if="carrera.estado !== 'en_curso'"
                @click="confirmarEliminar"
                prepend-icon="mdi-delete"
                class="text-error"
              >
                <v-list-item-title>Eliminar carrera</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </div>
      </v-card-title>

      <!-- Barra de progreso durante carrera -->
      <v-progress-linear
        v-if="carrera.estado === 'en_curso'"
        indeterminate
        :color="faseColor"
        height="3"
      />

      <!-- Resumen de resultados -->
      <v-card-text v-if="carrera.estado !== 'pendiente'" class="pa-4 pt-2">
        <div class="d-flex ga-4">
          <v-chip size="small" color="success" variant="tonal">
            <v-icon start size="small">mdi-check</v-icon>
            {{ finalizados }} finalizado{{ finalizados !== 1 ? 's' : '' }}
          </v-chip>
          <v-chip v-if="corriendo > 0" size="small" color="warning" variant="tonal">
            <v-icon start size="small">mdi-run</v-icon>
            {{ corriendo }} corriendo
          </v-chip>
          <v-chip v-if="pendientes > 0" size="small" color="info" variant="tonal">
            <v-icon start size="small">mdi-clock-outline</v-icon>
            {{ pendientes }} pendiente{{ pendientes !== 1 ? 's' : '' }}
          </v-chip>
          <v-chip v-if="dns > 0" size="small" color="grey" variant="tonal">
            DNS: {{ dns }}
          </v-chip>
          <v-chip v-if="dnf > 0" size="small" color="grey" variant="tonal">
            DNF: {{ dnf }}
          </v-chip>
        </div>
      </v-card-text>
    </template>

    <!-- Dialog: Crear Carrera -->
    <v-dialog v-model="showCrearDialog" max-width="500">
      <v-card>
        <v-card-title>
          <v-icon start>mdi-flag-plus</v-icon>
          Crear Qualy — {{ categoria }}
        </v-card-title>
        <v-card-text>
          <v-text-field
            v-model="nuevoNombre"
            label="Nombre de la carrera"
            :placeholder="`Qualy ${categoria}`"
            variant="outlined"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showCrearDialog = false">Cancelar</v-btn>
          <v-btn
            color="primary"
            @click="crearQualy"
            :loading="loading"
          >
            Crear
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog: Confirmar Finalizar -->
    <v-dialog v-model="showFinalizarDialog" max-width="500">
      <v-card>
        <v-card-title class="text-error">
          <v-icon start color="error">mdi-alert</v-icon>
          Confirmar cierre
        </v-card-title>
        <v-card-text>
          <p>¿Estás seguro de cerrar esta {{ carrera?.fase === 'qualy' ? 'Qualy' : 'Final' }}?</p>
          <p class="text-body-2 text-grey mt-2">
            Los corredores pendientes serán marcados como DNS (No largaron) y
            los que estén corriendo como DNF (No terminaron).
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showFinalizarDialog = false">Cancelar</v-btn>
          <v-btn color="error" @click="finalizarCarrera" :loading="loading">
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog: Confirmar Eliminar -->
    <v-dialog v-model="showEliminarDialog" max-width="500">
      <v-card>
        <v-card-title class="text-error">
          <v-icon start color="error">mdi-delete-alert</v-icon>
          Eliminar carrera
        </v-card-title>
        <v-card-text>
          <p>¿Estás seguro de eliminar esta carrera? Esta acción no se puede deshacer.</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showEliminarDialog = false">Cancelar</v-btn>
          <v-btn color="error" @click="eliminarCarrera" :loading="loading">
            Eliminar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog: Historial -->
    <v-dialog v-model="showHistorialDialog" max-width="700">
      <v-card>
        <v-card-title>
          <v-icon start>mdi-history</v-icon>
          Historial de carreras — {{ categoria }}
        </v-card-title>
        <v-card-text>
          <v-list v-if="historialCarreras.length > 0">
            <v-list-item
              v-for="c in historialCarreras"
              :key="c._id"
              @click="cambiarCarrera(c)"
              :class="{ 'bg-blue-lighten-5': c._id === carrera?._id }"
            >
              <template v-slot:prepend>
                <v-chip
                  :color="c.fase === 'qualy' ? 'orange' : 'deep-purple'"
                  size="small"
                  class="mr-2"
                >
                  {{ c.fase.toUpperCase() }}
                </v-chip>
              </template>
              <v-list-item-title>{{ c.nombre }}</v-list-item-title>
              <v-list-item-subtitle>
                Estado: {{ c.estado }} — {{ c.resultados?.length || 0 }} corredores
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
          <p v-else class="text-center text-grey pa-4">No hay carreras registradas.</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showHistorialDialog = false">Cerrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar" :timeout="3000" :color="snackbarColor">
      {{ snackbarText }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar = false">Cerrar</v-btn>
      </template>
    </v-snackbar>
  </v-card>
</template>

<script>
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default {
  name: 'RaceControls',
  props: {
    categoria: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      loading: false,
      showCrearDialog: false,
      showFinalizarDialog: false,
      showEliminarDialog: false,
      showHistorialDialog: false,
      nuevoNombre: '',
      historialCarreras: [],
      finalDisponible: false,
      snackbar: false,
      snackbarText: '',
      snackbarColor: 'success',
    };
  },
  watch: {
    showCrearDialog(isOpen) {
      if (isOpen) {
        this.nuevoNombre = `Qualy ${this.categoria}`;
      }
    },
    categoria: {
      immediate: true,
      handler(val) {
        this.nuevoNombre = `Qualy ${val}`;
      },
    },
  },
  computed: {
    carrera() {
      return this.$store.getters.carreraActual;
    },
    faseColor() {
      return this.carrera?.fase === 'qualy' ? 'orange' : 'deep-purple';
    },
    faseIcon() {
      return this.carrera?.fase === 'qualy' ? 'mdi-timer' : 'mdi-flag-checkered';
    },
    estadoColor() {
      const map = { pendiente: 'info', en_curso: 'warning', finalizada: 'success' };
      return map[this.carrera?.estado] || 'grey';
    },
    estadoTexto() {
      const map = { pendiente: 'Pendiente', en_curso: 'En curso', finalizada: 'Finalizada' };
      return map[this.carrera?.estado] || '';
    },
    finalizados() {
      return this.carrera?.resultados?.filter(r => r.estado === 'finalizado').length || 0;
    },
    corriendo() {
      return this.carrera?.resultados?.filter(r => r.estado === 'corriendo').length || 0;
    },
    pendientes() {
      return this.carrera?.resultados?.filter(r => r.estado === 'pendiente').length || 0;
    },
    dns() {
      return this.carrera?.resultados?.filter(r => r.estado === 'dns').length || 0;
    },
    dnf() {
      return this.carrera?.resultados?.filter(r => r.estado === 'dnf').length || 0;
    },
  },
  methods: {
    async crearQualy() {
      this.loading = true;
      try {
        const nombre = this.nuevoNombre || `Qualy ${this.categoria}`;
        await this.$store.dispatch('crearCarrera', {
          nombre,
          categoria: this.categoria,
          fase: 'qualy',
        });
        this.showCrearDialog = false;
        this.nuevoNombre = '';
        this.showSnackbar('Qualy creada exitosamente', 'success');
      } catch (error) {
        const msg = error.response?.data?.message || 'Error al crear la Qualy';
        this.showSnackbar(msg, 'error');
      } finally {
        this.loading = false;
      }
    },
    async iniciarCarrera() {
      this.loading = true;
      try {
        await this.$store.dispatch('iniciarCarrera');
        this.showSnackbar('Carrera iniciada', 'success');
      } catch (error) {
        const msg = error.response?.data?.message || 'Error al iniciar';
        this.showSnackbar(msg, 'error');
      } finally {
        this.loading = false;
      }
    },
    confirmarFinalizar() {
      this.showFinalizarDialog = true;
    },
    async finalizarCarrera() {
      this.loading = true;
      try {
        await this.$store.dispatch('finalizarCarrera');
        this.showFinalizarDialog = false;
        this.showSnackbar('Carrera finalizada', 'success');
      } catch (error) {
        const msg = error.response?.data?.message || 'Error al finalizar';
        this.showSnackbar(msg, 'error');
      } finally {
        this.loading = false;
      }
    },
    async generarFinal() {
      this.loading = true;
      try {
        await this.$store.dispatch('generarFinal');
        this.showSnackbar('Final generada exitosamente. La grilla se ordenó por tiempos de Qualy.', 'success');
      } catch (error) {
        const msg = error.response?.data?.message || 'Error al generar Final';
        this.showSnackbar(msg, 'error');
      } finally {
        this.loading = false;
      }
    },
    irAFinal() {
      // Recargar la carrera activa (que ahora debería ser la final)
      this.$store.dispatch('cargarCarreraActiva', this.categoria);
    },
    confirmarEliminar() {
      this.showEliminarDialog = true;
    },
    async eliminarCarrera() {
      this.loading = true;
      try {
        await this.$store.dispatch('eliminarCarrera');
        this.showEliminarDialog = false;
        this.showSnackbar('Carrera eliminada', 'success');
      } catch (error) {
        this.showSnackbar('Error al eliminar', 'error');
      } finally {
        this.loading = false;
      }
    },
    async verHistorial() {
      this.historialCarreras = await this.$store.dispatch(
        'cargarCarrerasCategoria',
        this.categoria
      );
      this.showHistorialDialog = true;
    },
    async cambiarCarrera(carrera) {
      await this.$store.dispatch('cargarCarrera', carrera._id);
      this.showHistorialDialog = false;
    },
    exportarGrilla() {
      if (!this.carrera || !this.carrera.resultados) return;

      const doc = new jsPDF();
      doc.text(`Grilla de Largada - ${this.carrera.nombre}`, 14, 15);

      // Ordenamos a los corredores por la posición designada en la carrera
      const ordenados = [...this.carrera.resultados].sort((a, b) => {
        // Los que no tienen posición van al final
        if (a.posicion === 0) return 1;
        if (b.posicion === 0) return -1;
        return a.posicion - b.posicion;
      });

      const tableColumn = ["Orden de Salida", "Número", "Nombre", "RUT", "Team"];
      const tableRows = [];

      ordenados.forEach((resultado) => {
        const rowData = [
          resultado.posicion > 0 ? resultado.posicion : '-',
          resultado.corredor?.numero || '-',
          resultado.corredor?.nombre || 'N/A',
          resultado.corredor?.rut || 'N/A',
          resultado.corredor?.team || 'N/A',
        ];
        tableRows.push(rowData);
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 20,
      });

      doc.save(`Grilla_${this.carrera.nombre.replace(/\s+/g, '_')}.pdf`);
    },
    showSnackbar(text, color = 'success') {
      this.snackbarText = text;
      this.snackbarColor = color;
      this.snackbar = true;
    },
  },
};
</script>

<style scoped>
.race-controls {
  border-left: 4px solid #1976d2;
}
</style>
