const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// ตั้งค่าเชื่อมต่อ PostgreSQL ไปยัง Supabase ด้วย Connection String
const pool = new Pool({
  connectionString: process.env.SUPERBASE_URL,
  ssl: {
    rejectUnauthorized: false // จำเป็นสำหรับการเชื่อมต่อ Supabase จากภายนอก
  }
});

// ตรวจสอบการเชื่อมต่อเมื่อเริ่มเซิร์ฟเวอร์
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error acquiring client', err.stack);
  }
  console.log('Connected to Supabase PostgreSQL successfully!');
  release();
});

// ดึงข้อมูลทั้งหมด
app.get('/api/frames', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM frames ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// เพิ่มข้อมูลใหม่
app.post('/api/frames', async (req, res) => {
  const { name, size, color, quantity, price } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO frames (name, size, color, quantity, price) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, size, color, quantity, price]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// แก้ไขข้อมูล (รวมถึงการปรับลด/เพิ่มจำนวน)
app.put('/api/frames/:id', async (req, res) => {
  const { id } = req.params;
  const { name, size, color, quantity, price } = req.body;
  try {
    const result = await pool.query(
      'UPDATE frames SET name = $1, size = $2, color = $3, quantity = $4, price = $5 WHERE id = $6 RETURNING *',
      [name, size, color, quantity, price, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ลบข้อมูล
app.delete('/api/frames/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM frames WHERE id = $1', [id]);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on port ${process.env.PORT || 5000}`);
});