const HealthStatus = ({ status }) => {
  if (!status) return null;

  const isHealthy = status.status === "healthy";
  const bgColor = isHealthy ? "bg-green-50" : "bg-red-50";
  const textColor = isHealthy ? "text-green-800" : "text-red-800";
  const dotColor = isHealthy ? "bg-green-500" : "bg-red-500";
  const statusText = isHealthy ? "Healthy" : status.status === "down" ? "Down" : "Unhealthy";

  return (
    <div className={`${bgColor} border border-gray-200 rounded-lg px-6 py-4 flex items-center gap-3`}>
      <div className={`w-3 h-3 rounded-full ${dotColor} animate-pulse`}></div>
      <div>
        <p className="text-sm text-gray-600">Backend Status</p>
        <p className={`font-semibold ${textColor}`}>{statusText}</p>
      </div>
    </div>
  );
};

export default HealthStatus;
