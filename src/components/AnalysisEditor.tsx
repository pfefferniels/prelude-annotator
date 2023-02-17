import { Save } from "@mui/icons-material"
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material"
import { useState } from "react"

interface AnalysisEditorProps {
    open: boolean
    onClose: () => void

    onCreate: (title: string) => void
}

export const AnalysisEditor = ({ open, onClose, onCreate }: AnalysisEditorProps) => {
    const [title, setTitle] = useState('')

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Create or Edit Analysis</DialogTitle>
            <DialogContent>
                <TextField
                    label='Title'
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
            </DialogContent>
            <DialogActions>
                <Button
                    startIcon={<Save />}
                    variant='contained'
                    onClick={() => {
                        onCreate(title)
                        onClose()
                    }}>
                    Save
                </Button>
                <Button
                    onClick={onClose}
                    variant='outlined'>Cancel</Button>
            </DialogActions>
        </Dialog>
    )
}