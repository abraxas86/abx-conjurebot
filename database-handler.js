const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const dbPath = path.join(__dirname, 'conjure.db');

// Function to execute a SELECT query
async function executeSelect(statement, params = []) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Error opening database:', err.message);
                reject(err);
            }
        });

        db.all(statement, params, (err, rows) => {
            if (err) {
                console.error('Error executing SELECT query:', err.message);
                reject(err);
            } else {
                resolve(rows); // Resolve with the query results
            }
        });

        db.close((err) => {
            if (err) {
                console.error('Error closing database:', err.message);
            }
        });
    });
}

// Function to execute an UPDATE query
async function executeUpdate(statement, params = []) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Error opening database:', err.message);
                reject(err);
            }
        });

        db.run(statement, params, function (err) {
            if (err) {
                console.error('Error executing query:', err.message);
                reject(err);
            } else {
                resolve(this.changes); // Resolve with the number of rows affected
            }
        });

        db.close((err) => {
            if (err) {
                console.error('Error closing database:', err.message);
            }
        });
    });
}

module.exports = { executeSelect, executeUpdate };