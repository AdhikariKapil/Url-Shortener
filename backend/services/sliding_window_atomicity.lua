-- KEYS[1] = redis key

-- ARGV[1] = current time
-- ARGV[2] = window size (second)
-- ARGV[3] = max request (limit)
-- ARGV[4] = unique request id

local key = KEYS[1]

local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])

--remove old request
redis.call("ZREMRANGEBYSCORE", key, 0, now - window)

--count request
local count = redis.call("ZCARD", key)

if count >= limit then
	local oldest = redis.call("ZRANGE", key, 0, 0, "WITHSCORES")
	local retry_after = window - (now - tonumber(oldest[2]))

	return { 0, retry_after }
end

--allow request
redis.call("ZADD", key, now, now)
redis.call("EXPIRE", key, window)

return { 1, 0 }
