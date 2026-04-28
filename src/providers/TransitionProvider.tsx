'use client'

import { ReactNode, useCallback, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { TransitionRouter } from 'next-transition-router'
import { PAGE_BACKGROUNDS } from '@/consts'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import type { Route } from 'next'

export default function TransitionProvider({ children }: { children: ReactNode }) {
    const pathname = usePathname()
    const containerRef = useRef<HTMLDivElement>(null)

    const { contextSafe } = useGSAP({ scope: containerRef })

    const getBackgroundColor = useCallback((path: string) => {
        return PAGE_BACKGROUNDS[path as Route] ?? PAGE_BACKGROUNDS['/']
    }, [])

    const prefersReducedMotion = () => {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    }

    const handleLeave = contextSafe((next: () => void, to: string = '/') => {
        const targetColor = getBackgroundColor(to)

        if (prefersReducedMotion()) {
            gsap.set('.backgroundElement', {
                backgroundColor: targetColor,
            })

            next()
            return
        }

        const tl = gsap.timeline({ onComplete: next })

        tl.to(
            '.backgroundElement',
            {
                backgroundColor: targetColor,
                duration: 0.3,
                ease: 'power2.inOut',
            },
            0,
        )

        tl.to(
            '.childrenWrapper',
            {
                opacity: 0,
                y: -20,
                duration: 0.3,
                ease: 'power2.in',
            },
            0,
        )
    })

    const handleEnter = contextSafe((next: () => void) => {
        if (prefersReducedMotion()) {
            gsap.set('.childrenWrapper', {
                opacity: 1,
                y: 0,
            })

            next()
            return
        }

        gsap.fromTo(
            '.childrenWrapper',
            {
                opacity: 0,
                y: 20,
            },
            {
                opacity: 1,
                y: 0,
                duration: 0.3,
                ease: 'power2.out',
                onComplete: next,
            },
        )
    })

    return (
        <TransitionRouter
            auto
            leave={(next, _from, to) => handleLeave(next, to)}
            enter={(next) => handleEnter(next)}
        >
            <div ref={containerRef}>
                <div
                    style={{
                        backgroundColor: getBackgroundColor(pathname),
                    }}
                    className="backgroundElement min-h-svh overflow-hidden"
                >
                    <div className="childrenWrapper min-h-svh">{children}</div>
                </div>
            </div>
        </TransitionRouter>
    )
}
