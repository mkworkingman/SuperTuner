import type { Route } from 'next'

type RouteItem = {
    href: Route
    label: string
    bgColor: string
}

type RouteConfigType = Record<string, RouteItem>

export const ROUTE_CONFIG: RouteConfigType = {
    tuner: { href: '/tuner', label: 'Tuner', bgColor: 'bg-app-tuner' },
    guess: { href: '/guess', label: 'Guess The Note/Interval/Chord', bgColor: 'bg-app-guess' },
    metronome: { href: '/metronome', label: 'Metronome', bgColor: 'bg-app-metronome' },
    beat: { href: '/beat', label: 'Beat Machine', bgColor: 'bg-app-beat' },
    about: { href: '/about', label: 'About', bgColor: 'bg-app-about' },
}
