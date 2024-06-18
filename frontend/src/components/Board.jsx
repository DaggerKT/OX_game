import React, { useState } from "react";

import "./Board.css";

// components
import Box from "./Box";
import ResetBtn from "./ResetBtn";

function calculateLines(board) {
  const lines = [];
  // แนวนอน
  for (let i = 0; i < board; i++) {
    const line = [];
    for (let j = 0; j < board; j++) {
      line.push(i * board + j);
    }
    lines.push(line);
  }
  // แนวตั้ง
  for (let i = 0; i < board; i++) {
    const line = [];
    for (let j = 0; j < board; j++) {
      line.push(j * board + i);
    }
    lines.push(line);
  }
  // แนวทะแยง
  const diagonal1 = [];
  const diagonal2 = [];
  for (let i = 0; i < board; i++) {
    diagonal1.push(i * board + i);
    diagonal2.push(i * board + (board - 1 - i));
  }
  lines.push(diagonal1);
  lines.push(diagonal2);

  return lines;
}

export default function Board({
  board,
  score,
  setScore,
  xPlayer,
  setXPlayer,
  gameOver,
  setGameOver,
  onMove,
  reBoard,
}) {
  if (!board) {
    board = 3;
  }
  const qtyBox = board * board;
  const [boxes, setBoxes] = useState(Array(qtyBox).fill(null));

  const handleClick = (i) => {
    const newBoxes = [...boxes];
    newBoxes[i] = xPlayer ? "X" : "O";
    setBoxes(newBoxes);

    const winner = checkWinner(newBoxes);
    onMove(i, winner);
    if (winner) {
      if (winner === "X") {
        setScore({ ...score, x_score: score.x_score + 1 });
      } else {
        setScore({ ...score, o_score: score.o_score + 1 });
      }
    }
    setXPlayer(!xPlayer);
  };

  const checkWinner = (boxes) => {
    const lines = calculateLines(board);

    for (let line of lines) {
      const [a, b, c] = line;
      if (boxes[a] && boxes[a] === boxes[b] && boxes[a] === boxes[c]) {
        setGameOver(true);
        return boxes[a];
      }
    }
    // ถ้า เสมอ
    if (!boxes.includes(null)) {
      setGameOver(true);
      return "draw";
    }
    return null;
  };

  const resetBoard = () => {
    setBoxes(Array(qtyBox).fill(null));
    setGameOver(false);
    reBoard();
  };

  const style = {
    display: "grid",
    gridTemplateColumns: `repeat(${board}, 1fr)`,
    gridTemplateRows: `repeat(${board}, 1fr)`,
    gap: "5px",
  };
  return (
    <div className="board-layout">
      <div className="board" style={style}>
        {boxes.map((box, i) => (
          <Box
            key={i}
            value={box}
            onClick={() => {
              if (!box && !gameOver) {
                handleClick(i);
              } else if (gameOver) {
                resetBoard();
              } else {
                return;
              }
            }}
          />
        ))}
      </div>
      <div className="btn-container">
        <button
          className="btn-blue"
          onClick={() => {
            window.location.href = "/";
          }}
        >
          Back to Home
        </button>
        <ResetBtn onClick={resetBoard} />
      </div>
    </div>
  );
}
