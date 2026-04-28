'use client'
import { ReactNode, useRef, startTransition } from 'react'
import { usePathname } from 'next/navigation'
import { TransitionRouter } from 'next-transition-router'
import { PAGE_BACKGROUNDS } from '@/consts'
import gsap from 'gsap'
import type { Route } from 'next'

const getBackgroundColor = (path: string) =>
    PAGE_BACKGROUNDS[path as Route] ?? PAGE_BACKGROUNDS['/']

const prefersReducedMotion = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const handleLeave = (
    next: () => void,
    to: string = '/',
    backgroundDiv: HTMLDivElement | null,
    contentDiv: HTMLDivElement | null,
) => {
    if (!backgroundDiv || !contentDiv) {
        next()
        return
    }

    const targetColor = getBackgroundColor(to)

    if (prefersReducedMotion()) {
        gsap.set(backgroundDiv, { backgroundColor: targetColor })
        next()
        return
    }

    const tl = gsap.timeline({ onComplete: next })

    tl.to(
        backgroundDiv,
        {
            backgroundColor: targetColor,
            duration: 0.3,
            ease: 'power2.inOut',
        },
        0,
    ).to(
        contentDiv,
        {
            opacity: 0,
            y: -20,
            duration: 0.3,
            ease: 'power2.in',
        },
        0,
    )

    return () => {
        tl.kill()
    }
}

const handleEnter = (next: () => void, contentDiv: HTMLDivElement | null) => {
    if (!contentDiv) {
        next()
        return
    }

    if (prefersReducedMotion()) {
        gsap.set(contentDiv, { opacity: 1, y: 0 })
        next()
        return
    }

    const tl = gsap.timeline()

    tl.fromTo(
        contentDiv,
        { opacity: 0, y: 20 },
        {
            opacity: 1,
            y: 0,
            duration: 0.3,
            ease: 'power2.out',
        },
    ).call(() => {
        requestAnimationFrame(() => {
            startTransition(next)
        })
    })

    return () => {
        tl.kill()
    }
}

export default function TransitionProvider({ children }: { children: ReactNode }) {
    const pathname = usePathname()
    const backgroundRef = useRef<HTMLDivElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)

    return (
        <TransitionRouter
            auto
            leave={(next, _from, to) =>
                handleLeave(next, to, backgroundRef.current, contentRef.current)
            }
            enter={(next) => handleEnter(next, contentRef.current)}
        >
            <div
                ref={backgroundRef}
                style={{ backgroundColor: getBackgroundColor(pathname) }}
                className="min-h-svh overflow-hidden"
            >
                <div ref={contentRef} className="min-h-svh">
                    {children}
                </div>
            </div>
        </TransitionRouter>
    )
}
