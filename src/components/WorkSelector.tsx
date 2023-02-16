import { asUrl, getPodUrlAll, getSolidDataset, getStringNoLocale, getThingAll, getUrl, getUrlAll, Thing, Url, UrlString } from "@inrupt/solid-client";
import { useSession } from "@inrupt/solid-ui-react";
import { RDF } from "@inrupt/vocab-common-rdf";
import { Edit, Upload } from "@mui/icons-material";
import { Button, Drawer, IconButton, List, ListItem, ListItemText } from "@mui/material";
import { useEffect, useState } from "react";
import { crm, frbroo } from "../helpers/namespaces";
import { WorkDialog } from "./WorkDialog";
import { WorkListItem } from "./WorkListItem";

interface WorkSelectorProps {
    open: boolean
    onClose: () => void
    setScore: (score: UrlString) => void
}

export const WorkSelector = ({ open, onClose, setScore }: WorkSelectorProps) => {
    const { session } = useSession()
    const [availableWorks, setAvailableWorks] = useState<Thing[]>([])
    const [selectedWork, setSelectedWork] = useState<UrlString>()
    const [addWorkDialogOpen, setAddWorkDialogOpen] = useState(false)

    const loadFromDataset = async (datasetUrl: UrlString, options?: any) => {
        try {
            const dataset = await getSolidDataset(datasetUrl, options)
            const things = getThingAll(dataset)

            return things
                .filter(thing =>
                    getUrlAll(thing, RDF.type).includes(frbroo('F1_Work')))
        }
        catch (e) {
            console.log(e)
        }
        return []
    }

    console.log('')

    const fetchAllWorks = async () => {
        const publicDataset = "https://storage.inrupt.com/d14d1c60-6851-4c65-86fa-062c6989387c/preludes/works(4).ttl"
        let f1Works = [
            ...await loadFromDataset(publicDataset)
        ]

        let personalDataset = ''
        if (session.info.webId) {
            const podUrl = await getPodUrlAll(session.info.webId)
            personalDataset = `${podUrl}preludes/works.ttl`
            f1Works = [...f1Works, ...(await loadFromDataset(personalDataset, { fetch: session.fetch as any }))]
        }

        setAvailableWorks(f1Works
            .filter((work, i) => {
                return f1Works.findIndex(otherWork => asUrl(otherWork) === asUrl(work)) === i
            }))
    }

    useEffect(() => {
        open && fetchAllWorks()
    }, [open])

    return (
        <Drawer open={open} onClose={onClose}>
            <List>
                {availableWorks?.map(work => (
                    <WorkListItem
                        selected={work.url === selectedWork}
                        work={work}
                        key={`work_${asUrl(work)}`}
                        onClick={() => {
                            setSelectedWork(asUrl(work))
                            setScore(asUrl(work))
                            onClose()
                        }} />
                ))}
            </List>

            {session.info.isLoggedIn && (
                <Button
                    startIcon={<Upload />}
                    onClick={() => setAddWorkDialogOpen(true)}
                >Upload MEI</Button>
            )}

            <WorkDialog
                open={addWorkDialogOpen}
                onClose={() => setAddWorkDialogOpen(false)}
            />
        </Drawer>
    );
};
