import { Thing, asUrl, getUrlAll } from "@inrupt/solid-client"
import { crm } from "../helpers/namespaces"
import { Selection } from "../types/Selection"

export const toSelection = (thing: Thing): Selection => {
    const selectionUrl = asUrl(thing)
    const refs = getUrlAll(thing, crm('P106_is_composed_of')).map(url => url.split('#').at(-1) || '')

    return {
        url: selectionUrl,
        refs: refs
    }
}
