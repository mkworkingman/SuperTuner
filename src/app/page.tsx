import Link from 'next/link'
import Logo from '@/components/logo'
import { ROUTE_CONFIG } from '@/consts'

export default function Home() {
    return (
        <div className="bg-app-root flex min-h-svh flex-col">
            <header className="flex grow flex-col items-center justify-center p-4">
                <Logo />
                <nav aria-label="Main Navigation" className="mt-2">
                    <ul className="grid gap-4">
                        {Object.values(ROUTE_CONFIG).map((link) => (
                            <li key={link.href}>
                                <Link
                                    href={link.href}
                                    className={`block w-full rounded-full px-6 py-2 text-center ${link.bgColor}`}
                                >
                                    {link.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>
            </header>

            <main className="sr-only">
                <h2>Welcome to SuperTuner!</h2>
            </main>

            <footer className="py-2 text-center">Footer</footer>
        </div>
    )
}
