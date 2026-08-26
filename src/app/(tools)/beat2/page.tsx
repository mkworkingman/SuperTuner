'use client'
import { useBeatMachine } from '@/hooks/useBeatMachine'
import { CustomButton, InputRange } from '@/components/ui'
import BeatMachineGrid from '@/components/BeatMachineGrid'
import { TOOLS_CLASSNAME } from '@/consts'
import { BeatGrid } from '@/types'
import { useBeatMachine_2 } from '@/hooks/useBeatMachine_2'
import style from './style.module.scss'

export default function BeatMachine() {
    const { startAudio, stopAudio, stepIndicatorRef } = useBeatMachine_2()

    return (
        <div className={`bg-app-beat ${TOOLS_CLASSNAME}`}>
            <button onClick={startAudio}>Start</button>
            <button onClick={stopAudio}>Stop</button>
            <div ref={stepIndicatorRef} className={style.cells}>
                <div data-step="0">1</div>
                <div data-step="1">2</div>
                <div data-step="2">3</div>
                <div data-step="3">4</div>
                <div data-step="4">5</div>
                <div data-step="5">6</div>
                <div data-step="6">7</div>
                <div data-step="7">8</div>
                <div data-step="8">9</div>
                <div data-step="9">10</div>
                <div data-step="10">11</div>
                <div data-step="11">12</div>
                <div data-step="12">13</div>
                <div data-step="13">14</div>
                <div data-step="14">15</div>
                <div data-step="15">16</div>
            </div>
        </div>
    )
}
