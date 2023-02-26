import { UrlString } from "@inrupt/solid-client"
import { createContext, MutableRefObject, SetStateAction, useRef } from "react"
import { Selection } from "../types/Selection"

type ScoreSurfaceContextType = {
    analyses: UrlString[]
    workUrl: UrlString
    scoreIsReady: number,

    selectionPanel: MutableRefObject<HTMLDivElement | undefined>

    activeSelection?: Selection
    setActiveSelection: (newSelection: SetStateAction<Selection | undefined>) => void

    setActiveLayer: (analysisUrl: UrlString) => void
}

export const WorkspaceContext = createContext<ScoreSurfaceContextType>({
    analyses: [],
    workUrl: '',
    scoreIsReady: 0,

    selectionPanel: { current: undefined },

    setActiveSelection: () => {},
    setActiveLayer: () => {}
})
