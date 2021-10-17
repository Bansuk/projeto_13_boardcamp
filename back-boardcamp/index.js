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
    } catch (error) {}
});

app.post("/categories", async (req, res) => {
    const { name } = req.body;

    try {
        await connection.query("INSERT INTO categories (name) VALUES ($1);", [
            name,
        ]);
        res.status(201).send("sem dados");
    } catch (error) {}
});

app.listen(4000);
