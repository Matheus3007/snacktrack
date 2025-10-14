import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import annotationPlugin from 'chartjs-plugin-annotation';
import './App.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, annotationPlugin);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function App() {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({ totalToday: 0, afterHours: 0, total: 0 });
  const [doorStatus, setDoorStatus] = useState({ isOpen: false, time: '', timeAgo: '' });
  const [lastUpdate, setLastUpdate] = useState('');
  const [granularity, setGranularity] = useState(60);

  const isAfterHours = (date) => {
    const hour = date.getHours();
    return hour >= 20 || hour < 7;
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
    const intervals = granularity === 60 ? 24 : granularity === 30 ? 48 : 96;
    const counts = new Array(intervals).fill(0);
    
    events.forEach(event => {
      if (event.event_type.toLowerCase().includes('open') && !event.event_type.toLowerCase().includes('close')) {
        const date = new Date(event.created_at);
        const totalMinutes = date.getHours() * 60 + date.getMinutes();
        const index = Math.floor(totalMinutes / granularity);
        counts[index]++;
      }
    });

    return {
      labels: Array.from({length: intervals}, (_, i) => {
        const totalMinutes = i * granularity;
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        return `${h}:${m.toString().padStart(2, '0')}`;
      }),
      datasets: [
        {
          label: '',
          data: counts,
          backgroundColor: counts.map((_, i) => {
            const totalMinutes = i * granularity;
            const hour = Math.floor(totalMinutes / 60);
            return isAfterHours(new Date(0, 0, 0, hour)) 
              ? 'rgba(255, 99, 132, 0.6)' 
              : 'rgba(54, 162, 235, 0.6)';
          }),
          borderColor: counts.map((_, i) => {
            const totalMinutes = i * granularity;
            const hour = Math.floor(totalMinutes / 60);
            return isAfterHours(new Date(0, 0, 0, hour)) 
              ? 'rgba(255, 99, 132, 0.9)' 
              : 'rgba(54, 162, 235, 0.9)';
          }),
          borderWidth: 1,
          barThickness: 'flex',
          categoryPercentage: 1.0,
          barPercentage: 1.0,
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
    layout: {
      padding: 0
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1 }
      },
      x: {
        offset: false,
        grid: {
          offset: false
        }
      }
    },
    elements: {
      bar: {
        borderWidth: 1
      }
    },
    plugins: {
      title: {
        display: false
      },
      legend: {
        display: false
      },
      annotation: {
        annotations: {
          currentTime: {
            type: 'line',
            xMin: (new Date().getHours() * 60 + new Date().getMinutes()) / granularity - 0.5,
            xMax: (new Date().getHours() * 60 + new Date().getMinutes()) / granularity - 0.5,
            borderColor: 'rgba(255, 165, 0, 0.8)',
            borderWidth: 2,
            label: {
              display: true,
              content: 'Now',
              position: 'start',
              rotation: 270,
              color: '#000',
              backgroundColor: 'rgba(255, 255, 255, 0)',
              borderColor: 'rgba(0, 0, 0, 0)',
              padding: 0,
              font: {
                size: 16,
                weight: 'bold'
              },
              xAdjust: -8,
              yAdjust: -10
            }
          }
        }
      }
    }
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>🍿 Snack Locker Monitor</h1>
        <Link to="/data" style={{ padding: '8px 16px', background: '#007bff', color: 'white', textDecoration: 'none', borderRadius: '4px', fontSize: '14px' }}>View Data</Link>
      </div>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>Door Opens by Time of Day (All Time)</div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              <span style={{ color: 'rgba(54, 162, 235, 1)' }}>■</span> Work Hours (7AM-8PM) 
              <span style={{ marginLeft: '12px', color: 'rgba(255, 99, 132, 1)' }}>■</span> After Hours (8PM-7AM)
            </div>
          </div>
          <select value={granularity} onChange={(e) => setGranularity(Number(e.target.value))} style={{ padding: '4px 8px', fontSize: '12px', border: '1px solid #ddd', borderRadius: '4px', background: 'white' }}>
            <option value={60}>1 hour</option>
            <option value={30}>30 min</option>
            <option value={15}>15 min</option>
          </select>
        </div>
        <div style={{ height: '400px' }}>
          <Bar data={getChartData()} options={chartOptions} />
        </div>
      </div>

      <div className="last-update">
        Last updated: {lastUpdate}
      </div>
    </div>
  );
}

export default App;
