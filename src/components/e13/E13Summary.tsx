import { E13 } from "../../types/E13";
import { urlAsLabel } from '../../helpers/urlAsLabel'

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
                <span>{urlAsLabel(e13.property)} {urlAsLabel(typeof e13.attribute === 'string' ? e13.attribute : e13.attribute.url)}</span>}
            {e13.comment && <div>Comment: {e13.comment}</div>}
        </div>
    )
}
