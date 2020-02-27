import Web3 from 'web3';
import { Contract } from 'web3-eth-contract/types';
import { hash as namehash } from 'eth-ens-namehash';
import { Subdomains } from './types';
import { SEARCH_DOMAINS_UNDER_AVAILABLE_TLDS, INVALID_DOMAIN, INVALID_LABEL, DOMAIN_NOT_EXISTS, NO_ACCOUNTS_TO_SIGN } from './errors';
import { ZERO_ADDRESS } from './constants';
import { validLabel, validDomain, validTld, hasAccounts } from './utils';

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
    if (!validDomain(domain)) {
      throw new Error(INVALID_DOMAIN);
    }

    if (!validTld(domain)) {
      throw new Error(SEARCH_DOMAINS_UNDER_AVAILABLE_TLDS);
    }

    if (!validLabel(label)) {
      throw new Error(INVALID_LABEL);
    }

    const domainOwner = await this.registry.methods.owner(namehash(domain)).call();
    if (domainOwner === ZERO_ADDRESS) {
      throw new Error(DOMAIN_NOT_EXISTS);
    }

    const node: string = namehash(`${label}.${domain}`);
    const owner: string = await this.registry.methods.owner(node).call();

    return owner === ZERO_ADDRESS;
  }

  /**
   * Creates a new subdomain under the given domain tree
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
  async createSubdomain(domain: string, label: string, owner: string): Promise<void> {
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

    const domainOwner = await this.registry.methods.owner(namehash(domain)).call();
    if (domainOwner === ZERO_ADDRESS) {
      throw new Error(DOMAIN_NOT_EXISTS);
    }

    const node: string = namehash(`${domain}`);
    const accounts = await this.web3.eth.getAccounts();
    
    await this.registry.methods.setSubnodeOwner(node, this.web3.utils.sha3(label), owner).send({ from: accounts[0] });    
  }
}
