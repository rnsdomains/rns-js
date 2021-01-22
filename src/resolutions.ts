import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';
import { formatsByCoinType } from '@ensdomains/address-encoder';
import {
  createAddrResolver, createChainAddrResolver, createNameResolver,
  createReverseRegistrar, createNewAddrResolver,
} from './factories';
import {
  ZERO_ADDRESS, ADDR_INTERFACE, SET_CHAIN_ADDR_INTERFACE,
  CHAIN_ADDR_INTERFACE, NAME_INTERFACE, ADDR_REVERSE_NAMEHASH,
  SET_NAME_INTERFACE, NEW_ADDR_INTERFACE, CONTENTHASH_INTERFACE,
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
  NO_ACCOUNTS_TO_SIGN, INVALID_ADDRESS, INVALID_CHECKSUM_ADDRESS,
  DOMAIN_NOT_EXISTS, INVALID_DOMAIN, NO_REVERSE_REGISTRAR, NO_SET_NAME_METHOD,
  NO_CONTENTHASH_INTERFACE, NO_CONTENTHASH_SET, UNSUPPORTED_CONTENTHASH_PROTOCOL,
  CHAIN_ID_NOT_SUPPORTED,
} from './errors';
import { TransactionOptions } from './types/options';
import networks from './types/networks.json';
import ContenthashHelper from './contenthash-helper';
import { DecodedContenthash } from './types/resolutions';

export default class extends Composer implements Resolutions {
  _contenthashHelper: ContenthashHelper;

  constructor(public blockchainApi: Web3 | any, options?: Options) {
    super(blockchainApi, options);
    this._contenthashHelper = new ContenthashHelper(options);
  }

  private async _createResolver(
    node: string,
    contractFactory: (blockchainApi: Web3 | any, address: string) => Contract,
    noResolverError?: string,
    parentNode?: string,
  ): Promise<Contract> {
    const resolverAddress: string = await this._contracts
      .registry.methods
      .resolver(parentNode || node).call();

    if (resolverAddress === ZERO_ADDRESS) {
      this._throw(noResolverError || NO_RESOLVER);
    }

    const resolver: Contract = contractFactory(this.blockchainApi, resolverAddress);

    return resolver;
  }

  private _validateAddress(addr: string, chainId?: ChainId) {
    if (!chainId || [ChainId.RSK, ChainId.ETC, ChainId.ETH, ChainId.XDAI].includes(chainId)) {
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
      } else if (!isValidChecksumAddress(addr)) {
        this._throw(INVALID_CHECKSUM_ADDRESS);
      }
    }
  }

  _getCoinTypeFromChainId(chainId: ChainId): number {
    const coinType = networks.find((net) => net.id === chainId)?.index;

    if (coinType !== 0 && !coinType) {
      this._throw(CHAIN_ID_NOT_SUPPORTED);
    }

    return coinType!;
  }

  _decodeAddressByCoinType(addr: string, coinType: number) {
    try {
      const decoded = formatsByCoinType[coinType].decoder(addr);

      return decoded;
    } catch (err) {
      this._throw(INVALID_ADDRESS);
    }

    return '';
  }

  _encodeAddressByCoinType(decodedAddr: string, coinType: number): string {
    let encoded = '';
    try {
      const buff = Buffer.from(decodedAddr.replace('0x', ''), 'hex');

      encoded = formatsByCoinType[coinType].encoder(buff);
    } catch (err) {
      this._throw(INVALID_ADDRESS);
    }

    return encoded;
  }

  async addr(domain: string): Promise<string> {
    await this.compose();
    const node: string = namehash(domain);

    const resolver = await this._createResolver(node, createAddrResolver);

    const supportsInterface: boolean = await resolver.methods.supportsInterface(
      ADDR_INTERFACE,
    ).call();

    if (!supportsInterface) {
      this._throw(NO_ADDR_RESOLUTION);
    }

    const addr: string = await resolver.methods.addr(node).call();

    if (addr === ZERO_ADDRESS) {
      this._throw(NO_ADDR_RESOLUTION_SET);
    }

    return toChecksumAddress(addr, this.currentNetworkId);
  }

  async chainAddr(domain: string, chainId: ChainId): Promise<string> {
    await this.compose();
    const node: string = namehash(domain);

    const newResolver = await this._createResolver(node, createNewAddrResolver);

    const supportsNewAddrInterface: boolean = await newResolver.methods.supportsInterface(
      NEW_ADDR_INTERFACE,
    ).call();

    if (supportsNewAddrInterface) {
      const coinType = this._getCoinTypeFromChainId(chainId);
      const decodedAddr = await newResolver.methods['addr(bytes32,uint256)'](node, coinType).call();

      if (!decodedAddr || decodedAddr === ZERO_ADDRESS || decodedAddr === '0x') {
        this._throw(NO_CHAIN_ADDR_RESOLUTION_SET);
      }

      const addr = this._encodeAddressByCoinType(decodedAddr, coinType);

      if (!addr || addr === ZERO_ADDRESS) {
        this._throw(NO_CHAIN_ADDR_RESOLUTION_SET);
      }

      return addr;
    }

    const chainResolver = await this._createResolver(node, createChainAddrResolver);

    const supportsChainAddrInterface: boolean = await chainResolver.methods.supportsInterface(
      CHAIN_ADDR_INTERFACE,
    ).call();

    if (!supportsChainAddrInterface) {
      this._throw(NO_CHAIN_ADDR_RESOLUTION);
    }

    const addr = await chainResolver.methods.chainAddr(node, chainId).call();

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

  async setAddr(
    domain: string, addr: string, options?: TransactionOptions, parentNode?: string,
  ): Promise<string> {
    await this.compose();

    if (!await hasAccounts(this.blockchainApi)) {
      this._throw(NO_ACCOUNTS_TO_SIGN);
    }

    this._validateAddress(addr);

    const node: string = namehash(domain);

    const resolver = await this._createResolver(node, createAddrResolver, undefined, parentNode);

    const contractMethod = resolver.methods.setAddr(node, addr);

    return this.estimateGasAndSendTransaction(contractMethod, options);
  }

  async setChainAddr(
    domain: string, addr: string, chainId: ChainId, options?: TransactionOptions,
  ): Promise<string> {
    await this.compose();

    if (!await hasAccounts(this.blockchainApi)) {
      this._throw(NO_ACCOUNTS_TO_SIGN);
    }

    this._validateAddress(addr, chainId);

    const node: string = namehash(domain);

    const resolverAddress: string = await this._contracts.registry.methods.resolver(node).call();

    if (resolverAddress === ZERO_ADDRESS) {
      this._throw(NO_RESOLVER);
    }

    const supportsChainAddrInterface: boolean = await hasMethod(
      this.blockchainApi, resolverAddress, SET_CHAIN_ADDR_INTERFACE,
    );

    let contractMethod;
    if (supportsChainAddrInterface) {
      const resolver: Contract = createChainAddrResolver(this.blockchainApi, resolverAddress);

      contractMethod = resolver.methods.setChainAddr(node, chainId, addr);
    } else {
      const resolver: Contract = createNewAddrResolver(this.blockchainApi, resolverAddress);

      const coinType = this._getCoinTypeFromChainId(chainId);

      const decodedAddr = addr ? this._decodeAddressByCoinType(addr, coinType) : '0x';

      contractMethod = resolver.methods['setAddr(bytes32,uint256,bytes)'](node, coinType, decodedAddr);
    }

    return this.estimateGasAndSendTransaction(contractMethod, options);
  }

  async contenthash(domain: string): Promise<DecodedContenthash> {
    await this.compose();
    const node: string = namehash(domain);

    const resolver = await this._createResolver(node, createNewAddrResolver);

    const supportsInterface: boolean = await resolver.methods.supportsInterface(
      CONTENTHASH_INTERFACE,
    ).call();

    if (!supportsInterface) {
      this._throw(NO_CONTENTHASH_INTERFACE);
    }

    const encoded: string = await resolver.methods.contenthash(node).call();

    if (!encoded || encoded === '0x') {
      this._throw(NO_CONTENTHASH_SET);
    }

    const decoded = this._contenthashHelper.decodeContenthash(encoded);

    if (!decoded?.protocolType) {
      this._throw(UNSUPPORTED_CONTENTHASH_PROTOCOL);
    }

    return decoded!;
  }

  async setContenthash(
    domain: string, content: string, options?: TransactionOptions,
  ): Promise<string> {
    await this.compose();

    if (!await hasAccounts(this.blockchainApi)) {
      this._throw(NO_ACCOUNTS_TO_SIGN);
    }

    const node: string = namehash(domain);

    const resolver = await this._createResolver(node, createNewAddrResolver);

    const encodedContenthash = content ? this._contenthashHelper.encodeContenthash(content) : '0x';

    const contractMethod = resolver.methods['setContenthash(bytes32,bytes)'](node, encodedContenthash);

    return this.estimateGasAndSendTransaction(contractMethod, options);
  }

  async resolver(domain: string): Promise<string> {
    await this.compose();
    const node: string = namehash(domain);

    const domainOwner = await
    this._contracts.registry.methods.owner(node).call();
    if (domainOwner === ZERO_ADDRESS) {
      this._throw(DOMAIN_NOT_EXISTS);
    }

    const resolverAddress: string = await
    this._contracts.registry.methods.resolver(node).call();
    if (resolverAddress === ZERO_ADDRESS) {
      this._throw(NO_RESOLVER);
    }

    return resolverAddress;
  }

  async setResolver(
    domain: string, resolver: string, options?: TransactionOptions,
  ): Promise<string> {
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

  async setName(name: string, options?: TransactionOptions): Promise<string> {
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
      this._throw(NO_NAME_RESOLUTION);
    }

    const name: string = await resolver.methods.name(node).call();
    if (!name) {
      this._throw(NO_REVERSE_RESOLUTION_SET);
    }

    return name;
  }
}
