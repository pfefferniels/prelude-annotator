import { asUrl, getSolidDataset, getStringNoLocale, getThingAll, getUrlAll, Thing, UrlString } from "@inrupt/solid-client";
import { RDF } from "@inrupt/vocab-common-rdf";
import { Drawer, List, ListItem, ListItemText } from "@mui/material";
import { useEffect, useState } from "react";
import { crm, frbroo } from "../helpers/namespaces";

interface WorkSelectorProps {
    open: boolean
    onClose: () => void
    setScore: (score: UrlString) => void
}

export const WorkSelector = ({ open, onClose, setScore }: WorkSelectorProps) => {
    const [f1Works, setF1Works] = useState<Thing[]>();

    useEffect(() => {
        const fetchWorks = async () => {
            const dataset = await getSolidDataset('https://lute-preludes.org/data/works.ttl');

            const things = getThingAll(dataset);
            setF1Works(things.filter(thing => getUrlAll(thing, RDF.type).includes(frbroo('F1_Work'))));
        };
        fetchWorks();
    }, []);

    return (
        <Drawer open={open} onClose={onClose}>
            <List>
                {f1Works?.map(work => (
                    <ListItem
                        onClick={(e) => {
                            setScore(asUrl(work))
                            onClose()
                        }}
                        key={`work_selector_${asUrl(work)}`}>
                        <ListItemText
                            primary={getStringNoLocale(work, crm('P102_has_title'))}
                            secondary={asUrl(work)} />
                    </ListItem>
                ))}
            </List>
        </Drawer>
    );
};
