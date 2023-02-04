import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Drawer, List, ListItem, ListItemText, Typography } from "@mui/material"
import { useEffect } from "react"
import { testMEI } from "./testMEI"
import { Selection } from "./Workspace"

interface WorkPickerProps {
    open: boolean
    onClose: () => void

    setMEI: (mei: string) => void
    setSelections: (selections: Selection[]) => void
}

export const WorkPicker = ({ open, onClose, setMEI, setSelections }: WorkPickerProps) => {
    useEffect(() => {
        // get a list of the works found in the dataset
    })

    const openWork = () => {
        setMEI(testMEI)
        setSelections([])
    }

    return (
        <Drawer open={open} onClose={onClose}>
            <Typography variant='h4'>Choose a Work</Typography>
            <List>
                <ListItem>
                    <ListItemText>Test MEI</ListItemText>
                </ListItem>
            </List>
            <Button variant='contained' onClick={() => {
                openWork()
                onClose()
            }}>Open</Button>
            <Button variant='outlined' onClick={onClose}>Cancel</Button>
        </Drawer>
    )
}