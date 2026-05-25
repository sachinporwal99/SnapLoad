const express = require('express');
const cors = require('cors');
const { PUBLIC_DIR } = require('./config');

const infoRouter = require('./routes/info');
const downloadRouter = require('./routes/download');
const mp3Router = require('./routes/mp3');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(PUBLIC_DIR));

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/info', infoRouter);
app.use('/api/download', downloadRouter);
app.use('/api/mp3', mp3Router);

module.exports = app;
