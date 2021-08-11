import numeral from 'numeral';

numeral.zeroFormat('');
numeral.nullFormat('');

export default {
  percentage: (value: number | string, suffix = ''): string => `${numeral(value).format('0.00')}${suffix}`,
  currency: (value: number | string): string => numeral(value).format('0.0000'),
  currencyBRL: (value: number | string): string => numeral(value).format('0.00'),
};
