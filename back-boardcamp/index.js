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
    let result;

    try {
        result = await connection.query(
            "SELECT * FROM categories WHERE name = $1;",
            [name]
        );
    } catch (error) {
        res.sendStatus(500);
    }

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

app.post("/games", async (req, res) => {
    const { name, image, stockTotal, categoryId, pricePerDay } = req.body;
    let categoryIds, names;

    try {
        categoryIds = await connection.query("SELECT id FROM categories;");
        names = await connection.query(
            "SELECT name FROM games WHERE name = $1;",
            [name]
        );
    } catch (error) {
        res.sendStatus(500);
    }

    if (
        !name ||
        stockTotal <= 0 ||
        pricePerDay <= 0 ||
        !categoryIds.rows.filter(value => value.id === categoryId).length
    )
        res.sendStatus(400);
    else if (names.rowCount) res.sendStatus(409);
    else {
        try {
            await connection.query(
                'INSERT INTO games (name, image, "stockTotal", "categoryId", "pricePerDay") VALUES ($1, $2, $3, $4, $5);',
                [name, image, stockTotal, categoryId, pricePerDay]
            );
            res.sendStatus(201);
        } catch (error) {
            res.sendStatus(500);
        }
    }
});

app.listen(4000);
