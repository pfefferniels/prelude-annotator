import { useCallback, useEffect, useState } from "react";
import verovio from "verovio";
import { EventEmitter } from "../../helpers/EventEmitter";
import newVerovio from "../../helpers/loadVerovio";

interface VerovioProps {
  mei: string,
  // startNewSelection: (ref: string) => void
  // expandActiveSelection: (ref: string) => void
  // removeFromActiveSelection: (ref: string) => void
  onReady: () => void
}

export default function Verovio({
  mei,
  // startNewSelection,
  // expandActiveSelection,
  // removeFromActiveSelection,
  onReady
}: VerovioProps) {

  const [vrvToolkit, setVrvToolkit] = useState(undefined as undefined | verovio.toolkit)
  const [svg, setSvg] = useState('')
  const [pageWidth, setPageWidth] = useState(800);

  useEffect(() => {
    if (!svg.length) return

    setTimeout(onReady, 1000)
  }, [svg])

  const render = useCallback(() => {
    if (!vrvToolkit) return

    const pages = []
    const pageCount = vrvToolkit.getPageCount()
    for (let i=1; i<=pageCount; i++) {
      pages.push(vrvToolkit!.renderToSVG(i));
    }
    setSvg(pages.join('\n'))
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

    if (e.shiftKey) EventEmitter.dispatch('expand-active-selection', dataId)
    else if (e.altKey) EventEmitter.dispatch('remove-from-active-selection', dataId)
    else {
      console.log('dispatch')
      EventEmitter.dispatch('start-new-selection', dataId)
    }
  }

  return (
    <>
      <div
        style={{ width: '65vw' }}
        className='verovio'
        dangerouslySetInnerHTML={{ __html: svg }}
        onClick={onClick} />
    </>
  );
}
