import { useCallback, useEffect, useState } from "react";
import verovio from "verovio";
import { EventEmitter } from "../../helpers/EventEmitter";
import newVerovio from "../../helpers/loadVerovio";
import { Midi } from '@tonejs/midi'
import * as Tone from "tone";
import { Button } from "@mui/material";
import { PauseCircle, PlayCircle } from "@mui/icons-material";
interface VerovioProps {
  mei: string,
  onReady: () => void
}

export default function Verovio({
  mei,
  onReady
}: VerovioProps) {

  const [vrvToolkit, setVrvToolkit] = useState(undefined as undefined | verovio.toolkit)
  const [svg, setSvg] = useState('')
  const [pageWidth, setPageWidth] = useState(800);

  const [midi, setMidi] = useState<Midi>()
  const [playing, setPlaying] = useState(false)
  const [synths, setSynths] = useState<any[]>([])

  useEffect(() => {
    if (!svg.length) return

    setTimeout(onReady, 1000)
  }, [svg])

  const render = useCallback(() => {
    if (!vrvToolkit) return

    const pages = []
    const pageCount = vrvToolkit.getPageCount()
    for (let i = 1; i <= pageCount; i++) {
      pages.push(vrvToolkit!.renderToSVG(i));
    }
    setSvg(pages.join('\n'))

    const base64Midi = vrvToolkit!.renderToMIDI()
    const midiBuf = Uint8Array.from(window.atob(base64Midi), c => c.charCodeAt(0))
    setMidi(new Midi(midiBuf))
  }, [setSvg, vrvToolkit])

  const options = useCallback(
    () => ({
      systemMaxPerPage: 1,
      unit: 6,
      adjustPageHeight: true,
      breaks: 'smart' as 'smart',
      breaksSmartSb: 1.0,
      footer: 'none' as 'none',
      header: 'none' as 'none',
      pageWidth: pageWidth && pageWidth * 2,
      svgViewBox: true,
      svgHtml5: true,
    }),
    [pageWidth],
  )

  useEffect(() => {
    const loadVerovio = async () => {
      setSvg('loading verovio …')
      const vrvToolkit = await newVerovio()
      vrvToolkit.setOptions(options())
      setVrvToolkit(vrvToolkit)
      setSvg('verovio is ready')
    }

    loadVerovio()
  }, [setVrvToolkit, options]);

  useEffect(() => {
    mei && vrvToolkit && vrvToolkit.loadData(mei) && render();
  }, [render, mei, vrvToolkit]);

  const onClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const noteEl = (e.target as Element).closest('.note')
    if (!noteEl) {
      console.log('clicked element is not a note')
      return
    }

    const clickedElement = (e.target as Element).closest('[data-id]')
    const dataId = clickedElement?.getAttribute('data-id')
    if (!dataId) return

    // play just the given note using Tone.js
    const midiValues = vrvToolkit?.getMIDIValuesForElement(dataId)
    console.log('midiValues = ', midiValues)
    const synth = new Tone.Synth().toDestination();
    synth.triggerAttackRelease(Tone.Frequency(midiValues?.pitch || 50, "midi").toFrequency(), "8n");

    if (e.shiftKey) EventEmitter.dispatch('expand-active-selection', dataId)
    else if (e.altKey) EventEmitter.dispatch('remove-from-active-selection', dataId)
    else EventEmitter.dispatch('start-new-selection', dataId)
  }

  useEffect(() => {
    if (!midi) return

    if (playing) {
      const now = Tone.now() + 0.5
      midi.tracks.forEach((track) => {
        //create a synth for each track
        const synth = new Tone.PolySynth(Tone.Synth, {
          envelope: {
            attack: 0.02,
            decay: 0.1,
            sustain: 0.3,
            release: 1,
          },
        }).toDestination()
        synths.push(synth)
        //schedule all of the events
        track.notes.forEach((note) => {
          synth.triggerAttackRelease(
            note.name,
            note.duration * 0.3,
            note.time + now,
            note.velocity
          )
        })
      })
    }
    else {
      //dispose the synth and make a new one
      while (synths.length) {
        const synth = synths.shift();
        synth.disconnect();
      }
    }
  }, [playing])

  return (
    <>
      <Button onClick={() => setPlaying(!playing)}>
        {playing
          ? <PauseCircle />
          : <PlayCircle />
        }
      </Button>
      <div
        style={{ width: '65vw' }}
        className='verovio'
        dangerouslySetInnerHTML={{ __html: svg }}
        onClick={onClick} />
    </>
  );
}
