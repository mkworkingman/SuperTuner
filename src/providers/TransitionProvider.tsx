'use client'
import { usePathname } from 'next/navigation'
import { ReactNode, useRef } from 'react'
import { TransitionRouter } from 'next-transition-router'
import { PAGE_BACKGROUNDS } from '@/consts/colors'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

export default function TransitionProvider({ children }: { children: ReactNode }) {
    const pathname = usePathname()
    const bgRef = useRef<HTMLDivElement>(null)
    const childrenWrapperRef = useRef<HTMLDivElement>(null)
    const { contextSafe } = useGSAP({ scope: bgRef })

    const handleLeave = contextSafe((next: () => void, to: string = '/') => {
        const targetColor = PAGE_BACKGROUNDS[to]

        const tl = gsap.timeline({
            onComplete: next,
        })

        tl.to(
            bgRef.current,
            {
                backgroundColor: targetColor,
                duration: 0.3,
                ease: 'power2.inOut',
            },
            0,
        )

        tl.to(
            childrenWrapperRef.current,
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
        gsap.fromTo(
            childrenWrapperRef.current,
            { opacity: 0, y: 20 },
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
            leave={(next, from, to) => handleLeave(next, to)}
            enter={(next) => handleEnter(next)}
        >
            <div
                ref={bgRef}
                style={{
                    backgroundColor: PAGE_BACKGROUNDS[pathname],
                }}
                className="min-h-full overflow-hidden"
            >
                <div ref={childrenWrapperRef}>{children}</div>
            </div>
        </TransitionRouter>
    )
}
