import React, { useState } from 'react';
import logo from './logo.svg';
import './App.css';
import { LoginButton, SessionProvider } from '@inrupt/solid-ui-react';
import { Workspace } from './Workspace';
import { WorkPicker } from './WorkPicker';

function App() {
  return (
    <SessionProvider sessionId="prelude-annotator">
      <div className="App">
        <header className="App-header">
          <LoginButton
            oidcIssuer="https://inrupt.net"
            redirectUrl="https://localhost:3000/"
          />
        </header>
        <Workspace />
      </div>
    </SessionProvider>
  );
}

export default App;
