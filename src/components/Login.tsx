import { CombinedDataProvider, LoginButton, LogoutButton, Text, useSession } from "@inrupt/solid-ui-react";
import { FOAF } from "@inrupt/vocab-common-rdf";
import { Login, Logout } from "@mui/icons-material";
import { Button, CircularProgress, IconButton, Paper, Tooltip } from "@mui/material";
import { Stack } from "@mui/system";

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
                    <LoginButton
                        oidcIssuer='https://inrupt.net'
                        redirectUrl={window.location.href}
                        authOptions={{ clientName: 'Preludes Annotator' }}>
                        <Tooltip title='Login'>
                            <IconButton disabled={sessionRequestInProgress}>
                                {sessionRequestInProgress ? <CircularProgress /> : <Login />}
                            </IconButton>
                        </Tooltip>
                    </LoginButton>
                </>
            }
        </>
    )
}