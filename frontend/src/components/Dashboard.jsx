import { useState, useEffect } from "react";
import UrlShortner from "./UrlShortner";
import StatsCards from "./StatsCards";
import UrlTable from "./UrlTable";
import AnalyticsChart from "./AnalyticsChart";
import HealthStatus from "./HealthStatus";

const Dashboard = () => {
  const [urls, setUrls] = useState([]);
  const [selectedAlias, setSelectedAlias] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [health, setHealth] = useState(null);

  // Fetch health status
  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const response = await fetch("/api/health");
        if (response.ok) {
          setHealth({ status: "healthy" });
        } else {
          setHealth({ status: "unhealthy" });
        }
      } catch (err) {
        setHealth({ status: "down" });
      }
    };

    fetchHealth();
    const healthInterval = setInterval(fetchHealth, 30000); // Check every 30 seconds
    return () => clearInterval(healthInterval);
  }, []);

  // Fetch all URLs analytics
  const fetchUrls = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/analytics");
      if (response.ok) {
        const data = await response.json();
        setUrls(data.urls || []);
        if (data.urls && data.urls.length > 0 && !selectedAlias) {
          setSelectedAlias(data.urls[0].alias);
        }
        setError("");
      } else {
        setError("Failed to load URLs");
      }
    } catch (err) {
      setError("Unable to fetch analytics data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUrls();
  }, []);

  // Handle URL creation success
  const handleUrlCreated = () => {
    fetchUrls();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header with Health Status */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">URL Shortener Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage and analyze your shortened URLs</p>
          </div>
          <HealthStatus status={health} />
        </div>

        {/* Stats Cards */}
        <StatsCards urls={urls} />

        {/* Create URL Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Create New Short URL</h2>
          <UrlShortner onUrlCreated={handleUrlCreated} />
        </div>

        {/* URLs Table and Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* URL Table */}
          <div className="lg:col-span-1">
            <UrlTable 
              urls={urls} 
              selectedAlias={selectedAlias}
              onSelectAlias={setSelectedAlias}
              loading={loading}
              error={error}
              onRefresh={fetchUrls}
            />
          </div>

          {/* Analytics Chart */}
          <div className="lg:col-span-2">
            <AnalyticsChart 
              alias={selectedAlias}
              onAliasChange={setSelectedAlias}
              urls={urls}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
