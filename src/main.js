import { createApp } from 'vue'
import router from './router'
import store from './store'
// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'

// Components
import App from './App.vue'

const vuetify = createVuetify({
  components,
  directives,
  ssr: true,
  icons: {
    defaultSet: 'mdi', // This is already the default value - only for display purposes
  },
})

createApp(App).use(vuetify).use(store).use(router).mount('#app')
