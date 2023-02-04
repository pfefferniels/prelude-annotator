import { Check } from "@mui/icons-material";
import { Select, MenuItem, IconButton } from "@mui/material";
import { useState } from "react";

const cordes = ['empruntee', 'finale', 'dominante', 'mediante', 'unknown'] as const
type Corde = typeof cordes[number];

export type Cadence = {
    takesPlaceOn?: Corde
}

const CadenceProperties = ({ cadence, setCadence }: { cadence: Cadence, setCadence: (newCadence: Cadence) => void }) => {
    const [place, setPlace] = useState<Corde>(cadence?.takesPlaceOn || 'unknown')

    const updateCadence = () => {
        setCadence({
            takesPlaceOn: place
        })
    }

    return (
        <div>
            takes place on:
            <Select 
                size='small'
                value={place}
                onChange={(e) => setPlace(e.target.value as Corde)}>
                {cordes.map(corde => {
                    return <MenuItem value={corde}>{corde}</MenuItem>
                })}
            </Select>

            <IconButton onClick={updateCadence}>
                <Check />
            </IconButton>
        </div>
    )
}

type ObjectType = 'cadence' | 'figure'

// could by oters too
export type Attr = Cadence

type ObjectEditorProps = {
    type: ObjectType
    object?: Attr
    setObject: (object?: Attr) => void
}

export const ObjectEditor = ({ type, object, setObject }: ObjectEditorProps) => {
    if (type === 'cadence') return <CadenceProperties cadence={object as Cadence} setCadence={c => setObject(c as Attr)} />
    else return <div>no editor defined</div>
}
