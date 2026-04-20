'use client'
import { usePathname } from 'next/navigation'
import { ReactNode, useRef } from 'react'
import { TransitionRouter } from 'next-transition-router'
import { PAGE_BACKGROUNDS } from '@/consts/colors'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

export default function TransitionProvider({ children }: { children: ReactNode }) {
    const pathname = usePathname()
    const containerRef = useRef<HTMLDivElement>(null)
    const { contextSafe } = useGSAP({ scope: containerRef })

    const handleLeave = contextSafe((next: () => void, to: string = '/') => {
        const targetColor = PAGE_BACKGROUNDS[to]
        const mm = gsap.matchMedia()

        mm.add(
            {
                reduceMotion: '(prefers-reduced-motion: reduce)',
                doMotion: '(prefers-reduced-motion: no-preference)',
            },
            (context) => {
                const { reduceMotion } = context.conditions as { reduceMotion: boolean }

                if (reduceMotion) {
                    gsap.set('.backgroundElement', { backgroundColor: targetColor })
                    next()
                } else {
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
                }
            },
        )
    })

    const handleEnter = contextSafe((next: () => void) => {
        const mm = gsap.matchMedia()

        mm.add(
            {
                reduceMotion: '(prefers-reduced-motion: reduce)',
                doMotion: '(prefers-reduced-motion: no-preference)',
            },
            (context) => {
                const { reduceMotion } = context.conditions as { reduceMotion: boolean }

                if (reduceMotion) {
                    gsap.set('.childrenWrapper', { opacity: 1, y: 0 })
                    next()
                } else {
                    gsap.fromTo(
                        '.childrenWrapper',
                        { opacity: 0, y: 20 },
                        {
                            opacity: 1,
                            y: 0,
                            duration: 0.3,
                            ease: 'power2.out',
                            onComplete: next,
                        },
                    )
                }
            },
        )
    })

    return (
        <TransitionRouter
            auto
            leave={(next, from, to) => handleLeave(next, to)}
            enter={(next) => handleEnter(next)}
        >
            <div ref={containerRef}>
                <div
                    style={{
                        backgroundColor: PAGE_BACKGROUNDS[pathname],
                    }}
                    className="backgroundElement min-h-full overflow-hidden"
                >
                    <div className="childrenWrapper">{children}</div>
                </div>
            </div>
        </TransitionRouter>
    )
}
