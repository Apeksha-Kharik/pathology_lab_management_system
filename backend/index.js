const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Pathology Lab Backend is Running!');
});

app.listen(5000, () => {
  console.log('Server is alive on http://localhost:5000');
});