import Web3 from 'web3';
import { Contract } from 'web3-eth-contract/types';
import { hash as namehash } from 'eth-ens-namehash';
import { Subdomains } from './types';
import { SEARCH_ONLY_SIMPLE_DOMAINS, SEARCH_DOMAINS_UNDER_AVAILABLE_TLDS, INVALID_DOMAIN, INVALID_LABEL, DOMAIN_NOT_EXISTS } from './errors';
import { AVAILABLE_TLDS, ZERO_ADDRESS } from './constants';

/**
 * Set of subdomains related methods
 */
export default class implements Subdomains {
  /**
   * 
   * @param web3 - current Web3 instance
   * @param registry - RNS registry used to look for given domains
   */
  constructor(private web3: Web3, private registry: Contract) { }

  /**
   * Validates the given domain
   * 
   * @throws SEARCH_ONLY_SIMPLE_DOMAINS if the given domain is not a simple domain (example.tld) - KB008
   * @throws SEARCH_DOMAINS_UNDER_AVAILABLE_TLDS if the given domain is not a simple domain under valid TLDs - KB009
   * @throws INVALID_DOMAIN if the given domain is empty, is not alphanumeric or if has uppercase characters - KB010
   * 
   * @param domain - domain to validate
   */
  private _validateDomain(domain:string) {
    const labels = domain.split('.');

    if (labels.length !== 2) {
      throw new Error(SEARCH_ONLY_SIMPLE_DOMAINS);
    }

    if (!labels[0] || labels[0].match('[^a-z0-9]')) {
      throw new Error(INVALID_DOMAIN);
    }

    if (!AVAILABLE_TLDS.includes(labels[1])) {
      throw new Error(SEARCH_DOMAINS_UNDER_AVAILABLE_TLDS);
    }
  }

  /**
   * Validates the given label
   * 
   * @throws INVALID_LABEL if the given label is empty, is not alphanumeric or if has uppercase characters - KB011
   * 
   * @param label - label to validate
   */
  private _validateLabel(label: string) {
    if (!label || label.match('[^a-z0-9]')) {
      throw new Error(INVALID_LABEL);
    }
  }

  /**
   * Checks if the given label subdomain is available under the given domain tree
   * 
   * @throws SEARCH_ONLY_SIMPLE_DOMAINS if the given domain is not a simple domain (example.tld) - KB008
   * @throws SEARCH_DOMAINS_UNDER_AVAILABLE_TLDS if the given domain is not a simple domain under valid TLDs - KB009
   * @throws INVALID_DOMAIN if the given domain is empty, is not alphanumeric or if has uppercase characters - KB010
   * @throws INVALID_LABEL if the given label is empty, is not alphanumeric or if has uppercase characters - KB011
   * @throws DOMAIN_NOT_EXISTS if the given domain does not exists - KB012
   * 
   * @param domain - Parent .rsk domain. ie: wallet.rsk
   * @param label - Subdomain to check if is available. ie: alice
   * 
   * @returns
   * true if available, false if not
   */
  async available(domain: string, label: string): Promise<boolean> {
    this._validateDomain(domain);
    this._validateLabel(label);

    const domainOwner = await this.registry.methods.owner(namehash(domain)).call();
    if (domainOwner === ZERO_ADDRESS) {
      throw new Error(DOMAIN_NOT_EXISTS);
    }

    const node: string = namehash(`${label}.${domain}`);
    const owner: string = await this.registry.methods.owner(node).call();

    return owner === ZERO_ADDRESS;
  }
}
