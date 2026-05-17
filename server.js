require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDB } = require('./db/database');
const linksRouter = require('./routes/links');
const mpesaRouter = require('./routes/mpesa');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/links', linksRouter);
app.use('/api/mpesa', mpesaRouter);

app.get('/pay/:linkId', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pay.html'));
});

app.get('/success/:linkId', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'success.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`PayLinka running on http://localhost:${PORT}`);
  });
});