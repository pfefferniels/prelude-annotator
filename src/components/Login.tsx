import { CombinedDataProvider, LoginButton, LogoutButton, Text, useSession } from "@inrupt/solid-ui-react";
import { FOAF } from "@inrupt/vocab-common-rdf";
import { ChangeCircleOutlined, Login, Logout } from "@mui/icons-material";
import { Button, CircularProgress, IconButton, Paper, Tooltip } from "@mui/material";
import { Stack } from "@mui/system";
import { useState } from "react";
import { PodProviderDialog } from "./PodProviderDialog";

function Profile() {
    const { session, sessionRequestInProgress } = useSession()
    if (sessionRequestInProgress) return <CircularProgress />

    const webId = session.info.webId

    if (!webId) return <span>Something went wrong</span>

    return (
        <CombinedDataProvider datasetUrl={webId} thingUrl={webId}>
            <Button disabled><Text property={FOAF.name} /></Button>
        </CombinedDataProvider>
    )
}

export function LoginForm() {
    const { session, sessionRequestInProgress } = useSession();
    const [oidcIssuer, setOidcIssuer] = useState('https://inrupt.net')
    const [podProviderDialogOpen, setPodProviderDialogOpen] = useState(false)

    return (
        <>
            {session.info.isLoggedIn ?
                <Paper>
                    <Stack direction='row'>
                        <LogoutButton>
                            <Tooltip title='Logout'>
                                <IconButton>
                                    <Logout />
                                </IconButton>
                            </Tooltip>
                        </LogoutButton>
                        <Profile />
                    </Stack>
                </Paper> :
                <>
                    <Tooltip title='Change Pod Provider'>
                        <IconButton onClick={() => setPodProviderDialogOpen(true)}>
                            <ChangeCircleOutlined />
                        </IconButton>
                    </Tooltip>
                    <LoginButton
                        oidcIssuer={oidcIssuer}
                        redirectUrl={window.location.href}
                        authOptions={{ clientName: 'Preludes Annotator' }}>
                        <Tooltip title='Login'>
                            <IconButton disabled={sessionRequestInProgress}>
                                {sessionRequestInProgress ? <CircularProgress /> : <Login />}
                            </IconButton>
                        </Tooltip>
                    </LoginButton>
                    <PodProviderDialog
                        oidcIssuer={oidcIssuer}
                        open={podProviderDialogOpen}
                        onClose={(issuer) => {
                            setPodProviderDialogOpen(false)
                            setOidcIssuer(issuer)
                        }} />
                </>
            }
        </>
    )
}