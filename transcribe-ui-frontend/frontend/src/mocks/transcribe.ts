import { MockMethods } from 'axios-mock-server'

const methods: MockMethods = {
  post: () => {
    return [200, null]
  }
}

export default methods
