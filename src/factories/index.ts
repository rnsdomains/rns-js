import RNSRegistryData from '@rsksmart/rns-registry/RNSRegistryData.json';
import AddrResolverData from '@rsksmart/rns-resolver/AddrResolverData.json';
import Web3 from 'web3';

export const createRegistry = (web3: Web3) => new web3.eth.Contract(<any>(RNSRegistryData.abi), RNSRegistryData.address.rskMainnet)
export const createAddrResolver = (web3: Web3, address: string) => new web3.eth.Contract(<any>(AddrResolverData.abi), address)
