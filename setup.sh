#!/bin/bash

echo "Setting up snacktrack project..."

# Create directory structure
mkdir -p backend
mkdir -p frontend/src

# ============= BACKEND FILES =============

# backend/package.json
cat >backend/package.json <<'EOF'
{
  "name": "snacktrack-backend",
  "version": "1.0.0",
  "description": "Backend API for snack locker tracker",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
EOF

# backend/server.js
cat >backend/server.js <<'EOF'
const express = require('express');
const cors = require('cors');
require('dotenv').config();

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

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
EOF

# backend/.env
cat >backend/.env <<'EOF'
SUPABASE_URL=https://pjibitcgmkqhdydtaodh.supabase.co
SUPABASE_SERVICE_KEY=REPLACE_WITH_YOUR_SERVICE_KEY
PORT=3001
EOF

# ============= FRONTEND FILES =============

# frontend/package.json
cat >frontend/package.json <<'EOF'
{
  "name": "snacktrack-frontend",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "chart.js": "^4.4.0",
    "react-chartjs-2": "^5.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.0.8"
  }
}
EOF

# frontend/vite.config.js
cat >frontend/vite.config.js <<'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173
  }
})
EOF

# frontend/index.html
cat >frontend/index.html <<'EOF'
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Snack Locker Tracker</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
EOF

# frontend/.env
cat >frontend/.env <<'EOF'
VITE_API_URL=http://localhost:3001
EOF

# frontend/src/main.jsx
cat >frontend/src/main.jsx <<'EOF'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
EOF

# frontend/src/index.css
cat >frontend/src/index.css <<'EOF'
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#root {
  width: 100%;
  min-height: 100vh;
}
EOF

# frontend/src/App.css
cat >frontend/src/App.css <<'EOF'
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  margin: 0;
  padding: 20px;
  background: #f5f5f5;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

h1 {
  margin: 0 0 10px 0;
  color: #333;
}

.subtitle {
  color: #666;
  margin-bottom: 30px;
}

.door-status {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 30px;
  border-left: 4px solid #ccc;
  transition: all 0.3s ease;
}

.door-status.open {
  background: #fff3cd;
  border-left-color: #ffc107;
}

.door-status.closed {
  background: #d4edda;
  border-left-color: #28a745;
}

.status-indicator {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #6c757d;
  animation: pulse 2s infinite;
  transition: background 0.3s ease;
}

.status-indicator.open {
  background: #ffc107;
}

.status-indicator.closed {
  background: #28a745;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.status-text {
  flex: 1;
}

.status-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
}

.status-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  transition: color 0.3s ease;
}

.status-time {
  font-size: 14px;
  color: #666;
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-box {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  border-left: 4px solid #007bff;
}

.stat-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #333;
  transition: all 0.3s ease;
}

.after-hours {
  border-left-color: #dc3545;
}

.chart-container {
  margin-top: 30px;
  height: 400px;
}

.last-update {
  text-align: center;
  color: #999;
  font-size: 12px;
  margin-top: 20px;
}
EOF

# frontend/src/App.jsx
cat >frontend/src/App.jsx <<'EOF'
import { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import './App.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function App() {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({ totalToday: 0, afterHours: 0, total: 0 });
  const [doorStatus, setDoorStatus] = useState({ isOpen: false, time: '', timeAgo: '' });
  const [lastUpdate, setLastUpdate] = useState('');

  const isAfterHours = (date) => {
    const hour = date.getHours();
    return hour >= 19 || hour < 7;
  };

  const fetchEvents = async () => {
    try {
      const response = await fetch(`${API_URL}/api/events`);
      const data = await response.json();
      setEvents(data);
      updateStats(data);
      updateDoorStatus(data);
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const updateStats = (eventsData) => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const todayEvents = eventsData.filter(e => new Date(e.created_at) >= todayStart);
    const todayOpens = todayEvents.filter(e => 
      e.event_type.toLowerCase().includes('open') && !e.event_type.toLowerCase().includes('close')
    );
    const afterHoursEvents = todayOpens.filter(e => isAfterHours(new Date(e.created_at)));
    
    setStats({
      totalToday: todayOpens.length,
      afterHours: afterHoursEvents.length,
      total: eventsData.length
    });
  };

  const updateDoorStatus = (eventsData) => {
    if (eventsData.length === 0) return;
    
    const latest = eventsData[0];
    const eventTime = new Date(latest.created_at);
    const isOpen = latest.event_type.toLowerCase().includes('open') && 
                   !latest.event_type.toLowerCase().includes('close');
    
    const now = new Date();
    const timeDiff = Math.floor((now - eventTime) / 1000);
    let timeAgo;
    
    if (timeDiff < 60) {
      timeAgo = `${timeDiff} seconds ago`;
    } else if (timeDiff < 3600) {
      timeAgo = `${Math.floor(timeDiff / 60)} minutes ago`;
    } else {
      timeAgo = eventTime.toLocaleString();
    }
    
    setDoorStatus({
      isOpen,
      time: eventTime.toLocaleTimeString(),
      timeAgo
    });
  };

  const getChartData = () => {
    const hourCounts = new Array(24).fill(0);
    const afterHourCounts = new Array(24).fill(0);
    
    events.forEach(event => {
      const date = new Date(event.created_at);
      const hour = date.getHours();
      hourCounts[hour]++;
      if (isAfterHours(date)) {
        afterHourCounts[hour]++;
      }
    });

    return {
      labels: Array.from({length: 24}, (_, i) => `${i}:00`),
      datasets: [
        {
          label: 'Work Hours',
          data: hourCounts.map((count, hour) => 
            isAfterHours(new Date(0, 0, 0, hour)) ? 0 : count
          ),
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
        },
        {
          label: 'After Hours (SUSPICIOUS)',
          data: afterHourCounts,
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
        }
      ]
    };
  };

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 5000);
    return () => clearInterval(interval);
  }, []);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1 }
      }
    },
    plugins: {
      title: {
        display: true,
        text: 'Door Opens by Hour of Day (All Time)',
        font: { size: 16 }
      }
    }
  };

  return (
    <div className="container">
      <h1>🍿 Snack Locker Monitor</h1>
      <div className="subtitle">Real-time door activity tracking</div>
      
      <div className={`door-status ${doorStatus.isOpen ? 'open' : 'closed'}`}>
        <div className={`status-indicator ${doorStatus.isOpen ? 'open' : 'closed'}`}></div>
        <div className="status-text">
          <div className="status-label">Current Status</div>
          <div className="status-value">
            {doorStatus.isOpen ? '🔓 Door Open' : '🔒 Door Closed'}
          </div>
          <div className="status-time">{doorStatus.timeAgo}</div>
        </div>
      </div>

      <div className="stats">
        <div className="stat-box">
          <div className="stat-label">Total Opens Today</div>
          <div className="stat-value">{stats.totalToday}</div>
        </div>
        <div className="stat-box after-hours">
          <div className="stat-label">After Hours (7PM-7AM)</div>
          <div className="stat-value">{stats.afterHours}</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Total Events</div>
          <div className="stat-value">{stats.total}</div>
        </div>
      </div>

      <div className="chart-container">
        <Bar data={getChartData()} options={chartOptions} />
      </div>

      <div className="last-update">
        Last updated: {lastUpdate}
      </div>
    </div>
  );
}

export default App;
EOF

echo ""
echo "✅ Project structure created!"
echo ""
echo "Next steps:"
echo "1. Edit backend/.env and add your Supabase service_role key"
echo "2. cd backend && npm install && npm run dev"
echo "3. In another terminal: cd frontend && npm install && npm run dev"
echo "4. Open http://localhost:5173"
echo ""
