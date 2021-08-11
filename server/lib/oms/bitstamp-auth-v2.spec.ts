import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

import { getAuthHeaders, Request } from './bitstamp-auth-v2';

jest.mock('uuid');

const mockUUID = uuidv4 as jest.MockedFunction<typeof uuidv4>;

function buildRequest(request: Request = { path: '/', params: {} }): Request {
  return request;
}

function withFrozenNow(when: number, fn: () => void): void {
  const origNow = global.Date.now;

  try {
    global.Date.now = jest.fn(() => when);
    fn();
  } finally {
    global.Date.now = origNow;
  }
}

describe('getAutHeaders', () => {
  afterEach(() => {
    mockUUID.mockReset();
  });

  describe('X-Auth', () => {
    it('concatenates the apiKey from env', () => {
      const { 'X-Auth': xAuth } = getAuthHeaders(buildRequest());

      expect(xAuth).toStrictEqual(`BITSTAMP ${process.env.BITSTAMP_REST_API_KEY}`);
    });
  });

  describe('X-Auth-Nonce', () => {
    it('is a random value', () => {
      const randomValue = 'random-value';
      mockUUID.mockReturnValue(randomValue);

      const { 'X-Auth-Nonce': xAuthNonce } = getAuthHeaders(buildRequest());

      expect(xAuthNonce).toStrictEqual(randomValue);
    });
  });

  describe('X-Auth-Version', () => {
    it('is v2', () => {
      const { 'X-Auth-Version': xAuthVersion } = getAuthHeaders(buildRequest());

      expect(xAuthVersion).toStrictEqual('v2');
    });
  });

  describe('X-Auth-Timestamp', () => {
    it('is the time of calling', () => {
      const now = Date.now();
      withFrozenNow(now, () => {
        const { 'X-Auth-Timestamp': xAuthTimestamp } = getAuthHeaders(buildRequest());

        expect(xAuthTimestamp).toStrictEqual(now.toString());
      });
    });
  });

  describe('X-Auth-Signature', () => {
    describe('request with query params', () => {
      it('is the SHA-256 HMAC signature of the request', () => {
        const verb = 'POST';
        const path = '/api';
        const host = new URL(process.env.BITSTAMP_REST_URL || '').host;
        const request = buildRequest({
          path,
          params: { offset: 1, q: 'search' },
        });
        const params = 'offset=1&q=search';
        const nonce = 'nonce';
        mockUUID.mockReturnValue(nonce);
        const secret = process.env.BITSTAMP_REST_API_SECRET || '';
        const timestamp = Date.now();
        withFrozenNow(timestamp, () => {
          const str = `BITSTAMP ${process.env.BITSTAMP_REST_API_KEY}${
            verb}${host}${path}?${params}${
            nonce}${timestamp}v2`;
          const sig = crypto.createHmac('sha256', secret)
            .update(str)
            .digest('hex');

          const { 'X-Auth-Signature': xAuthSignature } = getAuthHeaders(request);

          expect(xAuthSignature).toStrictEqual(sig);
        });
      });
    });

    describe('request with body', () => {
      it('is the SHA-256 HMAC signature of the request', () => {
        const verb = 'POST';
        const path = '/api';
        const host = new URL(process.env.BITSTAMP_REST_URL || '').host;
        const request = buildRequest({
          path,
          payload: { offset: 1, q: 'search' },
        });
        const payload = 'offset=1&q=search';
        const contentType = 'application/x-www-form-urlencoded';
        const nonce = 'nonce';
        mockUUID.mockReturnValue(nonce);
        const secret = process.env.BITSTAMP_REST_API_SECRET || '';
        const timestamp = Date.now();
        withFrozenNow(timestamp, () => {
          const str = `BITSTAMP ${process.env.BITSTAMP_REST_API_KEY}${
            verb}${host}${path}${contentType}${
            nonce}${timestamp}v2${payload}`;
          const sig = crypto.createHmac('sha256', secret)
            .update(str)
            .digest('hex');

          const { 'X-Auth-Signature': xAuthSignature } = getAuthHeaders(request);

          expect(xAuthSignature).toStrictEqual(sig);
        });
      });
    });
  });
});
