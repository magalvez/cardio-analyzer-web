export function calculateLinearRegression(data: { x: number; y: number }[]) {
  const n = data.length;
  if (n < 2) return null;

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (const point of data) {
    sumX += point.x;
    sumY += point.y;
    sumXY += point.x * point.y;
    sumX2 += point.x * point.x;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

export function generateForecast(historicalData: { date: string; count: number }[], daysToProject = 30) {
  const mapped = historicalData.map((d, i) => ({ x: i, y: d.count }));
  const regression = calculateLinearRegression(mapped);

  if (!regression) return [];

  const lastIndex = mapped.length - 1;
  const forecast = [];

  for (let i = 1; i <= daysToProject; i++) {
    const nextIndex = lastIndex + i;
    const value = Math.max(0, regression.slope * nextIndex + regression.intercept);
    
    // Simple date projection
    const date = new Date(historicalData[lastIndex].date);
    date.setDate(date.getDate() + i);
    
    forecast.push({
      date: date.toISOString().split('T')[0],
      forecast: Math.round(value),
    });
  }

  return forecast;
}
