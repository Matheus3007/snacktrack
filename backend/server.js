import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Supabase config
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

app.use(cors());
app.use(express.json());

// Get all door events
app.get('/api/events', async (req, res) => {
  try {
    const limit = req.query.limit || 1000;
    
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/door_events?select=*&order=created_at.desc&limit=${limit}`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      }
    );
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Get after-hours statistics
app.get('/api/after-hours-stats', async (req, res) => {
  try {
    const days = req.query.days || 7;
    const [afterHours, businessHours] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/rpc/get_after_hours_stats`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ days_back: parseInt(days) })
      }).then(r => r.json()),
      fetch(`${SUPABASE_URL}/rest/v1/rpc/get_business_hours_avg`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ days_back: parseInt(days) })
      }).then(r => r.json())
    ]);
    
    const stats = afterHours[0] || {};
    const businessAvg = businessHours[0]?.avg_duration_seconds || 13.7;
    
    res.json([{ ...stats, business_hours_avg: businessAvg }]);
  } catch (error) {
    console.error('Error fetching after-hours stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get after-hours events with durations
app.get('/api/after-hours-events', async (req, res) => {
  try {
    const days = req.query.days || 30;
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/rpc/get_after_hours_events`,
      {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ days_back: parseInt(days) })
      }
    );
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching after-hours events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});