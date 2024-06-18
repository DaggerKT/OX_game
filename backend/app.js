const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 8080; // ตั้งค่าพอร์ตเป็น 8080
const cors = require('cors'); // เรียกใช้งาน cors

app.use(cors()); // ใช้งาน cors

const gameRoutes = require('./routes/game');

// Middleware
app.use(bodyParser.json());

// Routes
app.use('/api/game', gameRoutes);

app.listen(port, () => {
    console.log(`OX Game backend running on port ${port}`);
});