const StatsCards = ({ urls }) => {
  const totalUrls = urls.length;
  const totalClicks = urls.reduce(
    (sum, url) => sum + (url.total_clicks || 0),
    0,
  );
  const activeUrls = urls.filter((url) => url.total_clicks > 0).length;
  // const todayClicks = urls.reduce((sum, url) => {
  //   const today = new Date().toISOString().split("T")[0];
  //   const clicksToday = url.daily_clicks?.[today] || 0;
  //   return sum + clicksToday;
  // }, 0);

  const stats = [
    {
      label: "URLs Created",
      value: totalUrls,
      icon: "🔗",
      color: "bg-blue-50",
      textColor: "text-blue-900",
    },
    {
      label: "Total Clicks",
      value: totalClicks,
      icon: "📊",
      color: "bg-green-50",
      textColor: "text-green-900",
    },
    {
      label: "Active URLs",
      value: activeUrls,
      icon: "✅",
      color: "bg-purple-50",
      textColor: "text-purple-900",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`${stat.color} border border-gray-200 rounded-lg p-6`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-2">{stat.label}</p>
              <p className={`text-3xl font-bold ${stat.textColor}`}>
                {stat.value}
              </p>
            </div>
            <div className="text-4xl">{stat.icon}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
