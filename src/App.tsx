import React from 'react';
import logo from './logo.svg';
import './App.css';
import axios from 'axios';
import Smartcar from '@smartcar/auth';

async function onComplete(err: any, code: any, status: any) {
  console.log(process.env.REACT_APP_LIGO_NODE_ENDPOINT)
  const resp = await axios.post(`${process.env.REACT_APP_LIGO_NODE_ENDPOINT}/api/v0/smartcar/authorize`, {code: code})
  console.log(resp)
}

function App() {
  const smartcar = new Smartcar({
    clientId: process.env.REACT_APP_CLIENT_ID,
    redirectUri: process.env.REACT_APP_REDIRECT_URI,
    scope: ['required:read_vehicle_info', 'required:read_odometer', 'required:read_location'],
    testMode: true,
    onComplete: onComplete,
  });

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <button onClick={() => {
          smartcar.openDialog({forcePrompt: true});
        }}>Connect To Smartcar</button>
      </header>
    </div>
  );
}

export default App;
