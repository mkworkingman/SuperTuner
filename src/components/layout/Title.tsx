'use client'
import { ROUTE_CONFIG } from '@/consts'
import { usePathname } from 'next/navigation'

export default function Title({ className }: { className?: string }) {
    const pathname = usePathname()
    const title = ROUTE_CONFIG[pathname.slice(1)]?.label

    if (title) return <p className={className}>{title}</p>
    return null
}
