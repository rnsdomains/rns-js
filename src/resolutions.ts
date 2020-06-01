import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';
import { TransactionReceipt } from 'web3-eth';
import {
  createAddrResolver, createChainAddrResolver, createNameResolver,
  createReverseRegistrar, createNewAddrResolver,
} from './factories';
import {
  ZERO_ADDRESS, ADDR_INTERFACE, SET_CHAIN_ADDR_INTERFACE,
  CHAIN_ADDR_INTERFACE, NAME_INTERFACE, ADDR_REVERSE_NAMEHASH,
  SET_NAME_INTERFACE, NEW_ADDR_INTERFACE,
} from './constants';
import {
  ChainId, Resolutions, Options, NetworkId,
} from './types';
import Composer from './composer';
import {
  hasMethod, namehash, hasAccounts, isValidAddress, isValidChecksumAddress,
  isValidDomain, toChecksumAddress,
} from './utils';
import {
  NO_RESOLVER, NO_ADDR_RESOLUTION, NO_ADDR_RESOLUTION_SET, NO_CHAIN_ADDR_RESOLUTION,
  NO_CHAIN_ADDR_RESOLUTION_SET, NO_NAME_RESOLUTION, NO_REVERSE_RESOLUTION_SET,
  NO_ACCOUNTS_TO_SIGN, NO_SET_ADDR, INVALID_ADDRESS, INVALID_CHECKSUM_ADDRESS,
  DOMAIN_NOT_EXISTS, INVALID_DOMAIN, NO_REVERSE_REGISTRAR, NO_SET_NAME_METHOD, NO_SET_CHAIN_ADDR,
} from './errors';
import { TransactionOptions } from './types/options';
import { CoinType } from './types/enums';

/**
 * Standard resolution protocols.
 */
export default class extends Composer implements Resolutions {
  /**
   *
   * @param blockchainApi - current Web3 or Rsk3 instance
   * @param options - Overrides network defaults. Optional on RSK Mainnet and RSK Testnet, required for other networks.
   */
  constructor(public blockchainApi: Web3 | any, options?: Options) {
    super(blockchainApi, options);
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
    contractFactory: (blockchainApi: Web3 | any, address: string) => Contract,
    noResolverError?: string,
  ): Promise<Contract> {
    const resolverAddress: string = await this._contracts.registry.methods.resolver(node).call();

    if (resolverAddress === ZERO_ADDRESS) {
      this._throw(noResolverError || NO_RESOLVER);
    }

    const resolver: Contract = contractFactory(this.blockchainApi, resolverAddress);

    return resolver;
  }

  private _validateAddress(addr: string, chainId?: ChainId) {
    if (!chainId || chainId === ChainId.RSK || chainId === ChainId.ETHEREUM) {
      if (!isValidAddress(addr)) {
        this._throw(INVALID_ADDRESS);
      }

      if (!chainId) {
        if (!isValidChecksumAddress(addr, this.currentNetworkId)) {
          this._throw(INVALID_CHECKSUM_ADDRESS);
        }
      } else if (chainId === ChainId.RSK) {
        if (!isValidChecksumAddress(addr, NetworkId.RSK_MAINNET)) {
          this._throw(INVALID_CHECKSUM_ADDRESS);
        }
      } else if (chainId === ChainId.ETHEREUM) {
        if (!isValidChecksumAddress(addr)) {
          this._throw(INVALID_CHECKSUM_ADDRESS);
        }
      }
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

    const resolver = await this._createResolver(node, createAddrResolver);

    const supportsInterface: boolean = await resolver.methods.supportsInterface(
      ADDR_INTERFACE,
    ).call();

    if (!supportsInterface) {
      throw new RNSError(NO_ADDR_RESOLUTION);
    }

    const addr: string = await resolver.methods.addr(node).call();

    if (addr === ZERO_ADDRESS) {
      this._throw(NO_ADDR_RESOLUTION_SET);
    }

    return toChecksumAddress(addr, this.currentNetworkId);
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
  async chainAddr(domain: string, chainId: ChainId | CoinType): Promise<string> {
    await this.compose();
    const node: string = namehash(domain);

    const newResolver = await this._createResolver(node, createNewAddrResolver);

    const supportsNewAddrInterface: boolean = await newResolver.methods.supportsInterface(
      NEW_ADDR_INTERFACE,
    ).call();

    let addr;
    if (supportsNewAddrInterface) {
      // TODO: Decode address
      addr = await newResolver.methods.addr(node, chainId).call();
    } else {
      const chainResolver = await this._createResolver(node, createChainAddrResolver);

      const supportsChainAddrInterface: boolean = await chainResolver.methods.supportsInterface(
        CHAIN_ADDR_INTERFACE,
      ).call();

      if (!supportsChainAddrInterface) {
        throw new RNSError(NO_CHAIN_ADDR_RESOLUTION);
      }

      addr = await chainResolver.methods.chainAddr(node, chainId).call();
    }

    if (!addr || addr === ZERO_ADDRESS) {
      this._throw(NO_CHAIN_ADDR_RESOLUTION_SET);
    }

    // return checksum address just if it is a EVM blockchain address
    if (isValidAddress(addr)) {
      if (chainId === ChainId.RSK) {
        return toChecksumAddress(addr, NetworkId.RSK_MAINNET);
      }

      return toChecksumAddress(addr);
    }

    return addr;
  }

  /**
   * Sets addr for the given domain using the AbstractAddrResolver interface.
   *
   * @throws NO_SET_ADDR it has an invalid resolver - KB018.
   * @throws NO_RESOLVER when the domain doesn't have resolver - KB003.
   * @throws NO_ACCOUNTS_TO_SIGN if the given blockchainApi instance does not have associated accounts to sign the transaction - KB015
   * @throws INVALID_ADDRESS if the given addr is invalid - KB017
   * @throws INVALID_CHECKSUM_ADDRESS if the given addr has an invalid checksum - KB019
   *
   * @param domain - Domain to set resolution
   * @param addr - Address to be set as the resolution of the given domain
   * @param options - Custom configs to be used when submitting the transaction
   *
   */
  async setAddr(
    domain: string, addr: string, options?: TransactionOptions,
  ): Promise<TransactionReceipt> {
    await this.compose();

    if (!await hasAccounts(this.blockchainApi)) {
      this._throw(NO_ACCOUNTS_TO_SIGN);
    }

    this._validateAddress(addr);

    const node: string = namehash(domain);

    const resolver = await this._createResolver(node, createAddrResolver);

    const contractMethod = resolver.methods.setAddr(node, addr);

    return this.estimateGasAndSendTransaction(contractMethod, options);
  }

  /**
   * Sets addr for the given domain using the AbstractAddrResolver interface.
   *
   * @throws NO_SET_CHAIN_ADDR if it has an invalid resolver - KB024.
   * @throws NO_RESOLVER when the domain doesn't have resolver - KB003.
   * @throws NO_ACCOUNTS_TO_SIGN if the given blockchain api instance does not have associated accounts to sign the transaction - KB015
   * @throws INVALID_ADDRESS if the given addr is invalid when the chainId belongs to an EVM compatible blockchain - KB017
   * @throws INVALID_CHECKSUM_ADDRESS if the given addr has an invalid checksum and the chainId belongs to an EVM compatible blockchain - KB019
   *
   * @param domain - Domain to set resolution
   * @param addr - Address to be set as the resolution of the given domain
   * @param chainId - chain identifier listed in SLIP44 (https://github.com/satoshilabs/slips/blob/master/slip-0044.md)
   * @param options - Custom configs to be used when submitting the transaction
   *
   *
   */
  async setChainAddr(
    domain: string, addr: string, chainId: ChainId, options?: TransactionOptions,
  ): Promise<TransactionReceipt> {
    await this.compose();

    if (!await hasAccounts(this.blockchainApi)) {
      this._throw(NO_ACCOUNTS_TO_SIGN);
    }

    this._validateAddress(addr, chainId);

    const node: string = namehash(domain);

    const resolverAddress: string = await this._contracts.registry.methods.resolver(node).call();

    if (resolverAddress === ZERO_ADDRESS) {
      throw new RNSError(NO_RESOLVER);
    }

    const supportsResolverV1Interface: boolean = await hasMethod(
      this.blockchainApi, resolverAddress, NEW_ADDR_INTERFACE,
    );

    let contractMethod;
    if (supportsResolverV1Interface) {
      // TODO: Encode address
      const resolver: Contract = createNewAddrResolver(this.blockchainApi, resolverAddress);

      contractMethod = resolver.methods.setAddr(node, chainId, addr);
    } else {
      const supportsChainAddrInterface: boolean = await hasMethod(
        this.blockchainApi, resolverAddress, SET_CHAIN_ADDR_INTERFACE,
      );

      if (!supportsChainAddrInterface) {
        throw new RNSError(NO_SET_CHAIN_ADDR);
      }

      const resolver: Contract = createChainAddrResolver(this.blockchainApi, resolverAddress);

      contractMethod = resolver.methods.setChainAddr(node, chainId, addr);
    }

    return this.estimateGasAndSendTransaction(contractMethod, options);
  }

  /**
   * Set resolver of a given domain.
   *
   * @throws NO_ACCOUNTS_TO_SIGN if the given blockchain api instance does not have associated accounts to sign the transaction - KB015
   * @throws INVALID_ADDRESS if the given resolver address is invalid - KB017
   * @throws INVALID_CHECKSUM_ADDRESS if the given resolver address has an invalid checksum - KB019
   * @throws DOMAIN_NOT_EXISTS if the given domain does not exists - KB012
   *
   * @param domain - Domain to set resolver
   * @param resolver - Address to be set as the resolver of the given domain
   * @param options - Custom configs to be used when submitting the transaction
   *
   */
  async setResolver(
    domain: string, resolver: string, options?: TransactionOptions,
  ): Promise<TransactionReceipt> {
    await this.compose();

    if (!await hasAccounts(this.blockchainApi)) {
      this._throw(NO_ACCOUNTS_TO_SIGN);
    }

    this._validateAddress(resolver);

    const domainOwner = await this._contracts.registry.methods.owner(namehash(domain)).call();
    if (domainOwner === ZERO_ADDRESS) {
      this._throw(DOMAIN_NOT_EXISTS);
    }

    const node: string = namehash(domain);

    const contractMethod = this._contracts.registry.methods.setResolver(node, resolver);

    return this.estimateGasAndSendTransaction(contractMethod, options);
  }

  /**
   * Set reverse resolution with the given name for the current address
   *
   * @throws NO_ACCOUNTS_TO_SIGN if the given blockchain api instance does not have associated accounts to sign the transaction - KB015
   * @throws INVALID_DOMAIN if the given domain is empty, is not alphanumeric or if has uppercase characters - KB010
   * @throws NO_REVERSE_REGISTRAR if there is no owner for `addr.reverse` node - KB022
   * @throws NO_SET_NAME_METHOD if reverse registrar does not implement `setName` method - KB023
   *
   * @param name - Domain to set resolver
   * @param resolver - Address to be set as the resolver of the given domain
   * @param options - Custom configs to be used when submitting the transaction
   *
   * @returns TransactionReceipt of the submitted tx
   */
  async setName(name: string, options?: TransactionOptions): Promise<TransactionReceipt> {
    await this.compose();

    if (!await hasAccounts(this.blockchainApi)) {
      this._throw(NO_ACCOUNTS_TO_SIGN);
    }

    if (!isValidDomain(name)) {
      this._throw(INVALID_DOMAIN);
    }

    const reverseRegistrarOwner = await this._contracts.registry.methods.owner(
      ADDR_REVERSE_NAMEHASH,
    ).call();
    if (reverseRegistrarOwner === ZERO_ADDRESS) {
      this._throw(NO_REVERSE_REGISTRAR);
    }

    const hasSetNameMethod = await hasMethod(
      this.blockchainApi,
      reverseRegistrarOwner,
      SET_NAME_INTERFACE,
    );
    if (!hasSetNameMethod) {
      this._throw(NO_SET_NAME_METHOD);
    }

    const reverseRegistrar = createReverseRegistrar(this.blockchainApi, reverseRegistrarOwner);

    const contractMethod = reverseRegistrar.methods.setName(name);

    return this.estimateGasAndSendTransaction(contractMethod, options);
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
    const convertedAddress = address.substring(2).toLowerCase(); // remove '0x'

    const node: string = namehash(`${convertedAddress}.addr.reverse`);

    const resolver = await this._createResolver(
      node,
      createNameResolver,
      NO_REVERSE_RESOLUTION_SET,
    );

    const supportsInterface: boolean = await resolver.methods.supportsInterface(
      NAME_INTERFACE,
    ).call();

    if (!supportsInterface) {
      throw new RNSError(NO_NAME_RESOLUTION);
    }

    const name: string = await resolver.methods.name(node).call();
    if (!name) {
      this._throw(NO_REVERSE_RESOLUTION_SET);
    }

    return name;
  }
}
