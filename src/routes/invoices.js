const express = require('express');
const db = require('../db/db');
const router = express.Router();
const ExpressError = require('../utils/expressError');

// GET /invoices: Return info on invoices
router.get('/', async (req, res, next) => {
    try {
        const result = await db.query('SELECT id, comp_code FROM invoices');
        return res.json({ invoices: result.rows });
    } catch (err) {
        return next(err);
    }
});

// GET /invoices/[id]: Returns obj on given invoice
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await db.query('SELECT * FROM invoices WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            throw new ExpressError(`Invoice with id ${id} not found`, 404);
        }
        return res.json({ invoice: result.rows[0] });
    } catch (err) {
        return next(err);
    }
});

// POST /invoices: Adds an invoice
router.post('/', async (req, res, next) => {
    try {
        const { comp_code, amt } = req.body;
        const result = await db.query('INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING *', [comp_code, amt]);
        return res.status(201).json({ invoice: result.rows[0] });
    } catch (err) {
        return next(err);
    }
});

// PUT /invoices/[id]: Updates an invoice
router.put('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { amt } = req.body;
        const result = await db.query('UPDATE invoices SET amt = $1 WHERE id = $2 RETURNING *', [amt, id]);
        if (result.rows.length === 0) {
            throw new ExpressError(`Invoice with id ${id} not found`, 404);
        }
        return res.json({ invoice: result.rows[0] });
    } catch (err) {
        return next(err);
    }
});

// DELETE /invoices/[id]: Deletes an invoice
router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await db.query('DELETE FROM invoices WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) {
            throw new ExpressError(`Invoice with id ${id} not found`, 404);
        }
        return res.json({ status: "deleted" });
    } catch (err) {
        return next(err);
    }
});

module.exports = router;