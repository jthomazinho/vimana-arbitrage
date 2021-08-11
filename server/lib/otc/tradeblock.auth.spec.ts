import crypto from 'crypto';
import { getAuthHeaders } from './tradeblock.auth';

describe('getAutHeaders', () => {
  describe('ACCESS-KEY', () => {
    it('should return access-key the same as on env', () => {
      const { 'ACCESS-KEY': accessKey } = getAuthHeaders('user/info');

      expect(accessKey).toStrictEqual(`${process.env.TRADEBLOCK_APIKEY}`);
    });
  });

  describe('ACCESS-NONCE', () => {
    it('should return valid nonce', () => {
      const randomValue = new Date().getTime();

      jest.useFakeTimers();

      const { 'ACCESS-NONCE': accessNonce } = getAuthHeaders('user/info');

      expect(randomValue).toBeLessThanOrEqual(Number(accessNonce));
    });
  });

  describe('ACCESS-SIGNATURE', () => {
    describe('with no endpoint', () => {
      it('should header with no signature value', () => {
        const { 'ACCESS-SIGNATURE': accessSignature } = getAuthHeaders('');
        expect(accessSignature).toStrictEqual('');
      });
    });

    describe('with valid endpoint', () => {
      it('is the SHA-256 HMAC signature of the request', () => {
        const testNonce = new Date().getTime();

        const { 'ACCESS-SIGNATURE': accessSignature } = getAuthHeaders('user/info');

        const str = String(testNonce + (process.env.TRADEBLOCK_URL || ''));

        const sig = crypto.createHmac('sha256', str)
          .update(process.env.TRADEBLOCK_APISECRET || '')
          .digest('hex');

        expect(accessSignature).toStrictEqual(sig);
      });
    });
  });
});
