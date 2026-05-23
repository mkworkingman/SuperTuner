import Logo from '@/components/logo'
import Link from 'next/link'

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <div>
            <header className="p-4">
                <Link href="/">
                    <Logo />
                </Link>
            </header>
            {children}
        </div>
    )
}
