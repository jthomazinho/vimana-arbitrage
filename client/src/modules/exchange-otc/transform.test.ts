import transform from './transform';
import { Data, PostField, PostFields } from './interfaces';

describe('Spread OTC', () => {
  describe('transform', () => {
    describe('get', () => {
      it('matches transformed data', () => {
        const origin: Data = {
          'spread-otc': {
            id: 7,
            prefix: 'foxbit-otc',
            type: 'input',
            value: '10.00',
          },
        };

        const response: { rows: PostField[] } = {
          rows: [
            {
              id: 7,
              serviceProvider: 'foxbit-otc',
              service: 'spread-otc',
              fixed: '0.0000',
              rate: '0.1000',
            },
          ],
        };

        const tranformed: Data = {
          'spread-otc': {
            id: 7,
            prefix: 'foxbit-otc',
            type: 'input',
            value: '10.00',
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
          'spread-otc': {
            id: 7,
            prefix: 'foxbit-otc',
            type: 'input',
            value: '1.20',
          },
        };

        const response: PostFields = {
          7: {
            id: 7,
            serviceProvider: 'foxbit-otc',
            service: 'spread',
            rate: '1.20',
          },
        };

        const result: PostFields = transform.post(postData);

        expect(result).toStrictEqual(response);
      });
    });

    describe('queryParams', () => {
      it('matches transform data', () => {
        const params: { serviceProvider: string; service: string[] } = {
          serviceProvider: 'foxbit-otc',
          service: ['spread-otc'],
        };

        const result = transform.queryParams(params);

        expect(result).toBe('query[serviceProvider]=foxbit-otc&query[service]=spread-otc');
      });
    });
  });
});
