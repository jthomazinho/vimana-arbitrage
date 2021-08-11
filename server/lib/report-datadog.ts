import metrics from 'datadog-metrics';
import os from 'os';

function init(): any {
  const DD_API_KEY = process.env.DD_API_KEY || '';
  const defaultTags = [`env:${process.env.ENV_NAME || ''}`];
  metrics.init({
    host: os.hostname(),
    prefix: 'bot.arbitrage.',
    apiKey: DD_API_KEY,
    defaultTags,
  });
}

function increment(subject: string, value: number, tags: any) {
  metrics.increment(subject, value, tags);
}

function gauge(subject: string, value: number, tags: any) {
  metrics.gauge(subject, value, tags);
}

export default {
  init,
  increment,
  gauge,
};
