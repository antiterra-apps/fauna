export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-[var(--divider)] ${className}`} />
  )
}

export function AssetCardSkeleton() {
  return (
    <div className="w-full aspect-[4/3] bg-[var(--divider)] animate-pulse" />
  )
}
