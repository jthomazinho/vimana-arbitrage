import { ServiceStatus } from '../status';

export interface UpdateValue<In, Out = object> {
  update: (evt: In) => void;
  value: () => Out;
}

export interface Availabilty {
  available: boolean;
}

export default class Exchange<PriceEvt> implements UpdateValue<never>, Availabilty {
  private pricing: UpdateValue<PriceEvt>;

  private mdStatus: UpdateValue<ServiceStatus> & Availabilty;

  private omsStatus: UpdateValue<ServiceStatus, object | undefined> & Availabilty;

  get available(): boolean {
    return this.allAvailabilty();
  }

  private date = new Date().toISOString();

  constructor(
    price: UpdateValue<PriceEvt>,
    mdStatus: Exchange<PriceEvt>['mdStatus'],
    omsStatus: Exchange<PriceEvt>['omsStatus'],
  ) {
    this.pricing = price;
    this.mdStatus = mdStatus;
    this.omsStatus = omsStatus;
  }

  value(): object {
    return { date: this.date, status: this.available };
  }

  update(): void {
    this.date = new Date().toISOString();
  }

  status(): object {
    return {
      ...this.value(),
      ...this.pricing.value(),
      mdStatus: this.mdStatus.value(),
      omsStatus: this.omsStatus.value(),
    };
  }

  updateMdPrice(evt: PriceEvt): void {
    this.pricing.update(evt);
    this.update();
  }

  updateMdStatus(status: ServiceStatus): void {
    const { available } = status;

    this.mdStatus.update({ available });
    this.update();
  }

  updateOmsStatus(status: ServiceStatus): void {
    this.omsStatus.update(status);
    this.update();
  }

  allAvailabilty(): boolean {
    return this.mdStatus.available && this.omsStatus.available;
  }
}
