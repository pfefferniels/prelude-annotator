import { asUrl, getStringNoLocale, getUrl, Thing } from "@inrupt/solid-client"
import { crm } from "../helpers/namespaces"
import { Argumentation, Belief } from "../types/Belief"

export const toArgumentation = (argumentationThing: Thing, conclusions: Belief[]): Argumentation => {
    return {
        url: asUrl(argumentationThing),
        carriedOutBy: getUrl(argumentationThing, crm('P14_carried_out_by')) || '',
        concluded: conclusions,
        note: getStringNoLocale(argumentationThing, crm('P3_has_note')) || ''
    }
}
