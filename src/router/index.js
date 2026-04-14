// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: { requiresAuth: true }
  },
  // 👇 新增：知识树列表
  {
    path: '/tree/list',
    name: 'TreeList',
    component: () => import('@/views/TreeList.vue'),
    meta: { requiresAuth: true }
  },
  // 👇 新增：知识树详情（后续开发）
  {
    path: '/tree/detail/:treeId',
    name: 'TreeDetail',
    component: () => import('@/views/TreeDetail.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/study/record',
    name: 'StudyRecord',
    component: () => import('@/views/study/Record.vue'),
    meta: { title: '学习记录' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 全局路由守卫
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  const token = userStore.token

  if (to.meta.requiresAuth && !token) {
    // 需要登录但没有 token，跳转到登录页
    next('/login')
  } else if ((to.path === '/login' || to.path === '/register') && token) {
    // 已登录用户访问登录/注册页，跳转到首页
    next('/')
  } else {
    next()
  }
})

export default router