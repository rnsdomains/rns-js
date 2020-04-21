import Web3 from 'web3';
import { TransactionReceipt } from 'web3-eth';
import { Subdomains, Options, Resolutions } from './types';
import RNSError, {
  SEARCH_DOMAINS_UNDER_AVAILABLE_TLDS, INVALID_DOMAIN,
  INVALID_LABEL, DOMAIN_NOT_EXISTS, NO_ACCOUNTS_TO_SIGN,
  SUBDOMAIN_NOT_AVAILABLE,
} from './errors';
import { ZERO_ADDRESS } from './constants';
import Composer from './composer';
import {
  isValidDomain, isValidTld, isValidLabel, namehash, hasAccounts, labelhash, getCurrentAddress,
} from './utils';

/**
 * Set of subdomains related methods
 */
export default class extends Composer implements Subdomains {
  /**
   *
   * @param web3 - current Web3 instance
   * @param registry - RNS registry used to look for given domains
   */
  constructor(public web3: Web3, private _resolutions: Resolutions, options?: Options) {
    super(web3, options);
  }

  private _setSubnodeOwner(
    node: string,
    label: string,
    owner: string,
    sender?: string,
  ): Promise<TransactionReceipt> {
    return this._contracts.registry
      .methods
      .setSubnodeOwner(
        node,
        labelhash(label),
        owner,
      ).send({ from: sender || owner });
  }

  private _validateDomainAndLabel(domain: string, label: string): void {
    if (!isValidDomain(domain)) {
      throw new RNSError(INVALID_DOMAIN);
    }
    if (!isValidTld(domain)) {
      throw new RNSError(SEARCH_DOMAINS_UNDER_AVAILABLE_TLDS);
    }
    if (!isValidLabel(label)) {
      throw new RNSError(INVALID_LABEL);
    }
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

    this._validateDomainAndLabel(domain, label);

    const domainOwner = await this._contracts.registry.methods.owner(namehash(domain)).call();
    if (domainOwner === ZERO_ADDRESS) {
      throw new RNSError(DOMAIN_NOT_EXISTS);
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
   * @throws NO_ACCOUNTS_TO_SIGN if the given web3 instance does not have associated accounts to sign the transaction - KB015
   *
   * @param domain - Parent .rsk domain. ie: wallet.rsk
   * @param label - Subdomain to register. ie: alice
   * @param owner - The owner of the new subdomain
   */
  async setOwner(domain: string, label: string, owner: string): Promise<TransactionReceipt> {
    await this.compose();

    if (!await hasAccounts(this.web3)) {
      throw new RNSError(NO_ACCOUNTS_TO_SIGN);
    }

    this._validateDomainAndLabel(domain, label);

    const domainOwner = await this._contracts.registry.methods.owner(namehash(domain)).call();
    if (domainOwner === ZERO_ADDRESS) {
      throw new RNSError(DOMAIN_NOT_EXISTS);
    }

    const node: string = namehash(`${domain}`);
    const currentAddress = await getCurrentAddress(this.web3);

    return this._setSubnodeOwner(node, label, owner, currentAddress);
  }

  /**
   * Creates a new subdomain under the given domain tree and sets addr if provided
   *
   *
   * @throws SEARCH_DOMAINS_UNDER_AVAILABLE_TLDS if the given domain is not a domain under valid TLDs - KB009
   * @throws INVALID_DOMAIN if the given domain is empty, is not alphanumeric or if has uppercase characters - KB010
   * @throws INVALID_LABEL if the given label is empty, is not alphanumeric or if has uppercase characters - KB011
   * @throws DOMAIN_NOT_EXISTS if the given domain does not exists - KB012
   * @throws SUBDOMAIN_NOT_AVAILABLE if the given domain is already owned - KB016
   * @throws NO_ACCOUNTS_TO_SIGN if the given web3 instance does not have associated accounts to sign the transaction - KB015
   *
   * @param domain - Parent .rsk domain. ie: wallet.rsk
   * @param label - Subdomain to register. ie: alice
   * @param owner - The owner of the new subdomain. If not provided, the address who executes the tx will be the owner
   * @param addr - The address to be set as resolution of the new subdomain
   *
   * @returns Transaction receipt
   */
  async create(
    domain: string,
    label: string,
    owner?: string,
    addr?: string,
  ): Promise<TransactionReceipt> {
    await this.compose();

    if (!await hasAccounts(this.web3)) {
      throw new RNSError(NO_ACCOUNTS_TO_SIGN);
    }

    this._validateDomainAndLabel(domain, label);

    const domainOwner = await this._contracts.registry.methods.owner(namehash(domain)).call();
    if (domainOwner === ZERO_ADDRESS) {
      throw new RNSError(DOMAIN_NOT_EXISTS);
    }

    if (!await this.available(domain, label)) {
      throw new RNSError(SUBDOMAIN_NOT_AVAILABLE);
    }

    const node: string = namehash(`${domain}`);
    const sender = await getCurrentAddress(this.web3);

    if (!addr) {
      return this._setSubnodeOwner(node, label, owner || sender, sender);
    } if (!owner || owner === sender) {
      // submits just two transactions
      await this._setSubnodeOwner(node, label, sender);

      return this._resolutions.setAddr(`${label}.${domain}`, addr);
    }
    // needs to submit three txs
    await this._setSubnodeOwner(node, label, sender, sender);

    await this._resolutions.setAddr(`${label}.${domain}`, addr);

    return this._setSubnodeOwner(node, label, owner, sender);
  }
}
