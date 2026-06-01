import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
    /* config options here */
    reactCompiler: true,
    typedRoutes: true,
    experimental: {
        viewTransition: true,
    },
}

export default nextConfig
