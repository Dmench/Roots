import { cn } from '@/lib/utils'

type Variant = 'default' | 'terracotta' | 'sage' | 'sky' | 'coral' | 'amber' | 'stone'

const VARIANTS: Record<Variant, string> = {
  default:    'bg-parchment text-walnut border border-sand',
  terracotta: 'bg-terracotta-light text-terracotta-dark border border-terracotta/20',
  sage:       'bg-sage-light text-sage-dark border border-sage/20',
  sky:        'bg-sky-light text-sky border border-sky/20',
  coral:      'bg-coral-light text-coral border border-coral/20',
  amber:      'bg-amber-light text-amber border border-amber/20',
  stone:      'bg-parchment text-stone border border-stone/30',
}

export function Badge({
  children,
  variant = 'default',
  className,
}: {
  children: React.ReactNode
  variant?: Variant
  className?: string
}) {
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      VARIANTS[variant],
      className,
    )}>
      {children}
    </span>
  )
}
