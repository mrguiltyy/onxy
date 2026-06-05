import { cn } from '@/lib/utils'

interface AvatarProps {
  name:    string
  size?:   'sm' | 'md' | 'lg'
  color?:  string
  className?: string
}

const palette = ['#ff3a00', '#ff5b75', '#5fcb88', '#ffae50', '#ff5fb2', '#34d399', '#5b8def', '#ff7a4d']

export function Avatar({ name, size = 'md', color, className }: AvatarProps) {
  // Deterministic colour from name
  const c = color ?? palette[name.charCodeAt(0) % palette.length]

  return (
    <span
      className={cn('avatar', `avatar-${size}`, className)}
      style={{ background: `linear-gradient(135deg, ${c}, ${c}aa)` }}
    >
      {name[0]?.toUpperCase() ?? '?'}
    </span>
  )
}
