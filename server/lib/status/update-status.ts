import { ServiceStatus } from '../status';
import { Availabilty, UpdateValue } from './exchange';

export default class UpdateStatus implements UpdateValue<ServiceStatus>, Availabilty {
  date = new Date().toISOString();

  available = false;

  value(): object {
    return { date: this.date, status: this.available };
  }

  update(status: ServiceStatus): void {
    this.date = new Date().toISOString();
    this.available = status.available;
  }
}
