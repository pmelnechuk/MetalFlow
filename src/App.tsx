import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { ProjectsPage } from './pages/ProjectsPage'
import { KanbanPage } from './pages/KanbanPage'
import { VoicePage } from './pages/VoicePage'
import { SettingsPage } from './pages/SettingsPage'
import { AIReviewScreen } from './components/review/AIReviewScreen'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<ProjectsPage />} />
          <Route path="/tablero" element={<KanbanPage />} />
          <Route path="/voz" element={<VoicePage />} />
          <Route path="/voz/revision" element={<AIReviewScreen />} />
          <Route path="/ajustes" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
