import Web3 from 'web3/types';
import { Contract } from 'web3-eth-contract/types';
import { RNS, Contracts, Options, ContractAddresses } from './types';
import { hash as namehash } from 'eth-ens-namehash';
import { createRegistry, createAddrResolver, createContractAddresses } from './factories';
import { NO_ADDR_RESOLUTION, NO_ADDR_RESOLUTION_SET, NO_RESOLVER, LIBRARY_NOT_COMPOSED } from './errors';
import { ZERO_ADDRESS, ADDR_INTERFACE, ERC165_INTERFACE } from './constants';

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
      throw new Error(LIBRARY_NOT_COMPOSED);
    }
    return this._contracts;
  }

  public async compose(): Promise<void> {
    await this._detectNetwork()
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

  private async _hasMethod(contractAddress: string, signatureHash: string) {
    const code = await this.web3.eth.getCode(contractAddress);
    return code.indexOf(signatureHash.slice(2, signatureHash.length)) > 0;
  }

  async addr(domain: string): Promise<string> {
    await this._detectNetwork();

    const node: string = namehash(domain);

    const resolverAddress: string = await this._contracts.registry.methods.resolver(node).call();

    if (resolverAddress === ZERO_ADDRESS) {
      throw new Error(NO_RESOLVER);
    }
    const isErc165Contract = await this._hasMethod(resolverAddress, ERC165_INTERFACE);
    if (!isErc165Contract) {
      throw new Error(NO_ADDR_RESOLUTION);
    }

    const addrResolver: Contract = createAddrResolver(this.web3, resolverAddress);
    
    const supportsAddr: boolean = await addrResolver.methods.supportsInterface(ADDR_INTERFACE).call();
    if (!supportsAddr) { 
      throw new Error(NO_ADDR_RESOLUTION);
    }

    const addr: string = await addrResolver.methods.addr(node).call();

    if (addr === ZERO_ADDRESS){ 
      throw new Error(NO_ADDR_RESOLUTION_SET);
    }

    return addr;
  }
}
