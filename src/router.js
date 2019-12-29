import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

const pages = {
  DailyRank: () => import('./views/rank/DailyRank'),
  Detail: () => import('./views/detail/Detail'),
  Artist: () => import('./views/artist/Artist'),
  Search: () => import('./views/search/Search'),
  Find: () => import('./views/find/Find'),
  Me: () => import('./views/me/Me'),
  NotFound: () => import('./views/not-found/NotFound')
}

const originalPush = Router.prototype.push
Router.prototype.push = function push (location) {
  return originalPush.call(this, location).catch(err => err)
}

export default new Router({
  mode: 'history',
  base: 'pix',
  scrollBehavior (to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return {
        x: 0,
        y: 0
      }
    }
  },
  routes: [{
    path: '/',
    redirect: '/dailyRank'
  },
  {
    path: '/detail/:pid',
    name: 'Detail',
    component: pages.Detail,
    props: true
  },
  {
    path: '/artist/:artistId',
    name: 'Artist',
    component: pages.Artist,
    props: true
  },
  {
    path: '/dailyRank',
    name: 'DailyRank',
    component: pages.DailyRank
  },
  {
    path: '/search',
    name: 'Search',
    component: pages.Search,
    meta: {
      noCache: false
    }
  },
  {
    path: '/find',
    name: 'Find',
    component: pages.Find,
    meta: {
      noCache: true
    }
  },
  {
    path: '/me',
    name: 'Me',
    component: pages.Me,
    meta: {
      noCache: true
    }
  },
  {
    path: '*',
    name: 'NotFound',
    component: pages.NotFound,
    meta: {
      noCache: false
    }
  }
  ]
})
