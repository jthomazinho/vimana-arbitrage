/* eslint-disable no-param-reassign */
import {
  Algo, State, InputParameters, ServiceExecutor,
} from './btc-usd-arbitrage';
import factories from '../../spec/factories';
import { formatFeeService, formatFeeNumbers } from '../../lib/fee';

function buildAlgo(id = 'test', executor?: Partial<ServiceExecutor>): Algo {
  const defaultExecutor = {
    sendOrders: jest.fn(() => Promise.resolve()),
    sendShortOrder: jest.fn(() => Promise.resolve()),
    sendConciliationOrder: jest.fn(() => Promise.resolve()),
    getOrderHistory: jest.fn(() => Promise.resolve()),
    onFinalized: jest.fn(),
  };
  const algo = new Algo(id, Object.assign(defaultExecutor, executor));
  algo.dryRun = true;
  return algo;
}

async function triggerSendOrders(algo: Algo): Promise<void> {
  algo.dryRun = false;
  // it should be enough to trigger the orders
  await algo.setInput(factories.btcUsdInput.build({ targetSpread: -999 }));
  algo.dryRun = true;
}

describe('Algo', () => {
  function initializeFees(algo: Algo): void {
    algo.onShortFee('trade-taker', factories.fee.build());
    algo.onShortFee('withdraw-brl', factories.fee.build());
    algo.onLongFee('trade-taker', factories.fee.build());
    algo.onLongFee('withdraw-btc', factories.fee.build());
    algo.onPegFee('exchange', factories.fee.build());
    algo.onPegFee('iof', factories.fee.build());
  }

  function initializeMd(algo: Algo): void {
    algo.onShortDepth(factories.depth.build());
    algo.onLongDepth(factories.depth.build());
    algo.onPegQuote(factories.quote.build());
  }

  function initializeInputs(algo: Algo): void {
    algo.setInput(factories.btcUsdInput.build());
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

      expect(algo.state).toStrictEqual(State.Monitoring);
    });
  });

  describe('on fee events', () => {
    let algo: Algo;

    beforeEach(() => {
      algo = buildAlgo();
      initialize(algo);
    });

    it('updates short withdraw fee', () => {
      const fee = factories.fee.build({
        service: 'short-withdraw', rate: 0.1,
      });

      algo.onShortFee('withdraw-brl', fee);

      const key = formatFeeService(fee);
      const value = formatFeeNumbers(fee);
      expect(algo.getOutput()[key]).toStrictEqual(value);
    });

    it('updates short trade fee', () => {
      const fee = factories.fee.build({
        service: 'short-trade', rate: 0.2,
      });

      algo.onShortFee('trade-taker', fee);

      const key = formatFeeService(fee);
      const value = formatFeeNumbers(fee);
      expect(algo.getOutput()[key]).toStrictEqual(value);
    });

    it('updates long withdraw fee', () => {
      const fee = factories.fee.build({
        service: 'long-withdraw', rate: 0.3,
      });

      algo.onLongFee('withdraw-btc', fee);

      const key = formatFeeService(fee);
      const value = formatFeeNumbers(fee);
      expect(algo.getOutput()[key]).toStrictEqual(value);
    });

    it('updates long trade fee', () => {
      const fee = factories.fee.build({
        service: 'long-trade', rate: 0.4,
      });

      algo.onLongFee('trade-taker', fee);

      const key = formatFeeService(fee);
      const value = formatFeeNumbers(fee);
      expect(algo.getOutput()[key]).toStrictEqual(value);
    });

    it('updates peg exchange fee', () => {
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

        algo.setInput(factories.btcUsdInput.build({
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

        algo.setInput(factories.btcUsdInput.build({
          manualPegQuote: 5.7,
        }));

        algo.definePegPriceManual();

        expect(algo.getPegPrice()).toStrictEqual(5.7);
      });
    });

    describe('when manualPegQuote is 0', () => {
      it('does not defines pegPrice as manualPegQuote', () => {
        const algo = buildAlgo();

        algo.setInput(factories.btcUsdInput.build({
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

  describe('#setPegPrice', () => {
    it('set a new value to pegPrice', () => {
      const algo = buildAlgo();
      initialize(algo);

      const price = 5.255;
      algo.setPegPrice(price);

      expect(algo.getPegPrice()).toStrictEqual(price);
    });
  });

  describe('#getInput', () => {
    it('returns the input totalQuantity parameters with string values', () => {
      const algo = buildAlgo();

      algo.setInput(factories.btcUsdInput.build({
        totalQuantity: 2,
      }));

      expect(algo.getInput().totalQuantity).toStrictEqual('2');
    });

    it('returns the input manualPegQuote parameters with string values', () => {
      const algo = buildAlgo();

      algo.setInput(factories.btcUsdInput.build({
        manualPegQuote: 0,
      }));

      expect(algo.getInput().manualPegQuote).toStrictEqual('0');
    });
  });

  describe('#setInput', () => {
    it('updates the internal state from user input', async () => {
      const algo = buildAlgo();

      const params: InputParameters = {
        totalQuantity: 1,
        maxOrderQuantity: 0.1,
        targetSpread: 1.2,
        crowdFactor: 0.5,
        manualPegQuote: 5,
      };

      await algo.setInput(params);

      expect(algo.getInput()).toStrictEqual({
        totalQuantity: '1',
        maxOrderQuantity: '0.1',
        targetSpread: '1.2',
        crowdFactor: '0.5',
        manualPegQuote: '5',
      });
    });

    describe('input validation', () => {
      it('rejects totalQuantity < 0', async () => {
        const algo = buildAlgo();

        const input = factories.btcUsdInput.build({
          totalQuantity: -1,
        });

        await expect(algo.setInput(input)).toReject();
      });

      it('rejects maxOrderQuantity < 0', async () => {
        const algo = buildAlgo();

        const input = factories.btcUsdInput.build({
          maxOrderQuantity: -1,
        });

        await expect(algo.setInput(input)).toReject();
      });

      it('rejects crowdFactor < 0', async () => {
        const algo = buildAlgo();

        const input = factories.btcUsdInput.build({
          crowdFactor: -0.1,
        });

        await expect(algo.setInput(input)).toReject();
      });

      it('rejects crowdFactor > 1', async () => {
        const algo = buildAlgo();

        const input = factories.btcUsdInput.build({
          crowdFactor: 1.1,
        });

        await expect(algo.setInput(input)).toReject();
      });

      it('rejects manualPegQuote < 0', async () => {
        const algo = buildAlgo();

        const input = factories.btcUsdInput.build({
          manualPegQuote: -0.1,
        });

        await expect(algo.setInput(input)).toReject();
      });

      it('rejects manualPegQuote > 0 && manualPegQuote < 4.50', async () => {
        const algo = buildAlgo();

        const input = factories.btcUsdInput.build({
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

        expect(algo.state).toStrictEqual(State.Monitoring);
      });
    });

    describe('when WaitingOrderResponse', () => {
      it('changes state to Pause', () => {
        const algo = buildAlgo();
        algo.state = State.WaitingOrderResponse;
        initialize(algo);
        algo.togglePause(); // move to Paused

        algo.togglePause();

        expect(algo.state).toStrictEqual(State.Monitoring);
      });
    });

    describe('when Monitoring', () => {
      it('changes state to Paused', () => {
        const algo = buildAlgo();
        initialize(algo);
        expect(algo.state).toStrictEqual(State.Monitoring);

        algo.togglePause();

        expect(algo.state).toStrictEqual(State.Paused);
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

  describe('opportunity calculation', () => {
    // https://docs.google.com/spreadsheets/d/12h8sJwJD1PuukrZ8kox1i3gmPvI61H6GihiLAfHoHkw/edit#gid=0
    it('follows the spreadsheet simulation', () => {
      const algo = buildAlgo();
      initialize(algo);

      const btcbrlBook = factories.depth.build({ bids: [[1, 32598.98]] });
      algo.onShortDepth(btcbrlBook);

      const btcusdBook = factories.depth.build({ asks: [[1, 6048.34]] });
      algo.onLongDepth(btcusdBook);

      const pegPrice = factories.quote.build({ price: 5.255 });
      algo.onPegQuote(pegPrice);

      const exchangeFee = factories.fee.build({ rate: 0.002, fixed: 0 });
      algo.onPegFee('exchange', exchangeFee);

      const iofFee = factories.fee.build({ rate: 0.0038, fixed: 0 });
      algo.onPegFee('iof', iofFee);

      const btcbrlMakerFee = factories.fee.build({ rate: 0, fixed: 0 });
      algo.onShortFee('trade-taker', btcbrlMakerFee);

      const brlWithdraw = factories.fee.build({ rate: 0.001, fixed: 0 });
      algo.onShortFee('withdraw-brl', brlWithdraw);

      const btcusdMakerFee = factories.fee.build({ rate: 0, fixed: 0 });
      algo.onLongFee('trade-taker', btcusdMakerFee);

      const input = factories.btcUsdInput.build({ targetSpread: 0.01 });
      algo.setInput(input);

      const { marketSpread, orderToSend } = algo.getOutput();

      expect(marketSpread).toStrictEqual('2.02%');
      expect(orderToSend).toMatch('@ market');
    });

    it('limits quantity to maxOrderQuantity', () => {
      const algo = buildAlgo();
      initialize(algo);

      const maxOrderQuantity = 0.1;
      const params = factories.btcUsdInput.build({
        targetSpread: -Infinity,
        maxOrderQuantity,
      });
      algo.setInput(params);

      const { orderToSend } = algo.getOutput();

      expect(orderToSend).toStartWith(`${maxOrderQuantity.toFixed(6)} @`);
    });

    it('caps at min quantiy available in market (short leg)', () => {
      const algo = buildAlgo();
      initialize(algo);

      const params = factories.btcUsdInput.build({
        targetSpread: -Infinity,
        maxOrderQuantity: 10,
      });
      algo.setInput(params);

      const smallQty = 0.001;
      const shortDepth = factories.depth.build({ bids: [[smallQty, 40000]] });
      algo.onShortDepth(shortDepth);

      const bigQty = 0.1;
      const longDepth = factories.depth.build({ asks: [[bigQty, 40000]] });
      algo.onLongDepth(longDepth);

      const { orderToSend } = algo.getOutput();

      expect(orderToSend).toStartWith(`${smallQty.toFixed(6)} @`);
    });

    it('caps at min quantiy available in market (long leg)', () => {
      const algo = buildAlgo();
      initialize(algo);

      const params = factories.btcUsdInput.build({
        targetSpread: -Infinity,
        maxOrderQuantity: 10,
      });
      algo.setInput(params);

      const smallQty = 0.001;
      const longDepth = factories.depth.build({ asks: [[smallQty, 40000]] });
      algo.onLongDepth(longDepth);

      const bigQty = 0.1;
      const shortDepth = factories.depth.build({ bids: [[bigQty, 40000]] });
      algo.onShortDepth(shortDepth);

      const { orderToSend } = algo.getOutput();

      expect(orderToSend).toStartWith(`${smallQty.toFixed(6)} @`);
    });

    it('caps at remaining quantity to execute', () => {
      const algo = buildAlgo();
      initialize(algo);

      const params = factories.btcUsdInput.build({
        targetSpread: -Infinity,
        maxOrderQuantity: 10,
        totalQuantity: 0.001,
      });
      algo.setInput(params);

      const { orderToSend } = algo.getOutput();

      expect(orderToSend).toStartWith('0.001');
    });

    describe('crowd factor reduction', () => {
      it('reduces order quantity when market quantity is larger than 145% of maxOrderQty', () => {
        const algo = buildAlgo();
        initialize(algo);

        const crowdFactor = 0.4;
        const params = factories.btcUsdInput.build({
          targetSpread: -Infinity,
          maxOrderQuantity: 0.1,
          crowdFactor,
        });
        algo.setInput(params);

        const marketQty = 2 * params.maxOrderQuantity;
        const depth = factories.depth.build({
          asks: [[marketQty, 40000]],
          bids: [[marketQty, 40000]],
        });
        algo.onLongDepth(depth);
        algo.onShortDepth(depth);

        const { orderToSend } = algo.getOutput();

        const expectedQty = marketQty * crowdFactor;
        expect(orderToSend).toStartWith(`${expectedQty.toFixed(6)} @`);
      });

      it('does not reduce when market quantity is less than 145% of maxOrderQty', () => {
        const algo = buildAlgo();
        initialize(algo);

        const crowdFactor = 0.4;
        const params = factories.btcUsdInput.build({
          targetSpread: -Infinity,
          maxOrderQuantity: 0.1,
          crowdFactor,
        });
        algo.setInput(params);

        const marketQty = 1 * params.maxOrderQuantity;
        const depth = factories.depth.build({
          asks: [[marketQty, 40000]],
          bids: [[marketQty, 40000]],
        });
        algo.onLongDepth(depth);
        algo.onShortDepth(depth);

        const { orderToSend } = algo.getOutput();

        const expectedQty = params.maxOrderQuantity;
        expect(orderToSend).toStartWith(`${expectedQty.toFixed(6)} @`);
      });

      it('still respects the maxOrderQty after reduction', () => {
        const algo = buildAlgo();
        initialize(algo);

        const crowdFactor = 0.4;
        const params = factories.btcUsdInput.build({
          targetSpread: -Infinity,
          maxOrderQuantity: 0.1,
          crowdFactor,
        });
        algo.setInput(params);

        const marketQty = 10 * params.maxOrderQuantity;
        const depth = factories.depth.build({
          asks: [[marketQty, 40000]],
          bids: [[marketQty, 40000]],
        });
        algo.onLongDepth(depth);
        algo.onShortDepth(depth);

        const { orderToSend } = algo.getOutput();

        const expectedQty = params.maxOrderQuantity;
        expect(orderToSend).toStartWith(`${expectedQty.toFixed(6)} @`);
      });
    });
  });

  describe('sending orders', () => {
    let algo: Algo;
    const sendOrders = jest.fn();
    sendOrders.mockReturnValue(Promise.resolve({
      longOrder: factories.order.build(),
    }));

    beforeEach(() => {
      algo = buildAlgo('test', { sendOrders });
      initialize(algo);
    });

    it('changes state to WaitingOrders', async () => {
      await triggerSendOrders(algo);

      expect(algo.state).toStrictEqual(State.WaitingOrders);
    });

    it('changes state to WaitingOrderResponse', async () => {
      algo.state = State.WaitingOrderResponse;
      await triggerSendOrders(algo);
      expect(algo.state).toStrictEqual(State.WaitingOrders);
    });

    it('calls back the executor to create an execution', async () => {
      await triggerSendOrders(algo);

      expect(sendOrders).toHaveBeenCalled();
    });
  });

  describe('state Monitoring', () => {
    describe('when there is an open order', () => {
      it('moves to WaitingOrders', async () => {
        const algo = buildAlgo();
        initialize(algo);
        await triggerSendOrders(algo);

        algo.togglePause();
        algo.togglePause(); // force return to Monitoring

        expect(algo.state).toStrictEqual(State.WaitingOrders);
      });
    });

    describe('when the operation is done', () => {
      it('moves to Finalized', async () => {
        const algo = buildAlgo('test');
        initialize(algo);
        await triggerSendOrders(algo);

        // Reduce totalQuantity to be less than the order size
        algo.setInput(factories.btcUsdInput.build({
          totalQuantity: 0.1,
        }));
        algo.onLongOrderFilled();
        algo.onShortOrderFilled();

        expect(algo.state).toStrictEqual(State.Finalized);
      });
    });
  });

  describe('state Paused', () => {
    it('does not respond to external events', () => {
      const algo = buildAlgo();
      initialize(algo);

      const params = factories.btcUsdInput.build({
        targetSpread: -Infinity,
      });
      algo.setInput(params);
      const { orderToSend } = algo.getOutput();
      expect(orderToSend).not.toStrictEqual('Out of market');

      algo.togglePause();
      algo.setInput(params);

      const { orderToSend: pausedOrder } = algo.getOutput();

      expect(pausedOrder).toStrictEqual('Out of market');
    });
  });

  describe('state WaitingOrders', () => {
    describe('order_filled event', () => {
      it('increments the total quantity executed (long)', async () => {
        const algo = buildAlgo();
        initialize(algo);
        await triggerSendOrders(algo);
        expect(algo.state).toStrictEqual(State.WaitingOrders);

        algo.onLongOrderFilled();

        expect(Number(algo.getOutput().longQtyExecuted)).toBeGreaterThan(0);
      });

      it('increments the total quantity executed (short)', async () => {
        const algo = buildAlgo();
        initialize(algo);
        await triggerSendOrders(algo);
        expect(algo.state).toStrictEqual(State.WaitingOrders);

        algo.onShortOrderFilled();

        expect(Number(algo.getOutput().shortQtyExecuted)).toBeGreaterThan(0);
      });

      it('keeps waiting for the short order be filled', async () => {
        const algo = buildAlgo('test');
        initialize(algo);
        await triggerSendOrders(algo);
        expect(algo.state).toStrictEqual(State.WaitingOrders);

        algo.onLongOrderFilled();

        expect(algo.state).toStrictEqual(State.WaitingOrders);
      });

      it('keeps waiting for the long order be filled', async () => {
        const algo = buildAlgo('test');
        initialize(algo);
        await triggerSendOrders(algo);
        expect(algo.state).toStrictEqual(State.WaitingOrders);

        algo.onShortOrderFilled();

        expect(algo.state).toStrictEqual(State.WaitingOrders);
      });

      it('moves to Monitoring state', async () => {
        const algo = buildAlgo('test');
        initialize(algo);
        await triggerSendOrders(algo);
        expect(algo.state).toStrictEqual(State.WaitingOrders);

        algo.onLongOrderFilled();
        algo.onShortOrderFilled();

        expect(algo.state).toStrictEqual(State.Monitoring);
      });
    });
  });
});
