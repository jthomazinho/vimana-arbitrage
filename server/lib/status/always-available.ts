/* eslint-disable class-methods-use-this */
import { UpdateValue, Availabilty } from './exchange';

export default class AlwaysAvailable<E> implements UpdateValue<E, undefined>, Availabilty {
  available = true;

  value(): undefined {
    return undefined;
  }

  update(_evt: E): void {
    // there is nothing to update
  }
}
