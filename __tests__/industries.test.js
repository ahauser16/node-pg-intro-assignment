const request = require('supertest');
const app = require('../src/app');
const db = require('../src/db/db');
const slugify = require('slugify');

let testIndustry;
beforeEach(async () => {
    const newIndustry = `Test Industry ${Date.now()}`;
    // Use slugify to generate a URL-friendly code from the industry name
    const code = slugify(`test-${Date.now()}`, { lower: true, strict: true });
    const result = await db.query(`
        INSERT INTO industries (code, industry) 
        VALUES ($1, $2) 
        RETURNING code, industry`,
        [code, newIndustry]
    );
    testIndustry = result.rows[0];
});

afterEach(async () => {
    await db.query(`DELETE FROM industries WHERE code = $1`, [testIndustry.code]);
    testIndustry = null;
});

afterAll(async () => {
    await db.end(); // Close the database connection
});

describe('POST /industries', () => {
    let newIndustryCode;

    test('should create a new industry and return it', async () => {
        const newIndustry = `New Industry ${Date.now()}`;
        const response = await request(app)
            .post('/industries')
            .send({ industry: newIndustry });

        expect(response.statusCode).toBe(201);
        expect(response.body.industry).toBeDefined();
        expect(response.body.industry.industry).toBe(newIndustry);
        // Ensure the code is slugified correctly
        const expectedCode = slugify(newIndustry, { lower: true, strict: true });
        expect(response.body.industry.code).toBe(expectedCode);

        // Save the code for cleanup
        newIndustryCode = expectedCode;

        // Verify the industry was added to the database
        const dbResponse = await db.query('SELECT * FROM industries WHERE code = $1', [expectedCode]);
        expect(dbResponse.rows.length).toBe(1);
        expect(dbResponse.rows[0].industry).toBe(newIndustry);
    });

    // Cleanup: delete the newly created industry
    afterEach(async () => {
        if (newIndustryCode) {
            await db.query('DELETE FROM industries WHERE code = $1', [newIndustryCode]);
            newIndustryCode = null; // Reset to ensure it's not reused
        }
    });
});

describe('GET /industries', () => {
    test('should return a list of all industries with company codes and industry codes, including the test industry', async () => {
        const response = await request(app).get('/industries');
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body.industries)).toBe(true);
        // This test now checks for the presence of the testIndustry and its code
        const testIndustryPresent = response.body.industries.some(industry => 
            industry.industry === testIndustry.industry && industry.code === testIndustry.code);
        expect(testIndustryPresent).toBe(true);
        // Additionally, verify that the industry code is included in the response for each industry
        const allHaveCodes = response.body.industries.every(industry => industry.code);
        expect(allHaveCodes).toBe(true);
    });
});

describe('POST /industries/:code/company', () => {
    test('should associate the test industry to a company and return the association, then verify and delete the association', async () => {
        const companyCode = 'apple';
        const response = await request(app)
            .post(`/industries/${testIndustry.code}/company`)
            .send({ company_code: companyCode });

        expect(response.statusCode).toBe(201);
        expect(response.body.industry_code).toBeDefined();
        expect(response.body.industry_code).toBe(testIndustry.code);

        // Verify the association was created in the database
        const dbResponse = await db.query(
            `SELECT * FROM company_industries WHERE industry_code = $1 AND company_code = $2`,
            [testIndustry.code, companyCode]
        );
        expect(dbResponse.rows.length).toBe(1);
        expect(dbResponse.rows[0].industry_code).toBe(testIndustry.code);
        expect(dbResponse.rows[0].company_code).toBe(companyCode);

        // Delete the association to ensure the database is not changed by the test
        await db.query(
            `DELETE FROM company_industries WHERE industry_code = $1 AND company_code = $2`,
            [testIndustry.code, companyCode]
        );

        // Verify the association was removed from the database
        const postDeleteDbResponse = await db.query(
            `SELECT * FROM company_industries WHERE industry_code = $1 AND company_code = $2`,
            [testIndustry.code, companyCode]
        );
        expect(postDeleteDbResponse.rows.length).toBe(0);
    });
});

describe('DELETE /industries/:industry_code/company/:company_code', () => {
    test('should disassociate the test industry from a company and confirm the disassociation', async () => {
        const companyCode = 'apple'; // Assuming 'apple' is an existing company code
        try {
            // Ensure there's an association to delete by creating it first
            await db.query(
                `INSERT INTO company_industries (company_code, industry_code) VALUES ($1, $2)`,
                [companyCode, testIndustry.code]
            );

            // Check if the association was successfully created before attempting to delete it
            const preDeleteCheck = await db.query(
                `SELECT * FROM company_industries WHERE company_code = $1 AND industry_code = $2`,
                [companyCode, testIndustry.code]
            );
            expect(preDeleteCheck.rows.length).toBe(1); // Ensure the association exists

            // Attempt to delete the association
            const response = await request(app)
                .delete(`/industries/${testIndustry.code}/company/${companyCode}`);

            expect(response.statusCode).toBe(200);
            expect(response.body.message).toBe(`Industry ${testIndustry.code} disassociated from company ${companyCode}`);

            // Verify the association was removed from the database
            const dbResponse = await db.query(
                `SELECT * FROM company_industries WHERE industry_code = $1 AND company_code = $2`,
                [testIndustry.code, companyCode]
            );
            expect(dbResponse.rows.length).toBe(0); // Confirm the association is removed
        } finally {
            // Restore the association for test isolation
            await db.query(
                `INSERT INTO company_industries (company_code, industry_code) VALUES ($1, $2)`,
                [companyCode, testIndustry.code]
            );
        }
    });
});