import { summary } from './summary';
import factories from '../../../spec/factories';

describe('summary', () => {
  describe('with valid context', () => {
    it('returns summary', () => {
      expect(summary(factories.context.build())).toEqual(factories.summary.build());
    });
  });
  describe('with valid context changed quantity, longBestOffer and shortBestOffer', () => {
    const context = factories.context.build();
    context.quantityShort = 0.12345678;
    context.quantityLong = 0.12345678;
    context.shortBestOffer = [context.quantityShort, 63850.00];
    context.longBestOffer = [context.quantityLong, 10750.00];
    it('returns summary', () => {
      expect(summary(context)).toEqual(
        expect.objectContaining({
          pAndL: {
            brl: '206.5962',
            spread: '2.6261%',
            targetReached: true,
            usd: '35.8655',
          },
        }),
      );
    });
  });

  describe('with invalid context', () => {
    it('throws exeception', () => {
      const context = {
        ...factories.context.build(),
        fees: {
          short: {
            'trade-taker': null,
            'withdraw-brl': null,
          },
          long: {
            'trade-taker': null,
            'withdraw-btc': null,
          },
          peg: {
            exchange: null,
            iof: null,
          },
        },
      };
      expect(() => { (summary(context)); }).toThrowError('Missing fee');
    });
  });
});
