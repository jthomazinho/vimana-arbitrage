import * as md from './market-data';

describe('formatInstrument', () => {
  it('formats an Instrument', () => {
    const instrument: md.Instrument = {
      exchange: 'testExchange',
      symbol: 'testSymbol',
    };

    expect(md.formatInstrument(instrument))
      .toStrictEqual('testSymbol @ testExchange');
  });

  it('formats a null Instrument', () => {
    expect(md.formatInstrument(undefined)).toBeString();
  });
});

describe('formatDepthLevel', () => {
  it('formats a DepthLevel', () => {
    const depthLevel: md.DepthLevel = [0.1, 33600];

    expect(md.formatDepthLevel(depthLevel))
      .toStrictEqual('0.1@33600');
  });

  it('formats a null DepthLevel', () => {
    expect(md.formatDepthLevel(undefined)).toBeString();
  });
});

describe('formatPrice', () => {
  it('formats a price', () => {
    const price = 5.01;

    expect(md.formatPrice(price)).toStrictEqual('5.0100');
  });

  it('changes the number of decimal places', () => {
    const price = 5.01;

    expect(md.formatPrice(price, 1)).toStrictEqual('5.0');
  });

  it('formats a null price', () => {
    expect(md.formatPrice(undefined)).toBeString();
  });
});
