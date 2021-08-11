import crypto from 'crypto';
import querystring from 'querystring';
import { v4 as uuidv4 } from 'uuid';

const url = new URL(process.env.BITSTAMP_REST_URL || '');
const apiKey = process.env.BITSTAMP_REST_API_KEY || '';
const secret = process.env.BITSTAMP_REST_API_SECRET || '';

export interface Request {
  path: string;
  params?: { [key: string]: string | number | boolean };
  payload?: { [key: string]: string | number | boolean };
}

type Headers = {
  [key: string]: string;
}

function generateSignature(request: Request, nonce: string, timestamp: string): string {
  const params = request.params ? `?${querystring.stringify(request.params)}` : '';
  let payload = '';
  let contentType = '';
  if (request.payload) {
    payload = `${querystring.stringify(request.payload)}`;
    contentType = 'application/x-www-form-urlencoded';
  }

  const str = `BITSTAMP ${apiKey}${
    'POST'}${url.host}${request.path}${params}${
    contentType}${nonce}${timestamp}v2${payload}`;

  return crypto.createHmac('sha256', secret)
    .update(str)
    .digest('hex');
}

export function getAuthHeaders(request: Request): Headers {
  const timestamp = Date.now().toString();
  const nonce = uuidv4();

  return {
    'X-Auth': `BITSTAMP ${apiKey}`,
    'X-Auth-Signature': generateSignature(request, nonce, timestamp),
    'X-Auth-Nonce': nonce,
    'X-Auth-Timestamp': timestamp,
    'X-Auth-Version': 'v2',
  };
}
