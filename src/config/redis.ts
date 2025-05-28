import Redis from 'ioredis';

const redis = process.env.NODE_ENV === 'test'
  ? new Redis({
      lazyConnect: true,
      showFriendlyErrorStack: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 0
    })
  : new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      showFriendlyErrorStack: true
    });

redis.on('error', (err) => {
  if (process.env.NODE_ENV !== 'test') {
    console.error('Redis Client Error:', err);
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