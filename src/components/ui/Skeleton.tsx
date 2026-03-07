interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`bg-navy-700 rounded animate-pulse ${className}`}
    />
  )
}
