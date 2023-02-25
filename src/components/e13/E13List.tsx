import { ExpandMore } from "@mui/icons-material";
import { Accordion, AccordionDetails, AccordionSummary, Button, Typography } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { E13Editor } from "./E13Editor";
import { useSession } from "@inrupt/solid-ui-react";
import { saveSolidDatasetAt, removeThing, getSourceUrl, getSolidDataset, hasResourceInfo, buildThing, createThing, setThing, getThing, UrlString } from "@inrupt/solid-client";
import { RDF } from "@inrupt/vocab-common-rdf";
import { urlAsLabel } from "../../helpers/urlAsLabel";
import { E13 } from "../../types/E13";
import { Stack } from "@mui/system";
import { crm, crminf, dcterms } from "../../helpers/namespaces";
import { v4 } from "uuid";
import { Selection } from "../../types/Selection";
import { AnalysisContext } from "../../context/AnalysisContext";

export interface E13ListProps {
    forSelection: Selection
}

export const E13List = ({ forSelection }: E13ListProps) => {
    const { analysisThing, analysisDataset: dataset, updateDataset, availableE13s, editable } = useContext(AnalysisContext)
    const { session } = useSession();

    const [referredE13s, setReferredE13s] = useState<E13[]>([])

    const [selectedId, setSelectedId] = useState('');
    const [domainRestrictions, setDomainRestrictions] = useState<string[]>([]);

    // IDs of the E13s which is currently in the state of being saved
    const [savingE13s, setSavingE13s] = useState<string[]>([])

    useEffect(() => {
        console.log('Available E13s=', availableE13s)
        // when the available E13s change, filter out 
        // those which refer to the current selection 
        setReferredE13s(
            availableE13s
                .filter(e13 => e13.target === forSelection.url)
        )
    }, [availableE13s, forSelection])

    useEffect(() => {
        // depending on the types that were associated 
        // with the given selection, the available properties 
        // should be restricted to those which have one of 
        // this types as a domain.
        setDomainRestrictions(
            referredE13s
                .filter(e13 => e13.property === RDF.type && typeof e13.attribute === 'string')
                .map(e13 => e13.attribute as string)
        );
    }, [referredE13s]);

    const removeE13 = async (e13: E13) => {
        if (!dataset || !hasResourceInfo(dataset) || !editable)
            return;

        const sourceUrl = getSourceUrl(dataset);
        const modifiedDataset = removeThing(dataset, e13.url);
        const savedDataset = await saveSolidDatasetAt(sourceUrl, modifiedDataset, { fetch: session.fetch as any });
        updateDataset(await getSolidDataset(getSourceUrl(savedDataset), { fetch: session.fetch as any }));
    }

    const saveE13 = async (e13: E13) => {
        if (!dataset || !hasResourceInfo(dataset) || !editable) return

        const sourceUrl = getSourceUrl(dataset)

        console.log('saving E13', e13)
        console.log('for Selection', e13)

        const e13Thing = buildThing(createThing({
            url: e13.url
        }))
            .addUrl(RDF.type, crm('E13_Attribute_Assignment'))
            .addUrl(RDF.type, crminf('I4_Information_Set'))
            .addDate(dcterms('created'), new Date(Date.now()))
            .addUrl(crm('P14_carried_out_by'), session.info.webId!)
            .addUrl(crm('P140_assigned_attribute_to'), forSelection.url)
            .addStringNoLocale(crm('P3_has_note'), e13.comment)

        if (e13.attribute !== '') {
            e13Thing.addUrl(crm('P141_assigned'), typeof e13.attribute === 'string' ? e13.attribute : e13.attribute.url)
        }

        if (e13.treatise !== '') {
            e13Thing.addUrl(crm('P33_used_specific_technique'), e13.treatise || '')
        }

        if (e13.property.length) {
            e13Thing.addUrl(crm('P177_assigned_property_of_type'), e13.property)
        }

        if (!analysisThing) {
            console.log('Analysis not yet present')
            return
        }

        const updatedAnalysis = buildThing(analysisThing)
        updatedAnalysis.addUrl(crm('P3_consists_of'), e13.url)

        let modifiedDataset = setThing(dataset, e13Thing.build())
        modifiedDataset = setThing(modifiedDataset, updatedAnalysis.build())

        setSavingE13s(savings => [...savings, e13.url])
        const savedDataset = await saveSolidDatasetAt(sourceUrl, modifiedDataset, { fetch: session.fetch as any })
        updateDataset(await getSolidDataset(getSourceUrl(savedDataset), { fetch: session.fetch as any }))

        setSavingE13s(savings => {
            const newSavings = savings.slice()
            newSavings.splice(newSavings.findIndex(s => s === e13.url), 1)
            return newSavings
        })
    }

    const createE13 = () => {
        if (!dataset || !hasResourceInfo(dataset) || !editable) return

        const url = `${getSourceUrl(dataset)}#${v4()}`
        saveE13({
            url,

            // try to guess the right treatise be taking the first 
            // E13 in the given selection
            treatise: referredE13s.length ? referredE13s[0].treatise : '',

            // all the other attributes cannot be known yet
            attribute: '',
            comment: '',
            property: '',
            target: forSelection.url
        })

        setSelectedId(url)
    }

    return (
        <Stack>
            {referredE13s
                .sort((a, b) => (urlAsLabel(a.property)?.charCodeAt(0) || 0) - (urlAsLabel(b.property)?.charCodeAt(0) || 0))
                .map(e13 => {
                    return (
                        <Accordion
                            elevation={5}
                            expanded={e13.url === selectedId}
                            onChange={(_: React.SyntheticEvent, isExpanded: boolean) => {
                                if (isExpanded) {
                                    setSelectedId(e13.url);
                                }
                                else {
                                    setSelectedId('');
                                }
                            }}
                            key={`selection_editor_${e13.url}`}>
                            <AccordionSummary
                                expandIcon={<ExpandMore />}>
                                <Typography>
                                    <b>
                                        {urlAsLabel(e13.property) || <span style={{ color: '#f44336' }}>[New Attribute Assignment]</span>}
                                    </b>
                                </Typography>

                                {e13.property === RDF.type && <Typography> {urlAsLabel(e13.attribute as UrlString)}</Typography>}
                            </AccordionSummary>

                            <AccordionDetails>
                                {selectedId === e13.url &&
                                    <E13Editor
                                        selectionUrl={forSelection.url}
                                        e13={e13}
                                        onClose={() => setSelectedId('')}
                                        availableDomains={domainRestrictions}
                                        saving={savingE13s.includes(e13.url)}
                                        saveE13={saveE13}
                                        removeE13={removeE13}
                                    />}
                            </AccordionDetails>
                        </Accordion>
                    );
                })}

            {editable && (
                <Button onClick={createE13}>Assign Attribute</Button>
            )}
        </Stack>
    );
};
