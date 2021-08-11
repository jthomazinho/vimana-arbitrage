import transform from './transform';
import { DataTable, Enum, Payload } from './interfaces';

describe('Exchange DataTable', () => {
  describe('transform', () => {
    describe('get', () => {
      it('matches transformed data', () => {
        const initialData: DataTable = {
          [Enum.sell]: {
            rows: [
              {
                id: 0,
                date: '',
                price: '',
                quantity: '',
                grossTotal: '',
                feeTrade: '',
                feeWithdraw: '',
                netTotal: '',
              },
            ],
          },
          [Enum.buy]: {
            rows: [
              {
                id: 0,
                date: '',
                price: '',
                quantity: '',
                grossTotal: '',
                feeTrade: '',
                feeWithdraw: '',
                netTotal: '',
              },
            ],
          },
          [Enum.usd]: {
            rows: [
              {
                id: 0,
                date: '',
                price: '',
                feeExchange: '',
                feeIof: '',
                shortTotal: '',
                longTotal: '',
                buyUsd: '',
              },
            ],
          },
          [Enum.total]: {
            rows: [
              {
                id: 0,
                date: '',
                usd: '',
                brl: '',
                spread: '',
                targetReached: true,
              },
            ],
          },
        };

        const payload: Payload = {
          rows: [{
            id: 1,
            algoInstanceId: 1,
            date: '2020-03-26T17:19:25.000Z',
            summary: {
              shortLeg: {
                price: '33800.00',
                quantity: '0.03',
                grossTotal: '1014.00',
                feeTrade: '0.00',
                feeWithdraw: '1.01',
                netTotal: '1012.99',
              },
              longLeg: {
                price: '6610.15',
                quantity: '0.03',
                grossTotal: '198.30',
                feeTrade: '0.00',
                feeWithdraw: '0.00',
                netTotal: '198.30',
              },
              pegLeg: {
                price: '4.101',
                feeExchange: '2.03',
                feeIof: '3.85',
                shortTotal: '1007.11',
                longTotal: '198.64',
                buyUsd: '39.0000',
              },
              pAndL: {
                usd: '0.34',
                brl: '1.71',
                spread: '0.17',
                targetReached: true,
              },
            },
          }],
        };

        const result: DataTable = transform.get(initialData, payload);

        const transformed: DataTable = {
          [Enum.sell]: {
            rows: [
              {
                id: 1,
                date: '2020-03-26T17:19:25.000Z',
                price: '33800.00',
                quantity: '0.03',
                grossTotal: '1014.00',
                feeTrade: '0.00',
                feeWithdraw: '1.01',
                netTotal: '1012.99',
              },
            ],
          },
          [Enum.buy]: {
            rows: [
              {
                id: 1,
                date: '2020-03-26T17:19:25.000Z',
                price: '6610.15',
                quantity: '0.03',
                grossTotal: '198.30',
                feeTrade: '0.00',
                feeWithdraw: '0.00',
                netTotal: '198.30',
              },
            ],
          },
          [Enum.usd]: {
            rows: [
              {
                id: 1,
                date: '2020-03-26T17:19:25.000Z',
                price: '4.101',
                feeExchange: '2.03',
                feeIof: '3.85',
                shortTotal: '1007.11',
                longTotal: '198.64',
                buyUsd: '39.0000',
              },
            ],
          },
          [Enum.total]: {
            rows: [
              {
                id: 1,
                date: '2020-03-26T17:19:25.000Z',
                usd: '0.34',
                brl: '1.71',
                spread: '0.17',
                targetReached: true,
              },
            ],
          },
        };

        expect(result).toStrictEqual(transformed);
      });
    });
  });
});
