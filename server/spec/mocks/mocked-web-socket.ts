import WebSocket from 'ws';

/**
 * MockedWebSocket wraps a jest.Mocked<WebSocket> so that there is no need for
 * casting when accessing mocked functions in the mocked oject.
 *
 * To instantiate this class:
 *
 * ```typescript
 * import WebSocket from 'ws';
 * // automock from Jest
 * jest.mock('ws');
 * // cast the constructor to have access to Jest's mock methods
 * const MockWebSocket = WebSocket as jest.MockedClass<WebSocket>;
 * // pass the mock created by Jest
 * const mocked = new MockedWebSocket(MockWebSocket.mock.instances[0]);
 * ```
 */
export default class MockedWebSocket {
  /** The jest.Mocked instance of the WebSocket */
  mock: jest.Mocked<WebSocket>;

  constructor(mock: WebSocket) {
    this.mock = mock as jest.Mocked<WebSocket>;
  }

  /**
   * triggerListener calls the **first** listener with given `eventName`.
   * If there is no listener associated with `eventName`, it throws an error.
   * @param eventName The name of the event to be triggered
   * @param payload optional payload to be delivered to the listener
   */
  triggerListener(eventName: string, payload?: something): void {
    const listener = this.getListener(eventName);

    if (listener) {
      listener(payload);

      return;
    }

    throw new Error(`no listener for event='${eventName}'`);
  }

  private getListener(event: string): Maybe<Function> {
    const calls = this.mock.on.mock.calls;
    const listener = calls.find((item) => item[0] === event);
    return listener ? listener[1] : null;
  }
}
