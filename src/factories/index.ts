import RNSRegistryData from '@rsksmart/rns-registry/RNSRegistryData.json';
import { abi as AddrAbi } from '@rsksmart/rns-resolver/AddrResolverData.json';
import { abi as ChainAddrAbi } from '@rsksmart/rns-resolver/ChainAddrResolverData.json';
import { abi as NameResolverAbi } from '@rsksmart/rns-reverse/NameResolverData.json';
import { abi as ReverseRegistrarAbi } from '@rsksmart/rns-reverse/ReverseRegistrarData.json';
import { abi as RSKOwnerAbi } from '@rsksmart/rns-rskregistrar/RSKOwnerData.json';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import { abi as ResolverV1Abi } from '../resolvers/ResolverV1Data.json';
import { NetworkId, ContractAddresses } from '../types';
import RNSError, { NO_ADDRESSES_PROVIDED } from '../errors';


export const createContractAddresses = (networkId: NetworkId): ContractAddresses => {
  switch (networkId) {
    case NetworkId.RSK_MAINNET:
      return {
        registry: RNSRegistryData.address.rskMainnet,
      };
    case NetworkId.RSK_TESTNET:
      return {
        registry: RNSRegistryData.address.rskTestnet,
      };
    default: throw new RNSError(NO_ADDRESSES_PROVIDED);
  }
};

export const createRegistry = (
  web3: Web3, address: string,
) => new web3.eth.Contract(RNSRegistryData.abi as AbiItem[], address);

export const createAddrResolver = (
  web3: Web3, address: string,
) => new web3.eth.Contract(AddrAbi as AbiItem[], address);

export const createChainAddrResolver = (
  web3: Web3, address: string,
) => new web3.eth.Contract(ChainAddrAbi as AbiItem[], address);

export const createNewAddrResolver = (
  web3: Web3, address: string,
) => new web3.eth.Contract(ResolverV1Abi as AbiItem[], address);

export const createNameResolver = (
  web3: Web3, address: string,
) => new web3.eth.Contract(NameResolverAbi as AbiItem[], address);

export const createRskOwner = (
  web3: Web3, address: string,
) => new web3.eth.Contract(RSKOwnerAbi as AbiItem[], address);

export const createReverseRegistrar = (
  web3: Web3, address: string,
) => new web3.eth.Contract(ReverseRegistrarAbi as AbiItem[], address);
