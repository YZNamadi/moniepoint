import Redis from 'ioredis';

// Debug logging of all environment variables
console.log('All Environment Variables:', {
  NODE_ENV: process.env.NODE_ENV,
  REDIS_HOST: process.env.REDIS_HOST,
  REDIS_PORT: process.env.REDIS_PORT,
  PWD: process.env.PWD,
  PATH: process.env.PATH
});

const redisHost = process.env.REDIS_HOST || 'redis';
const redisPort = parseInt(process.env.REDIS_PORT || '6380');

console.log('Redis Connection Config:', {
  host: redisHost,
  port: redisPort
});

const redis = process.env.NODE_ENV === 'test'
  ? new Redis({
      lazyConnect: true,
      showFriendlyErrorStack: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 0
    })
  : new Redis({
      host: redisHost,
      port: redisPort,
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
      REDIS_HOST: redisHost,
      REDIS_PORT: redisPort
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