import Web3 from 'web3';
import { TransactionReceipt } from 'web3-eth';
import { Subdomains, Options, Resolutions } from './types';
import RNSError, {
  SEARCH_DOMAINS_UNDER_AVAILABLE_TLDS, INVALID_DOMAIN,
  INVALID_LABEL, DOMAIN_NOT_EXISTS, NO_ACCOUNTS_TO_SIGN,
  SUBDOMAIN_NOT_AVAILABLE,
  INVALID_ADDRESS,
  INVALID_CHECKSUM_ADDRESS,
} from './errors';
import { ZERO_ADDRESS } from './constants';
import Composer from './composer';
import {
  isValidDomain, isValidTld, isValidLabel, namehash, hasAccounts, labelhash,
  getCurrentAddress, isValidAddress, isValidChecksumAddress,
} from './utils';

/**
 * Set of subdomains related methods
 */
export default class extends Composer implements Subdomains {
  /**
   *
   * @param blockchainApi - current Web3 or Rsk3 instance
   * @param registry - RNS registry used to look for given domains
   */
  constructor(blockchainApi: Web3 | any, private _resolutions: Resolutions, options?: Options) {
    super(blockchainApi, options);
  }

  private _setSubnodeOwner(
    node: string,
    label: string,
    owner: string,
  ): Promise<TransactionReceipt> {
    const contractMethod = () => this._contracts.registry
      .methods
      .setSubnodeOwner(
        node,
        labelhash(label),
        owner,
      );

    return this.estimateGasAndSendTransaction(contractMethod);
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

  private _validateAddress(addr: string) {
    if (!isValidAddress(addr)) {
      throw new RNSError(INVALID_ADDRESS);
    }

    if (!isValidChecksumAddress(addr, this.currentNetworkId)) {
      throw new RNSError(INVALID_CHECKSUM_ADDRESS);
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
   * Sets a subdomain owner. If the subdomain exists, sets the new owner, if not, creates the subdomain and sets the owner.
   *
   * @throws SEARCH_DOMAINS_UNDER_AVAILABLE_TLDS if the given domain is not a domain under valid TLDs - KB009
   * @throws INVALID_DOMAIN if the given domain is empty, is not alphanumeric or if has uppercase characters - KB010
   * @throws INVALID_LABEL if the given label is empty, is not alphanumeric or if has uppercase characters - KB011
   * @throws DOMAIN_NOT_EXISTS if the given domain does not exists - KB012
   * @throws NO_ACCOUNTS_TO_SIGN if the given blockchain api instance does not have associated accounts to sign the transaction - KB015
   * @throws INVALID_ADDRESS if the given owner address is invalid - KB017
   * @throws INVALID_CHECKSUM_ADDRESS if the given owner address has an invalid checksum - KB019
   *
   * @param domain - Parent .rsk domain. ie: wallet.rsk
   * @param label - Subdomain to register. ie: alice
   * @param owner - The owner of the new subdomain
   */
  async setOwner(domain: string, label: string, owner: string): Promise<TransactionReceipt> {
    await this.compose();

    if (!await hasAccounts(this.blockchainApi)) {
      throw new RNSError(NO_ACCOUNTS_TO_SIGN);
    }

    this._validateDomainAndLabel(domain, label);

    this._validateAddress(owner);

    const domainOwner = await this._contracts.registry.methods.owner(namehash(domain)).call();
    if (domainOwner === ZERO_ADDRESS) {
      throw new RNSError(DOMAIN_NOT_EXISTS);
    }

    const node: string = namehash(`${domain}`);

    return this._setSubnodeOwner(node, label, owner);
  }

  /**
   * Creates a new subdomain under the given domain tree if it is available, and sets its resolution if addr is provided.
   * It could send one, two or three transactions based on the value of the sent parameters.
   *
   * @throws SEARCH_DOMAINS_UNDER_AVAILABLE_TLDS if the given domain is not a domain under valid TLDs - KB009
   * @throws INVALID_DOMAIN if the given domain is empty, is not alphanumeric or if has uppercase characters - KB010
   * @throws INVALID_LABEL if the given label is empty, is not alphanumeric or if has uppercase characters - KB011
   * @throws DOMAIN_NOT_EXISTS if the given domain does not exists - KB012
   * @throws SUBDOMAIN_NOT_AVAILABLE if the given domain is already owned - KB016
   * @throws NO_ACCOUNTS_TO_SIGN if the given blockchain api instance does not have associated accounts to sign the transaction - KB015
   * @throws INVALID_ADDRESS if the given owner or address resolution is invalid - KB017
   * @throws INVALID_CHECKSUM_ADDRESS if the given owner address or resolution has an invalid checksum - KB019
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

    if (!await hasAccounts(this.blockchainApi)) {
      throw new RNSError(NO_ACCOUNTS_TO_SIGN);
    }

    this._validateDomainAndLabel(domain, label);

    if (owner) {
      this._validateAddress(owner);
    }

    if (addr) {
      this._validateAddress(addr);
    }

    const domainOwner = await this._contracts.registry.methods.owner(namehash(domain)).call();
    if (domainOwner === ZERO_ADDRESS) {
      throw new RNSError(DOMAIN_NOT_EXISTS);
    }

    if (!await this.available(domain, label)) {
      throw new RNSError(SUBDOMAIN_NOT_AVAILABLE);
    }

    const node: string = namehash(`${domain}`);
    const sender = await getCurrentAddress(this.blockchainApi);

    if (!addr) {
      return this._setSubnodeOwner(node, label, owner || sender);
    } if (!owner || owner === sender) {
      // submits just two transactions
      await this._setSubnodeOwner(node, label, sender);

      return this._resolutions.setAddr(`${label}.${domain}`, addr);
    }
    // needs to submit three txs
    await this._setSubnodeOwner(node, label, sender);

    await this._resolutions.setAddr(`${label}.${domain}`, addr);

    return this._setSubnodeOwner(node, label, owner);
  }
}
