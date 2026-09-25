import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { DeviceStage } from './components/DeviceStage'
import { useAppState } from './state/AppState'
import { OnboardingPage } from './pages/OnboardingPage'
import { HomePage } from './pages/HomePage'
import { JourneyPage } from './pages/JourneyPage'
import { PracticePage } from './pages/PracticePage'
import { ProgressPage } from './pages/ProgressPage'
import { StashPage } from './pages/StashPage'
import { JournalPage } from './pages/JournalPage'
import { LyricsPage } from './pages/LyricsPage'
import { SessionPage } from './pages/SessionPage'
import { ClearPage } from './pages/ClearPage'
import { ScriptSessionPage } from './pages/ScriptSessionPage'
import { ScriptClearPage } from './pages/ScriptClearPage'
import { WritingChartPage } from './pages/WritingChartPage'
import { ScriptSetPage } from './pages/ScriptSetPage'

function ShellRoutes() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/journey" element={<JourneyPage />} />
        <Route path="/practice" element={<PracticePage />} />
        <Route path="/progress" element={<ProgressPage />} />
        <Route path="/stash" element={<StashPage />} />
        <Route path="/journal" element={<JournalPage />} />
        <Route path="/lyrics" element={<LyricsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  )
}

function Gate({
  onboarded,
  children,
}: {
  onboarded: boolean
  children: ReactNode
}) {
  if (!onboarded) return <Navigate to="/welcome" replace />
  return children
}

export default function App() {
  const { onboarded, ready } = useAppState()

  if (!ready) {
    return (
      <DeviceStage>
        <div className="atmosphere-grid flex min-h-full flex-1 items-center justify-center p-6">
          <p className="font-display text-xl font-bold">Warming up Mandarina…</p>
        </div>
      </DeviceStage>
    )
  }

  return (
    <DeviceStage>
      <Routes>
        <Route
          path="/welcome"
          element={
            onboarded ? (
              <Navigate to="/" replace />
            ) : (
              <AppShell hideNav>
                <OnboardingPage />
              </AppShell>
            )
          }
        />
        <Route
          path="/session"
          element={
            <Gate onboarded={onboarded}>
              <AppShell hideNav>
                <SessionPage />
              </AppShell>
            </Gate>
          }
        />
        <Route
          path="/clear"
          element={
            <Gate onboarded={onboarded}>
              <AppShell hideNav>
                <ClearPage />
              </AppShell>
            </Gate>
          }
        />
        <Route
          path="/script-set"
          element={
            <Gate onboarded={onboarded}>
              <AppShell hideNav>
                <ScriptSetPage />
              </AppShell>
            </Gate>
          }
        />
        <Route
          path="/script"
          element={
            <Gate onboarded={onboarded}>
              <AppShell hideNav>
                <ScriptSessionPage />
              </AppShell>
            </Gate>
          }
        />
        <Route
          path="/chart"
          element={
            <Gate onboarded={onboarded}>
              <AppShell hideNav>
                <WritingChartPage />
              </AppShell>
            </Gate>
          }
        />
        <Route
          path="/script-clear"
          element={
            <Gate onboarded={onboarded}>
              <AppShell hideNav>
                <ScriptClearPage />
              </AppShell>
            </Gate>
          }
        />
        <Route
          path="/*"
          element={
            onboarded ? <ShellRoutes /> : <Navigate to="/welcome" replace />
          }
        />
      </Routes>
    </DeviceStage>
  )
}
