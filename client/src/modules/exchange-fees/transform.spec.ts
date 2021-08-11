import transform from './transform';
import { Data, PostFields, PostField } from './interfaces';

describe('exchange-fees - transform', () => {
  describe('format', () => {
    it('returns percentage formats', () => {
      const percentage = transform.format('foxbit-withdraw-brl-rate', 10);

      expect(percentage).toStrictEqual('10.00');
    });

    it('returns currency formats', () => {
      const currency = transform.format('foxbit-withdraw-usd-fixed', 10);

      expect(currency).toStrictEqual('10.0000');
    });

    it('returns currencyBRL formats', () => {
      const currency = transform.format('foxbit-withdraw-brl-fixed', 10);

      expect(currency).toStrictEqual('10.00');
    });

    it('returns currency as default', () => {
      const currency = transform.format('xpto', 10);

      expect(currency).toStrictEqual('10.0000');
    });
  });

  describe('get', () => {
    it('matches transformed data', () => {
      const origin: Data = {
        foxbit: {
          brl: {
            prefix: 'foxbit',
            id: 0,
            value: 'BRL',
            type: 'text',
          },
          'foxbit-withdraw-brl-rate': {
            prefix: 'foxbit',
            id: 1,
            type: 'input',
            value: '50',
            percentage: true,
          },
          'foxbit-withdraw-brl-fixed': {
            prefix: 'foxbit',
            id: 1,
            type: 'input',
            value: '0.0',
          },
        },
      };

      const response = {
        rows: [
          {
            id: 1,
            serviceProvider: 'foxbit',
            service: 'withdraw-brl',
            fixed: '0.1200000000000000',
            rate: '0.5',
          },
        ],
      };

      const tranformed: Data = {
        foxbit: {
          brl: {
            prefix: 'foxbit',
            id: 0,
            value: 'BRL',
            type: 'text',
          },
          'foxbit-withdraw-brl-rate': {
            prefix: 'foxbit',
            id: 1,
            type: 'input',
            value: '50.00',
            percentage: true,
          },
          'foxbit-withdraw-brl-fixed': {
            prefix: 'foxbit',
            id: 1,
            type: 'input',
            value: '0.12',
          },
        },
      };

      const result: Data = transform.get(origin.foxbit, response);

      expect(result).toStrictEqual(tranformed.foxbit);
    });
  });

  describe('post', () => {
    it('matches transformed data', () => {
      const postData: Data = {
        foxbit: {
          'foxbit-withdraw-brl-rate': {
            prefix: 'foxbit',
            id: 1,
            type: 'input',
            value: '100',
            percentage: true,
          },
          'foxbit-withdraw-brl-fixed': {
            prefix: 'foxbit',
            id: 1,
            type: 'input',
            value: '0.12',
          },
        },
        bitstamp: {
          'bitstamp-withdraw-usd-rate': {
            prefix: 'bitstamp',
            id: 4,
            type: 'input',
            value: '2',
            percentage: true,
          },
          'bitstamp-withdraw-usd-fixed': {
            prefix: 'bitstamp',
            id: 4,
            type: 'input',
            value: '3.01',
          },
        },
      };

      const response: PostFields = {
        1: {
          id: 1,
          serviceProvider: 'foxbit',
          service: 'withdraw-brl',
          rate: '1',
          fixed: '0.12',
        },
        4: {
          id: 4,
          serviceProvider: 'bitstamp',
          service: 'withdraw-usd',
          rate: '0.02',
          fixed: '3.01',
        },
      };

      const result: PostFields = transform.post(postData);

      expect(result).toStrictEqual(response);
    });
  });

  describe('queryParams', () => {
    it('matches transform data', () => {
      const params: { serviceProvider: string; service: string[] } = {
        serviceProvider: 'foxbit',
        service: ['withdraw-brl', 'withdraw-btc'],
      };

      const result = transform.queryParams(params);

      expect(result).toBe('query[serviceProvider]=foxbit&query[service]=withdraw-brl&query[service]=withdraw-btc');
    });
  });
});
