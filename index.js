const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcrypt'); // For password hashing

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

// Login Route
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).send('Email and password are required.');
    }

    const query = `SELECT * FROM User WHERE Email = ?`;
    connection.query(query, [email], async (err, results) => {
        if (err) {
            console.error("Error fetching user:", err.stack);
            return res.status(500).send('Database error: ' + err.message);
        }

        if (results.length === 0) {
            return res.status(400).send('Invalid email.');
        }

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.Password); // Compare hashed passwords

        if (!isMatch) {
            return res.status(400).send('Invalid password.');
        }

        // Login successful
        res.send(`Welcome, ${user.UserName}!`);
    });
});

// Signup Route
app.post('/signup', async (req, res) => {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password || !role) {
        return res.status(400).send('All fields are required.');
    }

    const hashedPassword = await bcrypt.hash(password, 10); // Hash the password

    const query = `
        INSERT INTO User (UserName, Email, Password, RoleID)
        VALUES (?, ?, ?, ?)
    `;
    connection.query(query, [username, email, hashedPassword, role], (err) => {
        if (err) {
            console.error("Error inserting user:", err.stack);
            return res.status(500).send('Database error: ' + err.message);
        }

        res.send('Signup successful! You can now <a href="/login.html">log in</a>.');
    });
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
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results); // Return the Vendor data as JSON
    });
});

// Route: Evaluate Vendor Performance
app.post('/evaluate-performance', (req, res) => {
    const { VendorID, ServiceQuality, Timeliness, Pricing, Feedback } = req.body;

    // Validate input values
    if (!VendorID || !ServiceQuality || !Timeliness || !Pricing) {
        return res.status(400).send('All fields are required.');
    }

    // Check if VendorID exists
    const vendorCheckQuery = `SELECT COUNT(*) AS count FROM Vendor WHERE VendorID = ?`;
    connection.query(vendorCheckQuery, [VendorID], (err, results) => {
        if (err) {
            console.error("Error checking vendor ID:", err.stack);
            return res.status(500).send('Database error: ' + err.message);
        }

        if (results[0].count === 0) {
            return res.status(400).send('Vendor ID does not exist.');
        }

        // Insert the performance evaluation data
        const query = `
            INSERT INTO VendorPerformance (VendorID, EvaluationDate, ServiceQuality, Timeliness, Pricing, Feedback)
            VALUES (?, CURDATE(), ?, ?, ?, ?)
        `;
        connection.query(query, [VendorID, ServiceQuality, Timeliness, Pricing, Feedback], (err) => {
            if (err) {
                console.error("Error inserting performance evaluation:", err.stack);
                return res.status(500).send('Database error: ' + err.message);
            }
            res.json({ message: 'Vendor performance evaluated successfully!' });
        });
    });
});

// Route: Adjust budget
app.post('/adjust-budget', (req, res) => {
    const { BudgetID, AdjustmentAmount } = req.body;

    if (!BudgetID || !AdjustmentAmount) {
        return res.status(400).send('BudgetID and AdjustmentAmount are required.');
    }

    const query = `
        UPDATE Budget
        SET AllocatedAmount = AllocatedAmount + ?
        WHERE BudgetID = ?
    `;
    connection.query(query, [AdjustmentAmount, BudgetID], (err) => {
        if (err) return res.status(500).send('Database error: ' + err.message);
        res.json({ message: 'Budget adjusted successfully' });
    });
});

// Route: Fetch audit logs
app.get('/audit-logs', (req, res) => {
    connection.query(`SELECT * FROM AuditLog ORDER BY ActionDate DESC`, (err, results) => {
        if (err) return res.status(500).send('Database error: ' + err.message);
        res.json(results);
    });
});

// Route: Fetch budget data
app.get('/budgets', (req, res) => {
    const query = `SELECT * FROM Budget`;
    connection.query(query, (err, results) => {
        if (err) return res.status(500).send('Database error: ' + err.message);
        res.json(results);
    });
});

// Route: Fetch notifications
app.get('/notifications', (req, res) => {
    const query = `SELECT * FROM Notification`;
    connection.query(query, (err, results) => {
        if (err) return res.status(500).send('Database error: ' + err.message);
        res.json(results);
    });
});

// Route: Fetch reports
app.get('/reports', (req, res) => {
    res.json({ message: "Reports endpoint is functional", data: [1, 2, 3, 4, 5] });
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
