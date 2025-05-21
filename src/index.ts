import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import identifyRoutes from './routes/identify';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use('/identify', identifyRoutes);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
