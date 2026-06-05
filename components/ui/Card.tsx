import { cn } from '@/lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: 'none' | 'lift' | 'cyan'
}

export function Card({ hover = 'none', className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'card',
        hover === 'lift' && 'card-hover',
        hover === 'cyan' && 'card-cyan-hover',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardSection({ title, action, children, className }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('p-5 sm:p-6', className)}>
      {(title || action) && (
        <div className="section-h">
          {title && <h3 className="section-h-title">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  )
}
