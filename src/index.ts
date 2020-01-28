import Web3 from 'web3/types';
import { Contract } from 'web3-eth-contract/types';
import { RNS, Contracts, Options, ContractAddresses } from './types';
import { hash as namehash } from 'eth-ens-namehash';
import { createRegistry, createAddrResolver, createContractAddresses } from './factories';

export default class implements RNS {
  private _contracts!: Contracts
  private _contractAddresses!: ContractAddresses

  constructor (public web3: Web3, options?: Options) {
    if(options && options.contractAddresses) {
      this._contractAddresses = options.contractAddresses
    }
  }

  get contracts(): Contracts {
    if(!this._contracts) {
      throw 'Library not composed.'
    }
    return this._contracts;
  }

  public async compose() {
    await this._detectNetwork()
  }

  private async _detectNetwork() {
    if (!this._contractAddresses) {
      const networkId = await this.web3.eth.net.getId()
      this._contractAddresses = createContractAddresses(networkId)
    }

    if(!this._contracts) {
      this._contracts = {
        registry: createRegistry(this.web3, this._contractAddresses.registry)
      }
    }
  }

  async addr(domain: string): Promise<string> {
    await this._detectNetwork();

    const node: string = namehash(domain);

    const resolverAddress: string = await this._contracts.registry.methods.resolver(node).call();

    if (resolverAddress === '0x0000000000000000000000000000000000000000') throw 'No resolver';

    const addrResolver: Contract = createAddrResolver(this.web3, resolverAddress);

    const addrInterface: string = '0x3b3b57de';
    const supportsAddr: boolean = await addrResolver.methods.supportsInterface(addrInterface).call();
    if (!supportsAddr) throw 'No addr resolution';

    const addr: string = await addrResolver.methods.addr(node).call();

    if (addr === '0x0000000000000000000000000000000000000000') throw 'No addr resolution set';

    return addr;
  }
}
