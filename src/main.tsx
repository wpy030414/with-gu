import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import '@fontsource-variable/jetbrains-mono'
import './styles/tokens.css'
import './styles/base.css'
import './styles/crt.css'

import App from './App'

const container = document.getElementById('root')

if (!container) {
  throw new Error('找不到挂载点 #root')
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
