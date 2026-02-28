import { useState } from "react";
import { getAliasUrl } from "../services/api.js";

const SHORT_URL_BASE = import.meta.env.VITE_API_BASE || "/";

const UrlTable = ({
  urls,
  selectedAlias,
  onSelectAlias,
  loading,
  error,
  onRefresh,
}) => {
  const [copied, setCopied] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const handleOpenAlias = async (alias) => {
    try {
      const response = await getAliasUrl(alias);
      const originalUrl = response.data.original_url;
      window.open(originalUrl, "_blank");
    } catch (err) {
      console.error("Failed to get alias URL:", err);
      alert("Could not open URL");
    }
  };

  const filteredUrls = urls.filter(
    (url) =>
      url.alias.toLowerCase().includes(searchTerm.toLowerCase()) ||
      url.original_url.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Your URLs</h2>
        <button
          onClick={onRefresh}
          className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search alias or URL..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-800"
        />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <p className="text-gray-600">Loading URLs...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
          <p className="text-sm text-red-800">⚠ {error}</p>
        </div>
      )}

      {/* Table */}
      {!loading && filteredUrls.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-2 font-semibold text-gray-700">
                  Alias
                </th>
                <th className="text-left py-3 px-2 font-semibold text-gray-700">
                  Clicks
                </th>
                <th className="text-left py-3 px-2 font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUrls.map((url) => (
                <tr
                  key={url.alias}
                  className={`border-b border-gray-200 hover:bg-gray-50 cursor-pointer ${
                    selectedAlias === url.alias ? "bg-blue-50" : ""
                  }`}
                  onClick={() => onSelectAlias(url.alias)}
                >
                  <td className="py-3 px-2">
                    <div className="font-medium text-gray-900">{url.alias}</div>
                    <div className="text-xs text-gray-500 truncate max-w-xs">
                      {url.original_url}
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <span className="font-semibold text-gray-900">
                      {url.total_clicks || 0}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenAlias(url.alias);
                        }}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200 transition-colors"
                      >
                        Open
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredUrls.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-600">
            {searchTerm ? "No URLs match your search" : "No URLs created yet"}
          </p>
        </div>
      )}
    </div>
  );
};

export default UrlTable;
