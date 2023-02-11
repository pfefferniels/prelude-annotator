import React, { useEffect, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import { DatasetProvider, LoginButton, SessionProvider, useSession } from '@inrupt/solid-ui-react';
import { Workspace } from './components/Workspace';
import { WorkPicker } from './components/WorkPicker';
import { LoginForm } from './components/Login';
import { getPodUrlAll } from '@inrupt/solid-client';

const WorkspaceWithDataset = () => {
  const [datasetUrl, setDatasetUrl] = useState('https://pfefferniels.inrupt.net/preludes/works.ttl')
  const { session } = useSession()

  useEffect(() => {
    if (session.info.isLoggedIn && session.info.webId) {
      getPodUrlAll(session.info.webId, { fetch: session.fetch as any })
        .then(podUrl => {
          setDatasetUrl(podUrl + 'preludes/works.ttl')
        })
    }
  }, [session])

  useEffect(() => console.log(datasetUrl), [datasetUrl])

  return (
    <DatasetProvider datasetUrl={datasetUrl}>
      <Workspace />
    </DatasetProvider>

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
