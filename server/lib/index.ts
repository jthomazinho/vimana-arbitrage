import type { ServiceBroker } from 'moleculer';

export type Logger = ServiceBroker['logger'];
export type BroadcastFn = ServiceBroker['broadcast'];

/**
 * Break is an empty exception to break from a Promise chain.
 * For example:
 *
 * ```
 * promise
 *   .then(() => throw new Break())
 *   .then(() => willNotRun())
 *   .catch((err) => {
 *     if (!(err instanceof Break)) {
 *       throw err;
 *     }
 *   });
 * ```
 */
export class Break extends Error { }
