import Web3 from 'web3/types';
import { RNS, Contracts, Options, ContractAddresses, ChainId } from './types';
import { createRegistry, createContractAddresses } from './factories';
import { LIBRARY_NOT_COMPOSED } from './errors';
import Resolutions from './resolutions';

/**
 * RNS JavaScript library.
 * Used to interact with the complete RNS suite.
 */
export = class implements RNS {
  private _contracts!: Contracts;
  private _contractAddresses!: ContractAddresses;
  private _resolutionHelper!: Resolutions;
  private _composed!: boolean;

  /**
   * RNS constructor
   *
   * @remarks
   * The blockchain network will be detected automatically. In case is not RSK Mainnet or RSK Testnet, the second paramenter must be provided.
   * 
   * @param web3 - Web3 instance 
   * @param options - Necessary contract addresses in case the blockchain is not RSK Mainnet or RSK Testnet
   */
  constructor (public web3: Web3, options?: Options) {
    if(options && options.contractAddresses) {
      this._contractAddresses = options.contractAddresses
    }
  }

  /**
   * RNS suite contract instances
   *
   * @throws
   * Throws an error if the library was not previously composed
   * 
   * @returns Object with a web3.eth.Contract instance for each necessary contract.
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
   * @throws
   * Throws an error if the network is not RSK Mainnet or RSK Testnet and the options parameter was not provided in the constructor.
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
   * Resolves the given domain for the given blockchain. If not chainId provided, it will resolve the domain in the current blockchain
   *
   * @throws
   * Throws an error when the domain doesn't have resolver, when it has an invalid resolver or if the resolution hasn't been set yet.
   
   * @param domain - Domain to be resolved
   * @param chainId - Should match one of the listed in SLIP44 (https://github.com/satoshilabs/slips/blob/master/slip-0044.md)
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
