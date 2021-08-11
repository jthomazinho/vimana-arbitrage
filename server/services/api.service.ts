import ApiGateway from 'moleculer-web';

export default {
  name: 'api',
  mixins: [ApiGateway],

  settings: {
    port: process.env.PORT || 4000,
    ip: '0.0.0.0',
    use: [],
    routes: [
      {
        path: '/api',
        whitelist: [
          '$node.*',
          'fees.*',
          'btc-usd-arbitrage-controller.*',
          'btc-usd-arbitrage-maker-controller.*',
          'foxbit-otc-controller.*',
          'status.*',
        ],
        use: [],
        mergeParams: true,
        authentication: false,
        authorization: false,
        autoAliases: true,
        aliases: {
          'POST /algos/btc-usd-arbitrage': 'btc-usd-arbitrage-controller.create',
          'GET /algos/btc-usd-arbitrage': 'btc-usd-arbitrage-controller.list',
          'GET /algos/btc-usd-arbitrage/active': 'btc-usd-arbitrage-controller.getActive',
          'GET /algos/btc-usd-arbitrage/:id': 'btc-usd-arbitrage-controller.show',
          'POST /algos/btc-usd-arbitrage/:id': 'btc-usd-arbitrage-controller.update',
          'GET /algos/btc-usd-arbitrage/:id/executions': 'btc-usd-arbitrage-controller.getExecutions',
          'POST /algos/btc-usd-arbitrage/:id/finalize': 'btc-usd-arbitrage-controller.finalize',
          'POST /algos/btc-usd-arbitrage/:id/toggle-pause': 'btc-usd-arbitrage-controller.togglePause',
          'POST /algos/foxbit-otc/spread': 'foxbit-otc-controller.spread',
          'POST /algos/foxbit-otc/update': 'foxbit-otc-controller.update',
          'GET /status': 'status.getStatus',
        },
        callingOptions: {},
        bodyParsers: {
          json: {
            strict: false,
            limit: '1MB',
          },
          urlencoded: {
            extended: true,
            limit: '1MB',
          },
        },
        mappingPolicy: 'all', // Available values: "all", "restrict"
        logging: true,
      },
    ],
    log4XXResponses: false,
    logRequestParams: null,
    logResponseData: null,
    assets: {
      folder: 'public',
      options: {},
    },
  },
  methods: {},
};
