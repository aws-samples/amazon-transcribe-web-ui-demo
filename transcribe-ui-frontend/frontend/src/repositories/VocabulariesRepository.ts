import { AxiosResponse } from 'axios'
import Repository from './Repository'

export type Vocabulary = {
  phrase: string
  display: string
}

const resource = '/vocabularies'

export default {
  add(payload: Vocabulary[]): Promise<AxiosResponse<any>> {
    Repository.defaults.headers.post['Content-Type'] = 'application/json'
    return Repository.post(resource, payload)
  },
  remove(payload: Vocabulary[]): Promise<AxiosResponse<any>> {
    Repository.defaults.headers.post['Content-Type'] = 'application/json'
    return Repository.delete(resource, { data: payload })
  },
  get(): Promise<AxiosResponse<Vocabulary[]>> {
    Repository.defaults.headers.post['Content-Type'] = 'application/json'
    return Repository.get(resource)
  }
}
