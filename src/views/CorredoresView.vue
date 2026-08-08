<template>
  <div>
    <v-card flat>
      <v-card-title class="d-flex align-center pe-2">
        <v-icon icon="mdi-bike-fast"></v-icon> &nbsp; Corredores &nbsp;
        <v-chip color="primary" class="ml-2 font-weight-bold">
          {{ cantidadCorredores }} totales
        </v-chip>

        <v-menu>
          <template v-slot:activator="{ props }">
            <v-btn
              color="primary"
              variant="text"
              v-bind="props"
              class="ml-2"
              append-icon="mdi-chevron-down"
            >
              Ver desglose
            </v-btn>
          </template>
          <v-list>
            <v-list-subheader>Corredores por Categoría</v-list-subheader>
            <v-list-item v-for="(item, index) in conteoPorCategoria" :key="index">
              <template v-slot:prepend>
                <v-chip size="small" :color="item.color" class="mr-3">
                  {{ item.cantidad }}
                </v-chip>
              </template>
              <v-list-item-title class="font-weight-medium">
                {{ item.categoria }}
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>

        <v-spacer></v-spacer>

        <v-text-field
          v-model="search"
          density="compact"
          label="Buscar por nombre"
          append-icon="mdi-magnify"
          flat
          hide-details
          single-line
          variant="solo-filled"
        />

        <v-btn
          class="me-2 ml-4"
          prepend-icon="mdi-firebase"
          rounded="lg"
          color="deep-orange"
          variant="tonal"
          :loading="importLoading"
          :disabled="importLoading"
          @click="showImportDialog"
        >
          Importar Firebase
        </v-btn>

        <v-btn
          class="me-2"
          prepend-icon="mdi-plus"
          rounded="lg"
          text="Agregar"
          border
          @click="showCreateDialog"
        ></v-btn>
      </v-card-title>

      <v-data-table
        :headers="headers"
        :items="filteredCorredores"
        :search="search"
        class="elevation-1"
      >
        <template v-slot:[`item.actions`]="{ item }">
          <div class="d-flex ga-2 justify-end">
            <v-btn
              icon
              size="small"
              color="purple"
              title="Duplicar en otra categoría"
              @click="showDuplicateDialog(item)"
            >
              <v-icon size="small">mdi-content-copy</v-icon>
            </v-btn>

            <v-btn
              icon
              size="small"
              color="success"
              @click="showUpdateDialog(item)"
            >
              <v-icon size="small">mdi-pencil</v-icon>
            </v-btn>

            <v-btn
              icon
              size="small"
              color="error"
              @click="deleteCorredor(item._id)"
            >
              <v-icon size="small">mdi-delete-outline</v-icon>
            </v-btn>
            <!-- Si item.entregado es true, muestra un ícono distinto y permite desmarcar -->
            <v-btn
              icon
              size="small"
              color="green"
              v-if="item.entregado"
              @click="markIsNotDelivered(item)"
            >
              <v-icon size="small">mdi-check-circle</v-icon>
            </v-btn>

            <!-- Si item.entregado es false, muestra el ícono normal y permite marcar -->
            <v-btn
              icon
              size="small"
              color="primary"
              v-else
              @click="markAsDelivered(item)"
            >
              <v-icon size="small">mdi-checkbox-blank-circle-outline</v-icon>
            </v-btn>
          </div>
        </template>

        <template v-slot:[`item.numero`]="{ item }">
          <p>{{ item.categoria.numero }}</p>
          <v-chip
            :color="categorias.find((c) => c.value === item.categoria).color"
          >
            {{ item.numero }}
          </v-chip>
        </template>

        <template v-slot:[`item.categoria`]="{ item }">
          <p>{{ item.categoria.color }}</p>
          <v-chip
            :color="categorias.find((c) => c.value === item.categoria).color"
          >
            {{ item.categoria }}
          </v-chip>
        </template>

        <template v-slot:[`item.entregado`]="{ item }">
          <v-icon :color="item.entregado ? 'green' : 'red'"
            >mdi-{{ item.entregado ? "check" : "close" }}</v-icon
          >
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="createDialog" max-width="600px">
      <v-card>
        <v-card-title>
          <span class="headline">Crear Corredor</span>
        </v-card-title>
        <v-card-text>
          <v-form ref="createForm" v-model="valid">
            <v-text-field
              v-model="newCorredor.nombre"
              label="Nombre"
              required
            />
            <v-select
              v-model="newCorredor.categoria"
              :items="categorias"
              item-title="value"
              label="Categoría"
              required
            />
            <v-text-field
              v-model="newCorredor.edad"
              label="Edad"
              type="number"
              required
            />
            <v-text-field v-model="newCorredor.rut" label="RUT" required />
            <v-text-field v-model="newCorredor.team" label="Equipo" required />
            <v-text-field
              v-model="newCorredor.telefono"
              label="Teléfono"
              required
            />
            <v-checkbox v-model="newCorredor.entregado" label="Entregado" />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-btn @click="createCorredor" color="primary">Crear</v-btn>
          <v-btn @click="closeCreateDialog" color="grey">Cancelar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="updateDialog" max-width="600px">
      <v-card>
        <v-card-title>
          <span class="headline">Actualizar Corredor</span>
        </v-card-title>
        <v-card-text>
          <v-form ref="updateForm" v-model="valid">
            <v-text-field
              v-model="selectedCorredor.nombre"
              label="Nombre"
              required
            />
            <v-select
              v-model="selectedCorredor.categoria"
              :items="categorias"
              item-title="value"
              label="Categoría"
              required
            />
            <v-text-field
              v-model="selectedCorredor.edad"
              label="Edad"
              type="number"
              required
            />
            <v-text-field v-model="selectedCorredor.rut" label="RUT" required />
            <v-text-field
              v-model="selectedCorredor.team"
              label="Equipo"
              required
            />
            <v-text-field
              v-model="selectedCorredor.telefono"
              label="Teléfono"
              required
            />
            <v-checkbox
              v-model="selectedCorredor.entregado"
              label="Entregado"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-btn @click="updateCorredor" color="success">Actualizar</v-btn>
          <v-btn @click="closeUpdateDialog" color="grey">Cancelar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- Diálogo de confirmación de importación -->
    <v-dialog v-model="importDialog" max-width="480px">
      <v-card rounded="lg">
        <v-card-title class="d-flex align-center pt-4 px-6">
          <v-icon color="deep-orange" class="mr-2">mdi-firebase</v-icon>
          Importar desde Firebase
        </v-card-title>
        <v-card-text class="px-6">
          <p>Se importarán todos los corredores de la colección <strong>inscritos</strong> en Firebase Firestore a la base de datos MongoDB.</p>
          <br />
          <p class="text-medium-emphasis text-body-2">Los corredores que ya existen (mismo RUT) serán omitidos automáticamente para evitar duplicados. El tiempo de cada corredor se inicializará en <strong>0</strong>.</p>
        </v-card-text>
        <v-card-actions class="px-6 pb-4">
          <v-spacer></v-spacer>
          <v-btn @click="importDialog = false" color="grey" variant="text">Cancelar</v-btn>
          <v-btn
            color="deep-orange"
            variant="flat"
            :loading="importLoading"
            prepend-icon="mdi-download"
            @click="importarDesdeFirebase"
          >
            Importar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Diálogo de resultado de importación -->
    <v-dialog v-model="importResultDialog" max-width="560px">
      <v-card rounded="lg">
        <v-card-title class="d-flex align-center pt-4 px-6">
          <v-icon :color="importResult.errores > 0 ? 'warning' : 'success'" class="mr-2">mdi-check-circle</v-icon>
          Resultado de importación
        </v-card-title>
        <v-card-text class="px-6">
          <div class="d-flex ga-4 mb-4">
            <v-chip color="success" variant="tonal" prepend-icon="mdi-check">
              {{ importResult.importados }} importados
            </v-chip>
            <v-chip color="warning" variant="tonal" prepend-icon="mdi-skip-next">
              {{ importResult.omitidos }} omitidos
            </v-chip>
            <v-chip color="error" variant="tonal" prepend-icon="mdi-alert">
              {{ importResult.errores }} errores
            </v-chip>
          </div>
          <v-list v-if="importResult.detalles && importResult.detalles.length > 0" density="compact" max-height="240" style="overflow-y: auto;">
            <v-list-item
              v-for="(detalle, i) in importResult.detalles"
              :key="i"
              :title="detalle"
              class="text-body-2"
            />
          </v-list>
        </v-card-text>
        <v-card-actions class="px-6 pb-4">
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="flat" @click="importResultDialog = false">Cerrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Diálogo para Duplicar Corredor -->
    <v-dialog v-model="duplicateDialog" max-width="600px">
      <v-card rounded="lg">
        <v-card-title class="d-flex align-center pt-4 px-6">
          <v-icon color="purple" class="mr-2">mdi-content-copy</v-icon>
          Duplicar Piloto en Otra Categoría
        </v-card-title>
        <v-card-text class="px-6">
          <v-alert color="purple" variant="tonal" class="mb-4" density="compact">
            Se inscribirá una copia de <strong>{{ duplicateCorredor.nombre }}</strong> en una nueva categoría.
          </v-alert>
          <v-form ref="duplicateForm" v-model="valid">
            <v-text-field
              v-model="duplicateCorredor.nombre"
              label="Nombre"
              required
            />
            <v-select
              v-model="duplicateCorredor.categoria"
              :items="categorias"
              item-title="value"
              label="Nueva Categoría"
              required
            />
            <v-text-field
              v-model="duplicateCorredor.edad"
              label="Edad"
              type="number"
              required
            />
            <v-text-field v-model="duplicateCorredor.rut" label="RUT" required />
            <v-text-field v-model="duplicateCorredor.team" label="Equipo" required />
            <v-text-field
              v-model="duplicateCorredor.telefono"
              label="Teléfono"
              required
            />
            <v-checkbox v-model="duplicateCorredor.entregado" label="Número Entregado" />
          </v-form>
        </v-card-text>
        <v-card-actions class="px-6 pb-4">
          <v-spacer></v-spacer>
          <v-btn @click="closeDuplicateDialog" color="grey" variant="text">Cancelar</v-btn>
          <v-btn @click="duplicateCorredorSubmit" color="purple" variant="flat">
            Duplicar Piloto
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Diálogo para Editar Tiempo a Mano -->
    <v-dialog v-model="editTimeDialog" max-width="480px">
      <v-card rounded="lg">
        <v-card-title class="d-flex align-center pt-4 px-6">
          <v-icon color="amber-darken-2" class="mr-2">mdi-timer-edit-outline</v-icon>
          Editar Tiempo Manual
        </v-card-title>

        <v-card-text class="px-6">
          <p class="mb-3 text-body-1 font-weight-medium">
            Piloto: <span class="text-primary">{{ timeCorredor.nombre }}</span>
          </p>

          <v-alert color="amber-darken-2" variant="tonal" class="mb-4" density="compact">
            Ingresa los Minutos, Segundos y Milisegundos para corregir el tiempo del corredor.
          </v-alert>

          <div class="d-flex ga-2">
            <v-text-field
              v-model.number="timeInputs.minutos"
              label="Minutos"
              type="number"
              min="0"
              variant="outlined"
              density="comfortable"
            />
            <v-text-field
              v-model.number="timeInputs.segundos"
              label="Segundos"
              type="number"
              min="0"
              max="59"
              variant="outlined"
              density="comfortable"
            />
            <v-text-field
              v-model.number="timeInputs.milisegundos"
              label="Milisegundos"
              type="number"
              min="0"
              max="999"
              variant="outlined"
              density="comfortable"
            />
          </div>

          <div class="text-center my-2 py-3 bg-grey-lighten-4 rounded-lg border">
            <span class="text-caption text-grey-darken-1 d-block text-uppercase font-weight-bold">
              Tiempo Resultado
            </span>
            <span class="text-h4 font-weight-black text-amber-darken-3">
              {{ formattedCalculatedTime }}
            </span>
          </div>
        </v-card-text>

        <v-card-actions class="px-6 pb-4">
          <v-spacer></v-spacer>
          <v-btn @click="closeEditTimeDialog" color="grey" variant="text">Cancelar</v-btn>
          <v-btn @click="updateTimeSubmit" color="amber-darken-2" variant="flat">
            Guardar Tiempo
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" :timeout="4000" :color="snackbarColor">
      {{ snackbarMessage }}
      <v-btn color="white" text @click="snackbar = false">Cerrar</v-btn>
    </v-snackbar>
  </div>
</template>

<script>
import axios from "axios";

export default {
  data() {
    return {
      snackbar: false,
      snackbarMessage: "",
      snackbarColor: "success",
      cantidadCorredores: 0,
      search: "",
      corredores: [],
      importLoading: false,
      importDialog: false,
      importResultDialog: false,
      importResult: {
        importados: 0,
        omitidos: 0,
        errores: 0,
        detalles: [],
      },
      selectedCorredor: {
        nombre: "",
        categoria: "",
        edad: 0,
        tiempo: 0,
        rut: "",
        team: "",
        telefono: "",
        entregado: false,
      },
      newCorredor: {
        nombre: "",
        categoria: "",
        edad: 0,
        tiempo: 0,
        rut: "",
        team: "",
        telefono: "",
        entregado: false,
      },
      createDialog: false,
      updateDialog: false,
      duplicateDialog: false,
      editTimeDialog: false,
      timeCorredor: {
        _id: "",
        nombre: "",
        tiempo: 0,
      },
      timeInputs: {
        minutos: 0,
        segundos: 0,
        milisegundos: 0,
      },
      duplicateCorredor: {
        nombre: "",
        categoria: "",
        edad: 0,
        tiempo: 0,
        rut: "",
        team: "",
        telefono: "",
        entregado: false,
      },
      valid: false,
      categorias: [
        { text: "Kids", value: "Kids", color: "blue" },
        { text: "Infantil", value: "Infantil", color: "green" },
        { text: "Junior", value: "Junior", color: "red" },
        { text: "Damas", value: "Damas", color: "purple" },
        { text: "Novicios", value: "Novicios", color: "orange" },
        { text: "Rígido", value: "Rígido", color: "primary" },
        { text: "Experto", value: "Experto", color: "cyan" },
        { text: "Elite", value: "Elite", color: "indigo" },
        { text: "Master A", value: "Master A", color: "teal" },
        { text: "Open Master", value: "Open Master", color: "pink" },
        { text: "E-bike Varones", value: "E-bike Varones", color: "deep-blue" },
        { text: "E-bike Damas", value: "E-bike Damas", color: "deep-orange" },
      ],
      headers: [
        { title: "Nombre", key: "nombre" },
        { title: "Categoría", key: "categoria" },
        { title: "Edad", key: "edad" },
        { title: "Número", key: "numero" },
        { title: "RUT", key: "rut" },
        { title: "Equipo", key: "team" },
        { title: "Teléfono", key: "telefono" },
        { title: "Número Entregado", key: "entregado", align: "center" },
        { title: "Acciones", key: "actions", sortable: false, align: "center" },
      ],
    };
  },
  computed: {
    filteredCorredores() {
      return this.corredores.filter((corredor) =>
        corredor.nombre.toLowerCase().includes(this.search.toLowerCase())
      );
    },
    conteoPorCategoria() {
      const conteo = {};
      this.corredores.forEach(c => {
        // En algunos casos la categoría puede venir como objeto o string,
        // aseguramos que tomamos el valor correcto.
        const catName = typeof c.categoria === 'object' ? c.categoria.value : c.categoria;
        if(conteo[catName]) {
          conteo[catName]++;
        } else {
          conteo[catName] = 1;
        }
      });
      
      // Mapear con el color de la categoría y ordenar de mayor a menor cantidad
      return Object.keys(conteo).map(catName => {
        const categoriaInfo = this.categorias.find(c => c.value === catName);
        return {
          categoria: catName,
          cantidad: conteo[catName],
          color: categoriaInfo ? categoriaInfo.color : 'grey'
        };
      }).sort((a, b) => b.cantidad - a.cantidad);
    },
    calculatedTiempoMs() {
      const min = Math.max(0, parseInt(this.timeInputs.minutos) || 0);
      const sec = Math.max(0, parseInt(this.timeInputs.segundos) || 0);
      const ms = Math.max(0, parseInt(this.timeInputs.milisegundos) || 0);
      return (min * 60000) + (sec * 1000) + ms;
    },
    formattedCalculatedTime() {
      return this.formatTime(this.calculatedTiempoMs);
    }
  },
  methods: {
    async fetchCorredores() {
      try {
        const response = await axios.get("http://127.0.0.1:3030/corredores");
        this.corredores = response.data.data;
        this.cantidadCorredores = response.data.cantidad;
      } catch (error) {
        console.error("Error fetching corredores:", error);
      }
    },
    showImportDialog() {
      this.importDialog = true;
    },
    async importarDesdeFirebase() {
      this.importLoading = true;
      this.importDialog = false;
      try {
        const response = await axios.post(
          "http://127.0.0.1:3030/corredores/importar-firebase"
        );
        this.importResult = {
          importados: response.data.importados,
          omitidos: response.data.omitidos,
          errores: response.data.errores,
          detalles: response.data.detalles || [],
        };
        this.importResultDialog = true;
        await this.fetchCorredores();
      } catch (error) {
        console.error("Error importando desde Firebase:", error);
        this.snackbarMessage =
          error.response?.data?.message ||
          "Error al conectar con Firebase. Verifica el service account.";
        this.snackbarColor = "error";
        this.snackbar = true;
      } finally {
        this.importLoading = false;
      }
    },
    formatTime(ms) {
      if (!ms || ms <= 0) return "00:00.000";
      const totalMs = Math.max(0, Math.round(ms));
      const mins = Math.floor(totalMs / 60000);
      const secs = Math.floor((totalMs % 60000) / 1000);
      const millis = totalMs % 1000;
      return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${millis.toString().padStart(3, "0")}`;
    },
    showEditTimeDialog(corredor) {
      this.timeCorredor = { ...corredor };
      const currentMs = corredor.tiempo || 0;
      this.timeInputs = {
        minutos: Math.floor(currentMs / 60000),
        segundos: Math.floor((currentMs % 60000) / 1000),
        milisegundos: currentMs % 1000,
      };
      this.editTimeDialog = true;
    },
    closeEditTimeDialog() {
      this.editTimeDialog = false;
    },
    async updateTimeSubmit() {
      try {
        const finalTiempo = this.calculatedTiempoMs;
        await axios.patch(
          `http://127.0.0.1:3030/corredores/${this.timeCorredor._id}`,
          { tiempo: finalTiempo }
        );
        await this.fetchCorredores();
        this.closeEditTimeDialog();
        this.snackbarMessage = `Tiempo de ${this.timeCorredor.nombre} actualizado a ${this.formatTime(finalTiempo)}`;
        this.snackbarColor = "success";
        this.snackbar = true;
      } catch (error) {
        console.error("Error actualizando tiempo:", error);
        this.snackbarMessage = "Error al actualizar el tiempo del piloto.";
        this.snackbarColor = "error";
        this.snackbar = true;
      }
    },
    showCreateDialog() {
      this.createDialog = true;
    },
    showDuplicateDialog(corredor) {
      this.duplicateCorredor = {
        nombre: corredor.nombre,
        categoria: corredor.categoria,
        edad: corredor.edad,
        tiempo: 0,
        rut: corredor.rut,
        team: corredor.team,
        telefono: corredor.telefono,
        entregado: false,
      };
      this.duplicateDialog = true;
    },
    closeDuplicateDialog() {
      this.duplicateDialog = false;
      this.resetDuplicateCorredor();
    },
    async duplicateCorredorSubmit() {
      try {
        this.duplicateCorredor.edad = parseInt(this.duplicateCorredor.edad);
        this.duplicateCorredor.tiempo = 0;
        await axios.post("http://127.0.0.1:3030/corredores", this.duplicateCorredor);
        await this.fetchCorredores();
        this.closeDuplicateDialog();
        this.snackbarMessage = `Piloto duplicado exitosamente en ${this.duplicateCorredor.categoria}`;
        this.snackbarColor = "success";
        this.snackbar = true;
      } catch (error) {
        console.error("Error duplicando corredor:", error);
        this.snackbarMessage = "Error al duplicar el piloto. Verifica los datos.";
        this.snackbarColor = "error";
        this.snackbar = true;
      }
    },
    resetDuplicateCorredor() {
      this.duplicateCorredor = {
        nombre: "",
        categoria: "",
        edad: 0,
        tiempo: 0,
        rut: "",
        team: "",
        telefono: "",
        entregado: false,
      };
    },
    closeCreateDialog() {
      this.createDialog = false;
      this.resetNewCorredor();
    },
    async createCorredor() {
      try {
        this.newCorredor.edad = parseInt(this.newCorredor.edad);
        await axios.post("http://127.0.0.1:3030/corredores", this.newCorredor);
        await this.fetchCorredores();
        this.closeCreateDialog();
        // Mostrar snackbar después de la creación exitosa
        this.snackbarMessage = "Corredor creado correctamente";
        this.snackbar = true;
      } catch (error) {
        console.error("Error creating corredor:", error);
      }
    },
    showUpdateDialog(corredor) {
      this.selectedCorredor = { ...corredor };
      this.updateDialog = true;
    },
    closeUpdateDialog() {
      this.updateDialog = false;
      this.resetCorredorUpdate();
    },
    markAsDelivered(corredor) {
      this.selectedCorredor = { ...corredor };
      this.selectedCorredor.entregado = true;
      this.updateCorredor();
    },
    markIsNotDelivered(corredor) {
      this.selectedCorredor = { ...corredor };
      this.selectedCorredor.entregado = false;
      this.updateCorredor();
    },
    async updateCorredor() {
      try {
        this.newCorredor.edad = parseInt(this.newCorredor.edad);
        this.selectedCorredor.edad = parseInt(this.selectedCorredor.edad);
        console.log(this.selectedCorredor);
        await axios.patch(
          `http://127.0.0.1:3030/corredores/${this.selectedCorredor._id}`,
          this.selectedCorredor
        );
        this.fetchCorredores();
        this.closeUpdateDialog();
        // Mostrar snackbar después de la actualización exitosa
        this.snackbarMessage = "Corredor actualizado correctamente";
        this.snackbar = true;
      } catch (error) {
        console.error("Error updating corredor:", error);
        this.snackbarMessage =
          "Error al actualizar el corredor. Por favor, inténtalo de nuevo.";
        this.snackbar = true;
      }
    },
    async deleteCorredor(id) {
      // Confirmación antes de eliminar
      const confirmDelete = confirm(
        "¿Estás seguro de que deseas eliminar este corredor?"
      );
      if (!confirmDelete) {
        return;
      }
      try {
        await axios.delete(`http://127.0.0.1:3030/corredores/${id}`);
        await this.fetchCorredores();
        // Mostrar snackbar después de la eliminación exitosa
        this.snackbarMessage = "Corredor eliminado correctamente";
        this.snackbar = true;
      } catch (error) {
        console.error("Error deleting corredor:", error);
      }
    },
    resetCorredorUpdate() {
      this.selectedCorredor = {
        nombre: "",
        categoria: "",
        edad: 0,
        tiempo: 0,
        rut: "",
        team: "",
        telefono: "",
        entregado: false,
      };
    },
    resetNewCorredor() {
      this.newCorredor = {
        nombre: "",
        categoria: "",
        edad: 0,
        tiempo: 0,
        rut: "",
        team: "",
        telefono: "",
        entregado: false,
      };
    },
  },
  mounted() {
    this.fetchCorredores();
  },
};
</script>

<style scoped>
/* Puedes añadir estilos personalizados aquí */
</style>
