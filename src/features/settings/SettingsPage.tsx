import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { useSession } from '@/hooks/useSession'
import { profileService } from '@/services/profileService'
import { seedService } from '@/services/seedService'
import type { ImportPayload } from '@/types'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

export function SettingsPage() {
  const { user, activeProfile, profiles } = useSession()
  const [invite, setInvite] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [newName, setNewName] = useState('')
  const [calorieGoal, setCalorieGoal] = useState(activeProfile?.calorieGoal ?? 3500)
  const [proteinGoal, setProteinGoal] = useState(activeProfile?.proteinGoal ?? 180)
  const [carbGoal, setCarbGoal] = useState(activeProfile?.carbGoal ?? 400)
  const [fatGoal, setFatGoal] = useState(activeProfile?.fatGoal ?? 90)
  const [weekly, setWeekly] = useState(activeProfile?.weeklyWorkoutGoal ?? 4)
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
    setCalorieGoal(activeProfile.calorieGoal)
    setProteinGoal(activeProfile.proteinGoal)
    setCarbGoal(activeProfile.carbGoal)
    setFatGoal(activeProfile.fatGoal)
    setWeekly(activeProfile.weeklyWorkoutGoal)
  }, [activeProfile?.id])

  async function saveGoals() {
    if (!activeProfile) return
    await profileService.updateGoals(activeProfile.id, {
      calorieGoal,
      proteinGoal,
      carbGoal,
      fatGoal,
      weeklyWorkoutGoal: weekly,
    })
    setMessage('Metas salvas neste perfil.')
  }

  async function createProfile() {
    if (!user || !newName.trim()) return
    await profileService.createProfile(user, newName.trim())
    setNewName('')
    setMessage('Perfil criado. Use o seletor no topo para trocar.')
  }

  async function join() {
    if (!user) return
    setError('')
    try {
      await profileService.joinHousehold(user.id, joinCode)
      setMessage('Você entrou no grupo. Recarregue se os perfis não aparecerem.')
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
      <Card>
        <p className="text-sm text-muted">Quem está usando</p>
        <p className="text-lg font-semibold">{activeProfile?.name}</p>
        <p className="mt-1 text-sm text-muted">Troque no topo: {profiles.map((p) => p.name).join(' · ') || '—'}</p>
      </Card>

      <Card className="mt-4">
        <h2 className="font-display text-lg">Metas do perfil ativo</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-muted">
            Treinos/semana
            <Input type="number" className="mt-1" value={weekly} onChange={(e) => setWeekly(Number(e.target.value))} />
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
        <Button className="mt-4 w-full" onClick={() => void saveGoals()}>
          Salvar metas
        </Button>
      </Card>

      <Card className="mt-4">
        <h2 className="font-display text-lg">Perfis neste aparelho</h2>
        <p className="mt-2 text-sm text-muted">
          Pedro e Carol já vêm prontos. Não precisa entrar com e-mail. Os dados de cada um ficam separados.
        </p>
        <Input className="mt-3" placeholder="Outro nome de perfil" value={newName} onChange={(e) => setNewName(e.target.value)} />
        <Button className="mt-3 w-full" variant="secondary" onClick={() => void createProfile()}>
          Adicionar perfil
        </Button>
        <p className="mt-4 text-sm text-muted">Código do grupo (outro aparelho): {invite || '…'}</p>
        <Input className="mt-2" placeholder="Entrar com código" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} />
        <Button className="mt-3 w-full" variant="secondary" onClick={() => void join()}>
          Entrar no grupo
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
