import { useState, useEffect } from "react";

const AnalyticsChart = ({ alias, onAliasChange, urls }) => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchAnalytics = async () => {
    if (!alias) return;
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics/${alias}`);
      if (response.ok) {
        const data = await response.json();
        setChartData(data);
        setError("");
      } else {
        setError("Failed to load analytics");
      }
    } catch (err) {
      setError("Unable to fetch analytics data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!alias) return;
    fetchAnalytics();
  }, [alias]);

  const renderChart = (data) => {
    if (!data?.daily_clicks) return null;

    const entries = Object.entries(data.daily_clicks)
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .slice(-7); // Last 7 days

    if (entries.length === 0) {
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-600">No analytics data available yet</p>
        </div>
      );
    }

    const maxClicks = Math.max(...entries.map(([, clicks]) => clicks), 1);
    const chartHeight = 200;
    const chartWidth = 500;
    const pointSpacing = chartWidth / (entries.length - 1 || 1);
    const padding = 40;

    // Generate coordinates for all points
    const points = entries.map(([, clicks], index) => ({
      x: padding + index * pointSpacing,
      y: padding + chartHeight - (clicks / maxClicks) * chartHeight,
    }));

    // Generate smooth curve path using quadratic Bezier curves
    let pathData = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const curr = points[i];
      const prev = points[i - 1];
      const controlX = (prev.x + curr.x) / 2;
      const controlY = (prev.y + curr.y) / 2;
      pathData += ` Q ${controlX} ${controlY} ${curr.x} ${curr.y}`;
    }

    // Generate area path (same curve + close to bottom)
    const areaPathData = `${pathData} L ${points[points.length - 1].x} ${padding + chartHeight} L ${points[0].x} ${padding + chartHeight} Z`;

    return (
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartWidth + padding * 2} ${chartHeight + padding * 2}`}
          className="w-full h-80"
          style={{ minWidth: "500px" }}
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
            <line
              key={`grid-${ratio}`}
              x1={padding}
              y1={padding + (1 - ratio) * chartHeight}
              x2={chartWidth + padding}
              y2={padding + (1 - ratio) * chartHeight}
              stroke="#e5e7eb"
              strokeDasharray="4"
            />
          ))}

          {/* Y-axis */}
          <line
            x1={padding}
            y1={padding}
            x2={padding}
            y2={padding + chartHeight}
            stroke="#9ca3af"
            strokeWidth="2"
          />
          {/* X-axis */}
          <line
            x1={padding}
            y1={padding + chartHeight}
            x2={chartWidth + padding}
            y2={padding + chartHeight}
            stroke="#9ca3af"
            strokeWidth="2"
          />

          {/* Y-axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const value = Math.round(maxClicks * ratio);
            return (
              <text
                key={`y-label-${ratio}`}
                x={padding - 10}
                y={padding + (1 - ratio) * chartHeight + 5}
                textAnchor="end"
                className="text-xs fill-gray-600"
              >
                {value}
              </text>
            );
          })}

          {/* Line path with gradient */}
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop
                offset="0%"
                style={{ stopColor: "#1f2937", stopOpacity: 0.3 }}
              />
              <stop
                offset="100%"
                style={{ stopColor: "#1f2937", stopOpacity: 0 }}
              />
            </linearGradient>
          </defs>

          {/* Area under the line */}
          <path d={areaPathData} fill="url(#lineGradient)" />

          {/* Curved line */}
          <path
            d={pathData}
            fill="none"
            stroke="#1f2937"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Points and labels */}
          {entries.map(([date, clicks], index) => {
            const x = padding + index * pointSpacing;
            const y =
              padding + chartHeight - (clicks / maxClicks) * chartHeight;
            
            // Parse date string (YYYY-MM-DD format)
            const [year, month, day] = date.split("-");
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const dateLabel = `${monthNames[parseInt(month) - 1]} ${parseInt(day)}`;

            return (
              <g key={date}>
                {/* Point */}
                <circle
                  cx={x}
                  cy={y}
                  r="4"
                  fill="#1f2937"
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="hover:r-6 transition-all cursor-pointer"
                />
                {/* Date label */}
                <text
                  x={x}
                  y={padding + chartHeight + 20}
                  textAnchor="middle"
                  className="text-xs fill-gray-600"
                >
                  {dateLabel}
                </text>
                {/* Value label */}
                {clicks > 0 && (
                  <text
                    x={x}
                    y={y - 12}
                    textAnchor="middle"
                    className="text-xs fill-gray-900 font-semibold"
                  >
                    {clicks}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Analytics</h2>
        <div className="flex items-center gap-3">
          {urls.length > 0 && (
            <select
              value={alias || ""}
              onChange={(e) => onAliasChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-800"
            >
              <option value="">Select URL...</option>
              {urls.map((url) => (
                <option key={url.alias} value={url.alias}>
                  {url.alias}
                </option>
              ))}
            </select>
          )}
          {alias && (
            <button
              onClick={fetchAnalytics}
              disabled={loading}
              className="px-3 py-2 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white text-sm rounded-md transition-colors font-medium"
            >
              {loading ? "Refreshing..." : "🔄 Refresh"}
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
          <p className="text-sm text-red-800">⚠ {error}</p>
        </div>
      )}

      {/* No selection */}
      {!loading && !alias && (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-600">Select a URL to see analytics</p>
        </div>
      )}

      {/* Chart */}
      {!loading && alias && chartData && <div>{renderChart(chartData)}</div>}

      {/* Stats */}
      {!loading && alias && chartData && (
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
          <div className="text-center">
            <p className="text-sm text-gray-600">Total Clicks</p>
            <p className="text-2xl font-bold text-gray-900">
              {chartData.total_clicks || 0}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Avg Daily Clicks</p>
            <p className="text-2xl font-bold text-gray-900">
              {chartData.total_clicks &&
              Object.keys(chartData.daily_clicks).length
                ? Math.round(
                    chartData.total_clicks /
                      Object.keys(chartData.daily_clicks).length,
                  )
                : 0}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Peak Day</p>
            <p className="text-2xl font-bold text-gray-900">
              {chartData.daily_clicks
                ? Math.max(...Object.values(chartData.daily_clicks))
                : 0}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsChart;
