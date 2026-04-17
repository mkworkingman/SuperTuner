import Link from 'next/link'
import Logo from '@/components/logo'
import style from './page.module.scss'

const linkStyle = 'px-6 py-2 my-2 rounded-full relative'

export default function Home() {
    return (
        <div className="flex flex-col min-h-svh">
            <header className="flex-grow flex flex-col justify-center items-center">
                <Logo />
                <nav className="grid grid-cols-1 w-fit text-center">
                    <Link href="/tuner" className={`${linkStyle} bg-cyan-800`}>
                        Tuner
                    </Link>
                    <Link href="/tuner" className={`${linkStyle} bg-yellow-500`}>
                        Guess The Note/Interval/Chord
                    </Link>
                    <Link href="/tuner" className={`${linkStyle} bg-green-400`}>
                        Metronome
                    </Link>
                    <Link href="/tuner" className={`${linkStyle} bg-pink-800`}>
                        About
                    </Link>
                </nav>
            </header>

            <main className="sr-only">
                <h1>Welcome to SuperTuner!</h1>
            </main>

            <footer className="text-center py-2">Footer</footer>
        </div>
    )
}
