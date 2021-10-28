import express from "express";
import cors from "cors";
import connection from "../database/database.js";
import { categoriesSchema, gamesSchema, customersSchema } from "./schemes.js";

const DAYS_MILISECONDS = 24 * 60 * 60 * 1000;

const app = express();

app.use(express.json());
app.use(cors());

//Categories
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

    if (categoriesSchema.validate(req.body).error) res.sendStatus(400);
    else {
        try {
            const result = await connection.query(
                "SELECT * FROM categories WHERE name = $1;",
                [name]
            );

            if (result.rowCount) res.sendStatus(409);
            else {
                await connection.query(
                    "INSERT INTO categories (name) VALUES ($1);",
                    [name]
                );
                res.sendStatus(201);
            }
        } catch (error) {
            res.sendStatus(500);
        }
    }
});

//Games
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

    try {
        const categoryIds = await connection.query(
            "SELECT id FROM categories;"
        );
        const names = await connection.query(
            "SELECT name FROM games WHERE name = $1;",
            [name]
        );

        if (
            gamesSchema.validate(req.body).error ||
            !categoryIds.rows.filter(value => value.id === categoryId).length
        )
            res.sendStatus(400);
        else if (names.rowCount) res.sendStatus(409);
        else {
            await connection.query(
                'INSERT INTO games (name, image, "stockTotal", "categoryId", "pricePerDay") VALUES ($1, $2, $3, $4, $5);',
                [name, image, stockTotal, categoryId, pricePerDay]
            );
            res.sendStatus(201);
        }
    } catch (error) {
        res.sendStatus(500);
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

app.get("/customers/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const result = await connection.query(
            "SELECT * FROM customers WHERE id = $1;",
            [id]
        );
        result.rowCount ? res.send(result.rows) : res.sendStatus(404);
    } catch (error) {
        res.sendStatus(500);
    }
});

app.post("/customers", async (req, res) => {
    const { name, phone, cpf, birthday } = req.body;

    try {
        const result = await connection.query(
            "SELECT cpf FROM customers WHERE cpf = $1",
            [cpf]
        );

        if (customersSchema.validate(req.body).error) res.sendStatus(400);
        else if (result.rowCount) res.sendStatus(409);
        else {
            await connection.query(
                "INSERT INTO customers (name, phone, cpf, birthday) VALUES ($1, $2, $3, $4);",
                [name, phone, cpf, birthday]
            );
            res.sendStatus(201);
        }
    } catch (error) {
        res.sendStatus(500);
    }
});

app.put("/customers/:id", async (req, res) => {
    const { id } = req.params;
    const { name, phone, cpf, birthday } = req.body;

    try {
        const result = await connection.query(
            "SELECT cpf FROM customers WHERE cpf = $1",
            [cpf]
        );

        if (customersSchema.validate(req.body).error) res.sendStatus(400);
        else if (result.rowCount) res.sendStatus(409);
        else {
            await connection.query(
                "UPDATE customers SET name = $1, phone = $2, cpf = $3, birthday = $4 WHERE id = $5;",
                [name, phone, cpf, birthday, id]
            );
            res.sendStatus(200);
        }
    } catch (error) {
        res.sendStatus(500);
    }
});

//Rentals
app.get("/rentals", async (req, res) => {
    const customerId = req.query.customerId;
    const gameId = req.query.gameId;

    try {
        if (customerId) {
            const result = await connection.query(
                'SELECT rentals.*, customers.id, customers.name, games.id, games.name, games."categoryId", categories.name FROM rentals JOIN customers ON rentals."customerId" = customers.id JOIN games ON rentals."gameId" = games.id JOIN categories ON games."categoryId" = categories.id WHERE rentals."customerId" = $1;',
                [customerId]
            );
            res.send(result.rows);
        } else if (gameId) {
            const result = await connection.query(
                'SELECT rentals.*, customers.id, customers.name, games.id, games.name, games."categoryId", categories.name FROM rentals JOIN customers ON rentals."customerId" = customers.id JOIN games ON rentals."gameId" = games.id JOIN categories ON games."categoryId" = categories.id WHERE rentals."gameId" = $1;',
                [gameId]
            );
            res.send(result.rows);
        } else {
            const result = await connection.query(
                'SELECT rentals.*, customers.id, customers.name, games.id, games.name, games."categoryId", categories.name FROM rentals JOIN customers ON rentals."customerId" = customers.id JOIN games ON rentals."gameId" = games.id JOIN categories ON games."categoryId" = categories.id;'
            );
            res.send(result.rows);
        }
    } catch (error) {
        res.sendStatus(500);
    }
});

app.post("/rentals", async (req, res) => {
    const { customerId, gameId, daysRented } = req.body;

    try {
        const customer = await connection.query(
            "SELECT * FROM customers WHERE id = $1;",
            [customerId]
        );
        const game = await connection.query(
            "SELECT * FROM games WHERE id = $1;",
            [gameId]
        );
        const rented = await connection.query(
            'SELECT * FROM rentals WHERE "gameId" = $1 AND "returnDate" IS NULL',
            [gameId]
        );

        const isGameAvailable = rented.rowCount < game.rows[0].stockTotal;

        if (
            !customer.rowCount ||
            !game.rowCount ||
            !daysRented ||
            !isGameAvailable
        )
            res.sendStatus(400);
        else {
            const result = await connection.query(
                'SELECT "pricePerDay" FROM games WHERE id = $1;',
                [gameId]
            );
            const pricePerDay = result.rows[0].pricePerDay * daysRented;

            await connection.query(
                'INSERT INTO rentals ("customerId", "gameId", "rentDate", "daysRented", "returnDate", "originalPrice", "delayFee") VALUES ($1, $2, CURRENT_DATE, $3, null, $4, null);',
                [customerId, gameId, daysRented, pricePerDay]
            );
            res.sendStatus(201);
        }
    } catch (error) {
        res.sendStatus(500);
    }
});

app.post("/rentals/:id/return", async (req, res) => {
    const { id } = req.params;
    const now = new Date();
    let delayFee = null;

    try {
        const result = await connection.query(
            "SELECT * FROM rentals WHERE id = $1",
            [id]
        );

        if (!result.rowCount) res.sendStatus(404);
        else if (result.rows[0].returnDate) res.sendStatus(400);
        else {
            const keptDays = Math.floor(
                (now.getTime() - result.rows[0].rentDate.getTime()) /
                    DAYS_MILISECONDS
            );

            if (keptDays > result.rows[0].daysRented) {
                delayFee =
                    (keptDays - result.rows[0].daysRented) *
                    result.rows[0].originalPrice;
            }

            await connection.query(
                'UPDATE rentals SET "returnDate" = CURRENT_DATE, "delayFee" = $1 WHERE id = $2;',
                [delayFee, id]
            );

            res.sendStatus(200);
        }
    } catch (error) {
        res.sendStatus(500);
    }
});

app.delete("/rentals/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const wasReturned = await connection.query(
            'SELECT "returnDate" FROM rentals WHERE id = $1 AND "returnDate" IS NOT NULL;',
            [id]
        );

        if (wasReturned.rowCount) res.sendStatus(400);
        else {
            const result = await connection.query(
                "DELETE FROM rentals WHERE id = $1;",
                [id]
            );
            result.rowCount ? res.sendStatus(200) : res.sendStatus(404);
        }
    } catch (error) {
        res.sendStatus(500);
    }
});

app.listen(4000);
