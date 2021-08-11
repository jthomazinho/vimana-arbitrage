/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Errors } from 'moleculer';

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}

/**
 * Moleculer ServiceBroker configuration file
 *
 * More info about options:
 *     https://moleculer.services/docs/0.14/configuration.html
 *
 *
 * Overwriting options in production:
 * ================================
 * You can overwrite any option with environment variables.
 * For example to overwrite the "logLevel" value, use `LOGLEVEL=warn` env var.
 * To overwrite a nested parameter, e.g. retryPolicy.retries, use `RETRYPOLICY_RETRIES=10` env var.
 *
 * To overwrite broker’s deeply nested default options, which are not presented in "moleculer.config.js",
 * use the `MOL_` prefix and double underscore `__` for nested properties in .env file.
 * For example, to set the cacher prefix to `MYCACHE`,
 * you should declare an env var as `MOL_CACHER__OPTIONS__PREFIX=mycache`.
 * It will set this:
 * {
 *   cacher: {
 *     options: {
 *       prefix: "mycache"
 *     }
 *   }
 * }
 */
module.exports = {
  // Namespace of nodes to segment your nodes on the same network.
  namespace: '',
  // Unique node identifier. Must be unique in a namespace.
  nodeID: null,
  // Custom metadata store. Store here what you want. Accessing: `this.broker.metadata`
  metadata: {},

  // Enable/disable logging or use custom logger. More info: https://moleculer.services/docs/0.14/logging.html
  // Available logger types: "Console", "File", "Pino", "Winston", "Bunyan", "debug", "Log4js", "Datadog"
  logger: {
    type: 'Console',
    options: {
      colors: true,
      moduleColors: false,
      formatter: 'full',
      objectPrinter: null,
      autoPadding: false,
    },
  },
  logLevel: 'info',

  // Define transporter.
  // More info: https://moleculer.services/docs/0.14/networking.html
  // Note: During the development, you don't need to define it because all services will be loaded locally.
  // In production you can set it via `TRANSPORTER=nats://localhost:4222` environment variable.
  transporter: 'TCP', // "NATS"

  // Define a cacher.
  // More info: https://moleculer.services/docs/0.14/caching.html
  cacher: null,

  // Define a serializer.
  // Available values: "JSON", "Avro", "ProtoBuf", "MsgPack", "Notepack", "Thrift".
  // More info: https://moleculer.services/docs/0.14/networking.html#Serialization
  serializer: 'JSON',

  // Number of milliseconds to wait before reject a request with a RequestTimeout error. Disabled: 0
  requestTimeout: 10 * 1000,

  // Retry policy settings. More info: https://moleculer.services/docs/0.14/fault-tolerance.html#Retry
  retryPolicy: {
    // Enable feature
    enabled: false,
    // Count of retries
    retries: 5,
    // First delay in milliseconds.
    delay: 100,
    // Maximum delay in milliseconds.
    maxDelay: 1000,
    // Backoff factor for delay. 2 means exponential backoff.
    factor: 2,
    // A function to check failed requests.
    check: (err: Errors.MoleculerError) => err && !!err.retryable,
  },

  // Limit of calling level. If it reaches the limit, broker will throw an MaxCallLevelError error.
  // (Infinite loop protection)
  maxCallLevel: 100,

  // Number of seconds to send heartbeat packet to other nodes.
  heartbeatInterval: 10,
  // Number of seconds to wait before setting node to unavailable status.
  heartbeatTimeout: 30,

  // Cloning the params of context if enabled. High performance impact, use it with caution!
  contextParamsCloning: false,

  // Tracking requests and waiting for running requests before shuting down.
  // More info: https://moleculer.services/docs/0.14/context.html#Context-tracking
  tracking: {
    // Enable feature
    enabled: false,
    // Number of milliseconds to wait before shuting down the process.
    shutdownTimeout: 5000,
  },

  // Disable built-in request & emit balancer. (Transporter must support it, as well.).
  // More info: https://moleculer.services/docs/0.14/networking.html#Disabled-balancer
  disableBalancer: false,

  // Settings of Service Registry. More info: https://moleculer.services/docs/0.14/registry.html
  registry: {
    // Define balancing strategy. More info: https://moleculer.services/docs/0.14/balancing.html
    // Available values: "RoundRobin", "Random", "CpuUsage", "Latency", "Shard"
    strategy: 'RoundRobin',
    // Enable local action call preferring. Always call the local action instance if available.
    preferLocal: false,
  },

  // Settings of Circuit Breaker. More info: https://moleculer.services/docs/0.14/fault-tolerance.html#Circuit-Breaker
  circuitBreaker: {
    // Enable feature
    enabled: false,
    // Threshold value. 0.5 means that 50% should be failed for tripping.
    threshold: 0.5,
    // Minimum request count. Below it, CB does not trip.
    minRequestCount: 20,
    // Number of seconds for time window.
    windowTime: 60,
    // Number of milliseconds to switch from open to half-open state
    halfOpenTime: 10 * 1000,
    // A function to check failed requests.
    check: (err: Errors.MoleculerError) => err && err.code >= 500,
  },

  // Settings of bulkhead feature. More info: https://moleculer.services/docs/0.14/fault-tolerance.html#Bulkhead
  bulkhead: {
    // Enable feature.
    enabled: false,
    // Maximum concurrent executions.
    concurrency: 10,
    // Maximum size of queue
    maxQueueSize: 100,
  },

  // Enable action & event parameter validation. More info: https://moleculer.services/docs/0.14/validating.html
  validator: true,

  errorHandler: null,

  // Enable/disable built-in metrics function. More info: https://moleculer.services/docs/0.14/metrics.html
  metrics: {
    enabled: false,
    reporter: [
      {
        type: 'Console',
        options: {
          interval: 5,
          logger: null,
          colors: true,
          onlyChanges: true,
        },
      },
      {
        type: "Datadog",
        options: {
            host: "bot.arbitrage.",
            apiVersion: "v1",
            path: "/series",
            apiKey: process.env.DATADOG_API_KEY,
            defaultLabels: (registry: { broker: { namespace: any; nodeID: any; }; }) => ({
                namespace: registry.broker.namespace,
                nodeID: registry.broker.nodeID
            }),
            interval: 10
        }
    }
    ],
  },

  // Enable built-in tracing function. More info: https://moleculer.services/docs/0.14/tracing.html
  tracing: {
    enabled: false,
    exporter: {
      type: 'Console', // Console exporter is only for development!
      options: {
        logger: null,
        colors: true,
        width: 100,
        gaugeWidth: 40,
      },
    },
  },
  middlewares: [],
  replCommands: null,
  created: () => {
    require('./config/dotenv');

    if (process.env.NODE_ENV === 'development') {
      require('./config/development');
    }
  }
};