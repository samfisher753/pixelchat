import { createRoot } from 'react-dom/client'
import App from '@/App.tsx'
import '@/index.css'
import { GameProvider } from "@/contexts/GameContext"
import { AuthProvider } from '@/providers/AuthProvider'

createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <GameProvider>
      <App />
    </GameProvider>
  </AuthProvider>
)
