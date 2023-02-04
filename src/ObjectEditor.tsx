import { Check } from "@mui/icons-material";
import { Select, MenuItem, IconButton, Dialog, DialogTitle, DialogContent, Button, DialogActions } from "@mui/material";
import { useState } from "react";

const cordes = ['empruntee', 'finale', 'dominante', 'mediante'] as const
type Corde = typeof cordes[number];

export type Cadence = {
    takesPlaceOn?: Corde
}

const CadenceProperties = ({ cadence, setCadence }: { cadence: Cadence, setCadence: (newCadence: Cadence) => void }) => {
    const [place, setPlace] = useState<Corde | undefined>(cadence?.takesPlaceOn)

    const updateCadence = () => {
        setCadence({
            takesPlaceOn: place
        })
    }

    return (
        <div>
            takes place on:
            <Select value={place} onChange={(e) => setPlace(e.target.value as Corde)}>
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
export type Object = Cadence

type ObjectEditorProps = {
    type: ObjectType
    object?: Object
    setObject: (object?: Object) => void
}

export const ObjectEditor = ({ type, object, setObject }: ObjectEditorProps) => {
    if (type === 'cadence') return <CadenceProperties cadence={object as Cadence} setCadence={c => setObject(c as Object)} />
    else return <div>no editor defined</div>
}
