import { TOOLS_CLASSNAME } from '@/consts'
import Link from 'next/link'

export default function Guess() {
    return (
        <div className={`bg-app-guess ${TOOLS_CLASSNAME}`}>
            <Link href="/">Back</Link>
            <h1>Guess</h1>
        </div>
    )
}
