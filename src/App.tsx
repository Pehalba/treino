import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { ForgotPasswordPage, LoginPage, SignupPage } from '@/features/auth/AuthPages'
import { ProfilePickerPage } from '@/features/auth/ProfilePickerPage'
import { CaloriesPage } from '@/features/calories/CaloriesPage'
import { DietEditPage } from '@/features/diet/DietEditPage'
import { DietPage } from '@/features/diet/DietPage'
import { DashboardCustomizePage } from '@/features/home/DashboardCustomizePage'
import { HomePage } from '@/features/home/HomePage'
import { ReportsPage } from '@/features/reports/ReportsPage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { ExerciseHistoryPage } from '@/features/workout/ExerciseHistoryPage'
import { WorkoutEditPage } from '@/features/workout/WorkoutEditPage'
import { WorkoutModePage } from '@/features/workout/WorkoutModePage'
import { WorkoutsPage } from '@/features/workout/WorkoutsPage'
import { isFirebaseConfigured } from '@/firebase/config'
import { useAuthBootstrap, useSession } from '@/hooks/useSession'

function MissingFirebase() {
  return (
    <div className="mx-auto flex min-h-svh max-w-lg flex-col justify-center px-5">
      <h1 className="font-display text-3xl">Configure o Firebase</h1>
      <p className="mt-3 text-muted">
        Copie <code>.env.example</code> para <code>.env</code> e preencha as chaves do projeto. Depois reinicie o servidor.
      </p>
    </div>
  )
}

function BootScreen() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-bg px-6 text-center">
      <p className="text-xs font-semibold tracking-[0.2em] text-accent uppercase">Pedro & Carol</p>
      <h1 className="mt-3 font-display text-2xl">Preparando seus treinos</h1>
      <p className="mt-2 max-w-xs text-sm text-muted">Na primeira vez isso pode levar alguns segundos.</p>
    </div>
  )
}

function Guard() {
  const { firebaseUser, bootstrapping } = useSession()
  if (bootstrapping || !firebaseUser) return <BootScreen />
  return <Outlet />
}

function ProfileGuard() {
  const { activeProfile } = useSession()
  if (!activeProfile) return <Navigate to="/quem" replace />
  return <Outlet />
}

export default function App() {
  useAuthBootstrap()

  if (!isFirebaseConfigured()) return <MissingFirebase />

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/cadastro" element={<SignupPage />} />
      <Route path="/recuperar" element={<ForgotPasswordPage />} />
      <Route element={<Guard />}>
        <Route path="/quem" element={<ProfilePickerPage />} />
        <Route element={<ProfileGuard />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/painel" element={<DashboardCustomizePage />} />
          <Route path="/treino" element={<WorkoutsPage />} />
          <Route path="/treinos/:templateId/editar" element={<WorkoutEditPage />} />
          <Route path="/treino/:sessionId" element={<WorkoutModePage />} />
          <Route path="/treino/:sessionId/resumo" element={<WorkoutModePage />} />
          <Route path="/exercicio/:exerciseId" element={<ExerciseHistoryPage />} />
          <Route path="/calorias" element={<CaloriesPage />} />
          <Route path="/dietas" element={<DietPage />} />
          <Route path="/dietas/editar" element={<DietEditPage />} />
          <Route path="/relatorios" element={<ReportsPage />} />
          <Route path="/perfil" element={<SettingsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
