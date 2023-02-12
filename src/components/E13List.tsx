import { Delete, ExpandMore } from "@mui/icons-material";
import { Accordion, AccordionActions, AccordionDetails, AccordionSummary, Button, IconButton, Typography } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { E13Editor } from "./E13Editor";
import { DatasetContext, useSession } from "@inrupt/solid-ui-react";
import { saveSolidDatasetAt, removeThing, getSourceUrl, getSolidDataset, hasResourceInfo, buildThing, createThing, setThing } from "@inrupt/solid-client";
import { RDF, RDFS } from "@inrupt/vocab-common-rdf";
import { urlAsLabel } from "./E13Summary";
import { E13 } from "../types/E13";
import { E13Context } from "../context/E13Context";
import { Stack } from "@mui/system";
import { crm, crminf, dcterms } from "../helpers/namespaces";
import { v4 } from "uuid";
import { Selection } from "../types/Selection";

export interface E13ListProps {
    forSelection: Selection
}

export const E13List = ({ forSelection }: E13ListProps) => {
    const { availableE13s } = useContext(E13Context)
    const { solidDataset: dataset, setDataset } = useContext(DatasetContext);
    const { session } = useSession();

    const [referredE13s, setReferredE13s] = useState<E13[]>([])

    const [selectedId, setSelectedId] = useState('');
    const [domainRestrictions, setDomainRestrictions] = useState<string[]>([]);

    // IDs of the E13s which is currently in the state of being saved
    const [savingE13s, setSavingE13s] = useState<string[]>([])

    useEffect(() => {
        // when the available E13s change, filter out 
        // those which refer to the current selection 
        setReferredE13s(
            availableE13s
                .filter(e13 => e13.target.split('#').at(-1) === forSelection.id)
        )
    }, [availableE13s, forSelection])

    useEffect(() => {
        // depending on the types that were associated 
        // with the given selection, the available properties 
        // should be restricted to those which have one of 
        // this types as a domain.
        setDomainRestrictions(
            referredE13s
                .filter(e13 => e13.property === RDF.type)
                .map(e13 => e13.attribute)
        );
    }, [referredE13s]);

    const removeE13 = async (e13: E13) => {
        if (!dataset || !hasResourceInfo(dataset))
            return;

        const sourceUrl = getSourceUrl(dataset);
        const modifiedDataset = removeThing(dataset, `${sourceUrl}#${e13.id}`);
        const savedDataset = await saveSolidDatasetAt(sourceUrl, modifiedDataset, { fetch: session.fetch as any });
        setDataset(await getSolidDataset(getSourceUrl(savedDataset), { fetch: session.fetch as any }));
    }

    const saveE13 = async (e13: E13) => {
        const id = e13.id

        if (!dataset || !hasResourceInfo(dataset)) return

        const sourceUrl = getSourceUrl(dataset)

        const e13Thing = buildThing(createThing({
            name: id
        }))
            .addUrl(RDF.type, crm('E13_Attribute_Assignment'))
            .addUrl(RDF.type, crminf('I4_Information_Set'))
            .addStringNoLocale(RDFS.label, id)
            .addDate(dcterms('created'), new Date(Date.now()))
            .addUrl(crm('P14_carried_out_by'), session.info.webId!)
            .addUrl(crm('P140_assigned_attribute_to'), `${sourceUrl}#${forSelection.id}`)
            .addUrl(crm('P141_assigned'), e13.attribute.startsWith('http') ? e13.attribute : `${sourceUrl}/#${e13.attribute}`)
            .addStringNoLocale(crm('P3_has_note'), e13.comment)

        if (e13.treatise !== '') {
            e13Thing.addUrl(crm('P33_used_specific_technique'), e13.treatise || '')
        }

        if (e13.property.length) {
            e13Thing.addUrl(crm('P177_assigned_property_of_type'), e13.property)
        }

        const modifiedDataset = setThing(dataset, e13Thing.build());

        setSavingE13s(savings => [...savings, e13.id])
        const savedDataset = await saveSolidDatasetAt(sourceUrl, modifiedDataset, { fetch: session.fetch as any })
        setDataset(await getSolidDataset(getSourceUrl(savedDataset), { fetch: session.fetch as any }))

        setSavingE13s(savings => {
            const newSavings = savings.slice()
            newSavings.splice(newSavings.findIndex(s => s === e13.id), 1)
            return newSavings
        })
    }

    const createE13 = () => {
        if (!dataset) return

        const id = v4()
        saveE13({
            id: v4(),

            // new created E13s will always be saved in the 
            // personal POD
            provenience: getSourceUrl(dataset) || '',

            // try to guess the right treatise be taking the first 
            // E13 in the given selection
            treatise: referredE13s.length ? referredE13s[0].treatise : '',

            // all the other attributes cannot be known yet
            attribute: '',
            comment: '',
            property: '',
            target: forSelection.id
        })

        setSelectedId(id)
    }

    const isPersonalSelection = dataset && forSelection.provenience === getSourceUrl(dataset)

    return (
        <Stack>
            {referredE13s
                .sort((a, b) => (urlAsLabel(a.property)?.charCodeAt(0) || 0) - (urlAsLabel(b.property)?.charCodeAt(0) || 0))
                .map(e13 => {
                return (
                    <Accordion
                        elevation={5}
                        expanded={e13.id === selectedId}
                        onChange={(_: React.SyntheticEvent, isExpanded: boolean) => {
                            if (isExpanded) {
                                setSelectedId(e13.id);
                            }
                            else {
                                setSelectedId('');
                            }
                        }}
                        key={`selection_editor_${e13.id}`}>
                        <AccordionSummary
                            expandIcon={<ExpandMore />}>
                            <Typography>
                                <b>
                                    {urlAsLabel(e13.property) || <span style={{ color: 'red' }}>[New Attribute Assignment]</span>}
                                </b>
                            </Typography>

                            {e13.attribute && <Typography> {urlAsLabel(e13.attribute)}</Typography>}
                        </AccordionSummary>

                        <AccordionDetails>
                            {selectedId === e13.id &&
                                <E13Editor
                                    selectionUrl={forSelection.id}
                                    e13={e13}
                                    onClose={() => setSelectedId('')}
                                    availableDomains={domainRestrictions}
                                    saving={savingE13s.includes(e13.id)}
                                    saveE13={saveE13}
                                    removeE13={removeE13}
                                />}
                        </AccordionDetails>
                    </Accordion>
                );
            })}

            {session.info.isLoggedIn && isPersonalSelection && (
                <Button onClick={createE13}>Assign Attribute</Button>
            )}
        </Stack>
    );
};
