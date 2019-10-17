import axios from 'axios'
import cookie from 'js-cookie'
import router from '../router'

// 创建axios实例
const instance = axios.create({
  // baseURL: 'https://api.pixivic.com',
  baseURL: 'https://v1.api.pixivic.com',
  // baseURL: "https://search.api.pixivic.com",
  // baseURL: 'http://114.67.107.177:8080',
  timeout: 20000,
  validateStatus (status) {
    return status >= 200 && status < 600
  }
})

instance.interceptors.request.use(
  config => {
    if (cookie.get('jwt')) {
      config.headers.Authorization = 'Bearer ' + cookie.get('jwt')
    }
    return config
  },
  error => {
    console.log(error)
    Promise.reject(error)
  }
)

instance.interceptors.response.use(
  response => {
    if (response.headers.hasOwnProperty('Authorization')) {
      cookie.set('jwt', response.headers.Authorization, { expires: 365 })
    }
    if (response.status === 401) {
      this.$aMsg.error('身份验证过期，请重新登录')
      cookie.remove('jwt')
      localStorage.remove('user')
      router.push('/')
    }
    return response
  },
  error => {
    console.log('err' + error)
    return Promise.reject(error)
  }
)

export default instance