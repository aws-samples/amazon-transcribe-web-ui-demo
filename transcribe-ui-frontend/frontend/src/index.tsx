import 'react-app-polyfill/ie11'
import 'react-app-polyfill/stable'
import 'core-js'
import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import './i18next'
import App from './App'
import reportWebVitals from './reportWebVitals'
import NorthStarThemeProvider from 'aws-northstar/components/NorthStarThemeProvider'

ReactDOM.render(
  <NorthStarThemeProvider>
    <App />
  </NorthStarThemeProvider>,
  document.getElementById('root')
)

if (process.env.NODE_ENV === 'development') {
  reportWebVitals(console.log)
}
