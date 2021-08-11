/* eslint-disable no-param-reassign */
import {
  Algo, State, InputParameters, ServiceExecutor,
} from './foxbit-otc';
import factories from '../../spec/factories';
import { formatFeeService, formatFeeNumbers } from '../../lib/fee';

function buildAlgo(id = 'test', executor?: Partial<ServiceExecutor>): Algo {
  const defaultExecutor = {
    create: jest.fn(),
    setQuote: jest.fn(),
    onFinalized: jest.fn(),
  };
  const algo = new Algo(id, Object.assign(defaultExecutor, executor));
  algo.dryRun = true;
  return algo;
}

describe('algo foxbit-otc', () => {
  function initializeFees(algo: Algo): void {
    algo.onLongFee('trade-taker', factories.fee.build());
    algo.onPegFee('exchange', factories.fee.build());
    algo.onPegFee('iof', factories.fee.build());
  }

  function initializeMd(algo: Algo): void {
    algo.onLongDepth(factories.depth.build());
    algo.onPegQuote(factories.quote.build());
  }

  function initializeInputs(algo: Algo): void {
    algo.setInput(factories.foxbitOtcInput.build());
  }

  function initialize(algo: Algo): void {
    initializeFees(algo);
    initializeMd(algo);
    initializeInputs(algo);
  }

  describe('initialization', () => {
    it('starts in the `initializing` state', () => {
      const algo = buildAlgo();

      expect(algo.state).toStrictEqual(State.Initializing);
    });

    it('stays in initalizing until all data is available', () => {
      const algo = buildAlgo();

      expect(algo.state).toStrictEqual(State.Initializing);
      initializeFees(algo);

      expect(algo.state).toStrictEqual(State.Initializing);
      initializeMd(algo);

      expect(algo.state).toStrictEqual(State.Initializing);
      initializeInputs(algo);
    });
  });

  describe('on fee events', () => {
    let algo: Algo;

    it('updates long trade fee', () => {
      algo = buildAlgo();
      initialize(algo);
      const fee = factories.fee.build({
        service: 'long-trade', rate: 0.4,
      });

      algo.onLongFee('trade-taker', fee);

      const key = formatFeeService(fee);
      expect(algo.getOutput()[key]).toStrictEqual('40% + 0.50');
    });

    it('updates peg exchange fee', () => {
      algo = buildAlgo();
      initialize(algo);
      const fee = factories.fee.build({
        service: 'peg-exchange', rate: 0.5,
      });

      algo.onPegFee('exchange', fee);

      const key = formatFeeService(fee);
      const value = formatFeeNumbers(fee);
      expect(algo.getOutput()[key]).toStrictEqual(value);
    });

    it('updates peg iof fee', () => {
      const fee = factories.fee.build({
        service: 'peg-iof', rate: 0.5,
      });

      algo.onPegFee('iof', fee);

      const key = formatFeeService(fee);
      const value = formatFeeNumbers(fee);
      expect(algo.getOutput()[key]).toStrictEqual(value);
    });
  });

  describe('#definePegPriceManual', () => {
    describe('when pegPrice is undefined', () => {
      it('defines pegPrice as manualPegQuote', () => {
        const algo = buildAlgo();
        const pegPrice = factories.quote.build({ price: 0 });

        algo.setInput(factories.foxbitOtcInput.build({
          manualPegQuote: 5.7,
        }));
        algo.onPegQuote(pegPrice);
        algo.definePegPriceManual();
        expect(algo.getPegPrice()).toStrictEqual(5.7);
      });
    });

    describe('when pegPrice is 0', () => {
      it('defines pegPrice as manualPegQuote', () => {
        const algo = buildAlgo();

        algo.setInput(factories.foxbitOtcInput.build({
          manualPegQuote: 5.7,
        }));

        algo.definePegPriceManual();

        expect(algo.getPegPrice()).toStrictEqual(5.7);
      });
    });

    describe('when manualPegQuote is 0', () => {
      it('does not defines pegPrice as manualPegQuote', () => {
        const algo = buildAlgo();

        algo.setInput(factories.foxbitOtcInput.build({
          manualPegQuote: 0,
        }));

        algo.definePegPriceManual();

        expect(algo.getPegPrice()).toStrictEqual(undefined);
      });
    });
  });

  describe('#getPegPrice', () => {
    it('returns the current pegPrice', () => {
      const algo = buildAlgo();
      initialize(algo);

      const price = 5.255;
      const pegPrice = factories.quote.build({ price });
      algo.onPegQuote(pegPrice);

      expect(algo.getPegPrice()).toStrictEqual(price);
    });
  });

  describe('#trimDepth', () => {
    describe('when parameter has full depth layers book', () => {
      it('return trim depth until reach 5btc', async () => {
        const algo = buildAlgo();
        initialize(algo);

        const book = factories.bigDepth.build();

        expect(await algo.trimDepth(book)).toStrictEqual(
          {
            asks: [
              [1.72900738, 51256.25],
              [0.1, 51260.83],
              [0.00152813, 51266.9],
              [0.49887601, 51267.12],
              [0.09, 51267.13],
              [0.01875, 51267.62],
              [0.05919451, 51268.26],
              [0.43158317, 51269.4]],
            bids: [],
            exchange: '',
            symbol: '',
          },
        );
      });
    });

    describe('when parameter has no depth layers book', () => {
      it('should return md.depth without asks and bids', async () => {
        const algo = buildAlgo();
        initialize(algo);

        const book = factories.bigDepth.build({
          asks: [],
        });
        expect(await algo.trimDepth(book)).toStrictEqual(
          {
            exchange: '',
            symbol: '',
            bids: [],
            asks: [],
          },
        );
      });
    });
  });

  describe('#getWeitghtedAveragePrice', () => {
    describe('when parameter has just 5 btc depth', () => {
      it('should return weitghted average price', async () => {
        const algo = buildAlgo();
        initialize(algo);

        const book = factories.bigDepth.build();
        const trimedBook = await algo.trimDepth(book);

        expect(await algo.getWeitghtedAveragePrice(trimedBook)).toStrictEqual(51260.85087702189);
      });
    });

    describe('when parameter has no depth layers book', () => {
      it('should return price as ZERO', async () => {
        const algo = buildAlgo();
        initialize(algo);

        const book = factories.bigDepth.build({
          asks: [],
        });
        const trimedBook = await algo.trimDepth(book);
        expect(await algo.getWeitghtedAveragePrice(trimedBook)).toStrictEqual(0);
      });
    });
  });

  describe('#setInput', () => {
    it('updates the internal state from user input', async () => {
      const algo = buildAlgo();

      const params: InputParameters = {
        quoteSpread: 1,
        manualPegQuote: 5,
      };

      await algo.setInput(params);

      expect(algo.getInput()).toStrictEqual({
        manualPegQuote: '5',
        quoteSpread: '1',
      });
    });

    describe('input validation', () => {
      it('rejects quoteSpread < 0', async () => {
        const algo = buildAlgo();

        const input = factories.foxbitOtcInput.build({
          quoteSpread: -1,
        });

        await expect(algo.setInput(input)).toReject();
      });

      it('rejects manualPegQuote > 0 && manualPegQuote < 4.50', async () => {
        const algo = buildAlgo();

        const input = factories.foxbitOtcInput.build({
          manualPegQuote: 3.50,
        });

        await expect(algo.setInput(input)).toReject();
      });
    });
  });

  describe('#togglePause', () => {
    describe('when Paused', () => {
      it('changes state to Initializing', () => {
        const algo = buildAlgo();
        initialize(algo);
        algo.togglePause(); // move to Paused

        algo.togglePause();
      });
    });
  });

  describe('#finalize', () => {
    it('calls the lifecycle callback onFinalized', () => {
      const onFinalized = jest.fn();
      const algo = buildAlgo('test', { onFinalized });

      algo.finalize();
      expect(onFinalized).toHaveBeenCalled();
    });
  });
});
