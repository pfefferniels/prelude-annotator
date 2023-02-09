import { RDF } from "@inrupt/vocab-common-rdf";
import { E13 } from "./Workspace";

export const urlAsLabel = (url: string) => {
    if (!url.length) return ''
    if (url === RDF.type) return 'a'

    return url.split(/(#|\/)/).at(-1)
}

interface E13SummaryProps {
    e13: E13
}

/**
 * Creates a human-readable summary of an E13 Attribute Assignment.
 * For viewing only.
 */
export const E13Summary = ({ e13 }: E13SummaryProps) => {
    return (
        <div style={{ minWidth: '200px' }}>
            {(e13.property || e13.attribute) &&
                <span>{urlAsLabel(e13.property)} {urlAsLabel(e13.attribute)}</span>}
            {e13.comment && <div>Comment: {e13.comment}</div>}
        </div>
    )
}
