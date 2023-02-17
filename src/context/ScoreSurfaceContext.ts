import { UrlString } from "@inrupt/solid-client"
import { createContext } from "react"

type ScoreSurfaceContextType = {
    analyses: UrlString[]
    workUrl: UrlString
    scoreIsReady: number
}

export const ScoreSurfaceContext = createContext<ScoreSurfaceContextType>({
    analyses: [],
    workUrl: '',
    scoreIsReady: 0
})
