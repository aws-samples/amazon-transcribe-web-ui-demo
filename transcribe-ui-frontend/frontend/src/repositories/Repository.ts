import axios from 'axios'
import mock from '../mocks/$mock'

if (process.env.NODE_ENV === 'development') {
  mock()
}

export default axios.create({
  baseURL: process.env.REACT_APP_API_ENDPOINT
})
