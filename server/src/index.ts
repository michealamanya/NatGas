import app from './app.js';
import { config } from './config/index.js';
import { prisma } from './database/client.js';
import { logger } from './utils/logger.js';

const { port, host } = config.server;

let server: ReturnType<typeof app.listen>;

async function startServer(): Promise<void> {
  try {
    // Verify database connection
    await prisma.$connect();
    logger.info('Database connection established');

    server = app.listen(port, host, () => {
      logger.info(`NATGAS Uganda server running`, {
        host,
        port,
        env: config.env,
        apiPrefix: config.server.apiPrefix,
        clientUrl: config.client.url,
      });
    });

    // Keep-alive timeout slightly higher than ALB/nginx default
    server.keepAliveTimeout = 65000;
    server.headersTimeout = 66000;
  } catch (err) {
    logger.error('Failed to start server', { error: err });
    process.exit(1);
  }
}

async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}. Shutting down gracefully...`);

  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed');
      await prisma.$disconnect();
      logger.info('Database connection closed');
      process.exit(0);
    });

    // Force exit if graceful shutdown takes too long
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  } else {
    await prisma.$disconnect();
    process.exit(0);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection', { reason, promise });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error });
  process.exit(1);
});

startServer();

export default app;
