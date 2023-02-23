import { hasResourceInfo, buildThing, createThing, getSourceUrl, setThing, getThing, saveSolidDatasetAt, getSolidDataset, removeThing } from "@inrupt/solid-client"
import { DatasetContext, useSession } from "@inrupt/solid-ui-react"
import { RDF, DCTERMS } from "@inrupt/vocab-common-rdf"
import { Button } from "@mui/material"
import { Stack } from "@mui/system"
import { useContext } from "react"
import { v4 } from "uuid"
import { AnalysisContext } from "../context/AnalysisContext"
import { crminf, crm } from "../helpers/namespaces"
import { Argumentation } from "../types/Belief"
import { ArgumentationEditor } from "./ArgumentationEditor"

export const ArgumentationContainer = () => {
    const { session } = useSession()
    const { solidDataset: dataset, setDataset } = useContext(DatasetContext)
    const { analysisUrl, availableArgumentations } = useContext(AnalysisContext)
    
    const saveArgumentation = async (argumentation: Argumentation) => {
        if (!dataset || !hasResourceInfo(dataset)) return

        // stores the given argumentation into the personal POD
        const argumentationBuilder =
            buildThing(createThing({ url: argumentation.url }))
                .addUrl(RDF.type, crminf('I1_Argumentation'))
                .addUrl(crm('P14_carried_out_by'), argumentation.carriedOutBy)
                .addStringNoLocale(crm('P3_has_note'), argumentation.note)

        let modifiedDataset = dataset
        argumentation.concluded.map(belief => {
            return buildThing(createThing(belief.url !== '' ? {
                url: belief.url
            } : undefined))
                .addUrl(RDF.type, crminf('I2_Belief'))
                .addDate(DCTERMS.created, belief.time)
                .addDate(DCTERMS.modified, new Date(Date.now()))
                .addUrl(crminf('J4_that'), `${getSourceUrl(dataset)}#${belief.that}`)
                .addStringNoLocale(crminf('J5_holds_to_be'), belief.holdsToBe)
                .addStringNoLocale(crm('P3_has_note'), belief.note)
                .build()
        }).forEach(concludingBelief => {
            modifiedDataset = setThing(modifiedDataset, concludingBelief)
            argumentationBuilder.addUrl(crminf('J2_concluded_that'), concludingBelief)
        })

        const analysis = getThing(dataset, analysisUrl)
        if (!analysis) {
            console.log('Analysis', analysisUrl, 'not found in dataset')
            return
        }

        const updatedAnalysis = buildThing(analysis)
        updatedAnalysis.addUrl(crm('P3_consists_of'), argumentation.url)

        modifiedDataset = setThing(modifiedDataset, argumentationBuilder.build())
        modifiedDataset = setThing(modifiedDataset, updatedAnalysis.build())

        const savedDataset = await saveSolidDatasetAt(getSourceUrl(dataset), modifiedDataset, { fetch: session.fetch as any })
        setDataset(await getSolidDataset(getSourceUrl(savedDataset), { fetch: session.fetch as any }))
    }

    const removeArgumentation = async (argumentation: Argumentation) => {
        if (!dataset || !hasResourceInfo(dataset)) return
        const argumentationToRemove = getThing(dataset, argumentation.url)
        const beliefsToRemove = argumentation.concluded.map(belief => {
            return getThing(dataset, belief.url) || null
        })
            .filter(thing => thing !== null)

        // first remove the argumentation itself
        let modifiedDataset = dataset
        if (argumentationToRemove) {
            modifiedDataset = removeThing(dataset, argumentationToRemove)
        }

        // and then all the associated belief values
        beliefsToRemove.forEach(beliefThing => {
            modifiedDataset = removeThing(modifiedDataset, beliefThing!)
        })

        const savedDataset = await saveSolidDatasetAt(getSourceUrl(dataset), modifiedDataset, { fetch: session.fetch as any })
        setDataset(await getSolidDataset(getSourceUrl(savedDataset), { fetch: session.fetch as any }))
    }

    const createArgumentation = () => {
        if (!dataset || !hasResourceInfo(dataset)) return
        saveArgumentation({
            url: `${getSourceUrl(dataset)}#${v4()}`,
            carriedOutBy: session.info.webId || '',
            note: '',
            concluded: []
        })
    }

    return (
        <Stack spacing={2}>
            {availableArgumentations?.map(arg => (
                <ArgumentationEditor
                    key={`argumentation_editor_${arg.url}`}
                    argumentation={arg}
                    saveArgumentation={saveArgumentation}
                    removeArgumentation={() => removeArgumentation(arg)} />
            ))}
            <Button
                disabled={!session.info.isLoggedIn}
                onClick={() => {
                    createArgumentation()
                }}>Add Argumentation</Button>
        </Stack>
    )
}