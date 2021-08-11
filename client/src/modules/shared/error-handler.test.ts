import ErrorHandler from './error-handler';

describe('ErrorHandler', () => {
  describe('basic error', () => {
    it('returns error message', () => {
      const error = {
        message: 'basic error message',
      };

      const result = ErrorHandler(error);

      expect(result.message).toStrictEqual('basic error message');
    });

    describe('when error.response present', () => {
      it('returns formatted error message', () => {
        const error = {
          response: {
            request: {
              responseURL: 'https://www.example.com',
            },
            status: 400,
            data: {
              message: 'response error message',
            },
          },
        };

        const result = ErrorHandler(error);

        expect(result.message).toStrictEqual(`https://www.example.com
      status: 400
      message: response error message`);
      });
    });

    describe('when only error.request present', () => {
      it('returns formatted value with suffix', () => {
        const error = {
          request: {
            responseURL: 'https://www.example.com',
          },
        };

        const result = ErrorHandler(error);

        expect(result.message).toStrictEqual('No response for https://www.example.com');
      });
    });
  });
});
