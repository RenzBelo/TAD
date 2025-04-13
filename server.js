const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const mysql = require('mysql2');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors({
    origin: 'http://127.0.0.1:5500'
}));
app.use(express.static(__dirname + '/public')); // Serve static files from the public folder
app.use(bodyParser.json());

// MySQL Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', // Replace with your MySQL username
    password: 'Ronncarlos', // Replace with your MySQL password
    database: 'task_management' // Replace with your database name
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database.');
});

// Sign-Up Route
app.post('/api/signup', async (req, res) => {
    const { username, email, password } = req.body;

    // Check if the email already exists
    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error' });
        }
        if (results.length > 0) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert the new user into the database
        db.query(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            [username, email, hashedPassword],
            (err, results) => {
                if (err) {
                    console.error('Database error during insert:', err);
                    return res.status(500).json({ message: 'Database error' });
                }
                console.log('User registered successfully:', { id: results.insertId, username, email });
                res.status(201).json({ message: 'User registered successfully' });
            }
        );
    });
});

// Login Route
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    // Check if the email exists
    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        if (results.length === 0) return res.status(401).json({ message: 'Invalid email or password' });

        const user = results[0];

        // Compare the password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

        res.json({ message: 'Login successful', user: { id: user.id, username: user.username, email: user.email } });
    });
});
// Logout Route
app.post('/api/logout', (req, res) => {
    // Clear session or token (if applicable)
    res.json({ message: 'Logged out successfully' });
});

// Serve index.html as the default page
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});