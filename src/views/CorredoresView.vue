<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-text-field
          v-model="search"
          label="Buscar por nombre"
          append-icon="mdi-magnify"
          solo
        />
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-btn @click="showCreateDialog" color="primary">Crear Corredor</v-btn>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-data-table
          :headers="headers"
          :items="filteredCorredores"
          :search="search"
          class="elevation-1"
        >
          <template v-slot:[`item.actions`]="{ item }">
            <v-btn @click="showUpdateDialog(item)" color="success">Actualizar</v-btn>
          </template>

          <template v-slot:[`item.categoria`]="{ item }">
            <v-chip :color="categorias.find(c => c.value === item.categoria).color">
              {{ item.categoria }}
            </v-chip>
          </template>

          <template v-slot:[`item.entregado`]="{ item }">
            <v-icon :color="item.entregado ? 'green' : 'red'">mdi-{{ item.entregado ? 'check' : 'close' }}</v-icon>
          </template>

        </v-data-table>
      </v-col>
    </v-row>

    <v-dialog v-model="createDialog" max-width="600px">
      <v-card>
        <v-card-title>
          <span class="headline">Crear Corredor</span>
        </v-card-title>
        <v-card-text>
          <v-form ref="createForm" v-model="valid">
            <v-text-field v-model="newCorredor.nombre" label="Nombre" required />
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
            <v-text-field
              v-model="newCorredor.rut"
              label="RUT"
              required
            />
            <v-text-field
              v-model="newCorredor.team"
              label="Equipo"
              required
            />
            <v-text-field
              v-model="newCorredor.telefono"
              label="Teléfono"
              required
            />
            <v-checkbox
              v-model="newCorredor.entregado"
              label="Entregado"
            />
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
            <v-text-field v-model="selectedCorredor.nombre" label="Nombre" required />
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
            <v-text-field
              v-model="selectedCorredor.rut"
              label="RUT"
              required
            />
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
    <v-snackbar v-model="snackbar" :timeout="3000" color="success">
      {{ snackbarMessage }}
      <v-btn color="white" text @click="snackbar = false">Cerrar</v-btn>
    </v-snackbar>
  </v-container>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      snackbar: false,
      snackbarMessage: '',
      search: '',
      corredores: [],
      selectedCorredor: {
        nombre: '',
        categoria: '',
        edad: 0,
        tiempo: 0,
        rut: '',
        team: '',
        telefono: '',
        entregado: false,
      },
      newCorredor: {
        nombre: '',
        categoria: '',
        edad: 0,
        tiempo: 0,
        rut: '',
        team: '',
        telefono: '',
        entregado: false,
      },
      createDialog: false,
      updateDialog: false,
      valid: false,
      categorias: [
        { text: 'Kids', value: 'Kids', color: 'blue' },
        { text: 'Infantil', value: 'Infantil' , color: 'green'},
        { text: 'Junior', value: 'Junior', color: 'red' },
        { text: 'Damas', value: 'Damas', color: 'purple' },
        { text: 'Novicios', value: 'Novicios', color: 'orange' },
        { text: 'Rígido', value: 'Rígido', color: 'yellow' },
        { text: 'Experto', value: 'Experto', color: 'cyan' },
        { text: 'Elite', value: 'Elite', color: 'indigo' },
        { text: 'Master A', value: 'Master A', color: 'teal' },
        { text: 'Open Master', value: 'Open Master', color: 'pink' },
      ],
      headers: [
        { title: 'Nombre', key: 'nombre' },
        { title: 'Categoría', key: 'categoria' },
        { title: 'Edad', key: 'edad' },
        { title: 'Número', key: 'numero' },
        { title: 'RUT', key: 'rut' },
        { title: 'Equipo', key: 'team' },
        { title: 'Teléfono', key: 'telefono' },
        { title: 'Número Entregado', key: 'entregado', align: 'center' },
        { title: 'Acciones', key: 'actions', sortable: false },
      ],
    };
  },
  computed: {
    filteredCorredores() {
      return this.corredores.filter(corredor =>
        corredor.nombre.toLowerCase().includes(this.search.toLowerCase())
      );
    },
  },
  methods: {
    async fetchCorredores() {
      try {
        const response = await axios.get('http://127.0.0.1:3030/corredores');
        this.corredores = response.data.data;
      } catch (error) {
        console.error("Error fetching corredores:", error);
      }
    },
    showCreateDialog() {
      this.createDialog = true;
    },
    closeCreateDialog() {
      this.createDialog = false;
      this.resetNewCorredor();
    },
    async createCorredor() {
      try {
        this.newCorredor.edad = parseInt(this.newCorredor.edad);
        await axios.post('http://127.0.0.1:3030/corredores', this.newCorredor);
        await this.fetchCorredores();
        this.closeCreateDialog();
        // Mostrar snackbar después de la creación exitosa
        this.snackbarMessage = 'Corredor creado correctamente';
        this.snackbar = true;
      } catch (error) {
        console.error("Error creating corredor:", error);
      }
    },
    showUpdateDialog(corredor) {
      this.selectedCorredor = { ...corredor }; // Crea una copia para editar
      this.updateDialog = true;
    },
    closeUpdateDialog() {
      this.updateDialog = false;
      this.resetCorredorUpdate();
    },
    async updateCorredor() {
      try {
        await axios.patch(`http://127.0.0.1:3030/corredores/${this.selectedCorredor._id}`, this.selectedCorredor);
        this.fetchCorredores();
        this.closeUpdateDialog();
        // Mostrar snackbar después de la actualización exitosa
        this.snackbarMessage = 'Corredor actualizado correctamente';
        this.snackbar = true;
      } catch (error) {
        console.error("Error updating corredor:", error);
      }
    },
    resetCorredorUpdate(){
      this.selectedCorredor = {
        nombre: '',
        categoria: '',
        edad: 0,
        tiempo: 0,
        rut: '',
        team: '',
        telefono: '',
        entregado: false,
      };
    },
    resetNewCorredor() {
      this.newCorredor = {
        nombre: '',
        categoria: '',
        edad: 0,
        tiempo: 0,
        rut: '',
        team: '',
        telefono: '',
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
