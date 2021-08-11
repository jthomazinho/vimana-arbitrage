/* eslint-disable no-console */
export default (error: any) => {
  console.log('error handler', error);

  if (error.response) {
    console.log('response error:', error.response);

    return {
      ...error,
      message: `${error.response.request.responseURL}
      status: ${error.response.status}
      message: ${error.response.data.message}`,
    };
  }

  if (error.request) {
    console.log('request error:', error.request);

    return {
      ...error,
      message: `No response for ${error.request.responseURL}`,
    };
  }

  return error;
};
