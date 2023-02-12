import React, { useEffect, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import { DatasetContext, SessionProvider, useSession } from '@inrupt/solid-ui-react';
import { Workspace } from './components/Workspace';
import { LoginForm } from './components/Login';
import { getPodUrlAll, getSolidDataset, SolidDataset } from '@inrupt/solid-client';

const WorkspaceWithDataset = () => {
  const [solidDataset, setDataset] = useState<SolidDataset>()
  const { session } = useSession()

  useEffect(() => {
    if (!session.info.isLoggedIn || !session.info.webId) return

    const fetchDataset = async () => {
      const podUrl = await getPodUrlAll(session.info.webId!, { fetch: session.fetch as any })
      setDataset(await getSolidDataset(podUrl + 'preludes/works.ttl', { fetch: session.fetch as any }))
    }
    fetchDataset()
  }, [session.info.isLoggedIn])

  useEffect(() => console.log(solidDataset), [solidDataset])

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
