/**
 * Fee is the configuration cost of service charged by the service provider.
 * The fee can be either a fixed value, a percentual value or both.
 * When a fixed value is specified, its currency depends on the service.
 */
export interface Fee {
  id: number;
  /**
   * service is the normalized service requested.
   */
  service: string;
  /**
   * serviceProvider is the normalized provider of the service requested.
   */
  serviceProvider: string;
  /**
   * fixed is a constant value charged for the service.
   */
  fixed: number;
  /**
   * rate is a percentual value charged over the service value.
   */
  rate: number;
}

/**
 * formatFeeService generates a standardized identifier for a Fee.
 * @param fee The Fee to be formatted.
 */
export function formatFeeService(fee: Maybe<Fee>): string {
  if (!fee) {
    return '<empty>';
  }

  return `${fee.service} by ${fee.serviceProvider}`;
}

/**
 * formatFeeNumbers generates a standardized string for a FeeNumbers.
 * @param fee The Fee to be formatted.
 */
export function formatFeeNumbers(fee: Maybe<Fee>): string {
  if (!fee) {
    return '<empty>';
  }

  return `${(fee.rate * 100.0).toPrecision(2)}% + ${fee.fixed.toPrecision(2)}`;
}
