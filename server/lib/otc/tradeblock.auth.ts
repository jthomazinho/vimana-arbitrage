import crypto from 'crypto';

const url = new URL(process.env.TRADEBLOCK_URL!);
const apiKey = process.env.TRADEBLOCK_APIKEY!;
const secret = process.env.TRADEBLOCK_APISECRET!;

export interface Request {
  path: string;
  params?: { [key: string]: string | number | boolean };
  payload?: { [key: string]: string | number | boolean };
}

type Headers = {
  [key: string]: string;
}

function generateSignature(endpoint: string, nonce: string): string {
  if (endpoint === '') { return ''; }

  const str = String(nonce + url);

  return crypto.createHmac('sha256', str)
    .update(secret)
    .digest('hex');
}

export function getAuthHeaders(endpoint: string): Headers {
  const nonce = Date.now().toString();

  return {
    'ACCESS-KEY': `${apiKey}`,
    'ACCESS-SIGNATURE': generateSignature(endpoint, nonce),
    'ACCESS-NONCE': nonce,
  };
}
