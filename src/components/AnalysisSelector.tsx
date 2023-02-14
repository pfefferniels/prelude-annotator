import { asUrl, buildThing, createSolidDataset, createThing, getPodOwner, getPodUrlAll, getSolidDataset, getThingAll, getUrl, getUrlAll, saveSolidDatasetAt, setThing, UrlString } from "@inrupt/solid-client";
import { useSession } from "@inrupt/solid-ui-react";
import { RDF } from "@inrupt/vocab-common-rdf";
import { Button, Checkbox, Divider, Drawer, FormControl, InputLabel, List, ListItem, ListItemText, MenuItem, OutlinedInput, Select, SelectChangeEvent, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { v4 } from "uuid";
import { crm, frbroo } from "../helpers/namespaces";
import { stringToColour } from "../helpers/string2color";
import { ThingFromDataset } from "../types/ThingFromDataset";

interface AnalysisSelector {
    open: boolean
    onClose: () => void
    setAnalyses: (analyses: UrlString[]) => void
    forWork: UrlString
}

export const AnalysisSelector = ({ open, onClose, setAnalyses, forWork }: AnalysisSelector) => {
    const { session } = useSession()
    const [availableExpressions, setAvailableExpressions] = useState<UrlString[]>([])
    const [selectedExpressions, setSelectedExpressions] = useState<UrlString[]>([])

    useEffect(() => console.log('selected expressions=', availableExpressions), [availableExpressions])

    const fetchPublicExpressions = async () => {
        const dataset = await getSolidDataset('https://lute-preludes.org/data/works.ttl')
        const things = getThingAll(dataset)
        const e17 = things.find(thing => (
            getUrlAll(thing, RDF.type).includes(frbroo('F17_Aggregation_Work')) &&
            getUrl(thing, frbroo('R2_is_derivative_of')) === forWork
        ))

        if (!e17) {
            console.log(`It seems that no analyses have been published yet on this work:
            No F17 Aggregation Work has been found which relates to this work.`)
            return
        }

        setAvailableExpressions(expr => [...expr, ...getUrlAll(e17, frbroo('R3_is_realised_in'))])
    }

    const fetchPersonalExpressions = async () => {
        if (!session.info.isLoggedIn ||
            !session.info.webId) return
        try {
            const podUrl = await getPodUrlAll(session.info.webId)
            const dataset = await getSolidDataset(`${podUrl}preludes/works.ttl`, { fetch: session.fetch as any })
            const analyses = getThingAll(dataset)

            // Find all the F14 Indivudal Works which are saved in the 
            // personal pod and which are referring to the given work,
            // then load their respective realizations (as F22 Self-Contain'd Expressions).
            const derivativeAnalyses = analyses
                .filter(thing =>
                    getUrlAll(thing, RDF.type).includes(frbroo('F14_Individual_Work')) &&
                    getUrl(thing, frbroo('R2_is_derivative_of')) === forWork &&
                    getUrl(thing, frbroo('R9_is_realised_in')) !== null)
                .map(thing =>
                    getUrl(thing, frbroo('R9_is_realised_in'))!) // an F14 Individual Work may have only one F22 Expression
            console.log('derivative analyes', derivativeAnalyses)
            setAvailableExpressions(expr => [...expr, ...derivativeAnalyses])
        }
        catch (e) {
            console.log(e)
        }
    }

    useEffect(() => {
        setAvailableExpressions([])
        fetchPublicExpressions()
        fetchPersonalExpressions()
    }, [])

    const createPersonalExpression = async () => {
        if (!session.info.isLoggedIn || !session.info.webId) return

        try {
            const analysisDatasetId = v4()
            // First create the F22 Expression and save it in its own 
            // dataset
            const podUrl = await getPodUrlAll(session.info.webId)
            const analysisDataset = createSolidDataset()
            const newAnalysisExpression = buildThing(createThing())
                .addUrl(RDF.type, frbroo('F22_Self_Contained_Expression'))
                .addUrl(RDF.type, crm('E7_Activity'))
                .build()
            const modifiedAnalysisDataset = setThing(analysisDataset, newAnalysisExpression)
            await saveSolidDatasetAt(`${podUrl}preludes/analysis-${analysisDatasetId}.ttl`, modifiedAnalysisDataset, { fetch: session.fetch as any })

            // Then create a F14 Individual Work and attach the F22 Expression
            // as its only expression to it. Save the work in an overview dataset (analyses.ttl)
            const worksDataset = await getSolidDataset(`${podUrl}preludes/works.ttl`, { fetch: session.fetch as any })
            const newAnalysisWork = buildThing(createThing())
                .addUrl(RDF.type, frbroo('F14_Individual_Work'))
                .addUrl(frbroo('R2_is_derivative_of'), forWork)
                .addUrl(frbroo('R9_is_realised_in'), asUrl(newAnalysisExpression, `${podUrl}preludes/analysis-${analysisDatasetId}.ttl`))
                .build()
            const modifiedWorksDataset = setThing(worksDataset, newAnalysisWork)
            await saveSolidDatasetAt(`${podUrl}preludes/works.ttl`, modifiedWorksDataset, { fetch: session.fetch as any })
        }
        catch (e) {
            console.log(e)
        }
    }

    return (
        <Drawer open={open} onClose={onClose}>
            <Typography>Publicly Available Analyses</Typography>
            <FormControl sx={{ m: 1, width: 300 }}>

                <InputLabel id="choose-analysis-label" />
                <Select
                    labelId="choose-analysis-label"
                    id="choose-analysis"
                    multiple
                    value={selectedExpressions}
                    onChange={(e: SelectChangeEvent<typeof selectedExpressions>) => {
                        const target = e.target.value
                        setSelectedExpressions(
                            typeof target === 'string' ? target.split(',') : target,
                        )
                    }}
                    input={<OutlinedInput label="Tag" />}
                    renderValue={(selected) => selected.join(', ')}
                >
                    {availableExpressions.map(expression => (
                        <MenuItem
                            style={{ backgroundColor: stringToColour(expression) }}
                            key={expression}
                            value={expression}>
                            <Checkbox checked={selectedExpressions.indexOf(expression) > -1} />
                            <ListItemText primary={expression} />
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <Button
                onClick={async () => {
                    await createPersonalExpression()
                    await setAvailableExpressions([])
                    await fetchPublicExpressions()
                    await fetchPersonalExpressions()
                }}>Add Personal Analysis</Button>

            <Divider />

            <Button
                onClick={async () => {
                    setAnalyses(selectedExpressions)
                    onClose()
                }}
            >Open</Button>
        </Drawer>
    );
};
