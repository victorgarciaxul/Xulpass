import { cn } from '@/lib/utils'

const categoryColors: Record<string, string> = {
  web: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  app: 'bg-green-500/20 text-green-300 border-green-500/30',
  email: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  social: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  banking: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  server: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  other: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
}

export function Badge({ category }: { category: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', categoryColors[category] ?? categoryColors.other)}>
      {category}
    </span>
  )
}
