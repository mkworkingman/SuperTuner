import Link from 'next/link'
import Logo from '@/components/logo'
import { PAGE_BACKGROUNDS } from '@/consts/colors'

const NAV_LINKS = [
    { href: '/tuner', label: 'Tuner' },
    { href: '/guess', label: 'Guess The Note/Interval/Chord' },
    { href: '/metronome', label: 'Metronome' },
    { href: '/about', label: 'About' },
]
const linkStyle = 'px-6 py-2 my-2 rounded-full relative'

export default function Home() {
    return (
        <div className="flex min-h-svh flex-col">
            <header className="flex flex-grow flex-col items-center justify-center">
                <Logo />
                <nav className="grid w-fit grid-cols-1 text-center">
                    {NAV_LINKS.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={linkStyle}
                            style={{ backgroundColor: PAGE_BACKGROUNDS[link.href] }}
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>
            </header>

            <main className="sr-only">
                <h1>Welcome to SuperTuner!</h1>
            </main>

            <footer className="py-2 text-center">Footer</footer>
        </div>
    )
}
