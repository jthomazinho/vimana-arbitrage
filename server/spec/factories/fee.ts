import { Factory } from 'fishery';
import { Fee } from '../../lib/fee';

export default Factory.define<Fee>(({ sequence }) => ({
  id: sequence,
  service: 'testService',
  serviceProvider: 'testProvider',
  fixed: 0.5,
  rate: 0.03,
}));
