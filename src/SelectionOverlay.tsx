import React, { useEffect } from "react";
import ReactDOM from 'react-dom/client';
import { Selection } from "./Workspace";

interface SelectionOverlayProps {
    selection: Selection
    removeSelection: (id: string) => void
    setActiveSelection: (id: string) => void
}

export const SelectionOverlay = ({ selection, removeSelection, setActiveSelection }: SelectionOverlayProps) => {
    useEffect(() => {
        //const root = ReactDOM.createRoot(
        //    document.getElementById('#underlay_container') as HTMLElement
        //);
        //root.render(
        //    <React.StrictMode>
        //        <path onClick={(e) => {
        //            if (e.shiftKey && e.altKey) removeSelection(selection.id)
        //            else setActiveSelection(selection.id)
        //        }} />
        //    </React.StrictMode>
        //);
    })

    return (
        <></>
    )
}
