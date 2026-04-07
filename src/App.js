import React, { useState, useCallback, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { 
  calculateRisk, 
  calculateRouteRisk, 
  generateTemperatureHistory, 
  formatTime,
  generateProjectedTrend,
  compareRoutes
} from './utils/riskCalculator';
import './App.css';

function App() {
  // Input States
  const [temperature, setTemperature] = useState(8.5);
  const [travelMinutes, setTravelMinutes] = useState(180);
  const [ambientTemp, setAmbientTemp] = useState(32);
  const [sunExposure, setSunExposure] = useState(65);
  const [shadeCover, setShadeCover] = useState(30);
  
  // Analysis State
  const [analyzeClicked, setAnalyzeClicked] = useState(false);
  const [countdownValue, setCountdownValue] = useState(0);
  const countdownIntervalRef = useRef(null);
  
  // Result States
  const [riskData, setRiskData] = useState(() => calculateRisk(8.5, 180, 32));
  const [routeRisk, setRouteRisk] = useState(() => calculateRouteRisk(8.5, 180, 32, 65, 30));
  const [temperatureHistory, setTemperatureHistory] = useState(() => generateTemperatureHistory(8.5, 32));
  const [projectedTemps, setProjectedTemps] = useState([]);
  const [routeComparison, setRouteComparison] = useState(null);
  
  const canvasRef = useRef(null);
  
  // Handle Analyze Button
  const handleAnalyze = () => {
    setAnalyzeClicked(true);
  };
  
  // Reset and Re-analyze
  const handleReset = () => {
    setAnalyzeClicked(false);
    setCountdownValue(0);
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
  };
  
  // Update all predictions
  const updatePredictions = useCallback(() => {
    const newRisk = calculateRisk(temperature, travelMinutes, ambientTemp);
    setRiskData(newRisk);
    
    const newRouteRisk = calculateRouteRisk(temperature, travelMinutes, ambientTemp, sunExposure, shadeCover);
    setRouteRisk(newRouteRisk);
    
    const newHistory = generateTemperatureHistory(temperature, ambientTemp);
    setTemperatureHistory(newHistory);
    
    const trend = generateProjectedTrend(temperature, travelMinutes);
    setProjectedTemps(trend);
    
    const comparison = compareRoutes(temperature, travelMinutes, ambientTemp);
    setRouteComparison(comparison);
    
    // Start countdown timer
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    
    setCountdownValue(newRisk.timeLeft);
    
    if (newRisk.timeLeft > 0 && newRisk.status !== 'Spoiled') {
      countdownIntervalRef.current = setInterval(() => {
        setCountdownValue(prev => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 60000);
    }
  }, [temperature, travelMinutes, ambientTemp, sunExposure, shadeCover]);
  
  // Run analysis when analyze is clicked
  useEffect(() => {
    if (analyzeClicked) {
      updatePredictions();
    }
  }, [updatePredictions, analyzeClicked]);
  
  // Cleanup
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);
  
  // Draw gauge meter
  useEffect(() => {
    if (!canvasRef.current || !analyzeClicked) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const riskPercent = Math.min(100, Math.max(0, (riskData.riskScore / 100) * 100));
    const angle = (riskPercent / 100) * Math.PI * 1.8;
    const startAngle = -Math.PI / 2 + 0.45;
    
    canvas.width = 200;
    canvas.height = 200;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Background
    ctx.beginPath();
    ctx.arc(canvas.width/2, canvas.height/2, 80, startAngle, startAngle + Math.PI * 1.8);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 18;
    ctx.stroke();
    
    // Colored progress
    let gradient;
    if (riskData.status === 'Safe') {
      gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      gradient.addColorStop(0, '#22c55e');
      gradient.addColorStop(1, '#4ade80');
    } else if (riskData.status === 'Risk') {
      gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      gradient.addColorStop(0, '#eab308');
      gradient.addColorStop(1, '#f59e0b');
    } else {
      gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      gradient.addColorStop(0, '#ef4444');
      gradient.addColorStop(1, '#dc2626');
    }
    
    ctx.beginPath();
    ctx.arc(canvas.width/2, canvas.height/2, 80, startAngle, startAngle + angle);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 18;
    ctx.stroke();
    
    // Center text
    ctx.font = 'bold 32px "Inter", sans-serif';
    ctx.fillStyle = '#1e293b';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${Math.round(riskPercent)}%`, canvas.width/2, canvas.height/2 - 5);
    ctx.font = '12px "Inter", sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('SPOILAGE RISK', canvas.width/2, canvas.height/2 + 25);
  }, [riskData, analyzeClicked]);
  
  const getStatusClass = (status) => {
    return status === 'Safe' ? 'safe' : status === 'Risk' ? 'risk' : 'spoiled';
  };
  
  const getStatusEmoji = (status) => {
    return status === 'Safe' ? '🟢' : status === 'Risk' ? '🟡' : '🔴';
  };
  
  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-icon">💉</div>
            <div className="logo-text">
              <h1>VaxiSafe</h1>
              <p>Offline AI for Vaccine Safety</p>
            </div>
          </div>
          <div className="offline-badge">
            <i className="fas fa-microchip"></i>
            <span>OFFLINE MODE · Edge AI Active</span>
          </div>
        </div>
      </header>
      
      <main className="main-content">
        {/* Input Card */}
        <div className="card">
          <div className="card-header">
            <i className="fas fa-download"></i>
            <h2>📥 Input Conditions</h2>
          </div>
          
          <div className="slider-group">
            <label className="slider-label">
              <span>🌡️ Vaccine Temperature (°C)</span>
              <span className="temp-value">{temperature}°C</span>
            </label>
            <input type="range" min="0" max="50" step="1" value={temperature} onChange={(e) => setTemperature(parseFloat(e.target.value))} />
          </div>
          
          <div className="slider-group">
            <label className="slider-label">
              <span>⏳ Time Exposed (min)</span>
              <span className="temp-value">{travelMinutes} min</span>
            </label>
            <input type="range" min="0" max="720" step="15" value={travelMinutes} onChange={(e) => setTravelMinutes(parseInt(e.target.value))} />
          </div>
          
          <div className="slider-group">
            <label className="slider-label">
              <span>☀️ Ambient Temperature (°C)</span>
              <span className="ambient-value">{ambientTemp}°C</span>
            </label>
            <input type="range" min="20" max="50" step="1" value={ambientTemp} onChange={(e) => setAmbientTemp(parseInt(e.target.value))} />
          </div>
          
          {!analyzeClicked ? (
            <button className="primary-button" onClick={handleAnalyze}>
              <i className="fas fa-chart-line"></i> 🚀 Analyze Now
            </button>
          ) : (
            <button className="secondary-button" onClick={handleReset}>
              <i className="fas fa-refresh"></i> 🔄 New Analysis
            </button>
          )}
        </div>
        
        {/* Results - Only show after analyze */}
        {analyzeClicked && (
          <>
            {/* Status Card */}
            <div className="card">
              <div className={`status-large ${getStatusClass(riskData.status)}`}>
                <i className={`fas ${riskData.status === 'Safe' ? 'fa-shield-check' : riskData.status === 'Risk' ? 'fa-triangle-exclamation' : 'fa-skull-crossbones'}`}></i>
                {getStatusEmoji(riskData.status)} {riskData.status === 'Safe' ? 'SAFE' : riskData.status === 'Risk' ? 'AT RISK' : 'SPOILED'}
              </div>
              <p className="risk-score">Risk Score: {riskData.riskScore}</p>
              <div className="spoilage-meter">
                <canvas ref={canvasRef} width="200" height="200"></canvas>
              </div>
            </div>
            
            {/* Timer Card with Live Countdown */}
            <div className="card">
              <div className="card-header">
                <i className="fas fa-hourglass-half"></i>
                <h2>⏱️ Safe Time Remaining</h2>
              </div>
              <div className="countdown-display">
                {countdownValue > 0 ? `${countdownValue} min` : '0 min'}
              </div>
              {countdownValue === 0 && riskData.status !== 'Safe' && (
                <div className="warning-message">⚠️ No safe time remaining</div>
              )}
            </div>
            
            {/* Projected Temperature Trend Card (Like Streamlit) */}
            <div className="card">
              <div className="card-header">
                <i className="fas fa-chart-line"></i>
                <h2>📈 Temperature Trend (Projected)</h2>
              </div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={projectedTemps}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="time" stroke="#94a3b8" label={{ value: 'Minutes', position: 'bottom' }} />
                    <YAxis stroke="#94a3b8" label={{ value: '°C', angle: -90, position: 'left' }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="temperature" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="chart-note">Projected temperature increase over time</p>
            </div>
            
            {/* Route Comparison Card (Like Streamlit) */}
            <div className="card">
              <div className="card-header">
                <i className="fas fa-route"></i>
                <h2>🗺️ Smart Route Comparison</h2>
              </div>
              
              <div className="route-comparison">
                <div className="route-card cooler">
                  <h3>🌳 Cooler Route</h3>
                  <p className="route-ambient">Ambient: {routeComparison?.cooler.ambientTemp}°C</p>
                  <div className={`status-badge ${getStatusClass(routeComparison?.cooler?.status)}`}>
                    {routeComparison?.cooler?.status}
                  </div>
                  <div className="route-time">{routeComparison?.cooler?.timeLeft} min</div>
                  <p className="route-label">Safe Time</p>
                </div>
                
                <div className="route-card hotter">
                  <h3>☀️ Hot Route</h3>
                  <p className="route-ambient">Ambient: {routeComparison?.hotter.ambientTemp}°C</p>
                  <div className={`status-badge ${getStatusClass(routeComparison?.hotter?.status)}`}>
                    {routeComparison?.hotter?.status}
                  </div>
                  <div className="route-time">{routeComparison?.hotter?.timeLeft} min</div>
                  <p className="route-label">Safe Time</p>
                </div>
              </div>
            </div>
            
            {/* Historical Temperature Card */}
            <div className="card">
              <div className="card-header blue">
                <i className="fas fa-history"></i>
                <h2>📊 Historical Temperature (Last 6 Hours)</h2>
              </div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={temperatureHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} />
                    <YAxis domain={[-2, 22]} stroke="#94a3b8" fontSize={10} />
                    <Tooltip />
                    <Area type="monotone" dataKey="temperature" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Route Risk Card (Your existing feature) */}
            <div className="card">
              <div className="card-header amber">
                <i className="fas fa-map-marked-alt"></i>
                <h2>Route Risk Analysis</h2>
              </div>
              <div className="route-risk-box">
                <div className="route-risk-header">
                  <span>Route Thermal Risk</span>
                  <span className={`route-status ${getStatusClass(routeRisk.status)}`}>{routeRisk.status}</span>
                </div>
                <div className="progress-bar">
                  <div className={`progress-fill ${getStatusClass(routeRisk.status)}`} style={{ width: `${Math.min(100, (routeRisk.riskScore / 100) * 100)}%` }}></div>
                </div>
              </div>
              <div className="suggestion-box">
                <p><i className="fas fa-leaf"></i> {routeRisk.suggestion}</p>
                <small><i className="fas fa-temperature-high"></i> {routeRisk.details}</small>
              </div>
              
              <div className="slider-group">
                <label className="slider-label">
                  <span>☀️ Sun Exposure</span>
                  <span>{sunExposure}%</span>
                </label>
                <input type="range" min="0" max="100" step="5" value={sunExposure} onChange={(e) => setSunExposure(parseInt(e.target.value))} />
              </div>
              
              <div className="slider-group">
                <label className="slider-label">
                  <span>🌳 Shade Cover</span>
                  <span>{shadeCover}%</span>
                </label>
                <input type="range" min="0" max="100" step="5" value={shadeCover} onChange={(e) => setShadeCover(parseInt(e.target.value))} />
              </div>
              
              <button className="primary-button" onClick={updatePredictions}>
                <i className="fas fa-route"></i> Update Route Analysis
              </button>
            </div>
            
            {/* AI Insight */}
            <div className="ai-insight">
              <div className="ai-insight-header">
                <i className="fas fa-brain"></i>
                <span>TinyML Offline Insight</span>
              </div>
              <p className="ai-insight-text">
                {riskData.status === 'Safe' && '✅ Thermal trajectory stable. Vaccine integrity maintained.'}
                {riskData.status === 'Risk' && `⚠️ Temperature deviation detected. Act within ${countdownValue} minutes.`}
                {riskData.status === 'Spoiled' && '🔴 CRITICAL: Spoilage threshold reached. Do NOT administer.'}
              </p>
            </div>
          </>
        )}
        
        <footer className="footer">
          <i className="fas fa-wifi-slash"></i> Designed for offline rural healthcare usage
        </footer>
      </main>
    </div>
  );
}

export default App;