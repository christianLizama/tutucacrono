<template>
  <v-card
    class="mb-2 person-timer-card"
    :class="{
      'border-running': isRunning,
      'border-finished': isFinished,
      'border-dns': isDNS,
      'border-dnf': isDNF,
    }"
    :elevation="isRunning ? 4 : 1"
  >
    <v-card-text class="d-flex align-center pa-4">
      <!-- Posición -->
      <div class="d-flex align-center justify-center" style="width: 80px">
        <v-avatar
          :color="posicionColor"
          size="56"
          v-if="resultado.posicion > 0"
        >
          <span class="text-white font-weight-bold text-h5">{{ resultado.posicion }}</span>
        </v-avatar>
        <v-icon v-else color="grey-lighten-1" size="36">mdi-minus</v-icon>
      </div>

      <!-- Nombre -->
      <div class="d-flex align-center justify-start" style="width: 25%">
        <span class="font-weight-bold text-h5 ml-4">{{ corredor.nombre }}</span>
      </div>

      <!-- Team -->
      <div class="d-flex align-center justify-start" style="width: 15%">
        <span class="text-h6 text-grey-darken-1">{{ corredor.team }}</span>
      </div>

      <!-- Número -->
      <div class="d-flex align-center justify-center" style="width: 10%">
        <v-chip color="primary" size="x-large" variant="elevated" class="text-h5 px-4 py-2 font-weight-bold">
          {{ corredor.numero }}
        </v-chip>
      </div>

      <!-- Tiempo -->
      <div class="d-flex align-center justify-center" style="width: 22%">
        <span
          class="timer-display font-weight-black"
          style="font-size: 2.2rem;"
          :class="{
            'text-success': isFinished,
            'text-warning': isRunning,
            'text-grey': isPending,
            'text-error': isDNF,
          }"
        >
          {{ displayTimeFormatted }}
        </span>
      </div>

      <!-- Estado -->
      <div class="d-flex align-center justify-center" style="width: 10%">
        <v-chip
          :color="estadoChipColor"
          size="large"
          variant="tonal"
          class="text-button font-weight-bold"
        >
          {{ estadoTexto }}
        </v-chip>
      </div>

      <!-- Acciones -->
      <div class="d-flex align-center justify-end ga-2" style="width: 18%">
        <template v-if="carreraEnCurso">
          <!-- Botón Start/Stop del timer individual -->
          <v-btn
            v-if="isPending || isRunning"
            @click="toggleTimer"
            :color="isRunning ? 'error' : 'success'"
            size="large"
            :loading="loadingAction"
            icon
          >
            <v-icon size="x-large">{{ isRunning ? 'mdi-stop' : 'mdi-play' }}</v-icon>
          </v-btn>

          <!-- Botón Reiniciar (para corriendo o finalizado) -->
          <v-btn
            v-if="isRunning || isFinished"
            @click="reiniciarTimer"
            color="orange"
            size="large"
            variant="tonal"
            :loading="loadingAction"
            icon
          >
            <v-icon size="large">mdi-restart</v-icon>
            <v-tooltip activator="parent" location="top">Reiniciar timer</v-tooltip>
          </v-btn>

          <!-- Marcar DNS -->
          <v-btn
            v-if="isPending"
            @click="marcarDNS"
            color="grey"
            size="large"
            variant="tonal"
            :loading="loadingAction"
          >
            DNS
          </v-btn>

          <!-- Marcar DNF -->
          <v-btn
            v-if="isRunning"
            @click="marcarDNF"
            color="grey"
            size="large"
            variant="tonal"
            :loading="loadingAction"
          >
            DNF
          </v-btn>

          <!-- Botón Editar Tiempo a Mano (durante carrera) -->
          <v-btn
            @click="showEditTimeDialog"
            color="amber-darken-2"
            size="large"
            variant="tonal"
            icon
            :loading="loadingAction"
          >
            <v-icon size="large">mdi-timer-edit-outline</v-icon>
            <v-tooltip activator="parent" location="top">Editar tiempo a mano</v-tooltip>
          </v-btn>
        </template>

        <!-- Carrera finalizada / sin curso -->
        <template v-if="!carreraEnCurso">
          <v-chip
            v-if="isFinished"
            color="success"
            size="large"
            variant="tonal"
            class="text-button mr-1"
          >
            <v-icon start size="large">mdi-check</v-icon>
            Registrado
          </v-chip>

          <!-- Botón Editar Tiempo a Mano (fuera de carrera / finalizada) -->
          <v-btn
            @click="showEditTimeDialog"
            color="amber-darken-2"
            size="large"
            variant="tonal"
            icon
            :loading="loadingAction"
          >
            <v-icon size="large">mdi-timer-edit-outline</v-icon>
            <v-tooltip activator="parent" location="top">Editar tiempo a mano</v-tooltip>
          </v-btn>
        </template>
      </div>
    </v-card-text>

    <!-- Diálogo para Editar Tiempo a Mano en Qualy / Final -->
    <v-dialog v-model="editTimeDialog" max-width="480px">
      <v-card rounded="lg">
        <v-card-title class="d-flex align-center pt-4 px-6">
          <v-icon color="amber-darken-2" class="mr-2">mdi-timer-edit-outline</v-icon>
          Editar Tiempo Manual
        </v-card-title>

        <v-card-text class="px-6">
          <p class="mb-3 text-body-1 font-weight-medium">
            Piloto: <span class="text-primary">{{ corredor.nombre }}</span> (N° {{ corredor.numero }})
          </p>

          <v-alert color="amber-darken-2" variant="tonal" class="mb-4" density="compact">
            Corrige el tiempo del piloto en esta carrera (Minutos, Segundos y Milisegundos).
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
          <v-btn @click="editTimeDialog = false" color="grey" variant="text">Cancelar</v-btn>
          <v-btn @click="guardarTiempoManual" color="amber-darken-2" variant="flat" :loading="loadingAction">
            Guardar Tiempo
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script>
export default {
  name: 'PersonTimer',
  props: {
    resultado: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      localDisplayTime: 0,
      rafId: null,
      loadingAction: false,
      editTimeDialog: false,
      timeInputs: {
        minutos: 0,
        segundos: 0,
        milisegundos: 0,
      },
    };
  },
  computed: {
    corredor() {
      // El resultado viene con el corredor populado
      return this.resultado.corredor || {};
    },
    corredorId() {
      return this.corredor._id || this.corredor;
    },
    carreraEnCurso() {
      return this.$store.getters.carreraEnCurso;
    },
    timerLocal() {
      return this.$store.getters.timerLocal(this.corredorId);
    },

    // Estados
    isPending() { return this.resultado.estado === 'pendiente'; },
    isRunning() { return this.resultado.estado === 'corriendo'; },
    isFinished() { return this.resultado.estado === 'finalizado'; },
    isDNS() { return this.resultado.estado === 'dns'; },
    isDNF() { return this.resultado.estado === 'dnf'; },

    // Display
    displayTimeFormatted() {
      if (this.isDNS) return 'DNS';
      if (this.isDNF) return 'DNF';
      if (this.isRunning) return this.formatTime(this.localDisplayTime);
      if (this.isFinished) return this.formatTime(this.resultado.tiempo);
      return '0:00:000';
    },

    posicionColor() {
      if (this.resultado.posicion === 1) return 'amber-darken-2';
      if (this.resultado.posicion === 2) return 'blue-grey';
      if (this.resultado.posicion === 3) return 'deep-orange';
      return 'grey';
    },

    estadoChipColor() {
      const map = {
        pendiente: 'info',
        corriendo: 'warning',
        finalizado: 'success',
        dns: 'grey',
        dnf: 'error',
      };
      return map[this.resultado.estado] || 'grey';
    },

    estadoTexto() {
      const map = {
        pendiente: 'Pendiente',
        corriendo: 'Corriendo',
        finalizado: 'Finalizado',
        dns: 'DNS',
        dnf: 'DNF',
      };
      return map[this.resultado.estado] || '';
    },

    calculatedTiempoMs() {
      const min = Math.max(0, parseInt(this.timeInputs.minutos) || 0);
      const sec = Math.max(0, parseInt(this.timeInputs.segundos) || 0);
      const ms = Math.max(0, parseInt(this.timeInputs.milisegundos) || 0);
      return (min * 60000) + (sec * 1000) + ms;
    },

    formattedCalculatedTime() {
      return this.formatTime(this.calculatedTiempoMs);
    },
  },
  methods: {
    formatTime(ms) {
      if (!ms || ms <= 0) return '0:00:000';
      const totalMs = Math.max(0, Math.round(ms));
      const mins = Math.floor(totalMs / 60000);
      const secs = Math.floor((totalMs % 60000) / 1000);
      const millis = totalMs % 1000;
      return `${mins}:${secs.toString().padStart(2, '0')}:${millis.toString().padStart(3, '0')}`;
    },

    async toggleTimer() {
      if (this.isRunning) {
        await this.stopTimer();
      } else if (this.isPending) {
        await this.startTimer();
      }
    },

    async startTimer() {
      this.loadingAction = true;
      try {
        // 1. Notificar al servidor que este corredor empezó
        await this.$store.dispatch('iniciarTimerCorredor', this.corredorId);
        // 2. Iniciar el loop de animación local
        this.startLocalAnimation();
      } catch (error) {
        console.error('Error iniciando timer:', error);
      } finally {
        this.loadingAction = false;
      }
    },

    async stopTimer() {
      this.loadingAction = true;
      try {
        // 1. Calcular tiempo final
        const timerData = this.timerLocal;
        let finalTime = 0;
        if (timerData.running && timerData.startTimestamp) {
          finalTime = performance.now() - timerData.startTimestamp;
        }
        finalTime = Math.max(0, Math.round(finalTime));

        // 2. Detener animación local
        this.stopLocalAnimation();

        // 3. Enviar tiempo al servidor
        await this.$store.dispatch('registrarTiempo', {
          corredorId: this.corredorId,
          tiempo: finalTime,
        });
      } catch (error) {
        console.error('Error deteniendo timer:', error);
      } finally {
        this.loadingAction = false;
      }
    },

    showEditTimeDialog() {
      const currentMs = this.resultado.tiempo || 0;
      this.timeInputs = {
        minutos: Math.floor(currentMs / 60000),
        segundos: Math.floor((currentMs % 60000) / 1000),
        milisegundos: currentMs % 1000,
      };
      this.editTimeDialog = true;
    },

    async guardarTiempoManual() {
      this.loadingAction = true;
      try {
        const finalTiempo = this.calculatedTiempoMs;
        await this.$store.dispatch('registrarTiempo', {
          corredorId: this.corredorId,
          tiempo: finalTiempo,
        });
        this.editTimeDialog = false;
      } catch (error) {
        console.error('Error guardando tiempo manual:', error);
      } finally {
        this.loadingAction = false;
      }
    },

    async marcarDNS() {
      this.loadingAction = true;
      try {
        await this.$store.dispatch('marcarEstadoCorredor', {
          corredorId: this.corredorId,
          estado: 'dns',
        });
      } catch (error) {
        console.error('Error marcando DNS:', error);
      } finally {
        this.loadingAction = false;
      }
    },

    async marcarDNF() {
      this.loadingAction = true;
      try {
        this.stopLocalAnimation();
        await this.$store.dispatch('marcarEstadoCorredor', {
          corredorId: this.corredorId,
          estado: 'dnf',
        });
      } catch (error) {
        console.error('Error marcando DNF:', error);
      } finally {
        this.loadingAction = false;
      }
    },

    async reiniciarTimer() {
      this.loadingAction = true;
      try {
        this.stopLocalAnimation();
        this.localDisplayTime = 0;
        await this.$store.dispatch('reiniciarTimerCorredor', this.corredorId);
      } catch (error) {
        console.error('Error reiniciando timer:', error);
      } finally {
        this.loadingAction = false;
      }
    },

    // ─── Animación Local del Cronómetro ──────────────────────────

    startLocalAnimation() {
      this.updateLocalDisplay();
    },

    updateLocalDisplay() {
      const timerData = this.timerLocal;
      if (!timerData.running || !timerData.startTimestamp) {
        return;
      }
      this.localDisplayTime = performance.now() - timerData.startTimestamp;
      this.rafId = requestAnimationFrame(() => this.updateLocalDisplay());
    },

    stopLocalAnimation() {
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
    },
  },

  watch: {
    // Si el estado cambia externamente (por WS), sincronizar animación
    'resultado.estado'(newVal) {
      if (newVal === 'corriendo' && !this.rafId) {
        // Fue iniciado remotamente o se reconectó
        if (this.timerLocal.running) {
          this.startLocalAnimation();
        }
      } else if (newVal !== 'corriendo') {
        this.stopLocalAnimation();
      }
    },
  },

  mounted() {
    // Si el corredor ya estaba corriendo (reconexión), restaurar animación
    if (this.isRunning && this.timerLocal.running) {
      this.startLocalAnimation();
    }
  },

  beforeUnmount() {
    this.stopLocalAnimation();
  },
};
</script>

<style scoped>
.person-timer-card {
  transition: all 0.2s ease;
}
.border-running {
  border-left: 4px solid #ff9800;
}
.border-finished {
  border-left: 4px solid #4caf50;
}
.border-dns {
  border-left: 4px solid #9e9e9e;
  opacity: 0.7;
}
.border-dnf {
  border-left: 4px solid #f44336;
  opacity: 0.8;
}
.timer-display {
  font-family: 'Roboto Mono', monospace;
  font-size: 1.1rem;
  letter-spacing: 0.5px;
}
</style>
