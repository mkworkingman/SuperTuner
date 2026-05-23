import Logo from '@/components/logo'
import Link from 'next/link'

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <>
            <header className="p-4">
                <Link href="/" className="block w-fit">
                    <Logo />
                </Link>
            </header>
            {children}
        </>
    )
}
