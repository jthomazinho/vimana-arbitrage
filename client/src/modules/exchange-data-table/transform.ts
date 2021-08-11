import {
  DataTable,
  Payload,
  PayloadItem,
  Enum,
} from './interfaces';

function get(origin: DataTable, data: Payload): DataTable {
  const dic: { [x: string]: Enum } = {
    shortLeg: Enum.sell,
    longLeg: Enum.buy,
    pegLeg: Enum.usd,
    pAndL: Enum.total,
  };

  Object.assign(origin[Enum.sell], { rows: [] });
  Object.assign(origin[Enum.buy], { rows: [] });
  Object.assign(origin[Enum.usd], { rows: [] });
  Object.assign(origin[Enum.total], { rows: [] });

  data.rows.forEach((row: PayloadItem) => {
    const { id, date, summary } = row;

    Object.entries(summary).forEach(([key, value]: [string, any]) => {
      if (key in dic) {
        origin[dic[key]].rows.push({ id, date, ...value });
      }
    });
  });

  return origin;
}

export default {
  get,
};
