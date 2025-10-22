import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import './App.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function AfterHoursPage() {
  const [stats, setStats] = useState({});
  const [events, setEvents] = useState([]);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`${API_URL}/api/after-hours-stats?days=${days}`).then(r => r.json()),
      fetch(`${API_URL}/api/after-hours-events?days=${days}`).then(r => r.json())
    ])
    .then(([statsData, eventsData]) => {
      setStats(Array.isArray(statsData) ? statsData[0] || {} : statsData);
      setEvents(Array.isArray(eventsData) ? eventsData : []);
      setLoading(false);
    })
    .catch(err => {
      console.error('Error:', err);
      setLoading(false);
    });
  }, [days]);

  const timelineData = {
    labels: events.slice().reverse().map(e => new Date(e.opened_at_sp).toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    })),
    datasets: [{
      label: 'Duration (seconds)',
      data: events.slice().reverse().map(e => e.duration_seconds),
      backgroundColor: events.slice().reverse().map(e => 
        e.duration_seconds > (stats?.business_hours_avg || 13.7) ? 'rgba(255, 99, 132, 0.8)' : 'rgba(54, 162, 235, 0.8)'
      ),
      borderColor: events.slice().reverse().map(e => 
        e.duration_seconds > (stats?.business_hours_avg || 13.7) ? 'rgba(255, 99, 132, 1)' : 'rgba(54, 162, 235, 1)'
      ),
      borderWidth: 1
    }]
  };

  const timelineOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: `After-Hours Event Durations (Red = Above Business Hours Avg: ${stats?.business_hours_avg?.toFixed(1) || 13.7}s)` },
      tooltip: {
        callbacks: {
          label: (context) => {
            const event = events.slice().reverse()[context.dataIndex];
            return `Duration: ${event.duration_seconds.toFixed(1)}s`;
          }
        }
      }
    },
    scales: {
      y: { 
        title: { display: true, text: 'Duration (seconds)' },
        beginAtZero: true
      },
      x: { 
        title: { display: true, text: 'Date & Time' },
        ticks: { maxRotation: 45, minRotation: 45 }
      }
    }
  };

  const dailyCounts = events.reduce((acc, e) => {
    const date = new Date(e.opened_at_sp).toLocaleDateString();
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  const lineData = {
    labels: Object.keys(dailyCounts).reverse(),
    datasets: [{
      label: 'Events per Day',
      data: Object.values(dailyCounts).reverse(),
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1
    }]
  };

  const hourCounts = events.reduce((acc, e) => {
    const hour = new Date(e.opened_at_sp).getHours();
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {});

  const barData = {
    labels: Array.from({length: 24}, (_, i) => `${i}:00`),
    datasets: [{
      label: 'Events by Hour',
      data: Array.from({length: 24}, (_, i) => hourCounts[i] || 0),
      backgroundColor: Array.from({length: 24}, (_, i) => 
        (i >= 21 || i < 7) ? 'rgba(255, 99, 132, 0.7)' : 'rgba(201, 203, 207, 0.3)'
      )
    }]
  };

  return (
    <div className="container">
      {loading && <div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div>}
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>After-Hours Monitoring</h1>
        <Link to="/" className="back-link">← Back</Link>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label>Time Range: </label>
        <select value={days} onChange={(e) => setDays(e.target.value)}>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div className="stat-card">
          <h3>{stats?.total_events || 0}</h3>
          <p>After-Hours Events</p>
        </div>
        <div className="stat-card">
          <h3>{stats?.avg_duration_seconds?.toFixed(1) || 0}s</h3>
          <p>Avg Duration</p>
        </div>
        <div className="stat-card">
          <h3>{stats?.business_hours_avg?.toFixed(1) || 13.7}s</h3>
          <p>Business Hours Avg</p>
        </div>
        <div className="stat-card">
          <h3>{stats?.max_duration_seconds?.toFixed(0) || 0}s</h3>
          <p>Longest Event</p>
        </div>
        <div className="stat-card suspicious">
          <h3>{stats?.suspicious_count || 0}</h3>
          <p>Above Business Avg</p>
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <Bar data={timelineData} options={timelineOptions} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          <Line data={lineData} options={{ responsive: true, plugins: { title: { display: true, text: 'Daily Event Count' }}}} />
        </div>
        <div>
          <Bar data={barData} options={{ responsive: true, plugins: { title: { display: true, text: 'Events by Hour' }}}} />
        </div>
      </div>

      <div style={{ marginTop: '30px' }}>
        <h2>Recent After-Hours Events</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Date/Time</th>
              <th>Duration</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {events.slice(0, 20).map(e => (
              <tr key={e.event_id} style={{ borderBottom: '1px solid #ddd' }}>
                <td>{new Date(e.opened_at_sp).toLocaleString()}</td>
                <td>{e.duration_seconds?.toFixed(1)}s</td>
                <td style={{ color: e.duration_seconds > (stats?.business_hours_avg || 13.7) ? '#ff6384' : '#36a2eb' }}>
                  {e.duration_seconds > (stats?.business_hours_avg || 13.7) ? '⚠️ Above Avg' : '✓ Normal'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AfterHoursPage;
