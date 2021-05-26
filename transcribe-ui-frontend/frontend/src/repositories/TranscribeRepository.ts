import { AxiosResponse } from 'axios'
import Repository from './Repository'

export type Language = 'en-GB' | 'es-US' | 'ja-JP'

export type Transcribe = {
  file: string
  lang: Language
  num: number
  addr: string
}

const resource = '/transcribe'

export default {
  start(payload: Transcribe): Promise<AxiosResponse<any>> {
    Repository.defaults.headers.post['Content-Type'] = 'application/json'
    return Repository.post(resource, {
      ...payload,
      lang: String(payload['lang'])
    })
  }
}
