import { Delete, ExpandMore } from "@mui/icons-material";
import { Accordion, AccordionActions, AccordionDetails, AccordionSummary, IconButton, Typography } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { E13Editor } from "./E13Editor";
import { DatasetContext, useSession } from "@inrupt/solid-ui-react";
import { saveSolidDatasetAt, removeThing, getSourceUrl, getSolidDataset, hasResourceInfo } from "@inrupt/solid-client";
import { RDF } from "@inrupt/vocab-common-rdf";
import { urlAsLabel } from "./E13Summary";
import { E13 } from "./Workspace";
import { SelectionContext } from "./SelectionContext";

export interface E13ListProps {
    e13s: E13[]

    selectionId: string
}

export const E13List = ({ e13s, selectionId }: E13ListProps) => {
    const { availableSelections, highlightSelection } = useContext(SelectionContext)
    const { solidDataset: dataset, setDataset } = useContext(DatasetContext);
    const { session } = useSession();

    const [selectedId, setSelectedId] = useState('');
    const [domainRestrictions, setDomainRestrictions] = useState<string[]>([]);

    useEffect(() => {
        // update the domain restrictions
        setDomainRestrictions(
            e13s
                .filter(e13 => e13.property === RDF.type)
                .map(e13 => e13.attribute)
        );
    }, [e13s]);

    return (
        <>
            {e13s.map(e13 => {
                return (
                    <Accordion
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
                            <Typography>{urlAsLabel(e13.property) || 'unedited'} </Typography>
                            {e13.attribute && <Typography> {urlAsLabel(e13.attribute)}</Typography>}
                        </AccordionSummary>

                        <AccordionActions>
                            <IconButton onClick={async () => {
                                if (!dataset || !hasResourceInfo(dataset))
                                    return;

                                const sourceUrl = getSourceUrl(dataset);
                                const modifiedDataset = removeThing(dataset, `${sourceUrl}#${e13.id}`);
                                const savedDataset = await saveSolidDatasetAt(sourceUrl, modifiedDataset, { fetch: session.fetch as any });
                                setDataset(await getSolidDataset(getSourceUrl(savedDataset), { fetch: session.fetch as any }));
                            }}>
                                <Delete />
                            </IconButton>
                        </AccordionActions>

                        <AccordionDetails>
                            {selectedId === e13.id &&
                                <E13Editor
                                    availableDomains={domainRestrictions}
                                    selectionId={selectionId}
                                    e13={e13}
                                    availableSelections={availableSelections}
                                    highlightSelection={highlightSelection}
                                    onClose={() => setSelectedId('')} />}
                        </AccordionDetails>
                    </Accordion>
                );
            })}
        </>
    );
};
