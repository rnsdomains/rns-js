import Web3 from 'web3/types';
import { RNS, Contracts, Options, ChainId } from './types';
import { LIBRARY_NOT_COMPOSED } from './errors';
import Resolutions from './resolutions';
import Subdomains from './subdomains';
import { Composer } from './composer';

/**
 * RNS JavaScript library.
 */
export = class extends Composer implements RNS {
  private _resolutionHelper!: Resolutions;
  private _subdomainsHelper!: Subdomains;

  /**
   * Create RNS library.
   *
   * @remarks
   * If web3 points to RSK Mainnet or RSK Testnet, no options are required. Contract addresses are detected automatically.
   * 
   * @param web3 - Web3 instance 
   * @param options - Overrides network defaults. Optional on RSK Mainnet and RSK Testnet, required for other networks.
   */
  constructor (public web3: Web3, options?: Options) {
    super(web3, options);
    this._subdomainsHelper = new Subdomains(this.web3, options);
    this._resolutionHelper = new Resolutions(this.web3, options);
  }

  /**
   * RNS suite contract instances.
   *
   * @throws LIBRARY_NOT_COMPOSED if the library was not previously composed with compose method - KB004.
   * 
   * @returns Web3 Contract instances of RNS public smart contracts
   */
  get contracts(): Contracts {
    if(!this._contracts) {
      throw new Error(LIBRARY_NOT_COMPOSED);
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
      return this._resolutionHelper.addr(domain);
    } else {
      return this._resolutionHelper.chainAddr(domain, chainId);
    }
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
    return this._resolutionHelper.name(address);
  }

  /**
   * Set of subdomains related methods
   *
   * @returns Object with subdomains related methods ready to use.
   */
  get subdomains(): Subdomains {
    return this._subdomainsHelper;
  }
}
