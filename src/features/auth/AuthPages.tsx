import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { authService } from '@/services/authService'
import { useState, type FormEvent, type ReactNode } from 'react'

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col justify-center px-5 py-10">
      <p className="text-xs font-semibold tracking-[0.2em] text-accent uppercase">Pedro & Carol</p>
      <h1 className="mt-3 font-display text-4xl font-semibold">{title}</h1>
      <p className="mt-2 text-muted">{subtitle}</p>
      <div className="mt-8">{children}</div>
    </div>
  )
}

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authService.signIn(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível entrar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Entrar" subtitle="Continue de onde parou, na academia ou em casa.">
      <form className="space-y-4" onSubmit={onSubmit}>
        <Input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <Button type="submit" size="xl" className="w-full" disabled={loading}>
          {loading ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>
      <div className="mt-6 flex flex-col gap-3 text-sm text-muted">
        <Link to="/recuperar" className="text-ink">
          Esqueci minha senha
        </Link>
        <Link to="/cadastro">
          Criar conta
        </Link>
      </div>
    </AuthLayout>
  )
}

export function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authService.signUp(email, password, name)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar a conta.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Criar conta" subtitle="Cada pessoa tem a própria conta. Os dados nunca se misturam.">
      <form className="space-y-4" onSubmit={onSubmit}>
        <Input placeholder="Nome (ex.: Pedro)" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <Button type="submit" size="xl" className="w-full" disabled={loading}>
          {loading ? 'Criando…' : 'Criar conta'}
        </Button>
      </form>
      <p className="mt-6 text-sm text-muted">
        Já tem conta? <Link to="/login" className="text-ink">Entrar</Link>
      </p>
    </AuthLayout>
  )
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    try {
      await authService.resetPassword(email)
      setMessage('Enviamos um e-mail para redefinir sua senha.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível enviar o e-mail.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Recuperar senha" subtitle="Informe o e-mail da sua conta.">
      <form className="space-y-4" onSubmit={onSubmit}>
        <Input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        {message ? <p className="text-sm text-accent">{message}</p> : null}
        <Button type="submit" size="xl" className="w-full" disabled={loading}>
          {loading ? 'Enviando…' : 'Enviar link'}
        </Button>
      </form>
      <Link to="/login" className="mt-6 block text-sm text-muted">
        Voltar ao login
      </Link>
    </AuthLayout>
  )
}
