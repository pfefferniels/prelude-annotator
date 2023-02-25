import { Thing, asUrl, getUrl, getStringNoLocale } from "@inrupt/solid-client"
import { crm } from "../helpers/namespaces"
import { E13 } from "../types/E13"
import { Selection } from "../types/Selection"

export const toE13 = (thing: Thing, assignedSelection?: Selection): E13 => {
    return ({
        url: asUrl(thing),
        treatise: getUrl(thing, crm('P33_used_specific_technique')) || '',
        property: getUrl(thing, crm('P177_assigned_property_of_type')) || '',
        attribute: assignedSelection || getUrl(thing, crm('P141_assigned')) || '',
        target: getUrl(thing, crm('P140_assigned_attribute_to')) || '',
        comment: getStringNoLocale(thing, crm('P3_has_note')) || '',
    })
}
