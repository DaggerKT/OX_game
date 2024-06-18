// eslint-disable-next-line
import React, { useState } from "react";
import "./App.css";

// eslint-disable-next-line
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";

// components
import Home from "./components/Home";
import Game from "./components/Game";

function App() {
  
  return (
    <div>
      <Router>
        <Switch>
          <Route path="/" exact component={Home} />
          <Route path="/game" component={Game} />
        </Switch>
      </Router>
    </div>
  );
}

export default App;
