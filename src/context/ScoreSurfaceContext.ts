import { UrlString } from "@inrupt/solid-client"
import { createContext } from "react"
import { Argumentation } from "../types/Belief"

type ScoreSurfaceContextType = {
    workUrl: UrlString
    scoreIsReady: number
}

export const ScoreSurfaceContext = createContext<ScoreSurfaceContextType>({
    workUrl: '',
    scoreIsReady: 0
})
