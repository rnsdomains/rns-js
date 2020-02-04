import Web3 from 'web3/types';
import { RNS as IRNS, Contracts, Options, ContractAddresses, ChainId } from './types';
import { createRegistry, createContractAddresses } from './factories';
import { LIBRARY_NOT_COMPOSED } from './errors';
import Resolutions from './resolutions';

export = RNS;
class RNS implements IRNS {
  private _contracts!: Contracts;
  private _contractAddresses!: ContractAddresses;
  private _resolutionHelper!: Resolutions;
  private _composed!: boolean;

  constructor (public web3: Web3, options?: Options) {
    if(options && options.contractAddresses) {
      this._contractAddresses = options.contractAddresses
    }
  }

  get contracts(): Contracts {
    if(!this._contracts) {
      throw new Error(LIBRARY_NOT_COMPOSED);
    }
    return this._contracts;
  }

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

  async addr(domain: string, chainId?: ChainId): Promise<string> {
    await this.compose();
    if (!chainId) {
      return this._resolutionHelper.addr(domain);
    } else {
      return this._resolutionHelper.chainAddr(domain, chainId);
    }
  }
}
