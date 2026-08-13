import { Button } from '@/components/ui/Button'

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-3xl border border-danger/30 bg-card px-5 py-8 text-center">
      <p className="text-sm text-danger">{message}</p>
      {onRetry ? (
        <Button className="mt-4" variant="secondary" onClick={onRetry}>
          Tentar de novo
        </Button>
      ) : null}
    </div>
  )
}
