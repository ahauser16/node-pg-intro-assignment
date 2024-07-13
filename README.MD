# Biztime Assignment

## notes on how I set up this file

This project is a Springboard assignment to create a simple Express app using the `pg` library to interact with a PostgreSQL database. Here's how I set it up and how you can get it running on your machine.

### I. Prerequisites

- Node.js installed on your machine.
- PostgreSQL installed and running on your machine.

### II. Setting Up the Database

To create a database called "biztime" from the command line, you can follow these steps:

1. **Open your terminal**: Make sure you're in a command line interface where you can execute `psql` commands.
   
2. **Switch to the `postgres` user** (optional): If you're on a Unix/Linux system, PostgreSQL creates a default user named `postgres`. You might need to switch to this user to create a new database, depending on your PostgreSQL setup and permissions. You can switch to the `postgres` user by running:
   
```
sudo -i -u postgres
```

If your current user already has the necessary permissions to create a database, you can skip this step.

3. **Access the PostgreSQL command line interface**: You can access the PostgreSQL CLI by running:
```
psql
```
If you switched to the `postgres` user in the previous step, just run `psql`. If you're using your own user, you might need to specify the user with `-U` (e.g., `psql -U username`).

4. **Create the database**: Once inside the PostgreSQL CLI, you can create the "biztime" database by executing the following SQL command:
```
CREATE DATABASE biztime;
```
This command creates a new database named "biztime".

5. **Exit the PostgreSQL CLI**: After creating the database, you can exit the PostgreSQL CLI by typing:
```
\q
```

6. **Verify the database creation** (optional): To ensure that the "biztime" database has been created successfully, you can list all databases by accessing the PostgreSQL CLI again with `psql` and then running:
```
\l
```
Look for "biztime" in the list of databases.

### III. Populate database with data

#### from `data.sql` into `biztime`

To load the initial data from your `data.sql` file into the `biztime` database, follow these steps:

1. **Open your terminal**: Ensure you have access to a command line interface where you can execute commands.

2. **Navigate to the directory containing your `data.sql` file**: If you're not already in the directory, use the `cd` command to navigate to the directory containing your `data.sql` file. Based on your workspace structure, it would be something like:
```
cd src/db/
```

3. **Log in to PostgreSQL**: Before you can import the data, you need to log in to PostgreSQL. You can do this with the `psql` command. If you have a specific user for your PostgreSQL database, you can log in as that user:
```
psql -U your_username -d biztime
```

Replace `your_username` with your PostgreSQL username. If you're using the default `postgres` user, you might need to switch to the `postgres` user first or use `sudo` depending on your setup.

4. **Load the data**: Once logged in to PostgreSQL, you can load the data from your `data.sql` file directly into the `biztime` database using the `\i` command followed by the path to your `data.sql` file. If you're already in the directory containing `data.sql`, you can simply do:
```
\i data.sql
```
If you're not in the directory or are running the command from outside `psql`, you'll need to provide the full path to the file, like so:
```
\i /path/to/your/src/db/data.sql
```

Make sure to replace `/path/to/your/` with the actual path to the directory where `data.sql` is located.

5. **Verify the data loading**: After executing the `\i` command, PostgreSQL will run the SQL commands in your `data.sql` file. You can verify that the data has been loaded correctly by querying the tables. For example, to check the `companies` table, you can use:
```
SELECT * FROM companies;
```

6. **Exit `psql`**: Once you've verified that the data has been loaded correctly, you can exit the PostgreSQL command line interface by typing:
```
\q
```
These steps will load the initial data from your `data.sql` file into the `biztime` database, setting up your database with the necessary tables and data for your application.

#### from `data_test.sql` into `biztime_test`
1. **Open your terminal**: Ensure you have access to a command line interface where you can execute commands.

2. **Navigate to the directory containing your `data_test.sql file`**: If you're not already in the directory, use the `cd` command to navigate to the directory containing your `data_test.sql` file. Based on your workspace structure, it would be something like:
```
cd src/db/
```

3. **Log in to PostgreSQL**: Before you can import the data, you need to log in to PostgreSQL. You can do this with the `psql` command. If you have a specific user for your PostgreSQL database, you can log in as that user:
```
psql -U your_username
```
Replace `your_username` with your PostgreSQL username. If you're using the default `postgres` user, you might need to switch to the `postgres` user first or use `sudo` depending on your setup.


4. **Create the `biztime_test` database**: Once logged into PostgreSQL, create the `biztime_test` database by executing the following SQL command:
```
CREATE DATABASE biztime_test;
```

5. **Connect to the biztime_test database**: After creating the database, connect to it by running:
```
\c biztime_test
```

6. **Load the data**: Now that you're connected to the `biztime_test` database, you can load the data from your `data_test.sql` file directly into the database using the `\i` command followed by the path to your `data_test.sql` file. If you're already in the directory containing `data_test.sql`, you can simply do:
```
\i data_test.sql
```
If you're not in the directory or are running the command from outside psql, you'll need to provide the full path to the file, like so:

7. **Verify the data loading**: After executing the `\i` command, PostgreSQL will run the SQL commands in your `data_test.sql` file. You can verify that the data has been loaded correctly by querying the tables. For example, to check the `companies` table, you can use:
```
SELECT * FROM companies;
```

8. **Exit `psql`**: Once you've verified that the data has been loaded correctly, you can exit the PostgreSQL command line interface by typing:
```
\q
```
These steps will create the `biztime_test` database and load the initial data from your `data_test.sql` file into it, setting up your database with the necessary tables and data for your application testing.

### IV. Refactor `db.js` so that it connects to the `biztime` database and exports the client object

1. Create and update the `.env` file with the `DB_URI` and `TEST_DB_URI` variables.  These will be used in the `db.js` file.
2. Make sure that `.env` is included in `.gitignore` so that it won't be tracked by Git which could potentially expose sensitive information.  
3. Verify `db.js` code below works as expected:
```
require('dotenv').config();
const { Client } = require("pg");

const DB_URI = process.env.NODE_ENV === "test" ? process.env.TEST_DB_URI : process.env.DB_URI;

const db = new Client({
    connectionString: DB_URI
  });

db.connect(err => {
    if (err) {
      console.error("Connection error", err.stack);
    } else {
      console.log("Connected to database:", DB_URI);
    }
  });

module.exports = db;
```

### V. Installing Dependencies

Run the following command in the terminal to install the necessary dependencies:

```
npm install
```

### VI. Commands and Scripts you **MUST** know to run this application

This project includes several npm scripts to facilitate development, testing, and debugging. Below are the instructions for using these scripts:

#### A. `npm run test`

- #### (i) What it does:
Sets the `NODE_ENV` environment variable to `test` and runs tests using Jest. This ensures that your application connects to the test database.

- #### (ii) When to use it: 
Run this command when you want to execute your test suite. It's especially useful to ensure that all tests pass before pushing changes to your version control system.

- #### (iii) How it works:
##### a. Environment Variable Setting

The `npm run test` command in the `package.json` file is configured to set the `NODE_ENV` environment variable to `test` before running the tests with Jest (`"test": "NODE_ENV=test jest"`).  Keep in mind that this command explicitly sets `NODE_ENV` to `test`, which is crucial for the next step.
##### b. Conditional Database URI Selection

In the `db.js` file, the database URI is selected based on the value of `NODE_ENV`. If `NODE_ENV` is set to `test`, it uses `process.env.TEST_DB_URI;` otherwise, it defaults to `process.env.DB_URI` for development or production environments: `const DB_URI = process.env.NODE_ENV === "test" ? process.env.TEST_DB_URI : process.env.DB_URI;`.  This means that when `NODE_ENV` is equal to `test`, the connection string for the test database is used.

##### c. Database Connection
With the correct `DB_URI` selected, the `db` object is configured to connect to the specified database. This ensures that all database operations performed during the tests are executed against the test database, isolating 

##### d. Test Execution
With the environment correctly set up and the application connected to the test database, Jest runs the test suite. This setup ensures that your tests interact with the intended test database, providing a consistent and isolated environment for accurate testing.

#### (iv) Why it's helpful 
Running tests on a test database while the `NODE_ENV` environment variable is set to `test` offers several benefits:

##### a. Isolation
It ensures that the tests do not interfere with production data or the development database, maintaining data integrity and preventing accidental data loss or corruption.

##### b. Consistency
By using a dedicated test database, you can ensure that the tests start with a known database state, which is crucial for repeatability and reliability of test results.

##### c. Performance
Test databases can be optimized for speed, allowing for faster test execution. This is because they can be smaller and not carry the overhead of production-level data and logging.

##### d. Safety
It prevents accidental execution of potentially destructive operations on the production database, such as deletions or updates.

##### e. Environment-specific Configuration
Setting `NODE_ENV` to `test` allows for custom configuration (like database connection strings, logging levels, or third-party service mocks) that are specific to the testing environment, ensuring that tests run under conditions similar to production but without the risk.

##### f. Dependency Mocking
In a test environment, it's easier to mock external services and integrations, ensuring that the tests are not dependent on external factors and are more focused on the application logic itself.

##### g. Continuous Integration (CI) Compatibility
Using a test database and environment makes it easier to integrate with CI/CD pipelines, ensuring that automated tests can run in an isolated and controlled environment before any code is deployed to production.

#### B. `npm start`

  - #### (i) What it does & How it works
The `npm start` command starts the application by running `node src/server.js`. This command executes the `server.js` file using Node.js, which initializes the server and makes it listen for incoming requests on the configured port.

  - #### (ii) When to use it
Use this command when you want to run your application in a production environment or for general running/testing of your application in its completed form. It's the standard way to start the application without any development tools like `nodemon` or additional debugging capabilities.

#### C. `npm run debug`

  - #### (i) What it does
Sets the `NODE_ENV` environment variable to `development` and uses `nodemon` for automatic server restarts during development. This means that the server will automatically restart whenever you save changes to your files, ensuring that you are always running the most current version of your application without the need to manually stop and start the server.

  - #### (ii) When to use it
This command is ideal for use during the development phase of your project. It streamlines the development process by eliminating the need for manual restarts after making changes to your code. This is particularly useful for projects where changes are made frequently and you want to test those changes in real-time.

#### D. `npm run dev`

  - #### (i) What it does
Sets the `NODE_ENV` environment variable to `development` and uses `nodemon` for automatic server restarts during development. This means that the server will automatically restart whenever you save changes to your files, ensuring that you are always running the most current version of your application without the need to manually stop and start the server.

  - #### (ii) When to use it
This command is ideal for use during the development phase of your project. It streamlines the development process by eliminating the need for manual restarts after making changes to your code. This is particularly useful for projects where changes are made frequently and you want to test those changes in real-time.

#### E. `npm run dev:test`

  - #### (i) What it does
This command combines the functionality of setting the `NODE_ENV` environment variable to `test` with the utility of `nodemon`. By doing so, it ensures that the application connects to the test database and automatically restarts the test suite whenever file changes are detected. This is achieved by leveraging `nodemon` to watch for file changes and re-execute the tests, providing immediate feedback on the impact of your changes.

  - #### (ii) When to use it
The `npm run dev:test` command is particularly useful during the development process, especially in scenarios involving test-driven development (TDD) or when actively working on resolving test failures. It facilitates a more efficient development workflow by automatically rerunning tests upon saving changes, thereby providing instant feedback. This command is ideal for developers looking to quickly iterate on their code and tests, ensuring that new changes do not break existing functionality.

