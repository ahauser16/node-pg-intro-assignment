const express = require('express');
const db = require('../db/db');
const router = express.Router();
const ExpressError = require('../utils/expressError');
const slugify = require('slugify');

// POST /industries: Adds an industry
router.post('/', async (req, res, next) => {
    try {
        const { industry } = req.body;
        if (!industry) {
            throw new ExpressError('Missing industry name', 400);
        }
        // Generate a URL-friendly code from the industry name
        const code = slugify(industry, { lower: true, strict: true });
        const result = await db.query(`
            INSERT INTO industries (code, industry) 
            VALUES ($1, $2) 
            RETURNING code, industry`,
            [code, industry]);
        return res.status(201).json({ industry: result.rows[0] });
    } catch (err) {
        return next(err);
    }
});

// GET /industries: Lists all industries with company codes
router.get('/', async (req, res, next) => {
    try {
        const result = await db.query(`
            SELECT i.code, i.industry, ARRAY_AGG(ci.company_code) AS company_codes
            FROM industries i
            LEFT JOIN company_industries ci ON i.code = ci.industry_code
            GROUP BY i.code, i.industry`);
        if (result.rows.length === 0) {
            throw new ExpressError('No industries found', 404);
        }
        return res.json({ industries: result.rows });
    } catch (err) {
        return next(err);
    }
});

// POST /industries/:code/company: Associates an industry to a company
router.post('/:code/company', async (req, res, next) => {
    try {
        const { code } = req.params;
        const { company_code } = req.body;
        if (!company_code) {
            throw new ExpressError('Missing company code', 400);
        }
        const result = await db.query(`
            INSERT INTO company_industries (industry_code, company_code) 
            VALUES ($1, $2) 
            RETURNING industry_code`,
            [code, company_code]);
        if (result.rows.length === 0) {
            throw new ExpressError(`Industry with code ${code} not found`, 404);
        }
        return res.status(201).json({ industry_code: result.rows[0].industry_code });
    } catch (err) {
        return next(err);
    }
});

// Disassociates an industry from a company
router.delete('/:industry_code/company/:company_code', async (req, res, next) => {
    try {
        const { industry_code, company_code } = req.params;
        const result = await db.query(
            `DELETE FROM company_industries WHERE industry_code = $1 AND company_code = $2 RETURNING *`,
            [industry_code, company_code]
        );
        if (result.rows.length === 0) {
            throw new ExpressError(`Association between industry ${industry_code} and company ${company_code} not found`, 404);
        }
        return res.status(200).json({ message: `Industry ${industry_code} disassociated from company ${company_code}` });
    } catch (err) {
        return next(err);
    }
});

// DELETE /industries/:code: Deletes an industry by code
router.delete('/:code', async (req, res, next) => {
    try {
        const { code } = req.params;
        const deleteResult = await db.query(
            `DELETE FROM industries WHERE code = $1 RETURNING *`,
            [code]
        );
        if (deleteResult.rows.length === 0) {
            throw new ExpressError(`Industry with code ${code} not found`, 404);
        }
        return res.status(200).json({ message: `Industry with code ${code} deleted` });
    } catch (err) {
        return next(err);
    }
});

module.exports = router;