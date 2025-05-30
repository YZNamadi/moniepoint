import Redis from 'ioredis';

// Debug logging
console.log('Redis Configuration:', {
  NODE_ENV: process.env.NODE_ENV,
  REDIS_URL: process.env.REDIS_URL ? 'Set' : 'Not Set',
  REDIS_HOST: process.env.REDIS_HOST,
});

const redis = process.env.NODE_ENV === 'test'
  ? new Redis({
      lazyConnect: true,
      showFriendlyErrorStack: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 0
    })
  : process.env.REDIS_URL
    ? new Redis(process.env.REDIS_URL)
    : new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined,
        showFriendlyErrorStack: true
    });

redis.on('error', (err) => {
  if (process.env.NODE_ENV !== 'test') {
    console.error('Redis Client Error:', err);
    console.error('Current Config:', {
      NODE_ENV: process.env.NODE_ENV,
      REDIS_URL: process.env.REDIS_URL ? 'Set' : 'Not Set',
      REDIS_HOST: process.env.REDIS_HOST,
    });
  }
});

redis.on('connect', () => {
  if (process.env.NODE_ENV !== 'test') {
    console.log('Redis Client Connected');
  }
});

// For test environment, don't attempt to connect
if (process.env.NODE_ENV === 'test') {
  redis.disconnect();
}

export default redis; 