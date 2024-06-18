import React from "react";

import "./ScoreBoard.css";

export default function ScoreBoard({ score, xPlayer }) {
  return (
    <div className="score-layout">
      <span className={`score x-score ${!xPlayer && "inactive"}`}>X: {score.x_score}</span>
      <span className={`score o-score ${xPlayer && "inactive"}`}>O: {score.o_score}</span>
    </div>
  );
}
