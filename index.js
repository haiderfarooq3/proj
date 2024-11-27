// index.js

const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = 8080;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Database connection (Keeping your original connection logic)
const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "12345678Aa.",
    database: "CorporateVendorDB"
});

connection.connect(err => {
    if (err) {
        console.error("Database connection failed:", err.stack);
        return;
    }
    console.log("Connected to the database");
});

// Route: Register a new vendor
app.post('/register-vendor', (req, res) => {
    const { Name, ServiceCategory, ContactInfo, ComplianceCertifications } = req.body;

    // Validate inputs
    if (!Name || !ServiceCategory || !ContactInfo || !ComplianceCertifications) {
        return res.status(400).send('All fields are required.');
    }

    const query = `
        INSERT INTO Vendor (Name, ServiceCategory, ContactInfo, ComplianceCertifications)
        VALUES (?, ?, ?, ?)
    `;

    connection.query(query, [Name, ServiceCategory, ContactInfo, ComplianceCertifications], (err) => {
        if (err) {
            console.error("Error inserting vendor:", err.stack);
            res.status(500).send('Database error: ' + err.message);
            return;
        }
        res.redirect('/success.html');
    });
});

// Route: Add or update vendor performance
app.post('/evaluate-performance', (req, res) => {
    const { VendorID, ServiceQuality, Timeliness, Pricing, Feedback } = req.body;

    // Validate Ratings
    if (
        isNaN(ServiceQuality) || ServiceQuality < 0 || ServiceQuality > 5 ||
        isNaN(Timeliness) || Timeliness < 0 || Timeliness > 5 ||
        isNaN(Pricing) || Pricing < 0 || Pricing > 5
    ) {
        return res.status(400).send('Invalid ratings. Ratings must be between 0 and 5.');
    }

    const query = `
        INSERT INTO VendorPerformance (VendorID, EvaluationDate, ServiceQuality, Timeliness, Pricing, Feedback)
        VALUES (?, CURDATE(), ?, ?, ?, ?)
    `;

    connection.query(query, [VendorID, ServiceQuality, Timeliness, Pricing, Feedback], (err) => {
        if (err) {
            console.error("Error inserting evaluation:", err.stack);
            res.status(500).send('Database error: ' + err.message);
            return;
        }
        res.redirect('/success.html');
    });
});

// Route: Fetch vendor directory and performance metrics
app.get('/vendors', (req, res) => {
    const query = `
        SELECT v.VendorID, v.Name, v.ServiceCategory, v.ContactInfo, v.ComplianceCertifications,
               IFNULL(ROUND(AVG(p.ServiceQuality), 2), 'N/A') AS AvgServiceQuality,
               IFNULL(ROUND(AVG(p.Timeliness), 2), 'N/A') AS AvgTimeliness,
               IFNULL(ROUND(AVG(p.Pricing), 2), 'N/A') AS AvgPricing,
               v.PerformanceRating
        FROM Vendor v
        LEFT JOIN VendorPerformance p ON v.VendorID = p.VendorID
        GROUP BY v.VendorID
    `;
////
    connection.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching vendors:", err.stack);
            res.status(500).send('Database error: ' + err.message);
            return;
        }
        res.json(results);
    });
});

// Route: Provide simplified vendor list for autocomplete
app.get('/vendors-list', (req, res) => {
    const query = `
        SELECT VendorID, Name
        FROM Vendor
    `;

    connection.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching vendor list:", err.stack);
            res.status(500).send('Database error: ' + err.message);
            return;
        }
        res.json(results);
    });
});

// Route: View contracts
app.get('/contracts', (req, res) => {
    const query = `
        SELECT c.ContractID, v.Name AS VendorName, d.DepartmentName, c.StartDate, c.EndDate, c.Status
        FROM Contract c
        JOIN Vendor v ON c.VendorID = v.VendorID
        JOIN Department d ON c.DepartmentID = d.DepartmentID
    `;

    connection.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching contracts:", err.stack);
            res.status(500).send('Database error: ' + err.message);
            return;
        }
        res.json(results);
    });
});

// Route: Add a new contract
app.post('/add-contract', (req, res) => {
    const { VendorID, DepartmentID, StartDate, EndDate, Status } = req.body;

    // Basic validation
    if (!VendorID || !DepartmentID || !StartDate || !EndDate || !Status) {
        return res.status(400).send('All fields are required.');
    }

    const query = `
        INSERT INTO Contract (VendorID, DepartmentID, StartDate, EndDate, Status)
        VALUES (?, ?, ?, ?, ?)
    `;

    connection.query(query, [VendorID, DepartmentID, StartDate, EndDate, Status], (err) => {
        if (err) {
            console.error("Error adding contract:", err.stack);
            res.status(500).send('Database error: ' + err.message);
            return;
        }
        res.redirect('/success.html');
    });
});

// Static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
