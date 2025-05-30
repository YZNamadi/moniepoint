import Redis from 'ioredis';

// Debug logging
console.log('Redis Environment Variables:', {
  NODE_ENV: process.env.NODE_ENV,
  REDIS_URL: process.env.REDIS_URL ? 'Set' : 'Not Set',
  REDIS_HOST: process.env.REDIS_HOST || 'Not Set',
  REDIS_PORT: process.env.REDIS_PORT || 'Not Set'
});

const redis = process.env.NODE_ENV === 'test'
  ? new Redis({
      lazyConnect: true,
      showFriendlyErrorStack: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 0
    })
  : new Redis({
      host: process.env.REDIS_HOST || 'redis', // Docker service name
      port: parseInt(process.env.REDIS_PORT || '6380'), // Match docker-compose port
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        console.log(`Retrying Redis connection in ${delay}ms...`);
        return delay;
      }
    });

redis.on('error', (err) => {
  if (process.env.NODE_ENV !== 'test') {
    console.error('Redis Client Error:', err);
    console.error('Current Config:', {
      REDIS_HOST: process.env.REDIS_HOST || 'redis',
      REDIS_PORT: process.env.REDIS_PORT || '6380'
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