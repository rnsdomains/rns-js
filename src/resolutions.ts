import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';
import { TransactionReceipt } from 'web3-eth';
import {
  createAddrResolver, createChainAddrResolver, createNameResolver, createReverseRegistrar,
} from './factories';
import {
  ZERO_ADDRESS, ADDR_INTERFACE, ERC165_INTERFACE,
  CHAIN_ADDR_INTERFACE, NAME_INTERFACE, ADDR_REVERSE_NAMEHASH, SET_NAME_INTERFACE,
} from './constants';
import { ChainId, Resolutions, Options } from './types';
import Composer from './composer';
import {
  hasMethod, namehash, hasAccounts, isValidAddress, isValidChecksumAddress,
  isValidDomain, getCurrentAddress,
} from './utils';
import RNSError, {
  NO_RESOLVER, NO_ADDR_RESOLUTION, NO_ADDR_RESOLUTION_SET, NO_CHAIN_ADDR_RESOLUTION,
  NO_CHAIN_ADDR_RESOLUTION_SET, NO_NAME_RESOLUTION, NO_REVERSE_RESOLUTION_SET,
  NO_ACCOUNTS_TO_SIGN, NO_SET_ADDR, INVALID_ADDRESS, INVALID_CHECKSUM_ADDRESS,
  DOMAIN_NOT_EXISTS, INVALID_DOMAIN, NO_REVERSE_REGISTRAR, NO_SET_NAME_METHOD,
} from './errors';

/**
 * Standard resolution protocols.
 */
export default class extends Composer implements Resolutions {
  /**
   *
   * @param web3 - current Web3 instance
   * @param registry - RNS Registry Web3 Contract instance
   */
  constructor(public web3: Web3, options?: Options) {
    super(web3, options);
  }

  /**
   * Instance the resolver associated with the given node and checks if is valid according to the given interface.
   *
   * @throws provided `errorMessage` if the resolver is not ERC165 or it doesn't implement the necessary given interface.
   * @throws `noResolverError` || NO_RESOLVER when the domain doesn't have resolver - KB003.
   *
   * @param node - namehash of the domain to resolve
   * @param methodInterface - standard resolution interface id
   * @param errorMessage - error message in case the resolver is not valid
   * @param contractFactory - factory function used to instance the resolver
   * @param noResolverError - custom error to throw if no resolver found
   */
  private async _createResolver(
    node: string,
    methodInterface: string,
    errorMessage: string,
    contractFactory: (web3: Web3, address: string) => Contract,
    noResolverError?: string,
  ): Promise<Contract> {
    const resolverAddress: string = await this._contracts.registry.methods.resolver(node).call();

    if (resolverAddress === ZERO_ADDRESS) {
      throw new RNSError(noResolverError || NO_RESOLVER);
    }

    const isErc165Contract = await hasMethod(this.web3, resolverAddress, ERC165_INTERFACE);
    if (!isErc165Contract) {
      throw new RNSError(errorMessage);
    }

    const resolver: Contract = contractFactory(this.web3, resolverAddress);

    const supportsInterface: boolean = await resolver.methods.supportsInterface(
      methodInterface,
    ).call();

    if (!supportsInterface) {
      throw new RNSError(errorMessage);
    }

    return resolver;
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
   * addr resolution protocol.

   * @throws NO_ADDR_RESOLUTION_SET if the resolution hasn't been set yet - KB001.
   * @throws NO_ADDR_RESOLUTION it has an invalid resolver - KB002.
   * @throws NO_RESOLVER when the domain doesn't have resolver - KB003.
   *
   * @param domain - Domain to be resolved
   *
   * @return
   * Address resolution for the given domain
   */
  async addr(domain: string): Promise<string> {
    await this.compose();
    const node: string = namehash(domain);

    const resolver = await this._createResolver(
      node,
      ADDR_INTERFACE,
      NO_ADDR_RESOLUTION,
      createAddrResolver,
    );

    const addr: string = await resolver.methods.addr(node).call();

    if (addr === ZERO_ADDRESS) {
      throw new RNSError(NO_ADDR_RESOLUTION_SET);
    }

    return addr;
  }

  /**
   * chainAddr resolution protocol.
   *
   * @throws NO_CHAIN_ADDR_RESOLUTION_SET if the resolution hasn't been set yet - KB007.
   * @throws NO_CHAIN_ADDR_RESOLUTION it has an invalid resolver - KB006.
   * @throws NO_RESOLVER when the domain doesn't have resolver - KB003.
   *
   * @param domain - Domain to be resolved
   * @param chainId - chain identifier listed in SLIP44 (https://github.com/satoshilabs/slips/blob/master/slip-0044.md)
   *
   * @return
   * Address resolution for a domain in a given chain
   */
  async chainAddr(domain: string, chainId: ChainId): Promise<string> {
    await this.compose();
    const node: string = namehash(domain);

    const resolver = await this._createResolver(
      node,
      CHAIN_ADDR_INTERFACE,
      NO_CHAIN_ADDR_RESOLUTION,
      createChainAddrResolver,
    );

    const addr: string = await resolver.methods.chainAddr(node, chainId).call();
    if (!addr || addr === ZERO_ADDRESS) {
      throw new RNSError(NO_CHAIN_ADDR_RESOLUTION_SET);
    }

    return addr;
  }

  /**
   * Sets addr for the given domain using the AbstractAddrResolver interface.
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
  async setAddr(domain: string, addr: string): Promise<TransactionReceipt> {
    await this.compose();

    if (!await hasAccounts(this.web3)) {
      throw new RNSError(NO_ACCOUNTS_TO_SIGN);
    }

    this._validateAddress(addr);

    const node: string = namehash(domain);

    const resolver = await this._createResolver(
      node,
      ADDR_INTERFACE,
      NO_SET_ADDR,
      createAddrResolver,
    );

    const sender = await getCurrentAddress(this.web3);

    return resolver
      .methods
      .setAddr(
        node,
        addr,
      ).send({ from: sender });
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
  async setResolver(domain: string, resolver: string): Promise<TransactionReceipt> {
    await this.compose();

    if (!await hasAccounts(this.web3)) {
      throw new RNSError(NO_ACCOUNTS_TO_SIGN);
    }

    this._validateAddress(resolver);

    const domainOwner = await this._contracts.registry.methods.owner(namehash(domain)).call();
    if (domainOwner === ZERO_ADDRESS) {
      throw new RNSError(DOMAIN_NOT_EXISTS);
    }

    const node: string = namehash(domain);

    const sender = await getCurrentAddress(this.web3);

    return this._contracts.registry
      .methods
      .setResolver(node, resolver)
      .send({ from: sender });
  }

  /**
   * Set resolver of a given domain.
   *
   * @throws NO_ACCOUNTS_TO_SIGN if the given web3 instance does not have associated accounts to sign the transaction - KB015
   * @throws INVALID_DOMAIN if the given domain is empty, is not alphanumeric or if has uppercase characters - KB010
   * @throws INVALID_CHECKSUM_ADDRESS if the given resolver address has an invalid checksum - KB019
   * @throws DOMAIN_NOT_EXISTS if the given domain does not exists - KB012
   *
   * @param domain - Domain to set resolver
   * @param resolver - Address to be set as the resolver of the given domain
   *
    * @returns TransactionReceipt of the submitted tx
   */
  async setName(name: string): Promise<TransactionReceipt> {
    await this.compose();

    if (!await hasAccounts(this.web3)) {
      throw new RNSError(NO_ACCOUNTS_TO_SIGN);
    }

    if (!isValidDomain(name)) {
      throw new RNSError(INVALID_DOMAIN);
    }

    const reverseRegistrarOwner = await this._contracts.registry.methods.owner(
      ADDR_REVERSE_NAMEHASH,
    ).call();
    if (reverseRegistrarOwner === ZERO_ADDRESS) {
      throw new RNSError(NO_REVERSE_REGISTRAR);
    }

    const hasSetNameMethod = await hasMethod(this.web3, reverseRegistrarOwner, SET_NAME_INTERFACE);
    if (!hasSetNameMethod) {
      throw new RNSError(NO_SET_NAME_METHOD);
    }

    const reverseRegistrar = createReverseRegistrar(this.web3, reverseRegistrarOwner);

    const currentAddress = await getCurrentAddress(this.web3);

    return reverseRegistrar
      .methods
      .setName(name)
      .send({ from: currentAddress });
  }

  /**
   * name resolution protocol.
   *
   * @throws NO_REVERSE_RESOLUTION_SET when the domain has not the reverse resolution set - KB014.
   * @throws NO_NAME_RESOLUTION if has an invalid name resolver - KB013.
   *
   * @param address - address to be resolved
   *
   * @return
   * Domain or subdomain associated to the given address.
   */
  async name(address: string): Promise<string> {
    await this.compose();
    const convertedAddress = address.substring(2).toLowerCase(); // remove '0x' and convert it to lowercase.

    const node: string = namehash(`${convertedAddress}.addr.reverse`);

    const resolver = await this._createResolver(
      node,
      NAME_INTERFACE,
      NO_NAME_RESOLUTION,
      createNameResolver,
      NO_REVERSE_RESOLUTION_SET,
    );

    const name: string = await resolver.methods.name(node).call();
    if (!name) {
      throw new RNSError(NO_REVERSE_RESOLUTION_SET);
    }

    return name;
  }
}
