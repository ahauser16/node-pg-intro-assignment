const request = require('supertest');
const app = require('../src/app');
const db = require('../src/db/db');
const ExpressError = require('../src/utils/expressError');
const slugify = require('slugify');

let testCompany;
let uniqueCode;
let predefinedCompanies;
// Create a new company before each test. This way we can test the GET, POST, PATCH, and DELETE routes for companies.
beforeEach(async () => {
    uniqueCode = slugify(`testco-${Date.now()}`, { lower: true, strict: true });
    // Ensure each test company has a unique name by using the uniqueCode for the name as well
    const result = await db.query(`
        INSERT INTO companies (code, name, description) 
        VALUES ($1, $2, 'A company created for testing purposes.') 
        RETURNING code, name, description`,
        [uniqueCode, `Test Company ${uniqueCode}`]
    );
    testCompany = result.rows[0];

    // Fetch predefined companies from the database
    const predefinedResults = await db.query(`SELECT code, name FROM companies WHERE code IN ('apple', 'ibm')`);
    predefinedCompanies = predefinedResults.rows;
});
// Delete any data created by each test. This way we can test the DELETE /companies/:code route.  
// We will also delete the test company created in the beforeEach hook.  
// This will avoid a duplicate entry error when running the tests.
afterEach(async () => {
    // Check if testCompany has been defined before attempting to delete
    if (testCompany && testCompany.code) {
        await db.query(`DELETE FROM companies WHERE code = $1`, [testCompany.code]);
        testCompany = null; // Reset testCompany to ensure it's not reused
    }
});
// Close the database connection after all tests have run. 
//This is necessary to ensure that the test suite finishes cleanly.
afterAll(async () => {
    await db.end();
});

describe('GET /companies', () => {
    test('should return a list containing three companies', async () => {
        const response = await request(app).get('/companies');
        expect(response.statusCode).toBe(200);
        // Map over both expectedCompanies and responseBodyCompanies to select only code and name for comparison
        const expectedCompanies = [...predefinedCompanies, { code: testCompany.code, name: testCompany.name }]
            .sort((a, b) => a.code.localeCompare(b.code));
        const responseBodyCompanies = response.body.companies.map(({ code, name }) => ({ code, name }))
            .sort((a, b) => a.code.localeCompare(b.code));
        expect(responseBodyCompanies).toEqual(expectedCompanies);
    });
});

describe('GET /companies/:code', () => {
    test('should return a company and its invoices by code', async () => {
        // Assuming testCompany is already created in beforeEach
        const response = await request(app).get(`/companies/${testCompany.code}`);
        expect(response.statusCode).toBe(200);
        expect(response.body.company).toBeDefined();
        expect(response.body.company.code).toBe(testCompany.code);
        expect(response.body.company.name).toBe(testCompany.name);
        // Assuming description is also part of the testCompany object
        expect(response.body.company.description).toBe(testCompany.description);
        // Check if invoices is an array, since the company might not have invoices
        expect(Array.isArray(response.body.company.invoices)).toBe(true);
    });

    test('should return 404 for a non-existent company code', async () => {
        const nonExistentCode = 'non-existent-code';
        const response = await request(app).get(`/companies/${nonExistentCode}`);
        expect(response.statusCode).toBe(404);
        expect(response.body.error).toBeDefined();
        expect(response.body.message).toBe(`Company with code ${nonExistentCode} not found`);
    });
});

describe('POST /companies', () => {
    let newCompanyCode;
    let newCompanyName;
    let newCompanyDescription;

    beforeEach(() => {
        // Generate a unique code for the new company to avoid conflicts
        newCompanyCode = slugify(`newco-${Date.now()}`, { lower: true, strict: true });
        newCompanyName = `New Company ${newCompanyCode}`;
        newCompanyDescription = 'A new company for testing POST route.';
    });

    afterEach(async () => {
        // Delete the new company after the test to clean up
        if (newCompanyCode) {
            await db.query(`DELETE FROM companies WHERE code = $1`, [newCompanyCode]);
        }
    });

    test('should create a new company and return it', async () => {
        const response = await request(app)
            .post('/companies')
            .send({
                code: newCompanyCode,
                name: newCompanyName,
                description: newCompanyDescription
            });

        expect(response.statusCode).toBe(201);
        expect(response.body.company).toBeDefined();
        expect(response.body.company.code).toBe(newCompanyCode);
        expect(response.body.company.name).toBe(newCompanyName);
        expect(response.body.company.description).toBe(newCompanyDescription);

        // Verify the company was actually added to the database
        const dbResponse = await db.query('SELECT * FROM companies WHERE code = $1', [newCompanyCode]);
        expect(dbResponse.rows.length).toBe(1);
        expect(dbResponse.rows[0].code).toBe(newCompanyCode);
        expect(dbResponse.rows[0].name).toBe(newCompanyName);
        expect(dbResponse.rows[0].description).toBe(newCompanyDescription);
    });
});

describe('PUT /companies/:code', () => {
    let originalCompanyName;
    let originalCompanyDescription;
    const testCompanyCode = 'ibm'; // Use IBM as the test company

    beforeAll(async () => {
        // Fetch the original details of IBM before tests
        const originalDetails = await db.query('SELECT name, description FROM companies WHERE code = $1', [testCompanyCode]);
        originalCompanyName = originalDetails.rows[0].name;
        originalCompanyDescription = originalDetails.rows[0].description;
    });

    afterAll(async () => {
        // Revert IBM's details back to original after tests
        await db.query('UPDATE companies SET name = $1, description = $2 WHERE code = $3', [originalCompanyName, originalCompanyDescription, testCompanyCode]);
    });

    test('should update an existing company (IBM) and return the updated details', async () => {
        const updatedCompanyName = `Updated IBM`;
        const updatedCompanyDescription = 'Updated description for IBM.';

        const response = await request(app)
            .put(`/companies/${testCompanyCode}`)
            .send({
                name: updatedCompanyName,
                description: updatedCompanyDescription
            });

        expect(response.statusCode).toBe(200);
        expect(response.body.company).toBeDefined();
        expect(response.body.company.code).toBe(testCompanyCode);
        expect(response.body.company.name).toBe(updatedCompanyName);
        expect(response.body.company.description).toBe(updatedCompanyDescription);

        // Verify IBM was actually updated in the database
        const dbResponse = await db.query('SELECT * FROM companies WHERE code = $1', [testCompanyCode]);
        expect(dbResponse.rows.length).toBe(1);
        expect(dbResponse.rows[0].code).toBe(testCompanyCode);
        expect(dbResponse.rows[0].name).toBe(updatedCompanyName);
        expect(dbResponse.rows[0].description).toBe(updatedCompanyDescription);
    });

    test('should return 404 for a non-existent company code', async () => {
        const nonExistentCode = 'non-existent-code';
        const response = await request(app)
            .put(`/companies/${nonExistentCode}`)
            .send({
                name: 'Non-existent Company',
                description: 'This company does not exist.'
            });

        expect(response.statusCode).toBe(404);
        expect(response.body.error).toBeDefined();
        expect(response.body.message).toBe(`Company with code ${nonExistentCode} not found`);
    });
});

describe('DELETE /companies/:code', () => {
    test('should delete an existing company and return a confirmation', async () => {
        // Assuming testCompany is already created in beforeEach
        const response = await request(app).delete(`/companies/${testCompany.code}`);
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ status: "deleted" });

        // Verify the company was actually deleted from the database
        const dbResponse = await db.query('SELECT * FROM companies WHERE code = $1', [testCompany.code]);
        expect(dbResponse.rows.length).toBe(0);
    });

    test('should return 404 for a non-existent company code', async () => {
        const nonExistentCode = 'non-existent-code';
        const response = await request(app).delete(`/companies/${nonExistentCode}`);
        expect(response.statusCode).toBe(404);
        expect(response.body.error).toBeDefined();
        expect(response.body.message).toBe(`Company with code ${nonExistentCode} not found`);
    });
});