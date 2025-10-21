import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import annotationPlugin from 'chartjs-plugin-annotation';
import './App.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, annotationPlugin);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function DataPage() {
  const [events, setEvents] = useState([]);
  const [granularity, setGranularity] = useState(60);
  const [timeseriesWindow, setTimeseriesWindow] = useState(24);
  const [timeseriesInterval, setTimeseriesInterval] = useState(60);
  const [timeseriesScroll, setTimeseriesScroll] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const isAfterHours = (date) => {
    const hour = date.getHours();
    return hour >= 20 || hour < 7;
  };

  const fetchEvents = async () => {
    try {
      const response = await fetch(`${API_URL}/api/events`);
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 5000);
    return () => clearInterval(interval);
  }, []);

  const getChartData = (todayOnly = false) => {
    const intervals = granularity === 60 ? 24 : granularity === 30 ? 48 : 96;
    const counts = new Array(intervals).fill(0);
    
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const filteredEvents = todayOnly 
      ? events.filter(e => new Date(e.created_at) >= todayStart)
      : events;

    filteredEvents.forEach(event => {
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
      ],
      maxValue: Math.max(...counts)
    };
  };

  const getHeatmapData = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const heatmap = Array(7).fill(null).map(() => Array(24).fill(0));

    events.forEach(event => {
      if (event.event_type.toLowerCase().includes('open') && !event.event_type.toLowerCase().includes('close')) {
        const date = new Date(event.created_at);
        const day = date.getDay();
        const hour = date.getHours();
        heatmap[day][hour]++;
      }
    });

    const maxCount = Math.max(...heatmap.flat());

    return { days, heatmap, maxCount };
  };

  const getTimeseriesData = () => {
    const safeWindow = Math.max(5, Math.min(100, timeseriesWindow || 24));
    const safeInterval = Math.max(10, Math.min(1440, timeseriesInterval || 60));
    const safeScroll = Math.max(0, timeseriesScroll || 0);
    
    const now = Date.now();
    const intervalMs = safeInterval * 60 * 1000;
    const totalBars = 200;
    const allData = new Array(totalBars).fill(0);
    const allLabels = [];
    const allTimes = [];

    try {
      for (let i = totalBars - 1; i >= 0; i--) {
        const endTime = now - (i * intervalMs);
        const startTime = endTime - intervalMs;
        
        const count = events.filter(e => {
          if (!e.event_type.toLowerCase().includes('open') || e.event_type.toLowerCase().includes('close')) return false;
          const eventTime = new Date(e.created_at).getTime();
          return eventTime >= startTime && eventTime < endTime;
        }).length;

        allData[totalBars - 1 - i] = count;
        
        const date = new Date(endTime);
        allTimes.push(date);
        if (safeInterval >= 1440) {
          allLabels.push(date.toLocaleDateString());
        } else {
          const hours = date.getHours().toString().padStart(2, '0');
          const minutes = date.getMinutes().toString().padStart(2, '0');
          allLabels.push(`${hours}:${minutes}`);
        }
      }
    } catch (e) {
      console.error('Timeseries calculation error:', e);
    }

    const maxScroll = Math.max(0, totalBars - safeWindow);
    const clampedScroll = Math.min(safeScroll, maxScroll);
    const start = Math.max(0, totalBars - safeWindow - clampedScroll);
    const end = totalBars - clampedScroll;

    const slicedTimes = allTimes.slice(start, end);
    const pointColors = slicedTimes.map(date => {
      const hour = date.getHours();
      return (hour >= 22 || hour < 7) ? 'rgba(255, 99, 132, 1)' : 'rgba(54, 162, 235, 1)';
    });

    return {
      labels: allLabels.slice(start, end),
      datasets: [{
        label: 'Door Opens',
        data: allData.slice(start, end),
        segment: {
          borderColor: (ctx) => {
            const idx = ctx.p0DataIndex;
            const date = slicedTimes[idx];
            const hour = date.getHours();
            return (hour >= 22 || hour < 7) ? 'rgba(255, 99, 132, 1)' : 'rgba(54, 162, 235, 1)';
          }
        },
        pointBackgroundColor: pointColors,
        pointBorderColor: pointColors,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
        fill: true,
      }],
      maxScroll,
      safeWindow
    };
  };

  const chartOptions = (todayOnly = false, maxY) => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    layout: { padding: 0 },
    scales: {
      y: { beginAtZero: true, max: Math.ceil(maxY * 1.2), ticks: { stepSize: 1 } },
      x: { offset: false, grid: { offset: false } }
    },
    elements: { bar: { borderWidth: 1 } },
    plugins: {
      title: { display: false },
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: (context) => {
            const index = context[0].dataIndex;
            const safeInterval = Math.max(10, Math.min(1440, timeseriesInterval || 60));
            const safeScroll = Math.max(0, timeseriesScroll || 0);
            const totalBars = 200;
            const safeWindow = Math.max(5, Math.min(100, timeseriesWindow || 24));
            const start = Math.max(0, totalBars - safeWindow - safeScroll);
            const actualIndex = start + index;
            const endTime = Date.now() - ((totalBars - 1 - actualIndex) * safeInterval * 60 * 1000);
            return new Date(endTime).toLocaleString();
          }
        }
      },
      annotation: todayOnly ? {
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
              font: { size: 16, weight: 'bold' },
              xAdjust: -8,
              yAdjust: -10
            }
          }
        }
      } : {}
    }
  });

  const { days, heatmap, maxCount } = getHeatmapData();
  const allTimeData = getChartData(false);
  const todayData = getChartData(true);
  const timeseriesData = getTimeseriesData();
  const maxY = Math.max(allTimeData.maxValue, todayData.maxValue);

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>📊 Data Visualizations</h1>
        <Link to="/" style={{ padding: '8px 16px', background: '#007bff', color: 'white', textDecoration: 'none', borderRadius: '4px', fontSize: '14px' }}>Back to Monitor</Link>
      </div>
      <div className="subtitle">Comprehensive door activity analytics</div>

      <div style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>All Time Door Opens</div>
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
        <div style={{ height: '300px' }}>
          <Bar data={allTimeData} options={chartOptions(false, maxY)} />
        </div>
      </div>

      <div style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>Today's Door Opens</div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              <span style={{ color: 'rgba(54, 162, 235, 1)' }}>■</span> Work Hours (7AM-8PM) 
              <span style={{ marginLeft: '12px', color: 'rgba(255, 99, 132, 1)' }}>■</span> After Hours (8PM-7AM)
            </div>
          </div>
        </div>
        <div style={{ height: '300px' }}>
          <Bar data={todayData} options={chartOptions(true, maxY)} />
        </div>
      </div>

      <div style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ fontSize: '16px', fontWeight: 'bold' }}>Rolling Window Timeseries</div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '12px', marginRight: '4px' }}>Bars:</label>
              <input type="number" min="5" max="100" value={timeseriesWindow} onChange={(e) => { const v = Number(e.target.value); if (v >= 5 && v <= 100) setTimeseriesWindow(v); }} style={{ width: '60px', padding: '4px', fontSize: '12px', border: '1px solid #ddd', borderRadius: '4px' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', marginRight: '4px' }}>Interval:</label>
              <select value={timeseriesInterval} onChange={(e) => setTimeseriesInterval(Number(e.target.value))} style={{ padding: '4px 8px', fontSize: '12px', border: '1px solid #ddd', borderRadius: '4px', background: 'white' }}>
                <option value={10}>10 min</option>
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={60}>1 hour</option>
                <option value={120}>2 hours</option>
                <option value={240}>4 hours</option>
                <option value={480}>8 hours</option>
                <option value={720}>12 hours</option>
                <option value={1440}>24 hours</option>
              </select>
            </div>
          </div>
        </div>
        <div style={{ height: '300px' }}>
          <Line data={timeseriesData} options={chartOptions(false, Math.max(1, ...timeseriesData.datasets[0].data))} />
        </div>
        <div style={{ marginTop: '10px' }}>
          <div style={{ position: 'relative', height: '40px', background: '#f0f0f0', borderRadius: '4px', cursor: 'grab' }}
               onMouseDown={(e) => {
                 setIsDragging(true);
                 const rect = e.currentTarget.getBoundingClientRect();
                 const startX = e.clientX;
                 const startScroll = timeseriesScroll;
                 
                 const handleMove = (e) => {
                   const deltaX = startX - e.clientX;
                   const totalWidth = rect.width;
                   const scrollDelta = (deltaX / totalWidth) * 200;
                   setTimeseriesScroll(Math.max(0, Math.min(timeseriesData.maxScroll, startScroll + scrollDelta)));
                 };
                 
                 const handleUp = () => {
                   setIsDragging(false);
                   document.removeEventListener('mousemove', handleMove);
                   document.removeEventListener('mouseup', handleUp);
                 };
                 
                 document.addEventListener('mousemove', handleMove);
                 document.addEventListener('mouseup', handleUp);
               }}>
            <div style={{
              position: 'absolute',
              right: `${(timeseriesScroll / 200) * 100}%`,
              width: `${(timeseriesData.safeWindow / 200) * 100}%`,
              height: '100%',
              background: 'rgba(75, 192, 192, 0.5)',
              border: '2px solid rgba(75, 192, 192, 1)',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 'bold',
              color: '#333',
              pointerEvents: 'none'
            }}>
              Viewing Window
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '10px', color: '#666' }}>
            <span>{new Date(Date.now() - 200 * timeseriesInterval * 60 * 1000).toLocaleDateString()}</span>
            <span>{new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      <div>
        <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>Weekly Heatmap - Door Opens</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th style={{ padding: '4px', border: '1px solid #ddd', background: '#f8f9fa', fontSize: '10px' }}></th>
                {Array.from({length: 24}, (_, i) => (
                  <th key={i} style={{ padding: '4px', border: '1px solid #ddd', background: '#f8f9fa', fontSize: '10px' }}>{i}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map((day, dayIdx) => (
                <tr key={day}>
                  <td style={{ padding: '4px', border: '1px solid #ddd', background: '#f8f9fa', fontWeight: 'bold', fontSize: '11px' }}>{day.slice(0, 3)}</td>
                  {heatmap[dayIdx].map((count, hourIdx) => {
                    const intensity = maxCount > 0 ? count / maxCount : 0;
                    const bgColor = `rgba(54, 162, 235, ${intensity * 0.8})`;
                    return (
                      <td key={hourIdx} style={{ padding: '4px', border: '1px solid #ddd', background: bgColor, textAlign: 'center', fontSize: '10px' }}>
                        {count || ''}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default DataPage;
