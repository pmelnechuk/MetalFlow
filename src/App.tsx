import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { ProjectsPage } from './pages/ProjectsPage'
import { KanbanPage } from './pages/KanbanPage'
import { EmployeesPage } from './pages/EmployeesPage'
import { SettingsPage } from './pages/SettingsPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<ProjectsPage />} />
          <Route path="/tablero" element={<KanbanPage />} />
          <Route path="/empleados" element={<EmployeesPage />} />
          <Route path="/ajustes" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
