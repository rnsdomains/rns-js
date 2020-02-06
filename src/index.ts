import Web3 from 'web3/types';
import { RNS, Contracts, Options, ContractAddresses, ChainId } from './types';
import { createRegistry, createContractAddresses } from './factories';
import { LIBRARY_NOT_COMPOSED } from './errors';
import Resolutions from './resolutions';

/**
 * RNS JavaScript library.
 */
export = class implements RNS {
  private _contracts!: Contracts;
  private _contractAddresses!: ContractAddresses;
  private _resolutionHelper!: Resolutions;
  private _composed!: boolean;

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
    if(options && options.contractAddresses) {
      this._contractAddresses = options.contractAddresses
    }
  }

  /**
   * RNS suite contract instances.
   *
   * @throws LIBRARY_NOT_COMPOSED if the library was not previously composed with compose method - KB004.
   * 
<<<<<<< HEAD
   * @returns Web3 Contract instances of RNS public smart contracts
=======
   * @returns Object with a web3.eth.Contract instance for each necessary contract.
>>>>>>> Added more comments
   */
  get contracts(): Contracts {
    if(!this._contracts) {
      throw new Error(LIBRARY_NOT_COMPOSED);
    }
    return this._contracts;
  }

  /**
   * Detects the current network and instances the contracts.
   *
   * @throws NO_ADDRESSES_PROVIDED if the network is not RSK Mainnet or RSK Testnet and the options parameter was not provided in the constructor - KB005.
   */
  public async compose(): Promise<void> {
    if (!this._composed) {
      await this._detectNetwork();
      this._resolutionHelper = new Resolutions(this.web3, this._contracts.registry);
      this._composed = true;
    }
  }

  private async _detectNetwork() {
    if (!this._contractAddresses) {
      const networkId = await this.web3.eth.net.getId();
      this._contractAddresses = createContractAddresses(networkId)
    }

    if(!this._contracts) {
      this._contracts = {
        registry: createRegistry(this.web3, this._contractAddresses.registry)
      }
    }
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
    await this.compose();
    if (!chainId) {
      return this._resolutionHelper.addr(domain);
    } else {
      return this._resolutionHelper.chainAddr(domain, chainId);
    }
  }
}
