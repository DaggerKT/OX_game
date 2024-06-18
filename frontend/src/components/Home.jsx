import React, { useState } from "react";
import "./Home.css";
import { useHistory } from "react-router-dom/cjs/react-router-dom";

function Home() {
  const [boardSize, setBoardSize] = useState(3);
  const history = useHistory();

  const handleInputChange = (e) => {
    setBoardSize(Number(e.target.value));
  };

  const btnAction = [
    {
      name: "VS Player",
      action: () => {
        history.push(`/game?board=${boardSize}`);
        window.location.reload();
      },
      className: "btn-blue",
    },
    {
      name: "VS Bot",
      action: () => {
        history.push(`/game?board=${boardSize}&bot=true`);
        window.location.reload();
      },
      className: "btn-green",
    },
  ];
  return (
    <div className="home">
      <h1>OX Game</h1>
      <div className="input-row">
        <label htmlFor="board">Board size:</label>
        <input
          type="number"
          id="board"
          name="board"
          min="3"
          max="10"
          value={boardSize}
          onChange={handleInputChange}
        />
      </div>
      <div className="btn-clo">
        {btnAction.map((btn, index) => (
          <button key={index} onClick={btn.action} className={btn.className}>
            {btn.name}
          </button>
        ))}
      </div>
    </div>
  );
}

export default Home;
