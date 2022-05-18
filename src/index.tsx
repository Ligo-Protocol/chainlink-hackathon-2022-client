import React from "react";
import ReactDOM from "react-dom/client";
import reportWebVitals from "./reportWebVitals";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MoralisProvider } from "react-moralis";

import "bootstrap/dist/css/bootstrap.min.css";
import LigoHeader from "./components/LigoHeader";
import Vehicles from "./components/Vehicles";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <MoralisProvider
      serverUrl={process.env.REACT_APP_MORALIS_SERVER!}
      appId={process.env.REACT_APP_MORALIS_APP_ID!}
    >
      <LigoHeader />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Vehicles />} />
          <Route path="/browse" element={<div>Hello 2</div>} />
        </Routes>
      </BrowserRouter>
    </MoralisProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
