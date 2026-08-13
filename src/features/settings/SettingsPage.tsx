import { AppShell } from '@/components/layout/AppShell'
import { ProfileAvatar } from '@/components/profile/ProfileAvatar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Toast } from '@/components/ui/Toast'
import { useFeedback } from '@/hooks/useFeedback'
import { useSession } from '@/hooks/useSession'
import { profileService } from '@/services/profileService'
import { seedService } from '@/services/seedService'
import { weightService } from '@/services/weightService'
import { PROFILE_GOALS, PROFILE_GOAL_LABELS, type ImportPayload, type ProfileGoal } from '@/types'
import { parseHeightCm, parseLocaleNumber } from '@/utils/format'
import { clearBootCache } from '@/utils/localSession'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

export function SettingsPage() {
  const { user, activeProfile, patchActiveProfile } = useSession()
  const { message: toast, show } = useFeedback()
  const [invite, setInvite] = useState('')
  const [joinCode, setJoinCode] = useState('')
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
  const [activity, setActivity] = useState(activeProfile?.activityMultiplier ? String(activeProfile.activityMultiplier) : '1,5')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    profileService.getHousehold(user.householdId).then((h) => {
      if (h) setInvite(h.inviteCode)
    })
  }, [user?.householdId])

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
    setActivity(activeProfile.activityMultiplier ? String(activeProfile.activityMultiplier).replace('.', ',') : '1,5')
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
      const parsedActivity = parseLocaleNumber(activity)
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
        activityMultiplier: parsedActivity != null && parsedActivity > 0 ? parsedActivity : 1.5,
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
    await profileService.createProfile(user, newName.trim())
    setNewName('')
    setMessage('Perfil criado. Troque em Quem vai treinar.')
  }

  async function copyInvite() {
    if (!invite) return
    try {
      await navigator.clipboard.writeText(invite)
      show('Código copiado')
    } catch {
      setMessage(`Código: ${invite}`)
    }
  }

  async function join() {
    if (!user) return
    setError('')
    try {
      await profileService.joinHousehold(user.id, joinCode)
      clearBootCache()
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Código inválido.')
    }
  }

  async function importFile(file: File) {
    if (!activeProfile) return
    const text = await file.text()
    const payload = JSON.parse(text) as ImportPayload
    await seedService.importPayload(activeProfile.id, activeProfile.householdId, payload)
    setMessage('Importação concluída.')
  }

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
        <h2 className="font-display text-lg">Mesmos dados no PC e no celular</h2>
        <p className="mt-2 text-sm text-muted">
          Cada aparelho começa sozinho. Para o PC ver altura, peso e metas que você salvou no celular, copie o código
          abaixo e cole em Quem vai treinar no outro aparelho.
        </p>
        <p className="mt-3 font-display text-2xl tracking-[0.2em]">{invite || '…'}</p>
        <Button className="mt-3 w-full" variant="secondary" disabled={!invite} onClick={() => void copyInvite()}>
          Copiar código
        </Button>
        <Input className="mt-4" placeholder="Código de outro aparelho" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} />
        <Button className="mt-3 w-full" variant="secondary" onClick={() => void join()}>
          Entrar no grupo
        </Button>
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
          <label className="text-sm text-muted">
            Atividade (1,5 = academia 4x)
            <Input className="mt-1" inputMode="decimal" value={activity} onChange={(e) => setActivity(e.target.value)} />
          </label>
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
          Pedro, Carol e Convidado já vêm prontos. O convidado usa o mesmo treino do Pedro, com progresso separado.
        </p>
        <Input className="mt-3" placeholder="Outro nome de perfil" value={newName} onChange={(e) => setNewName(e.target.value)} />
        <Button className="mt-3 w-full" variant="secondary" onClick={() => void createProfile()}>
          Adicionar perfil
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

      <p className="mt-8 text-center text-sm text-muted">
        <Link to="/login" className="text-muted underline">
          Conta com e-mail (opcional)
        </Link>
      </p>
    </AppShell>
  )
}
