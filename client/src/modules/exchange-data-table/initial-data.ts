import { DataTable, Enum } from './interfaces';

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
        unitFeeExchange: '',
        unitFeeIof: '',
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
        targetReached: false,
      },
    ],
  },
};

export default initialData;
