/**
 * ServiceStatus is an interface that can represent the general status of
 * any service.
 */
export interface ServiceStatus {
  available: boolean;
  message?: string;
}
