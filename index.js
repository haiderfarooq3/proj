const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = 8080;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database connection
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
            return res.status(500).send('Database error: ' + err.message);
        }
        res.redirect('/success.html');
    });
});

// Route: Add or update vendor performance
app.post('/evaluate-performance', (req, res) => {
    const { VendorID, ServiceQuality, Timeliness, Pricing, Feedback } = req.body;
    const vendorCheckQuery = `SELECT COUNT(*) AS count FROM Vendor WHERE VendorID = ?`;
    connection.query(vendorCheckQuery, [VendorID], (err, results) => {
        if (err) return res.status(500).send('Database error: ' + err.message);
        if (results[0].count === 0) return res.status(400).send('Vendor ID does not exist.');
        const query = `
            INSERT INTO VendorPerformance (VendorID, EvaluationDate, ServiceQuality, Timeliness, Pricing, Feedback)
            VALUES (?, CURDATE(), ?, ?, ?, ?)
        `;
        connection.query(query, [VendorID, ServiceQuality, Timeliness, Pricing, Feedback], (err) => {
            if (err) return res.status(500).send('Database error: ' + err.message);
            res.redirect('/success.html');
        });
    });
});

// Route: Fetch vendor directory
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
    connection.query(query, (err, results) => {
        if (err) return res.status(500).send('Database error: ' + err.message);
        res.json(results);
    });
});

// Other routes
app.post('/add-contract', (req, res) => {
    const { VendorID, DepartmentID, StartDate, EndDate, Status } = req.body;
    const vendorCheckQuery = `SELECT COUNT(*) AS count FROM Vendor WHERE VendorID = ?`;
    connection.query(vendorCheckQuery, [VendorID], (err, results) => {
        if (err) return res.status(500).send('Database error: ' + err.message);
        if (results[0].count === 0) return res.status(400).send('Vendor ID does not exist.');
        const query = `
            INSERT INTO Contract (VendorID, DepartmentID, StartDate, EndDate, Status)
            VALUES (?, ?, ?, ?, ?)
        `;
        connection.query(query, [VendorID, DepartmentID, StartDate, EndDate, Status], (err) => {
            if (err) return res.status(500).send('Database error: ' + err.message);
            res.redirect('/success.html');
        });
    });
});

app.get('/audit-logs', (req, res) => {
    connection.query(`SELECT * FROM AuditLog ORDER BY ActionDate DESC`, (err, results) => {
        if (err) return res.status(500).send('Database error: ' + err.message);
        res.json(results);
    });
});




app.get('/vendors', (req, res) => {
    const query = `SELECT * FROM Vendor`;
    connection.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post('/manage-vendors', (req, res) => {
    const query = `UPDATE Vendor SET ComplianceCertifications = "Updated" WHERE VendorID = 1`;
    connection.query(query, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Vendor updated successfully' });
    });
});

app.get('/contracts', (req, res) => {
    const query = `SELECT * FROM Contract`;
    connection.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post('/manage-contracts', (req, res) => {
    const query = `UPDATE Contract SET Status = "Renewed" WHERE ContractID = 1`;
    connection.query(query, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Contract renewed successfully' });
    });
});

app.get('/budgets', (req, res) => {
    const query = `SELECT * FROM Budget`;
    connection.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post('/adjust-budgets', (req, res) => {
    const query = `UPDATE Budget SET SpentAmount = SpentAmount + 500 WHERE BudgetID = 1`;
    connection.query(query, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Budget adjusted successfully' });
    });
});

app.get('/notifications', (req, res) => {
    const query = `SELECT * FROM Notification`;
    connection.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.get('/reports', (req, res) => {
    res.json({ message: "Reports endpoint is functional", data: [1, 2, 3, 4, 5] });
});


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
