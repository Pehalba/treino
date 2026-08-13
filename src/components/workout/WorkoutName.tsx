import { parseWorkoutLabel, WORKOUT_VARIANT_COLORS } from '@/utils/workoutLabel'
import { cn } from '@/utils/cn'

function iconUrl(file: string): string {
  const base = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`
  return `${base}workout-icons/${file}`
}

export function WorkoutName({
  name,
  className,
  iconClassName,
}: {
  name: string
  className?: string
  iconClassName?: string
}) {
  const { group, variant } = parseWorkoutLabel(name)
  const color = variant ? WORKOUT_VARIANT_COLORS[variant] : undefined
  const file = group === 'upper' ? 'upper.png' : group === 'lower' ? 'lower.png' : null

  return (
    <span className={cn('inline-flex items-center gap-2 bg-transparent', className)} style={color ? { color } : undefined}>
      {file ? (
        <span
          aria-hidden
          className={cn('inline-block h-8 w-8 shrink-0 bg-current', iconClassName)}
          style={{
            backgroundColor: color ?? 'currentColor',
            WebkitMaskImage: `url(${iconUrl(file)})`,
            WebkitMaskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
            WebkitMaskSize: 'contain',
            maskImage: `url(${iconUrl(file)})`,
            maskRepeat: 'no-repeat',
            maskPosition: 'center',
            maskSize: 'contain',
          }}
        />
      ) : null}
      <span className="bg-transparent">{name}</span>
    </span>
  )
}
