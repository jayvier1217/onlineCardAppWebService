const express = require('express');
const mysql = require('mysql2/promise');
require('dotenv').config();
const port = 3000;

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 100,
    queueLimit: 0,
};

const app = express();
app.use(express.json());

app.listen( port, () => {
    console.log(`Server running on port: ${port}`);
});

app.get("/allcards", async (req, res) => {
    try {
        let connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT * FROM defaultdb.cards');
        res.json(rows);
    } catch (err) {
        console.log(err);
        res.status(500).send('Server error for all cards.');
    }
});

app.get("/", (req, res) => {
    res.send("Server is responding!");
});

app.post('/addcard', async (req, res) => {
    const { card_name, card_pic} = req.body;
    try {
        let connection = await mysql.createConnection(dbConfig);
        await connection.execute('INSERT INTO cards (card_name, card_pic) VALUES (?, ?)', [card_name, card_pic]);
        res.status(201).json({message: `card ${card_name} added successfully.`});
    } catch (err) {
        console.log(err);
        res.status(500).send(`server error - could not add card ${card_name}`);
    }
})

app.put('/updatecard/:id', async (req, res) => {
    const { id } = req.params;
    const { card_name, card_pic } = req.body;
    try{
        let connection = await mysql.createConnection(dbConfig);
        await connection.execute('UPDATE cards SET card_name=?, card_pic=? WHERE id=?', [card_name, card_pic, id]);
        res.status(201).json({ message: 'Card ' + id + ' updated successfully!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error - could not update card ' + id });
    }
});

app.delete('/deletecard/:id', async (req, res) => {
    const { id } = req.params;
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [result] = await connection.execute('DELETE FROM cards WHERE id=?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Card not found' });
        }

        res.status(200).json({ message: 'Card ' + id + ' deleted successfully!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error - could not delete card ' + id });
    } finally {
        if (connection) await connection.end();
    }
});