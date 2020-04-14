import Web3 from 'web3';
import { TransactionReceipt } from 'web3-eth';
import {
  RNS, Contracts, Options, ChainId, Utils,
  Resolutions as IResolutions,
  Subdomains as ISubdomains,
  Registrations as IRegistrations,
  ContractAddresses,
  NetworkId,
} from './types';
import RNSError, { LIBRARY_NOT_COMPOSED } from './errors';
import Resolutions from './resolutions';
import Registrations from './registrations';
import Subdomains from './subdomains';
import Composer from './composer';
import * as utils from './utils';


/**
 * RNS JavaScript library.
 */
export default class extends Composer implements RNS {
  private _resolutions!: IResolutions;

  private _subdomains!: ISubdomains;

  private _registrations!: IRegistrations;

  /**
   * Create RNS library.
   *
   * @remarks
   * If web3 points to RSK Mainnet or RSK Testnet, no options are required. Contract addresses are detected automatically.
   *
   * @param web3 - Web3 instance
   * @param options - Overrides network defaults. Optional on RSK Mainnet and RSK Testnet, required for other networks.
   */
  constructor(web3: Web3, options?: Options) {
    super(web3, options);
    this._resolutions = new Resolutions(this.web3, options);
    this._subdomains = new Subdomains(this.web3, this._resolutions, options);
    this._registrations = new Registrations(this.web3, options);
  }

  /**
   * RNS suite contract instances.
   *
   * @throws LIBRARY_NOT_COMPOSED if the library was not previously composed with compose method - KB004.
   *
   * @returns Web3 Contract instances of RNS public smart contracts
   */
  get contracts(): Contracts {
    if (!this._contracts) {
      throw new RNSError(LIBRARY_NOT_COMPOSED);
    }
    return this._contracts;
  }

  /**
   * Get address of a given domain and chain. If chainId is not provided, it resolves current blockchain address.
   *
   * @throws NO_RESOLVER when the domain doesn't have resolver - KB003.
   * @throws NO_ADDR_RESOLUTION_SET if the resolution hasn't been set yet - KB001.
   * @throws NO_ADDR_RESOLUTION it has an invalid resolver - KB002.
   * @throws NO_CHAIN_ADDR_RESOLUTION_SET if `chainId` provided and the resolution hasn't been set yet - KB007.
   * @throws NO_CHAIN_ADDR_RESOLUTION `chainId` provided and it has an invalid resolver - KB006.
   *
   * @param domain - Domain to be resolved
   * @param chainId - chain identifier listed in SLIP44 (https://github.com/satoshilabs/slips/blob/master/slip-0044.md)
   */
  async addr(domain: string, chainId?: ChainId): Promise<string> {
    if (!chainId) {
      return this._resolutions.addr(domain);
    }
    return this._resolutions.chainAddr(domain, chainId);
  }

  /**
   * Set address resolution of a given domain.
   *
   * @throws NO_ADDR_RESOLUTION it has an invalid resolver - KB002.
   * @throws NO_RESOLVER when the domain doesn't have resolver - KB003.
   * @throws NO_ACCOUNTS_TO_SIGN if the given web3 instance does not have associated accounts to sign the transaction - KB015
   * @throws INVALID_ADDRESS if the given addr is invalid - KB017
   * @throws INVALID_CHECKSUM_ADDRESS if the given addr has an invalid checksum - KB019
   *
   * @param domain - Domain to set resolution
   * @param addr - Address to be set as the resolution of the given domain
   */
  setAddr(domain: string, addr: string): Promise<TransactionReceipt> {
    return this._resolutions.setAddr(domain, addr);
  }

  /**
   * Set resolver of a given domain.
   *
   * @throws NO_ACCOUNTS_TO_SIGN if the given web3 instance does not have associated accounts to sign the transaction - KB015
   * @throws INVALID_ADDRESS if the given resolver address is invalid - KB017
   * @throws INVALID_CHECKSUM_ADDRESS if the given resolver address has an invalid checksum - KB019
   * @throws DOMAIN_NOT_EXISTS if the given domain does not exists - KB012
   *
   * @param domain - Domain to set resolver
   * @param resolver - Address to be set as the resolver of the given domain
   */
  setResolver(domain: string, resolver: string): Promise<TransactionReceipt> {
    return this._resolutions.setResolver(domain, resolver);
  }

  /**
   * Reverse lookup: get name of a given address.
   *
   * @throws NO_REVERSE_RESOLUTION_SET when the domain has not set the reverse resolution yet - KB014.
   * @throws NO_NAME_RESOLUTION when the domain has an invalid name resolver - KB013.
   *
   * @param address - address to be resolved
   *
   * @returns
   * Domain or subdomain associated to the given address.
   */
  async reverse(address: string): Promise<string> {
    return this._resolutions.name(address);
  }

  /**
   * Check if given domain is available or if there are any availability for the given label.
   *
   * @param domain - Domain or label to check availability
   *
   * SEARCH_DOMAINS_UNDER_AVAILABLE_TLDS if the given domain is under an invalid tld
   * INVALID_DOMAIN if the given parameter is a domain and is not alphanumeric
   * INVALID_LABEL if the given parameter is a label and is not alphanumeric
   * NO_AVAILABLE_METHOD when the TLD owner does not implement the available method
   * NO_TLD_OWNER when the TLD does not has an owner
   *
   * @returns
   * True if the domain is available, false if not, or an array of available domains under possible TLDs if the parameter is a label
   */
  async available(domain: string): Promise<boolean | string[]> {
    return this._registrations.available(domain);
  }

  /**
   * Set of subdomains related methods
   *
   * @returns Object with subdomains related methods ready to use.
   */
  get subdomains(): ISubdomains {
    return this._subdomains;
  }

  /**
   * Set of subdomains related methods
   *
   * @returns Object with subdomains related methods ready to use.
   */
  /* eslint-disable class-methods-use-this */
  get utils(): Utils {
    return {
      hasAccounts: utils.hasAccounts,
      hasMethod: utils.hasMethod,
      isValidLabel: utils.isValidLabel,
      isValidDomain: utils.isValidDomain,
      isValidTld: utils.isValidTld,
      namehash: utils.namehash,
      labelhash: utils.labelhash,
      isValidAddress: utils.isValidAddress,
      isValidChecksumAddress: utils.isValidChecksumAddress,
    };
  }
}

export {
  ChainId,
  ContractAddresses,
  Options,
  NetworkId,
  Contracts,
  ISubdomains as Subdomains,
};
