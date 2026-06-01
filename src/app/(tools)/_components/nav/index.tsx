'use client'
import Link from 'next/link'
import { ROUTE_CONFIG } from '@/consts'
import { usePathname } from 'next/navigation'
import Image from 'next/image'

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
                                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                                    isActive ? `${link.bgColor} pointer-events-none` : 'bg-gray-400'
                                }`}
                                aria-current={isActive ? 'page' : undefined}
                            >
                                <Image
                                    className={!isActive ? 'opacity-60' : ''}
                                    src={link.img}
                                    alt={link.label}
                                    width={24}
                                    height={24}
                                />
                                <span className="sr-only">{link.label}</span>
                            </Link>
                        </li>
                    )
                })}
            </ul>
        </nav>
    )
}
