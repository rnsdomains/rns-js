import RNSRegistryData from '@rsksmart/rns-registry/RNSRegistryData.json';
import AddrResolverData from '@rsksmart/rns-resolver/AddrResolverData.json';
import ChainAddrResolverData from '@rsksmart/rns-resolver/ChainAddrResolverData.json';
import NameResolverData from '@rsksmart/rns-reverse/NameResolverData.json';
import ReverseRegistrarData from '@rsksmart/rns-reverse/ReverseRegistrarData.json';
import RSKOwnerData from '@rsksmart/rns-rskregistrar/RSKOwnerData.json';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
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

const getContract = (web3: Web3 | any, abi: AbiItem[], address: string) => {
  const namespace = web3.eth || web3;
  return new namespace.Contract(abi, address);
};

export const createRegistry = (
  web3: Web3, address: string,
) => getContract(web3, RNSRegistryData.abi as AbiItem[], address);

export const createAddrResolver = (
  web3: Web3, address: string,
) => getContract(web3, AddrResolverData.abi as AbiItem[], address);

export const createChainAddrResolver = (
  web3: Web3, address: string,
) => getContract(web3, ChainAddrResolverData.abi as AbiItem[], address);

export const createNameResolver = (
  web3: Web3, address: string,
) => getContract(web3, NameResolverData.abi as AbiItem[], address);

export const createRskOwner = (
  web3: Web3, address: string,
) => getContract(web3, RSKOwnerData.abi as AbiItem[], address);

export const createReverseRegistrar = (
  web3: Web3, address: string,
) => getContract(web3, ReverseRegistrarData.abi as AbiItem[], address);
