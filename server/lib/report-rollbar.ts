import Rollbar from 'rollbar';

export default new Rollbar({
  accessToken: process.env.RB_ACCESS_TOKEN,
  captureUncaught: true,
  captureUnhandledRejections: true,
  environment: process.env.ENV_NAME,
});
