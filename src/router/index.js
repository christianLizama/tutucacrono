import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import CategoryView from '@/views/CategoryView.vue'
// import RankView from '../views/RankView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/category/:category',
    name: 'category',
    component: CategoryView,
    props: true, // Pasa los parámetros de ruta como props al componente
  },
  // {
  //   path: '/rankings',
  //   name: 'rankings',
  //   component: RankView,
  // }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
