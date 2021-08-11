import transform from './transform';
import { Data, PostField, PostFields } from './interfaces';

describe('Exchange Rates', () => {
  describe('transform', () => {
    describe('get', () => {
      it('matches transformed data', () => {
        const origin: Data = {
          'exchange-rate': {
            id: 7,
            prefix: 'dummy',
            type: 'input',
            value: '0.00',
          },
          'iof-rate': {
            id: 8,
            prefix: 'dummy',
            type: 'input',
            value: '0.00',
          },
        };

        const response: { rows: PostField[] } = {
          rows: [
            {
              id: 7,
              serviceProvider: 'dummy',
              service: 'exchange',
              fixed: '0.0000',
              rate: '0.1000',
            },
            {
              id: 8,
              serviceProvider: 'dummy',
              service: 'iof',
              fixed: '0.0000',
              rate: '0.0200',
            },
          ],
        };

        const tranformed: Data = {
          'exchange-rate': {
            id: 7,
            prefix: 'dummy',
            type: 'input',
            value: '10.00',
          },
          'iof-rate': {
            id: 8,
            prefix: 'dummy',
            type: 'input',
            value: '2.00',
          },
        };

        const currencyValue = '4.01';
        const result: Data = transform.get(origin, response, currencyValue);

        expect(result).toStrictEqual(tranformed);
      });
    });

    describe('post', () => {
      it('matches transformed data', () => {
        const postData: Data = {
          'exchange-rate': {
            id: 7,
            prefix: 'dummy',
            type: 'input',
            value: '1.20',
          },
          'iof-rate': {
            id: 8,
            prefix: 'dummy',
            type: 'input',
            value: '3.30',
          },
        };

        const response: PostFields = {
          7: {
            id: 7,
            serviceProvider: 'dummy',
            service: 'exchange',
            rate: '0.012',
          },
          8: {
            id: 8,
            serviceProvider: 'dummy',
            service: 'iof',
            rate: '0.033',
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
});
