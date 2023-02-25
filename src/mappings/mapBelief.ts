import { Thing, asUrl, getUrl, getDate, getStringNoLocale } from "@inrupt/solid-client"
import { DCTERMS } from "@inrupt/vocab-common-rdf"
import { crm, crminf } from "../helpers/namespaces"
import { Belief, BeliefValue } from "../types/Belief"

export const toBelief = (thing: Thing): Belief => {
    return {
        url: asUrl(thing),
        time: getDate(thing, DCTERMS.created) || new Date(),
        that: getUrl(thing, crminf('J4_that'))?.split('#').at(-1) || '',
        holdsToBe: getStringNoLocale(thing, crminf('J5_holds_to_be')) as BeliefValue,
        note: getStringNoLocale(thing, crm('P3_has_note')) || ''
    }
}
