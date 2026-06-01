import Logo from '@/components/logo'
import Link from 'next/link'
import Title from './_components/title'
import Nav from './_components/nav'

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <div className="flex min-h-svh flex-col">
            <header className="bg-app-root flex items-center border-b p-4 shadow-xl">
                <Link href="/" className="mr-auto block w-fit">
                    <Logo />
                </Link>
                <Nav />
            </header>
            <main className="grow bg-indigo-300">
                <div className="mx-auto max-w-7xl px-4 py-8">
                    <Link href="/" className="inline">
                        ← Back Home
                    </Link>
                    <Title className="mb-4 text-3xl" />
                    {children}
                </div>
            </main>
            <footer className="bg-app-root">Footer</footer>
        </div>
    )
}
