const request = require('supertest');
const app = require('../src/app');
const db = require('../src/db/db');
const ExpressError = require('../src/utils/expressError');
const slugify = require('slugify');

let testInvoice;
beforeEach(async () => {
    // Generate a unique amount using the current timestamp to ensure uniqueness
    const uniqueAmt = parseFloat((Date.now() % 1000) + 100); // Ensures amount is always above 100 to satisfy the CHECK constraint
    const result = await db.query(`
        INSERT INTO invoices (comp_code, amt, paid, paid_date) 
        VALUES ('ibm', $1, false, null) 
        RETURNING id, comp_code, amt, paid, add_date, paid_date`,
        [uniqueAmt]
    );
    testInvoice = result.rows[0];
});

afterEach(async () => {
    // Delete the test invoice after each test
    if (testInvoice && testInvoice.id) {
        await db.query(`DELETE FROM invoices WHERE id = $1`, [testInvoice.id]);
        testInvoice = null; // Reset testInvoice to ensure it's not reused
    }
});

afterAll(async () => {
    // Close the database connection after all tests have run
    await db.end();
});

describe('GET /invoices', () => {
    let predefinedInvoices;
    beforeEach(async () => {
        // Fetch predefined invoices from the database
        const predefinedResults = await db.query(`
            SELECT id, comp_code FROM invoices WHERE comp_code IN ('apple', 'ibm')`);
        predefinedInvoices = predefinedResults.rows;
    });

    test('should return a list containing predefined invoices plus the test invoice', async () => {
        const response = await request(app).get('/invoices');
        expect(response.statusCode).toBe(200);
        // Ensure the testInvoice is added uniquely to the expectedInvoices array
        const expectedInvoices = [...predefinedInvoices];
        // Check if testInvoice is already in expectedInvoices to avoid duplicates
        if (!expectedInvoices.some(invoice => invoice.id === testInvoice.id)) {
            expectedInvoices.push({ id: testInvoice.id, comp_code: testInvoice.comp_code });
        }
        // Sort both arrays by id for accurate comparison
        expectedInvoices.sort((a, b) => a.id - b.id);
        const responseBodyInvoices = response.body.invoices.map(({ id, comp_code }) => ({ id, comp_code }))
            .sort((a, b) => a.id - b.id);
        // Compare the sorted arrays
        expect(responseBodyInvoices).toEqual(expectedInvoices);
    });
});

describe('GET /invoices/:id', () => {
    beforeEach(async () => {
        // Use testInvoice directly, no need for a separate testInvoiceId variable
    });

    afterEach(async () => {
        // Cleanup is already handled in the global afterEach
    });

    test('should return an invoice by id', async () => {
        const response = await request(app).get(`/invoices/${testInvoice.id}`);
        expect(response.statusCode).toBe(200);
        expect(response.body.invoice).toBeDefined();
        expect(response.body.invoice.id).toBe(testInvoice.id);
    });

    test('should return 404 for a non-existent invoice id', async () => {
        const nonExistentId = 99999;
        const response = await request(app).get(`/invoices/${nonExistentId}`);
        expect(response.statusCode).toBe(404);
        expect(response.body.error).toBeDefined();
        expect(response.body.message).toBe(`Invoice with id ${nonExistentId} not found`);
    });
});

describe('POST /invoices', () => {
    test('should create and return a new invoice', async () => {
        // Use a unique amount to avoid conflicts with existing test data
        const uniqueAmt = parseFloat((Date.now() % 1000) + 200); // Ensures amount is different from beforeEach setup
        const comp_code = 'ibm'; // Use a predefined company code for consistency

        const response = await request(app)
            .post('/invoices')
            .send({ comp_code, amt: uniqueAmt });

        expect(response.statusCode).toBe(201);
        expect(response.body.invoice).toBeDefined();
        expect(response.body.invoice.comp_code).toBe(comp_code);
        expect(response.body.invoice.amt).toBe(uniqueAmt);

        // Clean up: Delete the newly created invoice to maintain test isolation
        const createdInvoiceId = response.body.invoice.id;
        if (createdInvoiceId) {
            await db.query(`DELETE FROM invoices WHERE id = $1`, [createdInvoiceId]);
        }
    });
});

describe('POST /invoices', () => {
    test('should create and return a new invoice with custom values', async () => {
        // Generate a unique amount to avoid conflicts with existing test data
        const uniqueAmt = parseFloat((Date.now() % 1000) + 200); // Ensures amount is different from beforeEach setup
        // Use a custom or predefined company code that exists in the database
        const comp_code = 'ibm'; // Assuming 'ibm' exists in the companies table

        const response = await request(app)
            .post('/invoices')
            .send({ comp_code, amt: uniqueAmt });

        expect(response.statusCode).toBe(201);
        expect(response.body.invoice).toBeDefined();
        expect(response.body.invoice.comp_code).toBe(comp_code);
        expect(response.body.invoice.amt).toBe(uniqueAmt);

        // Clean up: Delete the newly created invoice to maintain test isolation
        const createdInvoiceId = response.body.invoice.id;
        if (createdInvoiceId) {
            await db.query(`DELETE FROM invoices WHERE id = $1`, [createdInvoiceId]);
        }
    });
});

describe('PUT /invoices/:id', () => {
    let originalAmt;

    beforeEach(async () => {
        // Fetch the original amount of the invoice with id "1" to revert changes after the test
        const result = await db.query('SELECT amt FROM invoices WHERE id = $1', ['1']);
        originalAmt = result.rows[0].amt;
    });

    afterEach(async () => {
        // Revert the invoice amount to its original value after the test
        await db.query('UPDATE invoices SET amt = $1 WHERE id = $2', [originalAmt, '1']);
    });

    test('should update an invoice amount by id and return the updated invoice', async () => {
        const newAmt = 500; // New amount to update the invoice with

        const response = await request(app)
            .put('/invoices/1')
            .send({ amt: newAmt });

        expect(response.statusCode).toBe(200);
        expect(response.body.invoice).toBeDefined();
        expect(response.body.invoice.id.toString()).toBe('1');
        expect(response.body.invoice.amt).toBe(newAmt);

        // Verify the invoice amount was actually updated in the database
        const dbResponse = await db.query('SELECT * FROM invoices WHERE id = $1', ['1']);
        expect(dbResponse.rows[0].amt).toBe(newAmt);
    });

    test('should return 404 for a non-existent invoice id', async () => {
        const nonExistentId = 99999; // Assuming this ID does not exist in the database
        const newAmt = 500;

        const response = await request(app)
            .put(`/invoices/${nonExistentId}`)
            .send({ amt: newAmt });

        expect(response.statusCode).toBe(404);
        expect(response.body.error).toBeDefined();
        expect(response.body.message).toBe(`Invoice with id ${nonExistentId} not found`);
    });
});

describe('DELETE /invoices/:id', () => {
    test('should delete the test invoice and return a confirmation message', async () => {
        const response = await request(app).delete(`/invoices/${testInvoice.id}`);
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ status: "deleted" });

        // Verify the invoice was actually deleted from the database
        const dbResponse = await db.query('SELECT * FROM invoices WHERE id = $1', [testInvoice.id]);
        expect(dbResponse.rows.length).toBe(0);
    });

    test('should return 404 for a non-existent invoice id', async () => {
        const nonExistentId = 99999; // Assuming this ID does not exist in the database
        const response = await request(app).delete(`/invoices/${nonExistentId}`);
        expect(response.statusCode).toBe(404);
        expect(response.body.error).toBeDefined();
        expect(response.body.message).toBe(`Invoice with id ${nonExistentId} not found`);
    });
});