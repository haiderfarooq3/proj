const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcrypt'); // For password hashing
const session = require('express-session'); // Add this line to import express-session

const app = express();
const port = 8080;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'your-secret-key', // Replace with a secure secret key
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false // Set to true if using HTTPS
    }
}));

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

// Add this helper function after database connection setup
function logAudit(userID, actionType, description) {
    const query = `
        INSERT INTO AuditLog (UserID, ActionDate, ActionType, Description)
        VALUES (?, NOW(), ?, ?)
    `;
    connection.query(query, [userID, actionType, description], (err) => {
        if (err) {
            console.error('Error logging audit:', err);
        }
    });
}

// Modified Role-based middleware
const checkRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.session.user) {
            if (req.path.startsWith('/api/')) {
                return res.status(401).json({ message: 'Unauthorized: Please log in.' });
            }
            return res.redirect('/login.html');
        }

        // Strict access control for Vendor (3) and Finance (5)
        if (req.session.user.RoleID === 3) {
            // Vendors can only access register-vendor.html
            if (!req.path.includes('register-vendor.html')) {
                if (req.path.startsWith('/api/')) {
                    return res.status(403).json({ message: 'Forbidden: Access denied.' });
                }
                return res.redirect('/register-vendor.html');
            }
        } else if (req.session.user.RoleID === 5) {
            // Finance can only access budget.html
            if (!req.path.includes('budget.html')) {
                if (req.path.startsWith('/api/')) {
                    return res.status(403).json({ message: 'Forbidden: Access denied.' });
                }
                return res.redirect('/budget.html');
            }
        }

        // For other roles, check if they're allowed
        if (!allowedRoles.includes(req.session.user.RoleID)) {
            if (req.path.startsWith('/api/')) {
                return res.status(403).json({ message: 'Forbidden: Access denied.' });
            }
            return res.status(403).send('Access denied');
        }
        next();
    };
};

// Modified login route
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const query = `
        SELECT User.*, Role.RoleName 
        FROM User 
        JOIN Role ON User.RoleID = Role.RoleID 
        WHERE User.Email = ?
    `;

    connection.query(query, [email], async (err, results) => {
        if (err) {
            console.error("Error fetching user:", err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        if (results.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid email.' });
        }

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.Password);

        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Invalid password.' });
        }

        // Store user info in session
        req.session.user = {
            UserID: user.UserID,
            UserName: user.UserName,
            Email: user.Email,
            RoleID: user.RoleID,
            RoleName: user.RoleName
        };

        // Log the login
        logAudit(user.UserID, 'LOGIN', `User ${user.UserName} logged in as ${user.RoleName}`);

        // Simple role-based redirection
        let redirectUrl;
        switch (user.RoleID) {
            case 1: // Admin
                redirectUrl = '/index.html';
                break;
            case 2: // Manager
                redirectUrl = '/index.html';
                break;
            case 3: // Vendor
                redirectUrl = '/register-vendor.html';
                break;
            case 4: // Procurement
                redirectUrl = '/index.html';
                break;
            case 5: // Finance
                redirectUrl = '/budget.html';
                break;
            default:
                redirectUrl = '/login.html';
        }

        res.json({
            success: true,
            role: user.RoleID,
            roleName: user.RoleName,
            redirectUrl: redirectUrl
        });
    });
});

// Helper function to determine redirect URL based on role
function getRoleBasedRedirectUrl(roleId, vendorId, departmentId) {
    switch (roleId) {
        case 1: // Admin
            return '/';
        case 2: // Vendor
            return vendorId ? '/evaluate-performance.html' : '/register-vendor.html';
        case 3: // Finance
            return departmentId ? '/budget.html' : '/budget.html';
        case 4: // Procurement
            return departmentId ? '/register-vendor.html' : '/register-vendor.html';
        default:
            return '/login.html';
    }
}

// Add role checking middleware
app.get('/admin-dashboard.html', checkRole([1]), (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-dashboard.html'));
});

app.get('/vendor-dashboard.html', checkRole([2]), (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'vendor-dashboard.html'));
});

app.get('/finance-dashboard.html', checkRole([3]), (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'finance-dashboard.html'));
});

app.get('/procurement-dashboard.html', checkRole([4]), (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'procurement-dashboard.html'));
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
app.post('/api/register-vendor', checkRole([1, 2, 4]), (req, res) => { // Admin, Vendor, and Procurement
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
        logAudit(req.session.user.UserID, 'VENDOR_REGISTER', `New vendor registered: ${Name}`);
        res.redirect('/success.html');
    });
});

// Route: Fetch budget data
app.get('/api/budgets', (req, res) => { // Admin and Finance
    console.log('Fetching budget data...'); // Debug log
    console.log('User session:', req.session.user); // Debug log

    const query = `
        SELECT *
        FROM Budget
        ORDER BY BudgetID ASC
    `;

    connection.query(query, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ 
                error: 'Error fetching budget data',
                details: err.message 
            });
        }

        // Convert BigInt values to strings if necessary
        const sanitizedResults = results.map(row => ({
            ...row,
            AllocatedAmount: row.AllocatedAmount.toString(),
            SpentAmount: row.SpentAmount.toString()
        }));

        console.log('Budget data fetched:', sanitizedResults); // Debug log
        res.json(sanitizedResults);
    });
});


// Route: Fetch vendor directory
app.get('/api/vendors',  (req, res) => { // Admin and Procurement
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
app.post('/api/evaluate-performance', checkRole([1, 2]), (req, res) => { // Admin and Vendor
    const { VendorID, ServiceQuality, Timeliness, Pricing, Feedback } = req.body;

    // Validate input values
    if (!VendorID || !ServiceQuality || !Timeliness || !Pricing) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    // Check if VendorID exists
    const vendorCheckQuery = `SELECT COUNT(*) AS count FROM Vendor WHERE VendorID = ?`;
    connection.query(vendorCheckQuery, [VendorID], (err, results) => {
        if (err) {
            console.error("Error checking vendor ID:", err.stack);
            return res.status(500).json({ message: 'Database error: ' + err.message });
        }

        if (results[0].count === 0) {
            return res.status(400).json({ message: 'Vendor ID does not exist.' });
        }

        // Insert the performance evaluation data
        const query = `
            INSERT INTO VendorPerformance (VendorID, EvaluationDate, ServiceQuality, Timeliness, Pricing, Feedback)
            VALUES (?, CURDATE(), ?, ?, ?, ?)
        `;
        connection.query(query, [VendorID, ServiceQuality, Timeliness, Pricing, Feedback], (err) => {
            if (err) {
                console.error("Error inserting performance evaluation:", err.stack);
                return res.status(500).json({ message: 'Database error: ' + err.message });
            }
            logAudit(req.session.user.UserID, 'PERFORMANCE_EVAL', `Performance evaluation submitted for Vendor ID: ${VendorID}`);
            res.json({ message: 'Vendor performance evaluated successfully!' });
        });
    });
});

// Route: Adjust budget
app.post('/api/adjust-budget', (req, res) => {
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
        logAudit(req.session.user.UserID, 'BUDGET_ADJUST', `Budget ID ${BudgetID} adjusted by ${AdjustmentAmount}`);
        res.json({ message: 'Budget adjusted successfully' });
    });
});

// Route: Fetch audit logs
app.get('/audit-logs', (req, res) => {
    const query = `
        SELECT a.*, u.UserName 
        FROM AuditLog a 
        LEFT JOIN User u ON a.UserID = u.UserID 
        ORDER BY ActionDate DESC
    `;
    connection.query(query, (err, results) => {
        if (err) return res.status(500).send('Database error: ' + err.message);
        res.json(results);
    });
});

// Route: Fetch notifications
app.get('/api/notifications', (req, res) => {
    const query = `SELECT * FROM Notification`;
    connection.query(query, (err, results) => {
        if (err) return res.status(500).send('Database error: ' + err.message);
        res.json(results);
    });
});
// Add Vendor Route
app.post('/api/add-vendor', (req, res) => {
    const { Name, ServiceCategory, ContactInfo, ComplianceCertifications } = req.body;

    if (!Name || !ServiceCategory || !ContactInfo || !ComplianceCertifications) {
        return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const query = `
        INSERT INTO Vendor (Name, ServiceCategory, ContactInfo, ComplianceCertifications)
        VALUES (?, ?, ?, ?)
    `;
    connection.query(query, [Name, ServiceCategory, ContactInfo, ComplianceCertifications], (err) => {
        if (err) {
            console.error("Error inserting vendor:", err.stack);
            return res.status(500).json({ success: false, message: 'Database error: ' + err.message });
        }

        res.json({ success: true, message: 'Vendor added successfully!' });
    });
});

// Delete Vendor Route
app.post('/api/delete-vendor', (req, res) => {
    const { email, password, vendorID } = req.body;

    if (!email || !password || !vendorID) {
        return res.status(400).json({ success: false, message: 'Email, password, and vendor ID are required.' });
    }

    // Re-authenticate the user
    const query = `SELECT * FROM User WHERE Email = ?`;
    connection.query(query, [email], async (err, results) => {
        if (err) {
            console.error("Error fetching user:", err.stack);
            return res.status(500).json({ success: false, message: 'Database error: ' + err.message });
        }

        if (results.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid email or password.' });
        }

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.Password);

        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Invalid email or password.' });
        }

        // Delete the vendor
        const deleteQuery = `DELETE FROM Vendor WHERE VendorID = ?`;
        connection.query(deleteQuery, [vendorID], (err) => {
            if (err) {
                console.error("Error deleting vendor:", err.stack);
                return res.status(500).json({ success: false, message: 'Database error: ' + err.message });
            }
            logAudit(user.UserID, 'VENDOR_DELETE', `Vendor ID ${vendorID} deleted`);
            res.json({ success: true, message: 'Vendor deleted successfully!' });
        });
    });
});

// Route: Fetch contracts
app.get('/api/contracts', (req, res) => {
    const query = `SELECT * FROM Contract`;
    connection.query(query, (err, results) => {
        if (err) return res.status(500).send('Database error: ' + err.message);
        res.json(results);
    });
});

// Route: Fetch purchase orders
app.get('/api/purchase-orders', (req, res) => {
    const query = `SELECT * FROM PurchaseOrder`;
    connection.query(query, (err, results) => {
        if (err) return res.status(500).send('Database error: ' + err.message);
        res.json(results);
    });
});

// Route: Approve purchase orders
app.post('/api/purchase-orders/approve', (req, res) => {
    const { POID } = req.body;
    if (!POID) {
        return res.status(400).send('POID is required.');
    }
    const query = `UPDATE PurchaseOrder SET Status = 'Approved' WHERE POID = ?`;
    connection.query(query, [POID], (err) => {
        if (err) return res.status(500).send('Database error: ' + err.message);
        res.json({ message: 'Purchase order approved successfully' });
    });
});

// Route: Manage tasks
app.post('/api/tasks', (req, res) => {
    // Implement task management logic
    res.json({ message: 'Task management not implemented yet' });
});

// Route: Fetch reports
app.get('/api/reports', (req, res) => {
    res.json({ message: "Reports endpoint is functional", data: [1, 2, 3, 4, 5] });
});

// Serve the main page
app.get('/', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login.html'); // Redirect to login if not authenticated
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/vendor-directory.html', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login.html');
    }
    res.sendFile(path.join(__dirname, 'public', 'vendor-directory.html'));
});

// Logout Route (optional)
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        // ...existing code...
        res.redirect('/login.html');
    });
});

// Add protection to routes
app.get('/index.html', checkRole([1, 2, 4]), (req, res) => { // Admin, Manager, Procurement
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/register-vendor.html', checkRole([1, 3, 4]), (req, res) => { // Admin, Vendor, Procurement
    res.sendFile(path.join(__dirname, 'public', 'register-vendor.html'));
});

app.get('/budget.html', checkRole([1, 5]), (req, res) => { // Admin, Finance
    res.sendFile(path.join(__dirname, 'public', 'budget.html'));
});

// Add catch-all route for unauthorized access
app.get('*', (req, res, next) => {
    if (req.session.user) {
        if (req.session.user.RoleID === 3) {
            return res.redirect('/register-vendor.html');
        } else if (req.session.user.RoleID === 5) {
            return res.redirect('/budget.html');
        }
    }
    next();
});

// Add a route to check if the user is logged in
app.get('/api/check-session', (req, res) => {
    if (req.session.user) {
        res.json({ loggedIn: true, user: req.session.user });
    } else {
        res.json({ loggedIn: false });
    }
});

// Start the server
app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
