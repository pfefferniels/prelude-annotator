import { E13 } from "./E13"

export const beliefValues = ['true', 'likely', 'questionable', 'false'] as const
export type BeliefValue = typeof beliefValues[number]

export interface Belief {
    url: string
    time: Date
    that: string
    holdsToBe: BeliefValue
    note: string
}

export interface Argumentation {
    url: string
    carriedOutBy: string
    concluded: Belief[]
}
