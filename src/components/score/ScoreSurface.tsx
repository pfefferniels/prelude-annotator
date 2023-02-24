import { ToggleButton, ToggleButtonGroup } from "@mui/material"
import { useEffect, useState } from "react"
import Verovio from "./Verovio"
import { Stack } from "@mui/system"
import { tab2cmn } from "../../helpers/tab2cmn"
import { useSession } from "@inrupt/solid-ui-react"
import { getFile } from "@inrupt/solid-client"

type DisplayMode = 'staff-notation' | 'tablature'

interface ScoreSurfaceProps {
    meiUrl: string
    onReady: () => void
}

export const ScoreSurface = ({ meiUrl, onReady }: ScoreSurfaceProps) => {
    const { session } = useSession()
    const [displayMode, setDispayMode] = useState<DisplayMode>('tablature')
    const [tablatureMEI, setTablatureMEI] = useState('')
    const [cmnMEI, setCmnMEI] = useState('')

    useEffect(() => {
        const fetchMEI = async () => {
            // load the score from the given URL
            const blob = await getFile(meiUrl, { fetch: session.fetch as any })
            const text = await blob.text()

            // insert measures into it (for proper displaying in verovio)
            const xslt = await (await fetch('insertMeasures.xsl')).text()
            const xsltProcessor = new XSLTProcessor()
            xsltProcessor.importStylesheet(new DOMParser().parseFromString(xslt, 'application/xml'))
            const result = xsltProcessor.transformToDocument(new DOMParser().parseFromString(text, 'application/xml'))

            const tabMEI = new XMLSerializer().serializeToString(result)
            setTablatureMEI(tabMEI)

            // once the tablature MEI is set, make sure to have 
            // a CMN transcription immediately available
            setCmnMEI(tab2cmn(tabMEI))
        }
        fetchMEI()
    }, [meiUrl])

    useEffect(() => console.log('cmn=', cmnMEI), [cmnMEI])
    useEffect(() => console.log('cmn=', tablatureMEI), [tablatureMEI])

    return (
        <div style={{ margin: '1rem' }}>
            <Stack direction='row'>
                <ToggleButtonGroup
                    exclusive
                    size='small'
                    value={displayMode}
                    onChange={(_, newMode) => setDispayMode(newMode as DisplayMode)}>
                    <ToggleButton value='tablature' key='tablature'>
                        Tablature
                    </ToggleButton>
                    <ToggleButton value='staff-notation' key='staff-notation'>
                        Staff notation
                    </ToggleButton>
                </ToggleButtonGroup>
            </Stack>

            <Verovio
                onReady={onReady}
                mei={displayMode === 'tablature' ? tablatureMEI : cmnMEI} />
        </div>
    )
}

