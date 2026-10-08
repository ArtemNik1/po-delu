import { lazy, Suspense, useEffect, type ReactNode } from 'react'
import { HashRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { AuthenticatedLayout } from './components/layout/AuthenticatedLayout'
import { SplashScreen } from './components/layout/SplashScreen'
import { OfflineScreen } from './components/ui/OfflineIndicator'
import { Toaster } from './components/ui/Toaster'
import { LoginPage } from './pages/LoginPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { RegisterPage } from './pages/RegisterPage'
import { useAuthStore } from './store/authStore'

const TodayPage = lazy(() => import('./pages/TodayPage').then((m) => ({ default: m.TodayPage })))
const UpcomingPage = lazy(() => import('./pages/UpcomingPage').then((m) => ({ default: m.UpcomingPage })))
const InboxPage = lazy(() => import('./pages/InboxPage').then((m) => ({ default: m.InboxPage })))
const CompletedPage = lazy(() =>
  import('./pages/CompletedPage').then((m) => ({ default: m.CompletedPage })),
)
const AnalyticsPage = lazy(() =>
  import('./pages/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage })),
)
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })))
const FocusPage = lazy(() => import('./pages/FocusPage').then((m) => ({ default: m.FocusPage })))
const OnboardingPage = lazy(() =>
  import('./pages/OnboardingPage').then((m) => ({ default: m.OnboardingPage })),
)

export function App() {
  const initialize = useAuthStore((state) => state.initialize)
  const initialized = useAuthStore((state) => state.initialized)

  useEffect(() => {
    void initialize()
  }, [initialize])

  return (
    <>
      <HashRouter>
        {initialized ? (
          <Suspense fallback={<SplashScreen />}>
            <Routes>
              <Route
                path="/login"
                element={
                  <GuestOnly>
                    <LoginPage />
                  </GuestOnly>
                }
              />
              <Route
                path="/register"
                element={
                  <GuestOnly>
                    <RegisterPage />
                  </GuestOnly>
                }
              />

              <Route element={<PrivateRoute />}>
                <Route element={<AuthenticatedLayout />}>
                  <Route path="/onboarding" element={<OnboardingPage />} />
                  <Route element={<RequireOnboarding />}>
                    <Route path="/focus/:taskId" element={<FocusPage />} />
                    <Route element={<AppShell />}>
                      <Route index element={<TodayPage />} />
                      <Route path="/upcoming" element={<UpcomingPage />} />
                      <Route path="/inbox" element={<InboxPage />} />
                      <Route path="/completed" element={<CompletedPage />} />
                      <Route path="/analytics" element={<AnalyticsPage />} />
                      <Route path="/settings" element={<SettingsPage />} />
                    </Route>
                  </Route>
                </Route>
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        ) : (
          <SplashScreen />
        )}
      </HashRouter>
      <Toaster />
    </>
  )
}

function PrivateRoute() {
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)
  const offline = useAuthStore((state) => state.offline)
  const initialized = useAuthStore((state) => state.initialized)
  const profileLoading = useAuthStore((state) => state.profileLoading)
  const location = useLocation()

  if (!initialized || (profileLoading && !user)) return <SplashScreen />
  if (!user && token && offline) return <OfflineScreen />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}

function GuestOnly({ children }: { children: ReactNode }) {
  const user = useAuthStore((state) => state.user)
  const settings = useAuthStore((state) => state.settings)
  const profileLoading = useAuthStore((state) => state.profileLoading)

  if (profileLoading) return <SplashScreen />
  if (!user) return children
  if (!settings) return <SplashScreen />
  return <Navigate to={settings.onboarding_completed ? '/' : '/onboarding'} replace />
}

function RequireOnboarding() {
  const settings = useAuthStore((state) => state.settings)

  if (!settings) return <SplashScreen />
  if (!settings.onboarding_completed) return <Navigate to="/onboarding" replace />
  return <Outlet />
}
