import { AppShell } from '@/components/layout/AppShell'
import { ProfileAvatar } from '@/components/profile/ProfileAvatar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Toast } from '@/components/ui/Toast'
import { useFeedback } from '@/hooks/useFeedback'
import { useSession } from '@/hooks/useSession'
import { exportService, type ExportMode, type ExportScope } from '@/services/exportService'
import { profileService } from '@/services/profileService'
import { seedService } from '@/services/seedService'
import { weightService } from '@/services/weightService'
import {
  PROFILE_GOALS,
  PROFILE_GOAL_LABELS,
  REPORT_RANGES,
  type ImportPayload,
  type ProfileGoal,
  type ReportRange,
} from '@/types'
import {
  ACTIVITY_DAYS_OPTIONS,
  activityDaysFromMultiplier,
  activityMultiplierFromDays,
  type ActivityDays,
} from '@/utils/dietTargets'
import { monthShortLabel } from '@/utils/dates'
import { parseHeightCm, parseLocaleNumber } from '@/utils/format'
import { ChevronLeft, ChevronRight, CircleHelp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const PERIOD_RANGE_LABELS: Record<Exclude<ReportRange, 'custom'>, string> = {
  '7d': '7 dias',
  '30d': '30 dias',
  '3m': '3 meses',
  '6m': '6 meses',
  '1y': '1 ano',
}

const MONTH_INDEXES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const

export function SettingsPage() {
  const { user, activeProfile, patchActiveProfile } = useSession()
  const { message: toast, show } = useFeedback()
  const [newName, setNewName] = useState('')
  const [name, setName] = useState(activeProfile?.name ?? '')
  const [height, setHeight] = useState(activeProfile?.heightCm ? String(activeProfile.heightCm) : '')
  const [weight, setWeight] = useState('')
  const [weightGoal, setWeightGoal] = useState(activeProfile?.weightGoalKg ? String(activeProfile.weightGoalKg) : '')
  const [goal, setGoal] = useState<ProfileGoal>(activeProfile?.goal ?? 'bulking')
  const [calorieGoal, setCalorieGoal] = useState(activeProfile?.calorieGoal ?? 3500)
  const [proteinGoal, setProteinGoal] = useState(activeProfile?.proteinGoal ?? 180)
  const [carbGoal, setCarbGoal] = useState(activeProfile?.carbGoal ?? 400)
  const [fatGoal, setFatGoal] = useState(activeProfile?.fatGoal ?? 90)
  const [weekly, setWeekly] = useState(activeProfile?.weeklyWorkoutGoal ?? 4)
  const [timerMinutes, setTimerMinutes] = useState(
    activeProfile?.timerSeconds ? String(Math.round((activeProfile.timerSeconds / 60) * 2) / 2) : '2',
  )
  const [ageYears, setAgeYears] = useState(activeProfile?.ageYears ? String(activeProfile.ageYears) : '25')
  const [activityDays, setActivityDays] = useState<ActivityDays>(
    activityDaysFromMultiplier(activeProfile?.activityMultiplier),
  )
  const [activityHelpOpen, setActivityHelpOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const now = new Date()
  const [exportMode, setExportMode] = useState<ExportMode>('total')
  const [exportYear, setExportYear] = useState(now.getFullYear())
  const [exportMonth, setExportMonth] = useState(now.getMonth())
  const [exportRange, setExportRange] = useState<Exclude<ReportRange, 'custom'>>('30d')
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (!activeProfile) return
    let alive = true
    setName(activeProfile.name)
    setHeight(activeProfile.heightCm ? String(activeProfile.heightCm) : '')
    setWeightGoal(activeProfile.weightGoalKg ? String(activeProfile.weightGoalKg) : '')
    setGoal(activeProfile.goal ?? 'bulking')
    setCalorieGoal(activeProfile.calorieGoal)
    setProteinGoal(activeProfile.proteinGoal)
    setCarbGoal(activeProfile.carbGoal)
    setFatGoal(activeProfile.fatGoal)
    setWeekly(activeProfile.weeklyWorkoutGoal)
    setTimerMinutes(activeProfile.timerSeconds ? String(Math.round((activeProfile.timerSeconds / 60) * 2) / 2) : '2')
    setAgeYears(activeProfile.ageYears ? String(activeProfile.ageYears) : '25')
    setActivityDays(activityDaysFromMultiplier(activeProfile.activityMultiplier))
    setWeight('')
    weightService.list(activeProfile.id).then((items) => {
      if (!alive) return
      setWeight(items[0] ? String(items[0].weight) : '')
    })
    return () => {
      alive = false
    }
  }, [
    activeProfile?.id,
    activeProfile?.calorieGoal,
    activeProfile?.proteinGoal,
    activeProfile?.carbGoal,
    activeProfile?.fatGoal,
  ])

  async function saveGoals() {
    if (!activeProfile || !user) return
    try {
      const parsedHeight = parseHeightCm(height)
      if (height.trim() && parsedHeight == null) throw new Error('Altura inválida. Use cm (ex.: 186) ou metros (ex.: 1,86).')
      const parsedWeight = parseLocaleNumber(weight)
      const parsedGoal = parseLocaleNumber(weightGoal)
      const parsedTimer = parseLocaleNumber(timerMinutes)
      const parsedAge = parseLocaleNumber(ageYears)
      const patch = {
        name: name.trim(),
        heightCm: parsedHeight,
        weightGoalKg: parsedGoal != null && parsedGoal > 0 ? parsedGoal : null,
        goal,
        calorieGoal,
        proteinGoal,
        carbGoal,
        fatGoal,
        weeklyWorkoutGoal: weekly,
        timerSeconds: parsedTimer != null && parsedTimer > 0 ? Math.round(parsedTimer * 60) : 120,
        ageYears: parsedAge != null && parsedAge > 0 ? Math.round(parsedAge) : 25,
        activityMultiplier: activityMultiplierFromDays(activityDays),
      }
      await profileService.updateProfile(activeProfile.id, patch, user.id)
      if (parsedWeight != null && parsedWeight > 0) {
        await weightService.logOrUpdateToday({ user, profile: activeProfile, weight: parsedWeight })
      }
      patchActiveProfile(patch)
      show()
      setMessage('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar.')
    }
  }

  async function createProfile() {
    if (!user || !newName.trim()) return
    try {
      await profileService.createProfile(user, newName.trim())
      setNewName('')
      setError('')
      setMessage('Perfil criado. Troque em Quem vai treinar.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar o perfil.')
    }
  }

  async function importFile(file: File) {
    if (!activeProfile) return
    const text = await file.text()
    const payload = JSON.parse(text) as ImportPayload
    await seedService.importPayload(activeProfile.id, activeProfile.householdId, payload)
    setMessage('Importação concluída.')
  }

  function buildExportScope(): ExportScope {
    if (exportMode === 'month') return { mode: 'month', year: exportYear, monthIndex: exportMonth }
    if (exportMode === 'period') return { mode: 'period', range: exportRange }
    return { mode: 'total' }
  }

  async function exportData() {
    if (!activeProfile) return
    setExporting(true)
    setError('')
    try {
      const scope = buildExportScope()
      const payload = await exportService.build(activeProfile, scope)
      exportService.download(payload, exportService.filename(activeProfile, scope))
      setMessage('Arquivo JSON baixado com os dados do perfil.')
      show()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível exportar.')
    } finally {
      setExporting(false)
    }
  }

  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()
  const canGoNextExportYear = exportYear < currentYear

  return (
    <AppShell title="Perfil">
      <Toast message={toast} />
      <Card>
        <p className="text-sm text-muted">Quem está usando</p>
        <div className="mt-3 flex items-center gap-3">
          {activeProfile ? <ProfileAvatar profile={activeProfile} size="md" /> : null}
          <div>
            <p className="text-lg font-semibold">{activeProfile?.name}</p>
            <p className="text-sm text-muted">Toque na foto no topo para trocar de perfil.</p>
          </div>
        </div>
        <Link to="/quem" className="mt-4 block">
          <Button className="w-full" variant="secondary">
            Trocar perfil
          </Button>
        </Link>
        <Link to="/painel" className="mt-2 block">
          <Button className="w-full" variant="secondary">
            Personalizar painel
          </Button>
        </Link>
      </Card>

      <Card className="mt-4">
        <h2 className="font-display text-lg">Dados e metas</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-muted">
            Nome
            <Input className="mt-1" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="text-sm text-muted">
            Objetivo
            <Select className="mt-1" value={goal} onChange={(e) => setGoal(e.target.value as ProfileGoal)}>
              {PROFILE_GOALS.map((item) => (
                <option key={item} value={item}>
                  {PROFILE_GOAL_LABELS[item]}
                </option>
              ))}
            </Select>
          </label>
          <label className="text-sm text-muted">
            Idade
            <Input className="mt-1" type="number" value={ageYears} onChange={(e) => setAgeYears(e.target.value)} />
          </label>
          <label className="text-sm text-muted">
            Altura (cm)
            <Input className="mt-1" inputMode="decimal" value={height} onChange={(e) => setHeight(e.target.value)} />
          </label>
          <label className="text-sm text-muted">
            Peso atual (kg)
            <Input className="mt-1" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} />
          </label>
          <label className="text-sm text-muted">
            Meta de peso (kg)
            <Input className="mt-1" inputMode="decimal" value={weightGoal} onChange={(e) => setWeightGoal(e.target.value)} />
          </label>
          <div>
            <div className="flex items-center gap-2 text-sm text-muted">
              <span>Academia por semana</span>
              <button
                type="button"
                className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-card2 text-accent"
                aria-label="O que é academia por semana?"
                onClick={() => setActivityHelpOpen(true)}
              >
                <CircleHelp size={14} strokeWidth={2.2} />
              </button>
            </div>
            <Select
              className="mt-1"
              value={String(activityDays)}
              onChange={(e) => setActivityDays(Number(e.target.value) as ActivityDays)}
            >
              {ACTIVITY_DAYS_OPTIONS.map((days) => (
                <option key={days} value={days}>
                  {days} {days === 1 ? 'dia' : 'dias'}
                </option>
              ))}
            </Select>
          </div>
          <label className="text-sm text-muted">
            Treinos/semana
            <Input type="number" className="mt-1" value={weekly} onChange={(e) => setWeekly(Number(e.target.value))} />
          </label>
          <label className="text-sm text-muted">
            Timer (minutos)
            <Input className="mt-1" inputMode="decimal" value={timerMinutes} onChange={(e) => setTimerMinutes(e.target.value)} />
          </label>
          <label className="text-sm text-muted">
            Calorias
            <Input type="number" className="mt-1" value={calorieGoal} onChange={(e) => setCalorieGoal(Number(e.target.value))} />
          </label>
          <label className="text-sm text-muted">
            Proteína (g)
            <Input type="number" className="mt-1" value={proteinGoal} onChange={(e) => setProteinGoal(Number(e.target.value))} />
          </label>
          <label className="text-sm text-muted">
            Carboidrato (g)
            <Input type="number" className="mt-1" value={carbGoal} onChange={(e) => setCarbGoal(Number(e.target.value))} />
          </label>
          <label className="text-sm text-muted">
            Gordura (g)
            <Input type="number" className="mt-1" value={fatGoal} onChange={(e) => setFatGoal(Number(e.target.value))} />
          </label>
        </div>
        <p className="mt-3 text-xs text-muted">
          O peso atual vira o registro de hoje. A meta de peso fica salva no perfil.
        </p>
        <Button className="mt-4 w-full" onClick={() => void saveGoals()}>
          Salvar perfil
        </Button>
      </Card>

      <Card className="mt-4">
        <h2 className="font-display text-lg">Perfis neste aparelho</h2>
        <p className="mt-2 text-sm text-muted">
          Pedro, Carol, Luiz e Convidado já vêm prontos. Luiz começa com os treinos e a dieta do Pedro, mas o progresso é separado.
        </p>
        <Input className="mt-3" placeholder="Outro nome de perfil" value={newName} onChange={(e) => setNewName(e.target.value)} />
        <Button className="mt-3 w-full" variant="secondary" onClick={() => void createProfile()}>
          Adicionar perfil
        </Button>
      </Card>

      <Card className="mt-4">
        <h2 className="font-display text-lg">Exportar dados</h2>
        <p className="mt-2 text-sm text-muted">
          Baixa um JSON com dieta, treinos, histórico, calorias, peso e o restante deste perfil. Escolha o
          recorte do histórico.
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {(
            [
              { id: 'month' as const, label: 'Mês' },
              { id: 'period' as const, label: 'Período' },
              { id: 'total' as const, label: 'Total' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setExportMode(item.id)}
              className={`rounded-2xl px-3 py-2.5 text-sm font-semibold ${
                exportMode === item.id ? 'bg-accent text-bg' : 'bg-card2 text-muted'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {exportMode === 'month' ? (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                aria-label="Ano anterior"
                className="rounded-xl bg-card2 p-2 text-ink"
                onClick={() => {
                  const next = exportYear - 1
                  setExportYear(next)
                }}
              >
                <ChevronLeft size={18} />
              </button>
              <p className="font-display text-lg">{exportYear}</p>
              <button
                type="button"
                aria-label="Próximo ano"
                disabled={!canGoNextExportYear}
                className="rounded-xl bg-card2 p-2 text-ink disabled:cursor-not-allowed disabled:opacity-40"
                onClick={() => {
                  const next = exportYear + 1
                  if (next > currentYear) return
                  setExportYear(next)
                  if (next === currentYear && exportMonth > currentMonth) setExportMonth(currentMonth)
                }}
              >
                <ChevronRight size={18} />
              </button>
            </div>
            <div className="no-scrollbar flex gap-2 overflow-x-auto">
              {MONTH_INDEXES.map((index) => {
                const disabled = exportYear === currentYear && index > currentMonth
                return (
                  <button
                    key={index}
                    type="button"
                    disabled={disabled}
                    onClick={() => setExportMonth(index)}
                    className={`shrink-0 rounded-full px-4 py-2 text-sm capitalize disabled:cursor-not-allowed disabled:opacity-35 ${
                      exportMonth === index ? 'bg-accent text-bg' : 'bg-card2 text-muted'
                    }`}
                  >
                    {monthShortLabel(index)}
                  </button>
                )
              })}
            </div>
          </div>
        ) : null}

        {exportMode === 'period' ? (
          <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto">
            {REPORT_RANGES.filter((r): r is Exclude<ReportRange, 'custom'> => r !== 'custom').map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setExportRange(r)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm ${
                  exportRange === r ? 'bg-accent text-bg' : 'bg-card2 text-muted'
                }`}
              >
                {PERIOD_RANGE_LABELS[r]}
              </button>
            ))}
          </div>
        ) : null}

        {exportMode === 'total' ? (
          <p className="mt-4 text-sm text-muted">Inclui todo o histórico deste perfil, sem limite de data.</p>
        ) : null}

        <p className="mt-3 text-xs text-muted">
          Treinos e dieta cadastrados entram sempre. O filtro vale para sessões, séries, calorias, peso e
          medidas.
        </p>
        <Button className="mt-4 w-full" disabled={exporting || !activeProfile} onClick={() => void exportData()}>
          {exporting ? 'Exportando…' : 'Baixar JSON'}
        </Button>
      </Card>

      <Card className="mt-4">
        <h2 className="font-display text-lg">Importar treinos e dietas</h2>
        <p className="mt-2 text-sm text-muted">
          Use um JSON no formato do arquivo <code>public/import-example.json</code>. Isso substitui os placeholders quando você enviar os dados reais.
        </p>
        <input
          className="mt-3 block w-full text-sm"
          type="file"
          accept="application/json"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void importFile(file)
          }}
        />
      </Card>

      {message ? <p className="mt-4 text-sm text-accent">{message}</p> : null}
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}

      <Modal open={activityHelpOpen} onClose={() => setActivityHelpOpen(false)} title="Academia por semana">
        <div className="space-y-3 text-sm text-muted">
          <p>
            É quantos dias por semana você treina na academia. O app usa isso para estimar quanto você gasta de energia no dia.
          </p>
          <p>
            Quanto mais dias, maior a sugestão de calorias. Isso não muda a meta que você digitou em Calorias — só a estimativa da fórmula.
          </p>
          <p>
            Exemplo: 4 dias é o padrão. 1 dia = bem leve; 6–7 dias = bem ativo.
          </p>
        </div>
        <Button className="mt-5 w-full" onClick={() => setActivityHelpOpen(false)}>
          Entendi
        </Button>
      </Modal>

      <p className="mt-8 text-center text-sm text-muted">
        <Link to="/login" className="text-muted underline">
          Conta com e-mail (opcional)
        </Link>
      </p>
    </AppShell>
  )
}
