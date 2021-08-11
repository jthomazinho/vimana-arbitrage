import factories from '../spec/factories';
import { formatFeeService, formatFeeNumbers } from './fee';

describe('formatFeeService', () => {
  it('returns a default string when undefined fee', () => {
    expect(formatFeeService(undefined)).toBeString();
  });

  it('builds a string with service', () => {
    const fee = factories.fee.build({ service: 'service' });

    expect(formatFeeService(fee)).toInclude('service');
  });

  it('builds a string with provider', () => {
    const fee = factories.fee.build({ serviceProvider: 'provider' });

    expect(formatFeeService(fee)).toInclude('provider');
  });
});

describe('formatFeeNumbers', () => {
  it('returns a default string when undefined fee', () => {
    expect(formatFeeNumbers(undefined)).toBeString();
  });

  it('builds a string with fixed as string', () => {
    const fee = factories.fee.build({ fixed: 1.2 });

    expect(formatFeeNumbers(fee)).toInclude('1.2');
  });

  it('builds a string with rate as percent', () => {
    const fee = factories.fee.build({ rate: 0.03 });

    expect(formatFeeNumbers(fee)).toInclude('3.0%');
  });
});
