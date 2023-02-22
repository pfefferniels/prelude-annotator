import { asUrl, buildThing, createSolidDataset, createThing, getPodOwner, getPodUrlAll, getPodUrlAllFrom, getResourceInfo, getSolidDataset, getThingAll, getUrl, getUrlAll, saveSolidDatasetAt, setThing, UrlString } from "@inrupt/solid-client";
import { useSession } from "@inrupt/solid-ui-react";
import { RDF } from "@inrupt/vocab-common-rdf";
import { Add, Create, OpenInFull, OpenInNew, OpenInNewOff, OpenInNewOffOutlined } from "@mui/icons-material";
import { Button, Divider, Drawer, FormControl, IconButton, InputLabel, List, MenuItem, OutlinedInput, Select, SelectChangeEvent, Typography } from "@mui/material";
import { Stack } from "@mui/system";
import { useEffect, useState } from "react";
import { v4 } from "uuid";
import { crm, frbroo } from "../helpers/namespaces";
import { AnalysisEditor } from "./AnalysisEditor";
import { AnalysisListItem } from "./AnalysisListItem";
import { fetchPublicAnalyses } from "../helpers/fetchPublicAnalyses";

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

    const [createAnalysisOpen, setCreateAnalysisOpen] = useState(false)

    const fetchPersonalExpressions = async () => {
        if (!session.info.isLoggedIn ||
            !session.info.webId) return []
        try {
            const podUrl = await getPodUrlAll(session.info.webId)
            const dataset = await getSolidDataset(`${podUrl}preludes/works.ttl`, { fetch: session.fetch as any })
            const analyses = getThingAll(dataset)

            // Find all the F14 Indivudal Works which are saved in the 
            // personal pod and which are referring to the given work,
            // then load their respective realizations (as F22 Self-Contain'd Expressions).
            return analyses
                .filter(thing =>
                    getUrlAll(thing, RDF.type).includes(frbroo('F14_Individual_Work')) &&
                    getUrl(thing, frbroo('R2_is_derivative_of')) === forWork &&
                    getUrl(thing, frbroo('R9_is_realised_in')) !== null)
                .map(thing =>
                    getUrl(thing, frbroo('R9_is_realised_in'))! // an F14 Individual Work may have only one F22 Expression
                )
        }
        catch (e) {
            console.log(e)
        }
        return []
    }

    const fetchAllExpressions = async () => {
        const publicExpressions = await fetchPublicAnalyses(forWork)
        const personalExpressions = await fetchPersonalExpressions()

        let allExpressions = [
            ...publicExpressions,
            ...personalExpressions]
        allExpressions = allExpressions
            .filter((expression, i) => {
                // filter out duplicate expressions. 
                // This is not unlikely to happen, since 
                // publicly shared analyses will be fetched
                // from both, the public as well the private pod.
                return allExpressions.indexOf(expression) === i
            })
        setAvailableExpressions(allExpressions)
    }

    useEffect(() => {
        fetchAllExpressions()
    }, [open, forWork])

    const createPersonalExpression = async (title: string) => {
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
                .addUrl(crm('P14_carried_out_by'), session.info.webId)
                .addStringNoLocale(crm('P102_has_title'), title)
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

            // update the list of available analyses
            fetchAllExpressions()
        }
        catch (e) {
            console.log(e)
        }
    }

    return (
        <Drawer open={open} onClose={onClose}>
            <Typography sx={{ margin: '0.5rem' }}>Available Analyses</Typography>
            <Stack direction='row'>
                <Button
                    startIcon={<Add />}
                    onClick={() => setCreateAnalysisOpen(true)}>
                    Create
                </Button>

                <Button
                    disabled={selectedExpressions.length === 0}
                    startIcon={<OpenInNew />}
                    onClick={async () => {
                        setAnalyses(selectedExpressions)
                        onClose()
                    }}
                >Open Selection</Button>
            </Stack>

            <List dense sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }}>
                {availableExpressions.map((expression) => {
                    const labelId = `checkbox-list-secondary-label-${expression}`;
                    return (
                        <AnalysisListItem
                            forWork={forWork}
                            key={expression}
                            expression={expression}
                            checked={selectedExpressions.indexOf(expression) !== -1}
                            onChange={() => {
                                const currentIndex = selectedExpressions.indexOf(expression);
                                const newChecked = [...selectedExpressions];

                                if (currentIndex === -1) {
                                    newChecked.push(expression);
                                } else {
                                    newChecked.splice(currentIndex, 1);
                                }

                                setSelectedExpressions(newChecked);
                            }} />
                    );
                })}
            </List>

            <AnalysisEditor
                open={createAnalysisOpen}
                onClose={() => setCreateAnalysisOpen(false)}
                onCreate={createPersonalExpression}
            />
        </Drawer>
    );
};


