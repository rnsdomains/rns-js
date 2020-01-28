import Web3 from 'web3/types';
import { Contract } from 'web3-eth-contract/types';
import { RNS, Contracts } from './types';
import { hash as namehash } from 'eth-ens-namehash';
import { createRegistry, createAddrResolver } from './factories';

export default class implements RNS {
  private _web3: Web3;
  private _contracts: Contracts;

  constructor (web3: Web3) {
    this._web3 = web3
    this._contracts = {
      registry: createRegistry(this._web3)
    }
  }

  get contracts(): Contracts {
    return this._contracts;
  }

  async addr(domain: string): Promise<string> {
    const node: string = namehash(domain);

    const resolverAddress: string = await this._contracts.registry.methods.resolver(node).call();

    if (resolverAddress === '0x0000000000000000000000000000000000000000') throw 'No resolver';

    const addrResolver: Contract = createAddrResolver(this._web3, resolverAddress);

    const addrInterface: string = '0x3b3b57de';
    const supportsAddr: boolean = await addrResolver.methods.supportsInterface(addrInterface).call();
    if (!supportsAddr) throw 'No addr resolution';

    const addr: string = await addrResolver.methods.addr(node).call();

    if (addr === '0x0000000000000000000000000000000000000000') throw 'No addr resolution set';

    return addr;
  }
}
