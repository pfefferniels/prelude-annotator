import { asUrl, getSolidDataset, getThing, getThingAll, getUrlAll } from "@inrupt/solid-client";
import { RDF } from "@inrupt/vocab-common-rdf";
import { Button, CircularProgress, List } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { E13 } from "../../types/E13";
import { Argumentation } from "../../types/Belief";
import { WorkspaceContext } from "../../context/ScoreSurfaceContext";
import { crm, crminf } from "../../helpers/namespaces";
import { useSession } from "@inrupt/solid-ui-react";
import { toBelief } from "../../mappings/mapBelief";
import { toArgumentation } from "../../mappings/mapArgumentation";
import { ArgumentationEditor } from "../argumentation";
import { ArgumentationLinkButton } from "./ArgumentationLinkButton";

export const ReferredArgumentationContainer = ({ e13 }: { e13: E13; }) => {
    const { analyses } = useContext(WorkspaceContext);
    const { session } = useSession();

    const [referredArgumentations, setReferredArgumentations] = useState<Argumentation[]>([]);
    const [editorOpen, setEditorOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Finds all argumentations which refer to the given E13
    const fetchAllArgumentations = async () => {
        setLoading(true);
        const argumentationsByAnalysis = analyses.map(async (analysisUrl) => {
            const dataset = await getSolidDataset(analysisUrl, { fetch: session.fetch as any });
            const things = getThingAll(dataset);
            const analysis = getThing(dataset, analysisUrl);

            if (!analysis) {
                return [];
            }

            console.log('searching');

            return things
                .filter(thing => {
                    // get all the I1 Argumentations in the datasets
                    return getUrlAll(thing, RDF.type).includes(crminf('I1_Argumentation')) &&
                        getUrlAll(analysis, crm('P3_consists_of')).includes(asUrl(thing));
                })
                .reduce((prev, argumentationThing) => {
                    const conclusions = things
                        .filter(thing => {
                            const conclusions = getUrlAll(argumentationThing, crminf('J2_concluded_that'));
                            // console.log('searching for', asUrl(thing), 'in', conclusions)
                            // get all the I2 Beliefs
                            return getUrlAll(thing, RDF.type).includes(crminf('I2_Belief')) &&
                                conclusions.includes(asUrl(thing));
                        })
                        .map(toBelief);
                    const referredBelief = conclusions.find(belief => {
                        console.log('compare', belief.that, e13.url);
                        return belief.that === e13.url;
                    });
                    if (!referredBelief)
                        return prev;

                    prev.push(toArgumentation(argumentationThing, [referredBelief]));
                    return prev;
                }, [] as Argumentation[]);
        });

        setReferredArgumentations((await Promise.all(argumentationsByAnalysis)).flat());
        setLoading(false);
    };

    useEffect(() => {
        fetchAllArgumentations();
    }, [e13, analyses, session]);

    if (loading)
        return <CircularProgress />;

    return (
        <>
            {(referredArgumentations.length !== 0) && (
                <List>
                    {referredArgumentations.map(argumentation => <ArgumentationLinkButton
                        key={`button_${argumentation.url}`}
                        argumentation={argumentation}
                        belief={argumentation.concluded[0]!} />
                    )}
                </List>
            )}

            {session.info.isLoggedIn &&
                <Button onClick={() => setEditorOpen(true)}>
                    Argue that ...
                </Button>
            }

            <ArgumentationEditor
                open={editorOpen}
                onClose={async () => {
                    setEditorOpen(false)
                    fetchAllArgumentations()
                }}
                argumentation={{
                    url: '',
                    carriedOutBy: session.info.webId || '',
                    note: '',
                    concluded: [{
                        that: e13.url,
                        url: '',
                        holdsToBe: 'true',
                        time: new Date(Date.now()),
                        note: ''
                    }]
                }} />
        </>
    );
};
