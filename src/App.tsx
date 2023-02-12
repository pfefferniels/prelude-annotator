import React, { useEffect, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import { DatasetContext, DatasetProvider, LoginButton, SessionProvider, useSession } from '@inrupt/solid-ui-react';
import { Workspace } from './components/Workspace';
import { WorkPicker } from './components/WorkPicker';
import { LoginForm } from './components/Login';
import { getPodUrlAll, getSolidDataset, SolidDataset } from '@inrupt/solid-client';

const WorkspaceWithDataset = () => {
  const [solidDataset, setDataset] = useState<SolidDataset>()
  const { session } = useSession()

  useEffect(() => {
    const fetchDataset = async () => {
      if (session.info.isLoggedIn && session.info.webId) {
        const podUrl = await getPodUrlAll(session.info.webId, { fetch: session.fetch as any })
        setDataset(await getSolidDataset(podUrl + 'preludes/works.ttl', { fetch: session.fetch as any }))
      }
  
    }
  }, [session])

  return (
    <DatasetContext.Provider value={{
      solidDataset,
      setDataset
    }}>
      <Workspace />
    </DatasetContext.Provider>

  )
}

const App = () => {
  return (
    <SessionProvider sessionId="prelude-annotator">
      <div className="App">
        <LoginForm />

        <WorkspaceWithDataset />
      </div>
    </SessionProvider>
  );
}

export default App;
