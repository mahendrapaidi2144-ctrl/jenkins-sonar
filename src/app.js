const express = require('express');
const calculator = require('./calculator');

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Hello from DataQuaint Node.js CI demo!' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'UP' });
});

// Example: GET /calc/add?a=5&b=3
app.get('/calc/:op', (req, res) => {
  const { op } = req.params;
  const a = Number(req.query.a);
  const b = Number(req.query.b);

  if (Number.isNaN(a) || Number.isNaN(b)) {
    return res.status(400).json({ error: 'Query params a and b must be numbers' });
  }

  const fn = calculator[op];
  if (typeof fn !== 'function') {
    return res.status(404).json({ error: `Unknown operation: ${op}` });
  }

  try {
    return res.json({ op, a, b, result: fn(a, b) });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

module.exports = app;
