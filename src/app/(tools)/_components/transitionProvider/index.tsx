'use client'
import { ViewTransition } from 'react'
import { usePathname } from 'next/navigation'

export default function TransitionProvider({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    const pathname = usePathname()

    return (
        <ViewTransition enter="enter" exit="exit" key={pathname}>
            {children}
        </ViewTransition>
    )
}
