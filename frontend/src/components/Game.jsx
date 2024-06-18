import React, { useEffect, useState } from "react";
import "./Game.css";
import axios from "axios";

// components
import Board from "./Board";
import ScoreBoard from "./ScoreBoard";

function App() {
  // ถ้าบน routr path มี /?board=3 ให้ตั้งตามค่าที่ส่งมา
  // ไม่มีให้ใช้ค่า 3
  const handleCheckBoardSize = (boardSize) => {
    if (boardSize < 3) {
      return 3;
    } else if (boardSize > 10) {
      return 10;
    }
    return boardSize;
  };
  const [countLoading, setCountLoading] = useState(0);
  const params = new URLSearchParams(window.location.search);
  const boardSize = parseInt(params.get("board"), 10);
  const defaultBoardSize = handleCheckBoardSize(boardSize);

  // eslint-disable-next-line
  const [board, setBoard] = useState(defaultBoardSize);
  // eslint-disable-next-line
  const [isBot, setIsBot] = useState(params.get("bot") ? true : false);
  const [gameId, setGameId] = useState(null);
  const [score, setScore] = useState({ x_score: 0, o_score: 0 });
  const [xPlayer, setXPlayer] = useState(true);
  const [gameOver, setGameOver] = useState(false);

  const handleMove = (index, winner) => {
    if (winner) {
      postWinGame(gameId, winner).then((data) => {
        console.log("postWinGame: ", data);
      });
      setGameOver(true);
    }
    if (gameOver) {
      return;
    }

    postMoveGame(gameId, xPlayer ? "X" : "O", board, index).then((data) => {
      console.log("postMoveGame: ", data);
      console.log("if: ", isBot && xPlayer);
      if (isBot && xPlayer) {
        postAIMove(gameId, "O", board).then((data) => {
          console.log("postAIMove: ", data);
          handleMove(data.position, data.winner);
        });
      }
    })
  };

  const handleReset = () => {
    postSetupGame(defaultBoardSize, isBot).then((data) => {
      setGameId(data.game_id);
    });
  };

  useEffect(() => {
    if (!countLoading) {
      postSetupGame(defaultBoardSize, isBot).then((data) => {
        setGameId(data.game_id);
      });
      setCountLoading(countLoading + 1);
    } else {
      return;
    }
  }, [countLoading]);

  return (
    <div className="App">
      <ScoreBoard score={score} xPlayer={xPlayer} />{" "}
      <Board
        board={board}
        score={score}
        setScore={setScore}
        xPlayer={xPlayer}
        setXPlayer={setXPlayer}
        gameOver={gameOver}
        setGameOver={setGameOver}
        onMove={handleMove}
        reBoard={handleReset}
      />{" "}
    </div>
  );
}

export default App;

// function
async function postSetupGame(boardSize, isBot) {
  try {
    let payload = {
      board_size: boardSize,
      player1: "Player1",
      player2: isBot ? "Bot" : "Player2",
    };
    const response = await axios.post(
      "http://localhost:8080/api/game/new",
      payload
    );

    return response.data;
  } catch (error) {
    console.error(error, "postSetupGame");
  }
}

async function postMoveGame(gameId, player, boardSize = 3, index) {
  try {
    const setPosition = getIndicesOf(boardSize, index);

    console.log("setPosition: ", setPosition);

    let payload = {
      player: player,
      position: setPosition,
    };
    const response = await axios.post(
      `http://localhost:8080/api/game/${gameId}/move`,
      payload
    );

    return response.data;
  } catch (error) {
    console.error(error, "postMoveGame");
  }
}

async function postWinGame(gameId, winner) {
  try {
    let payload = {
      winner: winner === "X" || winner === "O" ? winner : null,
      result: winner === "draw" ? "draw" : "win",
    };
    const response = await axios.post(
      `http://localhost:8080/api/game/${gameId}/winner`,
      payload
    );

    return response.data;
  } catch (error) {
    console.error(error, "postWinGame");
  }
}

// AI Move
async function postAIMove(gameId, player, boardSize = 3) {
  try {
    const response = await axios.post(
      `http://localhost:8080/api/game/${gameId}/bot-move`
    );

    return response.data;
  } catch (error) {
    console.error(error, "postAIMove");
  }
}

function getIndicesOf(maxCols = 10, Idx) {
  const rowIdx = Math.floor(Idx / maxCols);
  const colIdx = Idx % maxCols;
  console.log("rowIdx: ", rowIdx);
  console.log("colIdx: ", colIdx);
  return `${rowIdx},${colIdx}`;
}
