import { MockMethods } from 'axios-mock-server'

const vocabularies = [
  { phrase: 'えーだぶりゅーえす', display: 'AWS' },
  { phrase: 'れいわ', display: '令和' }
]

const methods: MockMethods = {
  get: () => {
    return [200, vocabularies]
  },
  delete: () => {
    return [200, null]
  },
  post: () => {
    return [200, null]
  }
}

export default methods
