import { lazy, Suspense } from 'react'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { ProfilePickerPage } from '@/features/auth/ProfilePickerPage'
import { HomePage } from '@/features/home/HomePage'
import { isFirebaseConfigured } from '@/firebase/config'
import { useAuthBootstrap, useSession } from '@/hooks/useSession'

const LoginPage = lazy(() => import('@/features/auth/AuthPages').then((m) => ({ default: m.LoginPage })))
const SignupPage = lazy(() => import('@/features/auth/AuthPages').then((m) => ({ default: m.SignupPage })))
const ForgotPasswordPage = lazy(() =>
  import('@/features/auth/AuthPages').then((m) => ({ default: m.ForgotPasswordPage })),
)
const CaloriesPage = lazy(() => import('@/features/calories/CaloriesPage').then((m) => ({ default: m.CaloriesPage })))
const DietEditPage = lazy(() => import('@/features/diet/DietEditPage').then((m) => ({ default: m.DietEditPage })))
const DietPage = lazy(() => import('@/features/diet/DietPage').then((m) => ({ default: m.DietPage })))
const DashboardCustomizePage = lazy(() =>
  import('@/features/home/DashboardCustomizePage').then((m) => ({ default: m.DashboardCustomizePage })),
)
const ReportsPage = lazy(() => import('@/features/reports/ReportsPage').then((m) => ({ default: m.ReportsPage })))
const SettingsPage = lazy(() => import('@/features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })))
const ExerciseHistoryPage = lazy(() =>
  import('@/features/workout/ExerciseHistoryPage').then((m) => ({ default: m.ExerciseHistoryPage })),
)
const WorkoutEditPage = lazy(() =>
  import('@/features/workout/WorkoutEditPage').then((m) => ({ default: m.WorkoutEditPage })),
)
const WorkoutModePage = lazy(() =>
  import('@/features/workout/WorkoutModePage').then((m) => ({ default: m.WorkoutModePage })),
)
const WorkoutsPage = lazy(() => import('@/features/workout/WorkoutsPage').then((m) => ({ default: m.WorkoutsPage })))

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
      <h1 className="font-display text-2xl">Carregando</h1>
    </div>
  )
}

function RouteFallback() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-bg">
      <p className="text-sm text-muted">Carregando…</p>
    </div>
  )
}

function Guard() {
  const { firebaseUser, bootstrapping, user } = useSession()
  if (!firebaseUser) return <BootScreen />
  if (bootstrapping && !user) return <BootScreen />
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
    <Suspense fallback={<RouteFallback />}>
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
    </Suspense>
  )
}
