import transform from './transform';
import { Data, PostFields } from './interfaces';

describe('setup - transform', () => {
  describe('get', () => {
    it('matches transformed data', () => {
      const initialData: Data = {
        totalQuantity: {
          value: '',
        },
        maxOrderQuantity: {
          value: '',
        },
        targetSpread: {
          value: '',
        },
        crowdFactor: {
          value: '',
        },
        manualPegQuote: {
          value: '',
        },
      };

      const response: PostFields = {
        totalQuantity: '6',
        maxOrderQuantity: '5.65',
        targetSpread: '1',
        crowdFactor: '0.02',
        manualPegQuote: '4.5000',
      };

      const result: Data = transform.get(initialData, response);

      const tranformed: Data = {
        totalQuantity: {
          currency: false,
          percentage: false,
          value: '6',
        },
        maxOrderQuantity: {
          currency: false,
          percentage: false,
          value: '5.65',
        },
        targetSpread: {
          currency: false,
          percentage: true,
          value: '100.00',
        },
        crowdFactor: {
          currency: false,
          percentage: true,
          value: '100',
        },
        manualPegQuote: {
          currency: true,
          percentage: false,
          value: '4.5000',
        },
      };

      expect(result).toStrictEqual(tranformed);
    });
  });

  describe('post', () => {
    it('matches transformed data', () => {
      const postData: Data = {
        totalQuantity: {
          value: '1',
        },
        maxOrderQuantity: {
          value: '101',
        },
        targetSpread: {
          value: '2.00',
        },
        crowdFactor: {
          value: '4.00',
        },
        manualPegQuote: {
          value: '5.89',
        },
      };

      const response: PostFields = {
        totalQuantity: '1',
        maxOrderQuantity: '101',
        targetSpread: '0.0200',
        crowdFactor: '0.0400',
        manualPegQuote: '5.89',
      };

      const result: PostFields = transform.post(postData);

      expect(result).toStrictEqual(response);
    });
  });
});
