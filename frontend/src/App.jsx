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
