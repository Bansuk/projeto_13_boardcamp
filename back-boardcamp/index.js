import express from "express";
import cors from "cors";
import connection from "../database/database.js";

const app = express();

app.use(express.json());
app.use(cors());

app.get("/categories", async (req, res) => {
    try {
        const result = await connection.query("SELECT * FROM categories;");
        res.send(result.rows);
    } catch (error) {
        res.sendStatus(500);
    }
});

app.post("/categories", async (req, res) => {
    const { name } = req.body;

    const result = await connection.query(
        "SELECT * FROM categories WHERE name = $1;",
        [name]
    );

    if (!name) res.sendStatus(400);
    else if (result.rowCount) res.sendStatus(409);
    else {
        try {
            await connection.query(
                "INSERT INTO categories (name) VALUES ($1);",
                [name]
            );
            res.sendStatus(201);
        } catch (error) {
            res.sendStatus(500);
        }
    }
});

app.listen(4000);
