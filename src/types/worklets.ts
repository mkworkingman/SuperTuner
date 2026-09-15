type WorkletName = 'beat' | 'pitch'

export type WorkletUrlMap = {
    [P in WorkletName]: [`/worklets/${P}Processor.js`, `${P}-processor`]
}

export type WorkletUrl = WorkletUrlMap[WorkletName]
