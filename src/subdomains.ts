import Web3 from 'web3';
import { hash as namehash } from 'eth-ens-namehash';
import { Subdomains, Options } from './types';
import { SEARCH_DOMAINS_UNDER_AVAILABLE_TLDS, INVALID_DOMAIN, INVALID_LABEL, DOMAIN_NOT_EXISTS, NO_ACCOUNTS_TO_SIGN, SUBDOMAIN_NOT_AVAILABLE } from './errors';
import { ZERO_ADDRESS } from './constants';
import { validLabel, validDomain, validTld, hasAccounts } from './utils';
import { Composer } from './composer';

/**
 * Set of subdomains related methods
 */
export default class extends Composer implements Subdomains {
  /**
   * 
   * @param web3 - current Web3 instance
   * @param registry - RNS registry used to look for given domains
   */
  constructor(public web3: Web3, private options?: Options) {
    super(web3, options);
  }

  /**
   * Checks if the given label subdomain is available under the given domain tree
   * 
   * @throws SEARCH_DOMAINS_UNDER_AVAILABLE_TLDS if the given domain is not a domain under valid TLDs - KB009
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
    await this.compose();
    if (!validDomain(domain)) {
      throw new Error(INVALID_DOMAIN);
    }

    if (!validTld(domain)) {
      throw new Error(SEARCH_DOMAINS_UNDER_AVAILABLE_TLDS);
    }

    if (!validLabel(label)) {
      throw new Error(INVALID_LABEL);
    }

    const domainOwner = await this._contracts.registry.methods.owner(namehash(domain)).call();
    if (domainOwner === ZERO_ADDRESS) {
      throw new Error(DOMAIN_NOT_EXISTS);
    }

    const node: string = namehash(`${label}.${domain}`);
    const owner: string = await this._contracts.registry.methods.owner(node).call();

    return owner === ZERO_ADDRESS;
  }

  /**
   * Creates a new subdomain under the given domain tree if not exists.
   * 
   * @throws SEARCH_DOMAINS_UNDER_AVAILABLE_TLDS if the given domain is not a domain under valid TLDs - KB009
   * @throws INVALID_DOMAIN if the given domain is empty, is not alphanumeric or if has uppercase characters - KB010
   * @throws INVALID_LABEL if the given label is empty, is not alphanumeric or if has uppercase characters - KB011
   * @throws DOMAIN_NOT_EXISTS if the given domain does not exists - KB012
   * 
   * @param domain - Parent .rsk domain. ie: wallet.rsk
   * @param label - Subdomain to register. ie: alice
   * @param owner - The owner of the new subdomain
   */
  async setOwner(domain: string, label: string, owner: string): Promise<void> {
    await this.compose();
    if (!await hasAccounts(this.web3)) {
      throw new Error(NO_ACCOUNTS_TO_SIGN);
    }

    if (!validDomain(domain)) {
      throw new Error(INVALID_DOMAIN);
    }

    if (!validTld(domain)) {
      throw new Error(SEARCH_DOMAINS_UNDER_AVAILABLE_TLDS);
    }

    if (!validLabel(label)) {
      throw new Error(INVALID_LABEL);
    }

    const domainOwner = await this._contracts.registry.methods.owner(namehash(domain)).call();
    if (domainOwner === ZERO_ADDRESS) {
      throw new Error(DOMAIN_NOT_EXISTS);
    }

    if (!await this.available(domain, label)) {
      throw new Error(SUBDOMAIN_NOT_AVAILABLE);
    }

    const node: string = namehash(`${domain}`);
    const accounts = await this.web3.eth.getAccounts();
    
    await this._contracts.registry.methods.setSubnodeOwner(node, this.web3.utils.sha3(label), owner).send({ from: accounts[0] });    
  }
}
