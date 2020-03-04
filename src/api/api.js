import axios from 'axios'
import { options, TOKEN, modelJsonUrl, param } from './config'

export function getModelJson (id) {
  const data = param(Object.assign({}, TOKEN, id))

  let url = options.baseUrl + modelJsonUrl
  url += (url.indexOf('?') < 0 ? '?' : '&') + data

  return axios.get(url).then((res) => {
    if (res.status === options.ERR_OK && res.data.code === options.code) {
      return Promise.resolve(res.data)
    }
  })
}
