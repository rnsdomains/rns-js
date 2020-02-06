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

  private _validateLabel(label: string) {
    if (!label || label.match('[^a-z0-9]')) {
      throw new Error(INVALID_LABEL);
    }
  }

  /**
   * Checks if the given label subdomain is available under the given domain tree
   * 
   * @throws
   * Throws an error if the given domain does not exist, if it is not .rsk, if it is a subdomain or if the parameters are not alphanumeric
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