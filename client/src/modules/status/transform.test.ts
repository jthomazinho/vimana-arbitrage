import transform from './transform';
import initialData from './intial-data';

describe('Exchange Status', () => {
  describe('transform', () => {
    describe('get', () => {
      it('matches transformed data', () => {
        expect(initialData).toStrictEqual(transform.get(initialData));
      });
    });
  });
});
