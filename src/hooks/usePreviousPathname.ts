'use client'

import { usePathname } from 'next/navigation'
import { useState } from 'react'

export function usePreviousPathname() {
    const pathname = usePathname()

    const [currentPathname, setCurrentPathname] = useState<string>(pathname)
    const [prevPathname, setPrevPathname] = useState<string | null>(null)

    if (pathname !== currentPathname) {
        setPrevPathname(currentPathname)
        setCurrentPathname(pathname)
    }

    return prevPathname
}
