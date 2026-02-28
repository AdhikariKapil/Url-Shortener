import { useState } from "react";
import { shortenUrl } from "../services/api";

const UrlShortner = () => {
  const [url, setUrl] = useState("");
  const [alias, setAlias] = useState("");
  const [loading, setLoading] = useState(false);
  const [retryAfter, setRetryAfter] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

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
      console.log(response.data);
      setAlias(response.data.alias);
      setSuccess(true);
      setUrl("");
    } catch (error) {
      if (error.response && error.response.status === 429) {
        setRetryAfter(error.response.data.retry_after || 20);
        setError(
          `Too many requests. Please try again in ${error.response.data.retry_after} seconds.`,
        );
      } else if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else {
        setError("Unable to shorten URL. Please check the URL and try again.");
        console.error(error);
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
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleReset = () => {
    setUrl("");
    setAlias("");
    setError("");
    setSuccess(false);
    setCopied(false);
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
                disabled={loading || retryAfter > 0}
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

          {error && (
            <div className="mt-5 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800 font-medium">⚠ {error}</p>
            </div>
          )}

          {success && (
            <div className="mt-5 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800 font-medium">
                ✓ URL shortened successfully
              </p>
            </div>
          )}

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

          {retryAfter > 0 && (
            <div className="mt-5 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <p className="text-sm text-amber-800">
                <span className="font-medium">Rate limited</span> • Try again in{" "}
                {retryAfter}s
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UrlShortner;
