import React, { useState } from 'react';
import logo from './logo.svg';
import './App.css';
import { DatasetProvider, LoginButton, SessionProvider } from '@inrupt/solid-ui-react';
import { Workspace } from './Workspace';
import { WorkPicker } from './WorkPicker';
import { LoginForm } from './Login';



function App() {
  const [datasetUrl, setDatasetUrl] = useState('https://pfefferniels.inrupt.net/preludes/works.ttl')

  return (
    <SessionProvider sessionId="prelude-annotator">
      <div className="App">
        <header className="App-header">
          <LoginForm />
        </header>

        <DatasetProvider datasetUrl={datasetUrl}>
          <Workspace />
        </DatasetProvider>
      </div>
    </SessionProvider>
  );
}

export default App;
