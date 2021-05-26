/* eslint-disable */
import { AxiosInstance } from 'axios'
import mockServer from 'axios-mock-server'
import mock0 from './vocabularies'
import mock1 from './transcribe'

export default (client?: AxiosInstance) =>
  mockServer(
    [
      {
        path: '/vocabularies',
        methods: mock0
      },
      {
        path: '/transcribe',
        methods: mock1
      }
    ],
    client,
    ''
  )
