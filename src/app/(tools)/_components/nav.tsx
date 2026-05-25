'use client'
import Link from 'next/link'
import { ROUTE_CONFIG } from '@/consts'
import { usePathname } from 'next/navigation'

export default function Nav() {
    const pathname = usePathname()

    return (
        <nav>
            <ul className="flex gap-4">
                {Object.values(ROUTE_CONFIG).map((link) => {
                    const isActive = pathname === link.href

                    return (
                        <li key={link.href}>
                            <Link
                                href={link.href}
                                className={`block h-8 w-8 rounded-full ${
                                    isActive ? `${link.bgColor}` : 'bg-gray-400'
                                }`}
                                aria-current={isActive ? 'page' : undefined}
                            >
                                <span className="sr-only">{link.label}</span>
                            </Link>
                        </li>
                    )
                })}
            </ul>
        </nav>
    )
}
