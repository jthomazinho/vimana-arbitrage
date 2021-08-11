import {
  handleGetLastPrice,
} from './plural';

import factories from '../../spec/factories';

describe('md/plural', () => {
  describe('.handleGetLastPrice', () => {
    describe('Response with valid USD/BRL quote', () => {
      it('Should return valid lastQuotePrice', () => {
        expect(
          handleGetLastPrice(
            {
              data: [
                {
                  Currency: 'USD/BRL',
                  LastPrice: 5.7603,
                },
              ],
            },
            factories.instrument.build({ symbol: 'USD/BRL' }),
          ),
        ).toEqual(5.7603);
      });
    });

    describe('Response with invalid quote symbol', () => {
      it('Should return lastQuotePrice === 0', () => {
        expect(
          handleGetLastPrice(
            {
              data: [
                {
                  Currency: 'USD',
                  LastPrice: 5.7603,
                },
              ],
            },
            factories.instrument.build({ symbol: 'USD/BRL' }),
          ),
        ).toEqual(0);
      });
    });

    describe('Response with invalid LastPrice', () => {
      it('Should return lastQuotePrice === 0', () => {
        expect(
          handleGetLastPrice(
            {
              data: [
                {
                  Currency: 'USD',
                  LastPrice: 0,
                },
              ],
            },
            factories.instrument.build({ symbol: 'USD/BRL' }),
          ),
        ).toEqual(0);
      });
    });

    describe('Response with invalid instrument', () => {
      it('Should return lastQuotePrice === 0', () => {
        expect(
          handleGetLastPrice(
            {
              data: [
                {
                  Currency: 'USD/BRL',
                  LastPrice: 5.7603,
                },
              ],
            },
            factories.instrument.build({ symbol: 'BTCBRL' }),
          ),
        ).toEqual(0);
      });
    });
  });
});
