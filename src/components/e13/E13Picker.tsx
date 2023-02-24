import { asUrl, getSolidDataset, getThing, getThingAll, getUrlAll } from "@inrupt/solid-client";
import { useSession } from "@inrupt/solid-ui-react";
import { RDF } from "@inrupt/vocab-common-rdf";
import { Button, CircularProgress, Drawer, List, ListItem, ListItemText } from "@mui/material"
import { useContext, useEffect, useState } from "react";
import { ScoreSurfaceContext } from "../../context/ScoreSurfaceContext";
import { SelectionContext } from "../../context/SelectionContext";
import { crm } from "../../helpers/namespaces";
import { toE13 } from "../../mappings/mapE13";
import { E13 } from "../../types/E13";
import { urlAsLabel } from "../../helpers/urlAsLabel";

interface E13PickerProps {
    open: boolean
    onReady: (e13?: E13) => void
}

export const E13Picker = ({ open, onReady }: E13PickerProps) => {
    const { session } = useSession()
    const { analyses } = useContext(ScoreSurfaceContext)
    const [availableE13s, setAvailableE13s] = useState<E13[]>([])
    const { highlightSelection } = useContext(SelectionContext)
    const [hovered, setHovered] = useState<E13>()
    const [loading, setLoading] = useState(false)


    useEffect(() => {
        if (!open) return

        const fetchAllE13s = async () => {
            setLoading(true)
            const e13sByAnalysis = analyses.map(async analysisUrl => {
                const dataset = await getSolidDataset(analysisUrl, { fetch: session.fetch as any })
                const things = getThingAll(dataset)
                const analysis = getThing(dataset, analysisUrl)

                return (
                    things
                        .filter(thing => {
                            // get all E13s connected to this selection
                            return (
                                analysis &&
                                getUrlAll(thing, RDF.type).includes(crm('E13_Attribute_Assignment')) &&
                                getUrlAll(analysis, crm('P3_consists_of')).includes(asUrl(thing))
                            )
                        })
                        .map(toE13)
                )
            })

            const e13s = (await Promise.all(e13sByAnalysis)).flat()
            setAvailableE13s(e13s)
            setLoading(false)
        }
        fetchAllE13s()
    }, [analyses, open])

    return (
        <Drawer anchor='right' open={open} onClose={() => onReady()}>
            {loading ?
                <CircularProgress />
                :
                <List>
                    {availableE13s.map(proposition => {
                        return (
                            <ListItem
                                selected={proposition.url === hovered?.url}
                                onClick={() => {
                                    onReady(proposition)
                                }}
                                onMouseOver={() => {
                                    setHovered(proposition)
                                    highlightSelection(proposition.target)
                                }}
                                key={`e13picker_${proposition.url}`}>
                                <ListItemText
                                    primary={`${urlAsLabel(proposition.property)} → ${typeof proposition.attribute === 'string' && urlAsLabel(proposition.attribute)}`}
                                    secondary={proposition.url} />
                            </ListItem>
                        );
                    })}
                </List>
            }
            <Button onClick={() => onReady()}>Cancel</Button>
        </Drawer>
    )
}