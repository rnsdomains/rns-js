import RNSRegistryData from '@rsksmart/rns-registry/RNSRegistryData.json';
import AddrResolverData from '@rsksmart/rns-resolver/AddrResolverData.json';
import ChainAddrResolverData from '@rsksmart/rns-resolver/ChainAddrResolverData.json';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import { NetworkId } from '../types';
import { NO_ADDRESSES_PROVIDED } from '../errors'; 

export const createContractAddresses = (networkId: NetworkId) => {
  switch (networkId) {
    case NetworkId.RSK_MAINNET:
      return {
        registry: RNSRegistryData.address.rskMainnet
      }
    case NetworkId.RSK_TESTNET:
      return {
        registry: RNSRegistryData.address.rskTestnet
      }
    default: throw new Error(NO_ADDRESSES_PROVIDED);
  }
}

export const createRegistry = (web3: Web3, address: string) => new web3.eth.Contract(RNSRegistryData.abi as AbiItem[], address)

export const createAddrResolver = (web3: Web3, address: string) => new web3.eth.Contract(AddrResolverData.abi as AbiItem[], address)

export const createChainAddrResolver = (web3: Web3, address: string) => new web3.eth.Contract(ChainAddrResolverData.abi as AbiItem[], address)
