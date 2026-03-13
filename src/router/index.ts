import { option } from '@/app.option'

import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/:pathMatch(.+)',
      redirect: '/404',
    },
    {
      path: '/404',
      component: () => import('@/views/404.vue'),
    },
    {
      path: '/',
      component: () => import('@/views/Portal.vue'),
    },
    {
      path: '/blog',
      component: () => import('@/views/Blog.vue'),
    },
    {
      path: '/blog/:id',
      component: () => import('@/views/Blog.vue'),
    },
    {
      path: '/galary',
      component: () => import('@/views/Galary.vue'),
    },
    {
      path: '/museum',
      component: () => import('@/views/Museum.vue'),
    },
    {
      path: '/project',
      component: () => import('@/views/Project.vue'),
    },
    {
      path: '/about',
      component: () => import('@/views/About.vue'),
    },
    {
      path: '/sponsor',
      component: () => import('@/views/Sponsor.vue'),
    },
    {
      path: '/shrine',
      component: () => import('@/views/Shrine.vue'),
    },
    {
      path: '/easter-egg',
      component: () => import('@/views/EasterEgg.vue'),
    },
  ],
})

/**
 * 设置页面标题。
 */
export function setPageTitle(parts: string[]) {
  const postfix = `咕鹿小屋 | GuLu Nest`
  let temp = postfix

  parts.forEach((p) => {
    if (p) temp = `${p} - ${temp}`
  })
  document.title = temp
}

router.afterEach((to, _alpha, _beta) => {
  const pathMapper: { [key: string]: string } = {
    galary: '相册',
    museum: '展馆',
    project: option.projectName || '计划',
    '404': '404',
    about: '关于',
    sponsor: '赞助',
    shrine: '赤牧神社',
  }

  if (to.path !== '/blog') setPageTitle([pathMapper[to.path.slice(1)]!])
})

export default router
