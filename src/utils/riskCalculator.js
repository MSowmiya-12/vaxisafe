// Risk calculation logic (exactly as provided)
export const calculateRisk = (temp, minutes, ambientTemp) => {
  const SAFE_MIN = 2;
  const SAFE_MAX = 8;

  if (SAFE_MIN <= temp && temp <= SAFE_MAX) {
    return { riskScore: 5, status: "Safe", timeLeft: 120 };
  }

  const deviation = Math.max(0, temp - SAFE_MAX);
  let riskScore = (deviation * 0.6) + (minutes * 0.25) + ((ambientTemp - 25) * 0.15);
  riskScore = Math.pow(riskScore, 1.2);

  let status, timeLeft;
  if (riskScore < 25) {
    status = "Safe";
    timeLeft = Math.floor(90 - riskScore);
  } else if (riskScore < 60) {
    status = "Risk";
    timeLeft = Math.floor(60 - riskScore / 2);
  } else {
    status = "Spoiled";
    timeLeft = 0;
  }

  return {
    riskScore: Math.round(riskScore * 100) / 100,
    status,
    timeLeft: Math.max(timeLeft, 0)
  };
};

// Route risk calculator
export const calculateRouteRisk = (temp, minutes, ambientTemp, sunExposure, shadeCover) => {
  const effectiveAmbient = ambientTemp + (sunExposure / 100) * 8 - (shadeCover / 100) * 5;
  const result = calculateRisk(temp, minutes, effectiveAmbient);
  
  let suggestion = "", details = "";
  if (result.riskScore < 25) {
    suggestion = "✅ Current route is safe. Maintain ice packs.";
    details = "Low thermal exposure. Spoilage unlikely.";
  } else if (result.riskScore < 60) {
    suggestion = "🌳 Take shaded detour. Avoid peak sun hours.";
    details = "Moderate risk: Find tree-lined paths.";
  } else {
    suggestion = "⚠️ Use alternative route via shaded corridor.";
    details = "High risk: Spoilage imminent. Act now.";
  }
  
  return { ...result, suggestion, details, effectiveAmbient: Math.round(effectiveAmbient) };
};

// Historical temperature data
export const generateTemperatureHistory = (currentTemp, ambientTemp) => {
  const history = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    let hour = now.getHours() - i;
    if (hour < 0) hour = 24 + hour;
    const variation = Math.sin(i * 0.8) * 1.2;
    const ambientEffect = (ambientTemp - 28) * 0.08 * (i / 2);
    let histTemp = currentTemp + variation + ambientEffect;
    histTemp = Math.min(22, Math.max(-1, histTemp));
    history.push({ time: `${hour}:00`, temperature: Math.round(histTemp * 10) / 10 });
  }
  return history;
};

// NEW: Projected temperature trend (like Streamlit)
export const generateProjectedTrend = (currentTemp, totalMinutes) => {
  const points = [];
  const maxPoints = Math.min(totalMinutes, 60);
  const step = Math.max(1, Math.floor(maxPoints / 12));
  for (let i = 0; i <= maxPoints; i += step) {
    points.push({
      time: i,
      temperature: Math.round((currentTemp + (0.05 * i)) * 10) / 10
    });
  }
  return points;
};

// NEW: Route comparison (cooler vs hotter)
export const compareRoutes = (temp, minutes, ambientTemp) => {
  const coolerAmbient = ambientTemp - 3;
  const hotterAmbient = ambientTemp + 3;
  return {
    cooler: { ...calculateRisk(temp, minutes, coolerAmbient), ambientTemp: coolerAmbient },
    hotter: { ...calculateRisk(temp, minutes, hotterAmbient), ambientTemp: hotterAmbient }
  };
};

export const formatTime = (minutes) => {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${minutes} min`;
};