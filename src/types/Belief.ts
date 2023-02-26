import { UrlString } from "@inrupt/solid-client"

export const beliefValues = ['true', 'likely', 'questionable', 'false'] as const
export type BeliefValue = typeof beliefValues[number]

export interface Belief {
    url: UrlString
    time: Date
    that: UrlString
    holdsToBe: BeliefValue
    note: string
}

export interface Argumentation {
    url: string
    carriedOutBy: string
    concluded: Belief[]
    note: string
}
