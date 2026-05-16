<template>
  <div class="rank-view">
    <h1 class="text-center mt-3 mb-1">Resultados</h1>

    <div class="d-flex align-center mx-4 my-3">
      <!-- Selector de categoría -->
      <v-select
        v-model="selectedCategory"
        :items="categories"
        item-title="value"
        label="Seleccionar categoría"
        variant="outlined"
        density="comfortable"
        hide-details
        class="flex-grow-1 mr-4"
      />

      <v-btn
        color="info"
        prepend-icon="mdi-refresh"
        @click="fetchData"
        :loading="loading"
        class="mr-2"
      >
        Actualizar
      </v-btn>

      <v-btn
        color="error"
        prepend-icon="mdi-file-pdf-box"
        @click="exportPDF"
        :disabled="!carreraSeleccionada || resultadosOrdenados.length === 0"
        class="mr-2"
      >
        PDF
      </v-btn>

      <v-btn
        color="success"
        prepend-icon="mdi-file-excel"
        @click="exportExcel"
        :disabled="!carreraSeleccionada || resultadosOrdenados.length === 0"
      >
        Excel
      </v-btn>
    </div>

    <!-- Cargando -->
    <div v-if="loading" class="text-center pa-8">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <!-- Sin carreras -->
    <div v-else-if="carreras.length === 0" class="text-center pa-8">
      <v-icon size="64" color="grey-lighten-2">mdi-trophy-outline</v-icon>
      <p class="text-grey mt-4">No hay carreras registradas para esta categoría.</p>
    </div>

    <!-- Carreras encontradas -->
    <template v-else>
      <v-tabs v-model="activeTab" color="primary" class="mx-4 mb-4">
        <v-tab
          v-for="carrera in carreras"
          :key="carrera._id"
          :value="carrera._id"
        >
          <v-chip
            :color="carrera.fase === 'qualy' ? 'orange' : 'deep-purple'"
            size="small"
            class="mr-2"
            variant="elevated"
          >
            {{ carrera.fase.toUpperCase() }}
          </v-chip>
          {{ carrera.nombre }}
          <v-chip
            :color="carrera.estado === 'finalizada' ? 'success' : 'warning'"
            size="x-small"
            class="ml-2"
            variant="tonal"
          >
            {{ carrera.estado }}
          </v-chip>
        </v-tab>
      </v-tabs>

      <!-- Contenido de la tab activa -->
      <div v-if="carreraSeleccionada" class="mx-4">
        <v-list>
          <transition-group name="slide-fade">
            <v-list-item
              v-for="(resultado, index) in resultadosOrdenados"
              :key="getCorredorId(resultado)"
              class="my-2 rounded-lg"
              :class="getRowClass(resultado, index)"
              elevation="2"
            >
              <v-row class="align-center" no-gutters>
                <!-- Posición -->
                <v-col class="text-center" cols="1">
                  <v-avatar
                    :color="getPositionColor(index, resultado)"
                    size="40"
                  >
                    <span class="text-white font-weight-bold">
                      {{ resultado.estado === 'finalizado' ? index + 1 : '-' }}
                    </span>
                  </v-avatar>
                </v-col>

                <!-- Nombre -->
                <v-col cols="3">
                  <v-list-item-title class="font-weight-medium">
                    {{ resultado.corredor?.nombre || 'N/A' }}
                  </v-list-item-title>
                </v-col>

                <!-- RUT -->
                <v-col cols="2">
                  <v-list-item-subtitle>
                    RUT: {{ resultado.corredor?.rut || 'N/A' }}
                  </v-list-item-subtitle>
                </v-col>

                <!-- Equipo -->
                <v-col cols="2">
                  <v-list-item-subtitle>
                    Team: {{ resultado.corredor?.team || 'N/A' }}
                  </v-list-item-subtitle>
                </v-col>

                <!-- Número -->
                <v-col cols="1" class="text-center">
                  <v-chip color="primary" size="small">
                    {{ resultado.corredor?.numero || '-' }}
                  </v-chip>
                </v-col>

                <!-- Tiempo -->
                <v-col cols="2" class="text-right">
                  <span class="font-weight-bold timer-text">
                    <template v-if="resultado.estado === 'finalizado'">
                      {{ formatTime(resultado.tiempo) }}
                    </template>
                    <template v-else-if="resultado.estado === 'dns'">
                      <v-chip color="grey" size="small">DNS</v-chip>
                    </template>
                    <template v-else-if="resultado.estado === 'dnf'">
                      <v-chip color="error" size="small">DNF</v-chip>
                    </template>
                    <template v-else>
                      <v-chip color="info" size="small">{{ resultado.estado }}</v-chip>
                    </template>
                  </span>
                </v-col>

                <!-- Diferencia con el primero -->
                <v-col cols="1" class="text-right pr-4">
                  <span
                    v-if="resultado.estado === 'finalizado' && index > 0"
                    class="text-grey text-caption"
                  >
                    +{{ formatTime(resultado.tiempo - resultadosOrdenados[0].tiempo) }}
                  </span>
                </v-col>
              </v-row>
            </v-list-item>
          </transition-group>
        </v-list>
      </div>
    </template>
  </div>
</template>

<script>
import axios from 'axios';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const API_URL = 'http://127.0.0.1:3030';

export default {
  name: 'RankView',
  data() {
    return {
      loading: false,
      carreras: [],
      activeTab: null,
      selectedCategory: 'Kids',
      categories: [
        { text: 'Kids', value: 'Kids' },
        { text: 'Infantil', value: 'Infantil' },
        { text: 'Junior', value: 'Junior' },
        { text: 'Damas', value: 'Damas' },
        { text: 'Novicios', value: 'Novicios' },
        { text: 'Rígido', value: 'Rígido' },
        { text: 'Experto', value: 'Experto' },
        { text: 'Elite', value: 'Elite' },
        { text: 'Master A', value: 'Master A' },
        { text: 'Open Master', value: 'Open Master' },
        { text: 'E-bike Varones', value: 'E-bike Varones' },
        { text: 'E-bike Damas', value: 'E-bike Damas' },
      ],
    };
  },

  computed: {
    carreraSeleccionada() {
      return this.carreras.find((c) => c._id === this.activeTab) || null;
    },
    resultadosOrdenados() {
      if (!this.carreraSeleccionada) return [];

      const resultados = [...this.carreraSeleccionada.resultados];

      // Finalizados primero por tiempo, luego DNS/DNF
      const finalizados = resultados
        .filter((r) => r.estado === 'finalizado' && r.tiempo > 0)
        .sort((a, b) => a.tiempo - b.tiempo);

      const otros = resultados.filter(
        (r) => r.estado !== 'finalizado' || r.tiempo <= 0
      );

      return [...finalizados, ...otros];
    },
  },

  watch: {
    selectedCategory() {
      this.fetchData();
    },
  },

  created() {
    this.fetchData();
  },

  methods: {
    async fetchData() {
      this.loading = true;
      try {
        const response = await axios.get(
          `${API_URL}/carreras/categoria/${this.selectedCategory}`
        );
        this.carreras = response.data.data || [];
        // Auto-seleccionar la última carrera
        if (this.carreras.length > 0) {
          this.activeTab = this.carreras[0]._id;
        } else {
          this.activeTab = null;
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        this.carreras = [];
      } finally {
        this.loading = false;
      }
    },

    formatTime(ms) {
      if (!ms || ms <= 0) return '0:00:000';
      const totalMs = Math.max(0, Math.round(ms));
      const mins = Math.floor(totalMs / 60000);
      const secs = Math.floor((totalMs % 60000) / 1000);
      const millis = totalMs % 1000;
      return `${mins}:${secs.toString().padStart(2, '0')}:${millis.toString().padStart(3, '0')}`;
    },

    getCorredorId(resultado) {
      return resultado.corredor?._id || resultado.corredor;
    },

    getPositionColor(index, resultado) {
      if (resultado.estado !== 'finalizado') return 'grey';
      if (index === 0) return 'amber-darken-2';
      if (index === 1) return 'blue-grey';
      if (index === 2) return 'deep-orange';
      return 'primary';
    },

    getRowClass(resultado, index) {
      if (resultado.estado !== 'finalizado') return 'bg-grey-lighten-4';
      if (index === 0) return 'bg-amber-lighten-5';
      if (index === 1) return 'bg-blue-grey-lighten-5';
      if (index === 2) return 'bg-deep-orange-lighten-5';
      return '';
    },

    exportExcel() {
      if (!this.carreraSeleccionada) return;

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Resultados');

      sheet.columns = [
        { header: 'Posición', key: 'posicion', width: 10 },
        { header: 'Nombre', key: 'nombre', width: 30 },
        { header: 'RUT', key: 'rut', width: 15 },
        { header: 'Team', key: 'team', width: 20 },
        { header: 'Número', key: 'numero', width: 10 },
        { header: 'Tiempo', key: 'tiempo', width: 15 },
        { header: 'Diferencia', key: 'diferencia', width: 15 },
        { header: 'Estado', key: 'estado', width: 15 }
      ];

      this.resultadosOrdenados.forEach((resultado, index) => {
        let posicion = resultado.estado === 'finalizado' ? index + 1 : '-';
        let tiempo = resultado.estado === 'finalizado' ? this.formatTime(resultado.tiempo) : '-';
        let diferencia = (resultado.estado === 'finalizado' && index > 0) ? '+' + this.formatTime(resultado.tiempo - this.resultadosOrdenados[0].tiempo) : '-';
        let estado = resultado.estado.toUpperCase();

        if(resultado.estado === 'dns') estado = 'DNS';
        if(resultado.estado === 'dnf') estado = 'DNF';

        sheet.addRow({
          posicion,
          nombre: resultado.corredor?.nombre || 'N/A',
          rut: resultado.corredor?.rut || 'N/A',
          team: resultado.corredor?.team || 'N/A',
          numero: resultado.corredor?.numero || '-',
          tiempo,
          diferencia,
          estado
        });
      });

      workbook.xlsx.writeBuffer().then(buffer => {
        saveAs(new Blob([buffer]), `Resultados_${this.carreraSeleccionada.nombre}.xlsx`);
      });
    },

    exportPDF() {
      if (!this.carreraSeleccionada) return;

      const doc = new jsPDF();
      doc.text(`Resultados - ${this.carreraSeleccionada.nombre}`, 14, 15);

      const tableColumn = ["Posición", "Nombre", "RUT", "Team", "Número", "Tiempo", "Diferencia", "Estado"];
      const tableRows = [];

      this.resultadosOrdenados.forEach((resultado, index) => {
        let posicion = resultado.estado === 'finalizado' ? index + 1 : '-';
        let tiempo = resultado.estado === 'finalizado' ? this.formatTime(resultado.tiempo) : '-';
        let diferencia = (resultado.estado === 'finalizado' && index > 0) ? '+' + this.formatTime(resultado.tiempo - this.resultadosOrdenados[0].tiempo) : '-';
        let estado = resultado.estado.toUpperCase();

        if(resultado.estado === 'dns') estado = 'DNS';
        if(resultado.estado === 'dnf') estado = 'DNF';

        const rowData = [
          posicion,
          resultado.corredor?.nombre || 'N/A',
          resultado.corredor?.rut || 'N/A',
          resultado.corredor?.team || 'N/A',
          resultado.corredor?.numero || '-',
          tiempo,
          diferencia,
          estado
        ];
        tableRows.push(rowData);
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 20,
      });

      doc.save(`Resultados_${this.carreraSeleccionada.nombre}.pdf`);
    }
  },
};
</script>

<style scoped>
.rank-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px;
}

.timer-text {
  font-family: 'Roboto Mono', monospace;
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
