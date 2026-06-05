import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?:    React.ReactNode
  title:    string
  description?: string
  action?:  React.ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('empty', className)}>
      {icon && <div className="empty-icon">{icon}</div>}
      <div className="empty-title">{title}</div>
      {description && <div className="empty-desc">{description}</div>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}
