import { asUrl, createThing, getFile, getStringNoLocale, getThing, getThingAll, getUrl, getUrlAll, Thing } from "@inrupt/solid-client"
import { useDataset, useSession } from "@inrupt/solid-ui-react"
import { RDF, RDFS } from "@inrupt/vocab-common-rdf"
import { AddOutlined, Delete, Edit, OpenInNew } from "@mui/icons-material"
import { Drawer, IconButton, List, ListItem, ListItemText, makeStyles, withStyles } from "@mui/material"
import { styled } from "@mui/system"
import { useEffect, useState } from "react"
import { v4 } from "uuid"
import { crm, frbroo } from "./namespaces"
import { WorkDialog } from "./WorkDialog"
import { E13, Selection } from "./Workspace"

// avoid overlapping secondary actions in the list
const StyledList = styled(List)(() => ({
    width: '100%',
    minWidth: 500
}));

interface WorkPickerProps {
    open: boolean
    onClose: () => void

    setWorkURI: (uri: string) => void
    setMEI: (mei: string) => void
    setSelections: (selections: Selection[]) => void
}

export const WorkPicker = ({ open, onClose, setWorkURI, setMEI, setSelections }: WorkPickerProps) => {
    const { dataset } = useDataset()
    const { session } = useSession()

    const [works, setWorks] = useState<{ thing: Thing, title: string }[]>([])
    const [selectedWork, setSelectedWork] = useState<Thing>()
    const [workDialogOpen, setWorkDialogOpen] = useState(false)

    const loadWorks = () => {
        console.log('loading works')

        if (!dataset) {
            console.warn('No dataset found')
            return
        }
        // get a list of the works found in the dataset
        const things = getThingAll(dataset)
        setWorks(
            things
                .filter(thing => {
                    return getUrlAll(thing, RDF.type).includes(frbroo('F15_Complex_Work'))
                })
                .map(thing => {
                    return {
                        thing,
                        title: getStringNoLocale(thing, crm('P102_has_title')) || 'untitled'
                    }
                })
        )
    }

    useEffect(() => {
        if (!open) return
        loadWorks()
    }, [open, onClose, setMEI, setSelections])

    const openWork = async (work: Thing) => {
        setWorkURI(asUrl(work))

        // load MEI
        const fileUrl = getUrl(work, RDFS.label)
        if (!fileUrl) {
            console.warn('no MEI url given')
            return
        }
        const xslt = await (await fetch('insertMeasures.xsl')).text()
        const xsltProcessor = new XSLTProcessor()
        xsltProcessor.importStylesheet(new DOMParser().parseFromString(xslt, 'application/xml'))

        const file = await getFile(fileUrl, { fetch: session.fetch })
        const mei = await file.text()
        const result = xsltProcessor.transformToDocument(new DOMParser().parseFromString(mei, 'application/xml'))

        setMEI(new XMLSerializer().serializeToString(result))

        // load selections
        if (!dataset) {
            console.warn('Cannot load any selections, no dataset given.')
            setSelections([])
            return
        }

        const things = getThingAll(dataset)
        setSelections(
            things
                .filter(thing => {
                    // TODO: should use has_type instead
                    return getUrlAll(thing, RDF.type).includes(crm('E90_Symbolic_Object')) &&
                        getUrl(thing, crm('P106i_forms_part_of')) === asUrl(work)
                })
                .map(thing => {
                    const selectionUrl = asUrl(thing)
                    const refs = getUrlAll(thing, crm('P106_is_composed_of')).map(url => url.split('#').at(-1) || '')

                    return {
                        id: selectionUrl.split('#').at(-1) || '',
                        refs: refs,
                        e13s: things
                            .filter(thing => {
                                // get all E13s connected to this selection
                                return getUrlAll(thing, RDF.type).includes(crm('E13_Attribute_Assignment')) &&
                                    getUrl(thing, crm('P140_assigned_attribute_to')) === selectionUrl
                            })
                            .map((thing): E13 => {
                                return {
                                    id: asUrl(thing).split('#').at(-1) || v4(),
                                    treatise: '', // TODO
                                    property: getUrl(thing, crm('P177_assigned_property_of_type'))?.split('/').at(-1) || 'unknown',
                                    attribute: getUrl(thing, crm('P141_assigned')) || '',
                                    comment: getStringNoLocale(thing, crm('P3_has_note')) || ''
                                }
                            })
                    }
                })
        )
    }

    return (
        <>
            <Drawer open={open} onClose={onClose}>
                <StyledList>
                    {works.map((work, i) => {
                        return (
                            <ListItem
                                key={`work_${i}`}
                                secondaryAction={
                                    <>
                                        <IconButton onClick={() => {
                                            setSelectedWork(work.thing)
                                            setWorkDialogOpen(true)
                                        }}>
                                            <Edit />
                                        </IconButton>
                                        <IconButton>
                                            <Delete />
                                        </IconButton>
                                        <IconButton onClick={() => {
                                            openWork(work.thing)
                                            onClose()
                                        }}>
                                            <OpenInNew />
                                        </IconButton>
                                    </>
                                }>
                                <ListItemText
                                    primary={work.title}
                                    secondary={asUrl(work.thing).split('#').at(-1) || ''} />
                            </ListItem>
                        )
                    })}
                </StyledList>

                <IconButton onClick={() => setWorkDialogOpen(true)}>
                    <AddOutlined />
                </IconButton>
            </Drawer>
            <WorkDialog
                thing={selectedWork}
                open={workDialogOpen}
                onClose={() => {
                    setWorkDialogOpen(false)
                    loadWorks()
                }} />
        </>
    )
}