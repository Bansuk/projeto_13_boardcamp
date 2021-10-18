import express from "express";
import cors from "cors";
import connection from "../database/database.js";
import { categoriesSchema, customersSchema } from "./schemes.js";

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

    if (categoriesSchema.validate(req.body).error) res.sendStatus(400);
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

app.get("/games", async (req, res) => {
    let name = req.query.name;

    if (!name) name = "";

    try {
        const result = await connection.query(
            'SELECT games.*, categories.name AS "categoryName" FROM games JOIN categories ON games."categoryId" = categories.id WHERE games.name ILIKE $1;',
            [name + "%"]
        );
        res.send(result.rows);
    } catch (error) {
        res.sendStatus(500);
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

//Customers
app.get("/customers", async (req, res) => {
    let cpf = req.query.cpf;

    if (!cpf) cpf = "";

    try {
        const result = await connection.query(
            "SELECT * FROM customers WHERE cpf LIKE $1;",
            [cpf + "%"]
        );
        res.send(result.rows);
    } catch (error) {
        res.sendStatus(500);
    }
});

app.post("/customers", async (req, res) => {
    const { name, phone, cpf, birthday } = req.body;
    let result;

    try {
        result = await connection.query(
            "SELECT cpf FROM customers WHERE cpf = $1",
            [cpf]
        );
    } catch (error) {
        res.sendStatus(500);
    }

    if (customersSchema.validate(req.body).error) res.sendStatus(400);
    else if (result.rowCount) res.sendStatus(409);
    else {
        try {
            await connection.query(
                "INSERT INTO customers (name, phone, cpf, birthday) VALUES ($1, $2, $3, $4);",
                [name, phone, cpf, birthday]
            );
            res.sendStatus(201);
        } catch (error) {
            res.sendStatus(500);
        }
    }
});

app.put("/customers/:id", async (req, res) => {
    const { id } = req.params;
    const { name, phone, cpf, birthday } = req.body;
    let result;

    try {
        result = await connection.query(
            "SELECT cpf FROM customers WHERE cpf = $1",
            [cpf]
        );
    } catch (error) {
        res.sendStatus(500);
    }

    if (customersSchema.validate(req.body).error) res.sendStatus(400);
    else if (result.rowCount) res.sendStatus(409);
    else {
        try {
            await connection.query(
                "UPDATE customers SET name = $1, phone = $2, cpf = $3, birthday = $4 WHERE id = $5;",
                [name, phone, cpf, birthday, id]
            );
            res.sendStatus(200);
        } catch (error) {
            res.sendStatus(500);
        }
    }
});

app.listen(4000);
