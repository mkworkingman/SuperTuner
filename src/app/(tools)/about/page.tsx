import { TOOLS_CLASSNAME } from '@/consts'
import Link from 'next/link'

export default function About() {
    return (
        <div className={`bg-app-about ${TOOLS_CLASSNAME}`}>
            <Link href="/">Back</Link>
            <h1>About</h1>
        </div>
    )
}
