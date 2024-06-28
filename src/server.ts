import express from 'express';
const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Hello, Telescope!!!' });
});

const PORT = 4000;

app.listen(PORT, () => {
  console.log(`Test server is running on http://localhost:${PORT}`);
});
