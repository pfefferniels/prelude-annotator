import { buildThing, createThing, saveSolidDatasetAt, setThing } from "@inrupt/solid-client";
import { useDataset, useSession } from "@inrupt/solid-ui-react";
import { RDF } from "@inrupt/vocab-common-rdf";
import { Check } from "@mui/icons-material";
import { Select, MenuItem, IconButton, Paper, InputLabel, FormControl } from "@mui/material";
import { Stack } from "@mui/system";
import { useEffect, useState } from "react";
import { v4 } from "uuid";
import { crm, nivers } from "./namespaces";

const cordes = ['CordeEmpruntee', 'Finale', 'Dominante', 'Mediante', 'unknown'] as const
type Corde = typeof cordes[number]

const cadenceType = ['CadenceParfaite', 'CadenceImparfaite', 'CadenceRompue', 'unknown'] as const
type CadenceType = typeof cadenceType[number]

export type Cadence = {
    id: string
    takesPlaceOn?: Corde
    type?: CadenceType
}

export type Attr = Cadence

const CadenceProperties = ({ cadence, setCadence }: { cadence: Cadence, setCadence: (newCadence: Cadence) => void }) => {
    const { dataset } = useDataset()
    const { session } = useSession()

    const [id, setId] = useState<string>(cadence?.id || v4())
    const [place, setPlace] = useState<Corde>(cadence?.takesPlaceOn || 'unknown')
    const [type, setType] = useState<CadenceType>(cadence?.type || 'unknown')

    const updateCadence = () => {
        setCadence({
            id,
            takesPlaceOn: place,
            type
        })

        if (!dataset) return

        const cadenceThing = buildThing(createThing({
            name: id
        }))
            .addUrl(RDF.type, crm('E28_Conceptual_Object'))
            .addUrl(RDF.type, nivers(type))
            .addUrl(nivers('takesPlaceOn'), nivers(place))
            .build()
        const modifiedDataset = setThing(dataset, cadenceThing)
        saveSolidDatasetAt('https://pfefferniels.inrupt.net/preludes/works.ttl', modifiedDataset, { fetch: session.fetch as any });
    }

    return (
        <Paper elevation={3} sx={{ padding: '0.5rem' }}>
            <Stack spacing={2}>
                <FormControl variant='standard'>
                    <InputLabel>Cadence Type</InputLabel>

                    <Select
                        label='Cadence Type'
                        value={type}
                        onChange={(e) => setType(e.target.value as CadenceType)}>
                        {cadenceType.map(type => {
                            return <MenuItem key={`item_${type}`} value={type}>{type}</MenuItem>
                        })}
                    </Select>
                </FormControl>

                <FormControl variant='standard'>
                    <InputLabel>Cadence Place</InputLabel>
                    <Select
                        value={place}
                        onChange={(e) => setPlace(e.target.value as Corde)}>
                        {cordes.map(corde => {
                            return <MenuItem key={`item_${corde}`} value={corde}>{corde}</MenuItem>
                        })}
                    </Select>
                </FormControl>
            </Stack>

            <IconButton onClick={updateCadence}>
                <Check />
            </IconButton>
        </Paper>
    )
}

type ObjectEditorProps = {
    type: 'cadence' | 'figure'
    object?: Attr
    setObject: (object?: Attr) => void
}

export const ObjectEditor = ({ type, object, setObject }: ObjectEditorProps) => {
    if (type === 'cadence') return <CadenceProperties cadence={object as Cadence} setCadence={c => setObject(c as Attr)} />
    else return <div>no editor defined</div>
}
