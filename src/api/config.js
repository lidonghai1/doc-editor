export const options = {
  baseUrl: 'https://todoenv.kangyun3d.com/index.php',
  ERR_OK: 200,
  code: 0
}

export const TOKEN = {
  _: '7213zlDC32EGHoiavT20YiXG8sw3CSkN8vJtri8qmTy8lexYDByD7PEvmXon'
}

export const modelJsonUrl = '/api/edit/get_model'

export function param (data) {
  let url = ''
  for (var k in data) {
    let value = data[k] !== undefined ? data[k] : ''
    url += '&' + k + '=' + encodeURIComponent(value)
  }
  return url ? url.substring(1) : ''
}
