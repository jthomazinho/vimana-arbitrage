import formatter from './formatter';

describe('formatter', () => {
  describe('percentage', () => {
    it('returns formatted value', () => {
      const result = formatter.percentage(1);

      expect(result).toStrictEqual('1.00');
    });

    it('returns formatted value', () => {
      const result = formatter.percentage(10.6);

      expect(result).toStrictEqual('10.60');
    });

    describe('when value is string', () => {
      it('returns formatted value', () => {
        const result = formatter.percentage('1.56');

        expect(result).toStrictEqual('1.56');
      });
    });

    describe('when suffix is provided', () => {
      it('returns formatted value with suffix', () => {
        const result = formatter.percentage(1, '%');

        expect(result).toStrictEqual('1.00%');
      });
    });
  });

  describe('currency', () => {
    it('returns formatted value', () => {
      const result = formatter.currency(1);

      expect(result).toStrictEqual('1.0000');
    });

    it('returns formatted value', () => {
      const result = formatter.currency(0.05);

      expect(result).toStrictEqual('0.0500');
    });

    describe('when value is string', () => {
      it('returns formatted value', () => {
        const result = formatter.currency('0.05');

        expect(result).toStrictEqual('0.0500');
      });
    });
  });
});
