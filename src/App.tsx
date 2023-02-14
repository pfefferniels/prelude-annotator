import React, { useEffect, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import { DatasetContext, SessionProvider, useSession } from '@inrupt/solid-ui-react';
import { LoginForm } from './components/Login';
import { Workspace2 } from './components/Workspace2';

const App = () => {
  return (
    <SessionProvider sessionId="prelude-annotator">
      <div className="App">
        <LoginForm />
        <Workspace2 />
      </div>
    </SessionProvider>
  );
}

export default App;
