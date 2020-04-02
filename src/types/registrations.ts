/**
 * Set of registration related methods
 */
export interface Registrations {
  /**
   * Check if given domain is available or if there are any availability for the given label.
   *
   * @param domain - Domain or label to check availability
   *
   * @returns
   * True if the domain is available, false if not, or an array of available domains under possible TLDs if the parameter is a label
   */
  available(domain: string): Promise<boolean | string[]>
}
