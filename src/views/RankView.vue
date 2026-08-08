<template>
  <div class="rank-view">
    <h1 class="text-center mt-3 mb-1">Resultados y Rankings</h1>

    <!-- Controles superiores -->
    <div class="d-flex align-center flex-wrap mx-4 my-3 ga-2">
      <!-- Selector de categoría -->
      <v-select
        v-model="selectedCategory"
        :items="categories"
        item-title="text"
        item-value="value"
        label="Seleccionar categoría"
        variant="outlined"
        density="comfortable"
        hide-details
        class="flex-grow-1 mr-2"
        style="min-width: 250px"
      />

      <v-btn
        color="info"
        prepend-icon="mdi-refresh"
        @click="fetchData"
        :loading="loading"
      >
        Actualizar
      </v-btn>

      <v-btn
        color="error"
        prepend-icon="mdi-file-pdf-box"
        @click="exportPDF"
        :disabled="loading || carreras.length === 0"
      >
        PDF
      </v-btn>

      <v-btn
        color="success"
        prepend-icon="mdi-file-excel"
        @click="exportExcel"
        :disabled="loading || carreras.length === 0"
      >
        Excel
      </v-btn>

      <v-btn
        color="#0088cc"
        theme="dark"
        prepend-icon="mdi-send"
        @click="sendTelegram"
        :loading="sendingTelegram"
        :disabled="loading || carreras.length === 0"
      >
        Telegram
      </v-btn>
    </div>

    <!-- Cargando -->
    <div v-if="loading" class="text-center pa-8">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <!-- Sin carreras -->
    <div v-else-if="carreras.length === 0" class="text-center pa-8">
      <v-icon size="64" color="grey-lighten-2">mdi-trophy-outline</v-icon>
      <p class="text-grey mt-4">
        No hay carreras registradas para la selección actual.
      </p>
    </div>

    <!-- Carreras encontradas -->
    <template v-else>
      <!-- Tabs para Tabla General: Qualy vs Final -->
      <v-tabs
        v-if="selectedCategory === 'General'"
        v-model="generalActiveTab"
        color="primary"
        class="mx-4 mb-4"
        show-arrows
      >
        <v-tab value="qualy">
          <v-chip color="orange" size="small" class="mr-2" variant="elevated">
            QUALY
          </v-chip>
          Tabla General Qualy
        </v-tab>
        <v-tab value="final">
          <v-chip color="deep-purple" size="small" class="mr-2" variant="elevated">
            FINAL
          </v-chip>
          Tabla General Final
        </v-tab>
      </v-tabs>

      <!-- Tabs para Categoría específica (si hay varias etapas) -->
      <v-tabs
        v-else-if="carreras.length > 1"
        v-model="activeTab"
        color="primary"
        class="mx-4 mb-4"
        show-arrows
      >
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

      <!-- Vista interactiva en pantalla -->
      <div class="mx-4 pa-4 bg-white rounded-lg elevation-1">
        <div class="d-flex align-center justify-space-between mb-4 pb-2 border-b">
          <div>
            <h2 class="text-h5 font-weight-bold text-primary">
              {{
                selectedCategory === 'General'
                  ? `🏆 Tabla General (${generalActiveTab.toUpperCase()}) - Tutuca MTB`
                  : `🏁 ${carreraSeleccionada ? carreraSeleccionada.nombre : selectedCategory}`
              }}
            </h2>
            <p class="text-caption text-grey">
              {{ new Date().toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }}
            </p>
          </div>
          <v-chip color="primary" variant="outlined" size="small">
            Total Corredores: {{ listaResultadosActual.length }}
          </v-chip>
        </div>

        <v-list class="pa-0">
          <transition-group name="slide-fade">
            <v-list-item
              v-for="(resultado, index) in listaResultadosActual"
              :key="getCorredorKey(resultado, index)"
              class="my-2 rounded-lg border"
              :class="getRowClass(resultado, index)"
              elevation="1"
            >
              <v-row class="align-center" no-gutters>
                <v-col class="text-center" cols="1">
                  <v-avatar
                    :color="getPositionColor(index, resultado)"
                    size="36"
                  >
                    <span class="text-white font-weight-bold text-body-2">
                      {{ resultado.estado === 'finalizado' ? index + 1 : '-' }}
                    </span>
                  </v-avatar>
                </v-col>

                <v-col cols="3">
                  <v-list-item-title class="font-weight-medium">
                    {{ resultado.corredor?.nombre || 'N/A' }}
                  </v-list-item-title>
                  <v-list-item-subtitle v-if="resultado.categoria" class="text-caption text-primary">
                    {{ resultado.categoria }}
                  </v-list-item-subtitle>
                </v-col>

                <v-col cols="2">
                  <v-list-item-subtitle class="text-caption">
                    RUT: {{ resultado.corredor?.rut || 'N/A' }}
                  </v-list-item-subtitle>
                </v-col>

                <v-col cols="2">
                  <v-list-item-subtitle class="text-caption">
                    Team: {{ resultado.corredor?.team || 'N/A' }}
                  </v-list-item-subtitle>
                </v-col>

                <v-col cols="1" class="text-center">
                  <v-chip color="primary" size="x-small" variant="elevated">
                    #{{ resultado.corredor?.numero || '-' }}
                  </v-chip>
                </v-col>

                <v-col cols="2" class="text-right">
                  <span class="font-weight-bold timer-text">
                    <template v-if="resultado.estado === 'finalizado'">
                      {{ formatTime(resultado.tiempo) }}
                    </template>
                    <template v-else-if="resultado.estado === 'dns'">
                      <v-chip color="grey" size="x-small">DNS</v-chip>
                    </template>
                    <template v-else-if="resultado.estado === 'dnf'">
                      <v-chip color="error" size="x-small">DNF</v-chip>
                    </template>
                    <template v-else>
                      <v-chip color="info" size="x-small">{{ resultado.estado }}</v-chip>
                    </template>
                  </span>
                </v-col>

                <v-col cols="1" class="text-right pr-2">
                  <span
                    v-if="resultado.estado === 'finalizado' && index > 0 && listaResultadosActual[0]?.tiempo"
                    class="text-grey text-caption"
                  >
                    +{{ formatTime(resultado.tiempo - listaResultadosActual[0].tiempo) }}
                  </span>
                </v-col>
              </v-row>
            </v-list-item>
          </transition-group>
        </v-list>
      </div>

      <!-- Tarjeta especial estructurada tipo PDF para capturar y enviar a Telegram -->
      <div class="telegram-card-wrapper">
        <div ref="telegramCard" class="pdf-report-card pa-6">
          <div class="d-flex align-center justify-space-between mb-4 border-b-2 pb-3">
            <div>
              <h1 class="text-h5 font-weight-bold color-navy">TUTUCA MTB - RESULTADOS OFICIALES</h1>
              <p class="text-subtitle-2 text-grey-darken-2 font-weight-medium mb-0">
                {{
                  selectedCategory === 'General'
                    ? `TABLA GENERAL CONSOLIDADA DE TIEMPOS (${generalActiveTab.toUpperCase()})`
                    : `RESULTADOS - ${carreraSeleccionada ? carreraSeleccionada.nombre.toUpperCase() : selectedCategory.toUpperCase()}`
                }}
              </p>
            </div>
            <div class="text-right">
              <p class="text-caption font-weight-bold text-grey-darken-3 mb-0">FECHA: {{ new Date().toLocaleDateString('es-CL') }}</p>
              <p class="text-caption text-grey-darken-1 mb-0">Total Corredores: {{ listaResultadosActual.length }}</p>
            </div>
          </div>

          <table class="report-table">
            <thead>
              <tr>
                <th class="text-center" style="width: 50px">POS</th>
                <th>NOMBRE</th>
                <th>RUT</th>
                <th v-if="selectedCategory === 'General'">CATEGORÍA</th>
                <th>TEAM</th>
                <th class="text-center" style="width: 50px">N°</th>
                <th class="text-right">TIEMPO</th>
                <th class="text-right">DIF.</th>
                <th class="text-center">ESTADO</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(resultado, index) in listaResultadosActual"
                :key="'pdf_row_' + index"
                :class="{
                  'row-top-1': index === 0 && resultado.estado === 'finalizado',
                  'row-top-2': index === 1 && resultado.estado === 'finalizado',
                  'row-top-3': index === 2 && resultado.estado === 'finalizado',
                }"
              >
                <td class="text-center font-weight-bold">
                  {{ resultado.estado === 'finalizado' ? index + 1 : '-' }}
                </td>
                <td class="font-weight-medium">
                  {{ resultado.corredor?.nombre || 'N/A' }}
                </td>
                <td>{{ resultado.corredor?.rut || 'N/A' }}</td>
                <td v-if="selectedCategory === 'General'">
                  {{ resultado.categoria || '-' }}
                </td>
                <td>{{ resultado.corredor?.team || 'N/A' }}</td>
                <td class="text-center font-weight-bold">
                  {{ resultado.corredor?.numero || '-' }}
                </td>
                <td class="text-right font-weight-bold timer-font">
                  {{ resultado.estado === 'finalizado' ? formatTime(resultado.tiempo) : '-' }}
                </td>
                <td class="text-right text-grey-darken-1">
                  {{
                    resultado.estado === 'finalizado' && index > 0 && listaResultadosActual[0]?.tiempo
                      ? '+' + formatTime(resultado.tiempo - listaResultadosActual[0].tiempo)
                      : '-'
                  }}
                </td>
                <td class="text-center font-weight-bold">
                  {{ (resultado.estado || 'DNS').toUpperCase() }}
                </td>
              </tr>
            </tbody>
          </table>

          <div class="d-flex justify-space-between mt-4 pt-2 border-t text-caption text-grey-darken-1">
            <span>Cronometraje Oficial - Tutuca MTB</span>
          </div>
        </div>
      </div>
    </template>

    <!-- Snackbar de Notificaciones -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      timeout="4000"
      location="bottom right"
    >
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.show = false">Cerrar</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script>
import axios from 'axios';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

const API_URL = process.env.VUE_APP_API_URL || 'http://127.0.0.1:3030';

export default {
  name: 'RankView',
  data() {
    return {
      loading: false,
      sendingTelegram: false,
      carreras: [],
      activeTab: null,
      generalActiveTab: 'qualy',
      selectedCategory: 'General',
      categories: [
        { text: '🏆 Tabla General (Todas las Categorías)', value: 'General' },
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
      snackbar: {
        show: false,
        text: '',
        color: 'success',
      },
    };
  },

  computed: {
    categoriasConCarrera() {
      const set = new Set();
      const carrerasTarget = this.selectedCategory === 'General'
        ? this.carreras.filter((c) => c.fase === this.generalActiveTab)
        : this.carreras;

      carrerasTarget.forEach((c) => {
        if (c.categoria) set.add(c.categoria);
      });
      return Array.from(set);
    },

    carreraSeleccionada() {
      if (this.selectedCategory === 'General') return null;
      return this.carreras.find((c) => c._id === this.activeTab) || null;
    },

    listaResultadosActual() {
      if (this.selectedCategory === 'General') {
        return this.obtenerResultadosGeneralesConsolidados(this.generalActiveTab);
      }

      if (!this.carreraSeleccionada) return [];

      return this.ordenarResultados(this.carreraSeleccionada.resultados || []);
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
        if (this.selectedCategory === 'General') {
          const response = await axios.get(`${API_URL}/carreras`);
          this.carreras = response.data.data || [];
          this.activeTab = null;
        } else {
          const response = await axios.get(
            `${API_URL}/carreras/categoria/${this.selectedCategory}`
          );
          this.carreras = response.data.data || [];
          if (this.carreras.length > 0) {
            this.activeTab = this.carreras[0]._id;
          } else {
            this.activeTab = null;
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        this.carreras = [];
        this.mostrarNotificacion('Error al cargar datos del servidor', 'error');
      } finally {
        this.loading = false;
      }
    },

    ordenarResultados(resultados, categoriaFija = null) {
      const res = resultados.map((r) => ({
        ...r,
        categoria: categoriaFija || r.corredor?.categoria || r.categoria || '',
      }));

      const finalizados = res
        .filter((r) => r.estado === 'finalizado' && r.tiempo > 0)
        .sort((a, b) => a.tiempo - b.tiempo);

      const otros = res.filter(
        (r) => r.estado !== 'finalizado' || r.tiempo <= 0
      );

      return [...finalizados, ...otros];
    },

    obtenerResultadosPorCategoria(categoria) {
      let carrerasCat = this.carreras.filter((c) => c.categoria === categoria);
      if (this.selectedCategory === 'General') {
        carrerasCat = carrerasCat.filter((c) => c.fase === this.generalActiveTab);
      }
      if (carrerasCat.length === 0) return [];
      const carreraActual = carrerasCat[0];
      return this.ordenarResultados(carreraActual.resultados || [], categoria);
    },

    obtenerResultadosGeneralesConsolidados(fase = null) {
      const mapaCorredores = new Map();
      const faseFiltro = fase || (this.selectedCategory === 'General' ? this.generalActiveTab : null);

      const carrerasTarget = faseFiltro
        ? this.carreras.filter((c) => c.fase === faseFiltro)
        : this.carreras;

      carrerasTarget.forEach((carrera) => {
        const cat = carrera.categoria;
        (carrera.resultados || []).forEach((res) => {
          const id = res.corredor?._id || res.corredor;
          if (!id) return;
          mapaCorredores.set(id, {
            ...res,
            categoria: cat || res.corredor?.categoria || 'Sin Categoría',
          });
        });
      });

      return this.ordenarResultados(Array.from(mapaCorredores.values()));
    },

    formatTime(ms) {
      if (!ms || ms <= 0) return '0:00:000';
      const totalMs = Math.max(0, Math.round(ms));
      const mins = Math.floor(totalMs / 60000);
      const secs = Math.floor((totalMs % 60000) / 1000);
      const millis = totalMs % 1000;
      return `${mins}:${secs.toString().padStart(2, '0')}:${millis.toString().padStart(3, '0')}`;
    },

    getCorredorKey(resultado, index) {
      return (resultado.corredor?._id || resultado.corredor || 'item') + '_' + index;
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

    mostrarNotificacion(mensaje, color = 'success') {
      this.snackbar.text = mensaje;
      this.snackbar.color = color;
      this.snackbar.show = true;
    },

    exportExcel() {
      if (this.carreras.length === 0) return;

      const workbook = new ExcelJS.Workbook();
      const sufijoFase = this.selectedCategory === 'General' ? `_${this.generalActiveTab.toUpperCase()}` : '';

      if (this.selectedCategory === 'General') {
        const generalSheet = workbook.addWorksheet(`Tabla General${sufijoFase}`);
        generalSheet.columns = [
          { header: 'Posición', key: 'posicion', width: 10 },
          { header: 'Categoría', key: 'categoria', width: 18 },
          { header: 'Nombre', key: 'nombre', width: 30 },
          { header: 'RUT', key: 'rut', width: 15 },
          { header: 'Team', key: 'team', width: 20 },
          { header: 'Número', key: 'numero', width: 10 },
          { header: 'Tiempo', key: 'tiempo', width: 15 },
          { header: 'Diferencia', key: 'diferencia', width: 15 },
          { header: 'Estado', key: 'estado', width: 12 },
        ];

        const resultadosGen = this.obtenerResultadosGeneralesConsolidados();
        resultadosGen.forEach((resultado, index) => {
          let posicion = resultado.estado === 'finalizado' ? index + 1 : '-';
          let tiempo = resultado.estado === 'finalizado' ? this.formatTime(resultado.tiempo) : '-';
          let diferencia = (resultado.estado === 'finalizado' && index > 0) ? '+' + this.formatTime(resultado.tiempo - resultadosGen[0].tiempo) : '-';
          let estado = (resultado.estado || 'DNS').toUpperCase();

          generalSheet.addRow({
            posicion,
            categoria: resultado.categoria || 'N/A',
            nombre: resultado.corredor?.nombre || 'N/A',
            rut: resultado.corredor?.rut || 'N/A',
            team: resultado.corredor?.team || 'N/A',
            numero: resultado.corredor?.numero || '-',
            tiempo,
            diferencia,
            estado,
          });
        });

        this.categoriasConCarrera.forEach((cat) => {
          const sheet = workbook.addWorksheet(cat.substring(0, 31));
          sheet.columns = [
            { header: 'Posición', key: 'posicion', width: 10 },
            { header: 'Nombre', key: 'nombre', width: 30 },
            { header: 'RUT', key: 'rut', width: 15 },
            { header: 'Team', key: 'team', width: 20 },
            { header: 'Número', key: 'numero', width: 10 },
            { header: 'Tiempo', key: 'tiempo', width: 15 },
            { header: 'Diferencia', key: 'diferencia', width: 15 },
            { header: 'Estado', key: 'estado', width: 12 },
          ];

          const resCat = this.obtenerResultadosPorCategoria(cat);
          resCat.forEach((resultado, index) => {
            let posicion = resultado.estado === 'finalizado' ? index + 1 : '-';
            let tiempo = resultado.estado === 'finalizado' ? this.formatTime(resultado.tiempo) : '-';
            let diferencia = (resultado.estado === 'finalizado' && index > 0) ? '+' + this.formatTime(resultado.tiempo - resCat[0].tiempo) : '-';
            let estado = (resultado.estado || 'DNS').toUpperCase();

            sheet.addRow({
              posicion,
              nombre: resultado.corredor?.nombre || 'N/A',
              rut: resultado.corredor?.rut || 'N/A',
              team: resultado.corredor?.team || 'N/A',
              numero: resultado.corredor?.numero || '-',
              tiempo,
              diferencia,
              estado,
            });
          });
        });

        workbook.xlsx.writeBuffer().then((buffer) => {
          saveAs(new Blob([buffer]), `Tabla_General${sufijoFase}_Tiempos.xlsx`);
        });
      } else {
        const sheet = workbook.addWorksheet('Resultados');
        sheet.columns = [
          { header: 'Posición', key: 'posicion', width: 10 },
          { header: 'Nombre', key: 'nombre', width: 30 },
          { header: 'RUT', key: 'rut', width: 15 },
          { header: 'Team', key: 'team', width: 20 },
          { header: 'Número', key: 'numero', width: 10 },
          { header: 'Tiempo', key: 'tiempo', width: 15 },
          { header: 'Diferencia', key: 'diferencia', width: 15 },
          { header: 'Estado', key: 'estado', width: 12 },
        ];

        this.listaResultadosActual.forEach((resultado, index) => {
          let posicion = resultado.estado === 'finalizado' ? index + 1 : '-';
          let tiempo = resultado.estado === 'finalizado' ? this.formatTime(resultado.tiempo) : '-';
          let diferencia = (resultado.estado === 'finalizado' && index > 0) ? '+' + this.formatTime(resultado.tiempo - this.listaResultadosActual[0].tiempo) : '-';
          let estado = (resultado.estado || 'DNS').toUpperCase();

          sheet.addRow({
            posicion,
            nombre: resultado.corredor?.nombre || 'N/A',
            rut: resultado.corredor?.rut || 'N/A',
            team: resultado.corredor?.team || 'N/A',
            numero: resultado.corredor?.numero || '-',
            tiempo,
            diferencia,
            estado,
          });
        });

        workbook.xlsx.writeBuffer().then((buffer) => {
          saveAs(
            new Blob([buffer]),
            `Resultados_${this.carreraSeleccionada ? this.carreraSeleccionada.nombre : this.selectedCategory}.xlsx`
          );
        });
      }
    },

    exportPDF() {
      if (this.carreras.length === 0) return;

      const doc = new jsPDF();
      const tableColumn = ["Pos", "Nombre", "RUT", "Team", "N°", "Tiempo", "Dif.", "Estado"];
      const sufijoFase = this.selectedCategory === 'General' ? ` (${this.generalActiveTab.toUpperCase()})` : '';

      if (this.selectedCategory === 'General') {
        doc.setFontSize(16);
        doc.text(`TABLA GENERAL DE TIEMPOS${sufijoFase.toUpperCase()} - TUTUCA MTB`, 14, 15);
        doc.setFontSize(10);
        doc.text(`Fecha: ${new Date().toLocaleDateString('es-CL')}`, 14, 22);

        let startY = 28;

        this.categoriasConCarrera.forEach((cat) => {
          const resCat = this.obtenerResultadosPorCategoria(cat);
          if (resCat.length === 0) return;

          if (startY > 240) {
            doc.addPage();
            startY = 20;
          }

          doc.setFontSize(12);
          doc.text(`Categoría: ${cat}`, 14, startY);
          startY += 4;

          const tableRows = [];
          resCat.forEach((resultado, index) => {
            let posicion = resultado.estado === 'finalizado' ? index + 1 : '-';
            let tiempo = resultado.estado === 'finalizado' ? this.formatTime(resultado.tiempo) : '-';
            let diferencia = (resultado.estado === 'finalizado' && index > 0) ? '+' + this.formatTime(resultado.tiempo - resCat[0].tiempo) : '-';
            let estado = (resultado.estado || 'DNS').toUpperCase();

            tableRows.push([
              posicion,
              resultado.corredor?.nombre || 'N/A',
              resultado.corredor?.rut || 'N/A',
              resultado.corredor?.team || 'N/A',
              resultado.corredor?.numero || '-',
              tiempo,
              diferencia,
              estado,
            ]);
          });

          autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: startY,
            styles: { fontSize: 8 },
            margin: { left: 14, right: 14 },
          });

          startY = doc.lastAutoTable.finalY + 10;
        });

        doc.save(`Tabla_General_${this.generalActiveTab.toUpperCase()}_Tiempos.pdf`);
      } else {
        const nombreCarrera = this.carreraSeleccionada
          ? this.carreraSeleccionada.nombre
          : this.selectedCategory;

        doc.setFontSize(14);
        doc.text(`Resultados - ${nombreCarrera}`, 14, 15);

        const tableRows = [];
        this.listaResultadosActual.forEach((resultado, index) => {
          let posicion = resultado.estado === 'finalizado' ? index + 1 : '-';
          let tiempo = resultado.estado === 'finalizado' ? this.formatTime(resultado.tiempo) : '-';
          let diferencia = (resultado.estado === 'finalizado' && index > 0) ? '+' + this.formatTime(resultado.tiempo - this.listaResultadosActual[0].tiempo) : '-';
          let estado = (resultado.estado || 'DNS').toUpperCase();

          tableRows.push([
            posicion,
            resultado.corredor?.nombre || 'N/A',
            resultado.corredor?.rut || 'N/A',
            resultado.corredor?.team || 'N/A',
            resultado.corredor?.numero || '-',
            tiempo,
            diferencia,
            estado,
          ]);
        });

        autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: 22,
        });

        doc.save(`Resultados_${nombreCarrera}.pdf`);
      }
    },

    async sendTelegram() {
      if (!this.$refs.telegramCard) return;

      this.sendingTelegram = true;
      try {
        const element = this.$refs.telegramCard;
        const canvas = await html2canvas(element, {
          scale: 2,
          backgroundColor: '#ffffff',
          useCORS: true,
          logging: false,
        });

        canvas.toBlob(async (blob) => {
          if (!blob) {
            this.mostrarNotificacion('Error al generar la imagen', 'error');
            this.sendingTelegram = false;
            return;
          }

          const faseTag = this.selectedCategory === 'General' ? ` (${this.generalActiveTab.toUpperCase()})` : '';
          const title = this.selectedCategory === 'General'
            ? `Tabla General de Tiempos${faseTag}`
            : `Resultados - ${this.carreraSeleccionada ? this.carreraSeleccionada.nombre : this.selectedCategory}`;

          const formData = new FormData();
          formData.append('image', blob, 'tiempos.png');
          formData.append('caption', `🏆 ${title}\n📅 ${new Date().toLocaleDateString('es-CL')}`);

          try {
            await axios.post(`${API_URL}/telegram/send-photo`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });

            this.mostrarNotificacion('¡Foto enviada a Telegram con éxito!', 'success');
          } catch (error) {
            console.error('Error al enviar foto a Telegram:', error);
            const msg = error.response?.data?.message || 'Error al conectar con la API de Telegram';
            this.mostrarNotificacion(msg, 'error');
          } finally {
            this.sendingTelegram = false;
          }
        }, 'image/png');
      } catch (err) {
        console.error('Error al capturar pantalla:', err);
        this.mostrarNotificacion('Error al capturar la tabla de tiempos', 'error');
        this.sendingTelegram = false;
      }
    },
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

.border-b {
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
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

/* Estilos de la tarjeta para Telegram (Formato PDF) */
.telegram-card-wrapper {
  position: absolute;
  left: -9999px;
  top: -9999px;
  width: 900px;
}

.pdf-report-card {
  font-family: 'Roboto', sans-serif;
  color: #1a1a1a;
  background-color: #ffffff;
  border: 1px solid #cfd8dc;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.color-navy {
  color: #1a237e;
}

.border-b-2 {
  border-bottom: 2px solid #1a237e;
}

.report-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 8px;
  font-size: 13px;
}

.report-table th {
  background-color: #1a237e;
  color: #ffffff;
  padding: 8px 10px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.report-table td {
  padding: 7px 10px;
  border-bottom: 1px solid #e0e0e0;
}

.report-table tr:nth-child(even) {
  background-color: #f8f9fa;
}

.row-top-1 {
  background-color: #fff8e1 !important;
}

.row-top-2 {
  background-color: #eceff1 !important;
}

.row-top-3 {
  background-color: #fbe9e7 !important;
}

.timer-font {
  font-family: 'Roboto Mono', monospace;
}
</style>
