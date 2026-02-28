import { useState, useEffect } from "react";
import { shortenUrl } from "../services/api";

const UrlShortner = () => {
  const [url, setUrl] = useState("");
  const [alias, setAlias] = useState("");
  const [loading, setLoading] = useState(false);
  const [retryAfter, setRetryAfter] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (retryAfter <= 0) return;

    const interval = setInterval(() => {
      setRetryAfter((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [retryAfter]);

  //Clear error after retry timer finishes
  useEffect(() => {
    if (retryAfter === 0) {
      setError("");
    }
  }, [retryAfter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setCopied(false);

    if (!url.trim()) {
      setError("Please enter a valid URL.");
      return;
    }

    try {
      setLoading(true);
      const response = await shortenUrl(url);
      setAlias(response.data.alias);
      setSuccess(true);
      setUrl("");
    } catch (error) {
      if (error.status === 429) {
        // Try multiple ways to get retry_after
        const retryTime = error.response?.data?.retry_after || 20;
        setRetryAfter(retryTime);
        setError(
          `Too many requests. Please try again in ${retryTime} seconds.`,
        );
      } else if (error.data?.error) {
        setError(error.data.error);
      } else {
        setError("Unable to shorten URL. Please check the URL and try again.");
      }
    } finally {
      setLoading(false);
    }
  };
  const handleCopy = async () => {
    const shortUrl = `${import.meta.env.VITE_API_BASE}/alias/${alias}`;
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {}
  };

  const handleReset = () => {
    setUrl("");
    setAlias("");
    setError("");
    setSuccess(false);
    setCopied(false);
    setRetryAfter(0);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="w-full max-w-md bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-8 border-b border-gray-200">
          <h1 className="text-2xl font-semibold text-gray-900 text-center">
            URL Shortener
          </h1>
          <p className="text-sm text-gray-600 text-center mt-2">
            Create short, shareable links
          </p>
        </div>

        <div className="px-6 py-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="url-input"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Original URL
              </label>
              <input
                id="url-input"
                type="url"
                placeholder="https://example.com/very/long/url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading || retryAfter > 0 || !url.trim()}
                className="flex-1 py-2.5 bg-gray-900 text-white font-medium rounded-md hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {loading ? "Processing..." : "Shorten"}
              </button>
              {alias && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors"
                >
                  Reset
                </button>
              )}
            </div>
          </form>

          {/* Error Message */}
          {error && (
            <div className="mt-5 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800 font-medium">⚠ {error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mt-5 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800 font-medium">
                ✓ URL shortened successfully
              </p>
            </div>
          )}

          {/* Result Section */}
          {alias && (
            <div className="mt-5 p-4 bg-gray-50 border border-gray-200 rounded-md">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                Alias for your URL
              </p>
              <div className="flex gap-2 items-stretch">
                <input
                  type="text"
                  readOnly
                  value={`${alias}`}
                  className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 text-sm focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-3 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors"
                >
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <a
                href={`${import.meta.env.VITE_API_BASE}/alias/${alias}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-3 text-sm text-gray-600 hover:text-gray-900 underline"
              >
                Open shortened link →
              </a>
            </div>
          )}

          {/* Rate Limit Countdown */}
          {retryAfter > 0 && (
            <div className="mt-5 p-6 bg-amber-50 border-2 border-amber-300 rounded-md">
              <p className="text-sm text-amber-800 mb-6 text-center">
                <span className="font-semibold">Rate limit active</span>
              </p>
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className="text-7xl font-bold text-amber-900 mb-3 font-mono">
                    {retryAfter}
                  </div>
                  <div className="text-base text-amber-800 font-medium">
                    seconds remaining
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UrlShortner;
