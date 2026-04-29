import Link from 'next/link'
import Logo from '@/components/logo'
import { PAGE_BACKGROUNDS } from '@/consts/colors'
import type { Route } from 'next'

const NAV_LINKS: {
    href: Route
    label: string
}[] = [
    { href: '/tuner', label: 'Tuner' },
    { href: '/guess', label: 'Guess The Note/Interval/Chord' },
    { href: '/metronome', label: 'Metronome' },
    { href: '/about', label: 'About' },
]
const linkStyle = 'block px-6 py-2 rounded-full text-center'

export default function Home() {
    return (
        <div className="flex min-h-svh flex-col">
            <header className="flex flex-grow flex-col items-center justify-center p-4">
                <Logo />
                <nav aria-label="Main Navigation" className="mt-2">
                    <ul className="grid gap-4">
                        {NAV_LINKS.map((link) => (
                            <li key={link.href}>
                                <Link
                                    href={link.href}
                                    className={`${linkStyle} w-full`}
                                    style={{ backgroundColor: PAGE_BACKGROUNDS[link.href] }}
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
