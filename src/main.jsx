// gray-matter 依赖 Node 的 Buffer，在浏览器中需 polyfill
import { Buffer } from 'buffer'
if (typeof globalThis !== 'undefined') globalThis.Buffer = Buffer

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const rootEl = document.getElementById('root')
if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
