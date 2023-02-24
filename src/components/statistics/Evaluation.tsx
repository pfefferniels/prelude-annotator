import { getSolidDataset, getThingAll, getUrlAll, getUrl, UrlString, getThing, getFile } from "@inrupt/solid-client"
import { useSession } from "@inrupt/solid-ui-react"
import { RDF } from "@inrupt/vocab-common-rdf"
import { Paper, FormControl, InputLabel, Select, MenuItem, Typography, Divider, Button } from "@mui/material"
import { Stack } from "@mui/system"
import { useEffect, useState } from "react"
import { crm, frbroo } from "../../helpers/namespaces"
import { Ontology } from "../../helpers/Ontology"
import Verovio from "../score/Verovio"
import availableTreatises from "../availableTreatises.json"
import { ArrowRight } from "@mui/icons-material"

type SelectionInMEI = {
    meiUrl: UrlString
    refs: string[]
}

/*
    filter E13s by has_assigned_type (Roulade)
    choose its assigned_to property => selection
    open the associated MEI, select the portion
    and render it into an [svgs] prop

    */

const SelectionExtract = ({ selection }: { selection: SelectionInMEI }) => {
    const { session } = useSession()

    const [mei, setMEI] = useState<string>()
    const [title, setTitle] = useState<string>()
    const [measures, setMeasures] = useState<string[]>()

    useEffect(() => {
        const fetchSelection = async () => {
            const meiFile = await getFile(selection.meiUrl, { fetch: session.fetch as any })
            if (!meiFile) return null

            const meiDoc = new DOMParser().parseFromString(await meiFile.text(), 'application/xml')

            // insert measures into it (for proper displaying in verovio)
            const xslt = await (await fetch('insertMeasures.xsl')).text()
            const xsltProcessor = new XSLTProcessor()
            xsltProcessor.importStylesheet(new DOMParser().parseFromString(xslt, 'application/xml'))
            const result = xsltProcessor.transformToDocument(meiDoc)

            let selectedMeasures: string[] = []
            result.querySelectorAll('measure').forEach(measure => {
                // console.log('measure=', measure)
                const foundCounterparts = selection.refs.filter(ref => {
                    const correspEl = measure.querySelectorAll(`[*|id="${ref}"]`)
                    return correspEl.length > 0
                })
                if (foundCounterparts.length > 0) {
                    selectedMeasures.push(measure.getAttribute('n') || '')
                }
                else {
                    measure.remove()
                }
            })
            setMeasures(selectedMeasures)
            setTitle(meiDoc.querySelector('title')?.innerHTML || '')

            setMEI(new XMLSerializer().serializeToString(result))
        }

        fetchSelection()
    }, [selection])

    if (!mei) return <div>no MEI there yet</div>

    return (
        <>
            <div><span style={{ color: 'gray' }}>From</span>: {title}</div>
            <div><span style={{ color: 'gray' }}>Notes</span>: {measures?.join(', ')}</div>
            <Button startIcon={<ArrowRight />} variant='text'>associated attributes</Button>
            <Button startIcon={<ArrowRight />} variant='text'>associated argumentations</Button>
            <Verovio mei={mei} onReady={() => { }} />
            <Divider />
        </>
    )
}

const SelectionContainer = ({ fromDataset, classUrl }: { fromDataset: UrlString, classUrl: UrlString }) => {
    const { session } = useSession()

    const [selections, setSelections] = useState<(SelectionInMEI | null)[]>([])

    useEffect(() => {
        const fetchDataset = async () => {
            const analysisDataset = await getSolidDataset(fromDataset, { fetch: session.fetch as any })
            const things = getThingAll(analysisDataset)
            setSelections(things
                .filter(thing => {
                    const type = getUrl(thing, crm('P141_assigned'))
                    console.log('type=', type)
                    return type === classUrl &&
                        getUrl(thing, crm('P140_assigned_attribute_to')) !== null
                })
                .map(thing => {
                    console.log('thing=', thing)
                    const selectionUrl = getUrl(thing, crm('P140_assigned_attribute_to'))!
                    const selection = getThing(analysisDataset, selectionUrl)
                    if (!selection) return null

                    const refs = getUrlAll(selection, crm('P106_is_composed_of'))
                    if (!refs.length) return null

                    const meiUrl = refs[0].split('#').at(0)
                    if (!meiUrl || !meiUrl.length) return null

                    return {
                        meiUrl,
                        refs: refs.map(ref => ref.split('#').at(-1) || '')
                    }
                })
            )
        }

        fetchDataset()
    }, [fromDataset, classUrl])

    return (
        <>
            {selections.map(selection => (
                selection ?
                    <SelectionExtract key={`selection_${selection.meiUrl}`} selection={selection} />
                    : null
            ))}
        </>
    )
}

export const Evaluation = () => {
    const [ontologies, setOntologies] = useState<Ontology[]>([])
    const [analysisUrls, setAnalysisUrls] = useState<UrlString[]>([])
    const [currentTreatise, setCurrentTreatise] = useState<Ontology>()
    const [selectedClass, setSelectedClass] = useState<UrlString>('')

    useEffect(() => {
        const fetchOntologies = async () => {
            const fetchOntologies = (treatises: any[]) => {
                return treatises.map(async treatise => {
                    return new Ontology(await getSolidDataset(treatise.url), treatise.name, treatise.label)
                })
            }

            Promise.all(fetchOntologies(availableTreatises)).then(setOntologies)
        }

        const fetchAnalyses = async () => {
            const dataset = await getSolidDataset('https://storage.inrupt.com/d14d1c60-6851-4c65-86fa-062c6989387c/preludes/works(4).ttl');
            const things = getThingAll(dataset);

            setAnalysisUrls(
                things
                    .filter(thing => (
                        getUrlAll(thing, RDF.type).includes(frbroo('F17_Aggregation_Work')) &&
                        getUrlAll(thing, frbroo('R3_is_realised_in')).length > 0
                    ))
                    .map(thing => getUrl(thing, frbroo('R3_is_realised_in'))!)
            )
        }

        fetchOntologies()
        fetchAnalyses()
    }, [])

    console.log(analysisUrls)

    return (
        <>
            <Paper style={{ padding: '0.5rem', maxWidth: '50%' }}>
                <Typography>Filter</Typography>
                <Stack spacing={2}>
                    <FormControl variant='standard'>
                        <InputLabel>Treatise</InputLabel>

                        <Select
                            size='small'
                            value={currentTreatise?.name || ''}
                            onChange={async (e) => {
                                setCurrentTreatise(ontologies.find(ontology => ontology.name === e.target.value))
                            }}>
                            {ontologies.map(ontology => {
                                return (
                                    <MenuItem
                                        key={ontology.name}
                                        value={ontology.name}>
                                        {ontology.label}
                                    </MenuItem>
                                )
                            })}
                        </Select>
                    </FormControl>

                    <FormControl variant='standard'>
                        <InputLabel>Type</InputLabel>

                        <Select
                            disabled={!currentTreatise}
                            size='small'
                            value={selectedClass}
                            onChange={async (e) => {
                                setSelectedClass(e.target.value)
                            }}>
                            {currentTreatise?.allClasses().map(classObj => {
                                return (
                                    <MenuItem
                                        key={`class_${classObj.uri}`}
                                        value={classObj.uri}>
                                        {classObj.label}
                                    </MenuItem>
                                )
                            })}
                        </Select>
                    </FormControl>
                </Stack>
            </Paper>

            {analysisUrls.map(url => (
                <SelectionContainer
                    key={`container_${url}`}
                    fromDataset={url}
                    classUrl={selectedClass} />
            ))}
        </>
    )
}