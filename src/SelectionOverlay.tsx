import React, { useEffect, useState } from "react";
import { Selection } from "./Workspace";
import * as d3 from 'd3'
import { createPortal } from 'react-dom';

interface SelectionOverlayProps {
    selection: Selection
    removeSelection: (id: string) => void
    setActiveSelection: (id: string) => void

    svgBackground: Element
}

/**
 * This component draws a hull around a given selection 
 * into the `svgBackground` prop.
 */
export const SelectionOverlay = ({
    selection,
    removeSelection,
    setActiveSelection,
    svgBackground }: SelectionOverlayProps) => {

    const [hullPoints, setHullPoints] = useState<[number, number][]>()

    useEffect(() => {
        // collect the points of the selection
        const points: [number, number][] =
            selection.refs
                .reduce((result, ref) => {
                    const el = document.querySelector(`[data-id='${ref}']`) as SVGGElement
                    if (!el) return result

                    const bbox = el.getBBox()
                    return [
                        ...result,
                        [bbox.x + 50, bbox.y + 50],
                        [bbox.x + 100, bbox.y + 50],
                        [bbox.x + 50, bbox.y + 100],
                        [bbox.x + 100, bbox.y + 100]
                    ] as [number, number][]
                }, [] as [number, number][])


        // build a hull around these points
        const hullPoints = d3.polygonHull(points)
        if (hullPoints) setHullPoints(hullPoints)
    }, [selection, removeSelection, setActiveSelection, svgBackground])

    return (
        <>
            {hullPoints && createPortal(
                <path
                    className='hull'
                    d={`M${hullPoints.join(" L ")} Z`}
                    onClick={(e) => {
                        if (e.altKey) removeSelection(selection.id)
                        else setActiveSelection(selection.id)
                    }} />,
                svgBackground
            )}
        </>
    )
}
