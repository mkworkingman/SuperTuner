import type { Route } from 'next'

type RouteItem = {
    href: Route
    label: string
    bgColor: string
    img: string
}

type RouteConfigType = Record<string, RouteItem>

export const ROUTE_CONFIG: RouteConfigType = {
    tuner: { href: '/tuner', label: 'Tuner', bgColor: 'bg-app-tuner', img: '/images/tuner.svg' },
    guess: {
        href: '/guess',
        label: 'Guess The Note/Interval/Chord',
        bgColor: 'bg-app-guess',
        img: '/images/guess.svg',
    },
    metronome: {
        href: '/metronome',
        label: 'Metronome',
        bgColor: 'bg-app-metronome',
        img: '/images/metronome.svg',
    },
    beat: { href: '/beat', label: 'Beat Machine', bgColor: 'bg-app-beat', img: '/images/beat.svg' },
    about: { href: '/about', label: 'About', bgColor: 'bg-app-about', img: '/images/about.svg' },
}
