const express = require('express');
const router = express.Router();
const mysql = require('mysql');

// function other
function getCurrentDateTime() {
    const now = new Date();
    return now.toISOString().slice(0, 19).replace('T', ' ');
}

// อัลกอริธึม Minimax
function minimax(board, depth, isMaximizing) {
    // console.log("============= minimax ==============")
    const scores = {
        X: -1,
        O: 1,
        tie: 0
    };

    const result = checkWinner(board);
    if (result !== null) {
        // console.log("result checkWinner: ", result)
        return scores[result];
    }

    let bestScore;
    if (isMaximizing) {
        bestScore = -Infinity; // เริ่มต้นที่ -Infinity สำหรับการหาคะแนนที่สูงสุดของ AI
        for (let i = 0; i < board.length; i++) {
            for (let j = 0; j < board[i].length; j++) {
                if (board[i][j] === "") {
                    board[i][j] = 'O';
                    const score = minimax(board, depth + 1, false);
                    board[i][j] = "";
                    bestScore = Math.max(score, bestScore);
                }
            }
        }
    } else {
        bestScore = Infinity; // เริ่มต้นที่ Infinity สำหรับการหาคะแนนที่ต่ำสุดของผู้เล่น
        for (let i = 0; i < board.length; i++) {
            for (let j = 0; j < board[i].length; j++) {
                if (board[i][j] === "") {
                    board[i][j] = 'X';
                    const score = minimax(board, depth + 1, true);
                    board[i][j] = "";
                    bestScore = Math.min(score, bestScore);
                }
            }
        }
    }
    // console.log("bestScore: ", bestScore)
    return bestScore;
}

// ตรวจสอบผลลัพธ์ของเกม
function checkWinner(board) {
    const n = board.length; // ขนาดของกระดาน

    // ตรวจสอบแถวและคอลัมน์
    for (let i = 0; i < n; i++) {
        let rowEqual = true;
        let colEqual = true;
        for (let j = 0; j < n - 1; j++) {
            rowEqual = rowEqual && board[i][j] !== "" && board[i][j] === board[i][j + 1];
            colEqual = colEqual && board[j][i] !== "" && board[j][i] === board[j + 1][i];
        }
        if (rowEqual || colEqual) {
            return board[i][0]; // return 'X' or 'O'
        }
    }

    // ตรวจสอบแนวทแยง
    let diag1Equal = true;
    let diag2Equal = true;
    for (let i = 0; i < n - 1; i++) {
        diag1Equal = diag1Equal && board[i][i] !== "" && board[i][i] === board[i + 1][i + 1];
        diag2Equal = diag2Equal && board[i][n - 1 - i] !== "" && board[i][n - 1 - i] === board[i + 1][n - 2 - i];
    }
    if (diag1Equal || diag2Equal) {
        return board[0][0]; // return 'X' or 'O'
    }

    // ตรวจสอบว่าเสมอ
    // if (board.flat().every(cell => cell !== "")) {
    //     return 'tie';
    // }
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            if (board[i][j] === "") { // ถ้ายังมีช่องว่างอยู่ แสดงว่ายังไม่เสมอ
                return null;
            }
        }
    }
    return 'tie';
}

function randomMove(board) {
    const n = board.length;
    const emptyCells = [];
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            if (board[i][j] === "") {
                emptyCells.push([i, j]);
            }
        }
    }
    if (emptyCells.length === 0) {
        return null;
    }
    const randomIndex = Math.floor(Math.random() * emptyCells.length);
    return emptyCells[randomIndex];
}

// MySQL connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root', // ใช้รหัสผ่านของ MySQL ที่ตั้งค่าใน MAMP
    database: 'ox_game',
    port: 8889 // ใช้พอร์ตที่ตั้งค่าใน MAMP (ค่าเริ่มต้นคือ 8889)
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed: ' + err.stack);
        return;
    }
    console.log('Connected to database.');
});

// Test endpoint
router.get('/test', (req, res) => {
    res.status(200).json({ message: "Test endpoint" });
});

// Create new game
router.post('/new', (req, res) => {
    const { board_size, player1, player2 } = req.body;
    const initialBoardState = JSON.stringify({
        size: board_size,
        cells: Array(board_size).fill().map(() => Array(board_size).fill(""))
    });

    const query = `INSERT INTO game_state (board_size, current_turn, board_state, player1, player2) VALUES (?, 'X', ?, ?, ?)`;

    db.query(query, [board_size, initialBoardState, player1, player2], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        const gameId = result.insertId;
        res.status(200).json({ game_id: gameId });
    });
});

// Get game state
router.get('/:game_id', (req, res) => {
    const { game_id } = req.params;

    const query = `SELECT * FROM game_state WHERE game_id = ?`;

    db.query(query, [game_id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: "Game not found" });
        }
        res.status(200).json(results[0]);
    });
});

// Make a move
router.post('/:game_id/move', (req, res) => {
    const { game_id } = req.params;
    const { player, position } = req.body;

    db.beginTransaction((err) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        const selectQuery = `SELECT * FROM game_state WHERE game_id = ?`;
        db.query(selectQuery, [game_id], (err, results) => {
            if (err) {
                return db.rollback(() => {
                    res.status(500).json({ error: err.message });
                });
            }
            if (results.length === 0) {
                return res.status(404).json({ error: "Game not found" });
            }

            const row = results[0];
            const boardState = JSON.parse(row.board_state);
            const [rowIdx, colIdx] = position.split(',').map(Number);
            if (boardState.cells[rowIdx][colIdx] !== "") {
                return res.status(400).json({ error: "Position already occupied" });
            }
            boardState.cells[rowIdx][colIdx] = player;
            const updatedBoardState = JSON.stringify(boardState);
            const nextTurn = player === 'X' ? 'O' : 'X';
            const currentDateTime = getCurrentDateTime();

            const updateQuery = `UPDATE game_state SET board_state = ? , current_turn = ? , updated_at = ? WHERE game_id = ? `;
            db.query(updateQuery, [updatedBoardState, nextTurn, currentDateTime, game_id], (err) => {
                if (err) {
                    return db.rollback(() => {
                        res.status(500).json({ error: err.message });
                    });
                }
                const countNumber = 0
                const findeMoveNumber = `SELECT COUNT(game_id) FROM move_history WHERE game_id = ? `;
                db.query(findeMoveNumber, [game_id], (err, results) => {
                    if (err) {
                        return db.rollback(() => {
                            res.status(500).json({ error: err.message });
                        });
                    }
                    const moveNumber = results[0]['COUNT(game_id)'] + 1
                    const insertMoveQuery = `INSERT INTO move_history(game_id, player, move_number, position) VALUES( ? , ? , ?, ? )`;
                    db.query(insertMoveQuery, [game_id, player, moveNumber, position], (err) => {
                        if (err) {
                            return db.rollback(() => {
                                res.status(500).json({ error: err.message });
                            });
                        }

                        db.commit((err) => {
                            if (err) {
                                return db.rollback(() => {
                                    res.status(500).json({ error: err.message });
                                });
                            }
                            res.status(200).json({ message: "Move recorded" });
                        });
                    });
                });
            });
        });
    });
});

// Save Winner
router.post('/:game_id/winner', (req, res) => {
    const { game_id } = req.params;
    const { winner, result } = req.body;
    const updateQuery = `INSERT INTO game_results(game_id, winner, end_time, result) VALUES (?, ?, ?, ?)`;
    const currentDateTime = getCurrentDateTime();
    db.query(updateQuery, [game_id, winner, currentDateTime, result], (err) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json({ message: "Winner recorded" });
    });
});

// AI Move โดย AI จะเล่นเป็น O เท่านั้น
router.post('/:game_id/ai-move', (req, res) => {
    console.log(" ")
    console.log("================== AI Move ==================")
    const { game_id } = req.params;

    // ดึงสถานะปัจจุบันของเกมจากฐานข้อมูล
    const selectQuery = `SELECT * FROM game_state WHERE game_id = ?`;

    db.query(selectQuery, [game_id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: "Game not found" });
        }

        const game_state = results[0];
        const boardState = JSON.parse(game_state.board_state);
        // ตรวจสอบว่าเกมจบแล้วหรือยัง
        const result = checkWinner(boardState.cells);
        console.log("result checkWinner: ", result);
        if (result !== null) {
            return res.status(400).json({ error: "Game already ended" });
        }

        // ประยุกต์ใช้ Minimax เพื่อกำหนดการเล่นของ AI
        let bestScore = -Infinity;
        console.log("bestScore: ", bestScore)
        let move = { row: -1, col: -1 }; // กำหนดค่าเริ่มต้นของ move
        console.log("move: ", move)
        console.log("boardState.cells: ", boardState.cells)
        console.log(" ")

        for (let i = 0; i < boardState.cells.length; i++) {
            console.log(`${i} boardState.cells`, boardState.cells[i])
            for (let j = 0; j < boardState.cells[i].length; j++) {
                console.log(`=> ${i}.${j} boardState.cells[i]`, boardState.cells[i][j])
                if (boardState.cells[i][j] === "") {
                    boardState.cells[i][j] = 'O'; // จำลองการเล่นของ AI
                    console.log(`==> ${i}.${j} boardState.cells[i]`, boardState.cells[i][j])
                    const score = minimax(boardState.cells, 0, false);
                    console.log(`==> ${i}.${j} score`, score)
                    boardState.cells[i][j] = "";

                    console.log(`==> ${i}.${j} score > bestScore`, score, bestScore, score > bestScore)
                    if (score > bestScore) {
                        bestScore = score;
                        move.row = i;
                        move.col = j;
                    }
                }
            }
        }

        // อัปเดตสถานะกระดานด้วยการเล่นของ AI
        if (move && move.row !== undefined && move.col !== undefined) {
            boardState.cells[move.row][move.col] = 'O';
        }

        // คำนวณหมายเลขการเล่น
        const findMoveNumberQuery = `
                                            SELECT COUNT( * ) AS move_count FROM move_history WHERE game_id = ? `;
        db.query(findMoveNumberQuery, [game_id], (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            const move_number = results[0].move_count + 1;

            // เตรียมคิวรี่อัปเดตสถานะเกมและคิวรี่ใส่ข้อมูลการเล่นในประวัติการเคลื่อนไหว
            const updateGameStateQuery = `
                                            UPDATE game_state SET board_state = ? , current_turn = ? , updated_at = ? WHERE game_id = ? `;
            const insertMoveHistoryQuery = `
                                            INSERT INTO move_history(game_id, player, move_number, position) VALUES( ? , ? , ? , ? )
                                            `;

            const updatedBoardState = JSON.stringify(boardState);

            db.beginTransaction((err) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }

                const currentDateTime = getCurrentDateTime();

                // อัปเดตสถานะเกมด้วยสถานะกระดานใหม่และการหมุนต่อไป
                db.query(updateGameStateQuery, [updatedBoardState, 'X', currentDateTime, game_id], (err) => {
                    if (err) {
                        return db.rollback(() => {
                            res.status(500).json({ error: err.message });
                        });
                    }

                    // ใส่การเล่นของ AI เข้าสู่ประวัติการเคลื่อนไหว
                    db.query(insertMoveHistoryQuery, [game_id, 'O', move_number, `
                                            $ { move.row }, $ { move.col }
                                            `], (err) => {
                        if (err) {
                            return db.rollback(() => {
                                res.status(500).json({ error: err.message });
                            });
                        }

                        // ยืนยันการทำธุรกรรม
                        db.commit((err) => {
                            if (err) {
                                return db.rollback(() => {
                                    res.status(500).json({ error: err.message });
                                });
                            }

                            res.status(200).json({ message: "AI move recorded" });
                        });
                    });
                });
            });
        });
    });
});

// Bot Random Move
router.post('/:game_id/bot-move', (req, res) => {
    console.log(" ")
    console.log("================== Bot Move ==================")
    const { game_id } = req.params;

    // ดึงสถานะปัจจุบันของเกมจากฐานข้อมูล
    const selectQuery = `SELECT * FROM game_state WHERE game_id = ?`;

    db.query(selectQuery, [game_id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: "Game not found" });
        }

        const game_state = results[0];
        const boardState = JSON.parse(game_state.board_state);
        // ตรวจสอบว่าเกมจบแล้วหรือยัง
        const result = checkWinner(boardState.cells);
        console.log("result checkWinner: ", result);
        if (result !== null) {
            return res.status(400).json({ error: "Game already ended" });
        }

        // ประยุกต์ใช้ Minimax เพื่อกำหนดการเล่นของ AI
        let move = randomMove(boardState.cells);
        console.log("move: ", move)
        console.log("boardState.cells: ", boardState.cells)
        console.log(" ")

        // อัปเดตสถานะกระดานด้วยการเล่นของ AI
        if (move && move[0] !== undefined && move[1] !== undefined) {
            boardState.cells[move[0]][move[1]] = 'O';
        }

        // คำนวณหมายเลขการเล่น
        const findMoveNumberQuery = `SELECT COUNT( * ) AS move_count FROM move_history WHERE game_id = ? `;
        db.query(findMoveNumberQuery, [game_id], (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            const move_number = results[0].move_count + 1;

            // เตรียมคิวรี่อัปเดตสถานะเกมและคิวรี่ใส่ข้อมูลการเล่นในประวัติการเคลื่อนไหว
            const updateGameStateQuery = `UPDATE game_state SET board_state = ? , current_turn = ? , updated_at = ? WHERE game_id = ? `;
            const insertMoveHistoryQuery = `INSERT INTO move_history(game_id, player, move_number, position) VALUES( ? , ? , ? , ? )`;

            const updatedBoardState = JSON.stringify(boardState);

            db.beginTransaction((err) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }

                const currentDateTime = getCurrentDateTime();

                // อัปเดตสถานะเกมด้วยสถานะกระดานใหม่และการหมุนต่อไป
                db.query(updateGameStateQuery, [updatedBoardState, 'X', currentDateTime, game_id], (err) => {
                    if (err) {
                        return db.rollback(() => {
                            res.status(500).json({ error: err.message });
                        });
                    }

                    // ใส่การเล่นของ AI เข้าสู่ประวัติการเคลื่อนไหว
                    db.query(insertMoveHistoryQuery, [game_id, 'O', move_number, `${move[0]},${move[1]}`], (err) => {
                        if (err) {
                            return db.rollback(() => {
                                res.status(500).json({ error: err.message });
                            });
                        }

                        // ยืนยันการทำธุรกรรม
                        db.commit((err) => {
                            if (err) {
                                return db.rollback(() => {
                                    res.status(500).json({ error: err.message });
                                });
                            }

                            res.status(200).json({ message: "Bot move recorded" });
                        });
                    });
                });
            });
        });
    })
})

module.exports = router;