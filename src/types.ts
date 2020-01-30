import { Contract } from 'web3-eth-contract';
import Web3 from 'web3';

export enum NetworkId {
  RSK_MAINNET = 30,
  RSK_TESTNET = 31
}

export interface ContractAddresses {
  registry: string
}

export interface Options {
  contractAddresses?: ContractAddresses
}

export interface Contracts {
  registry: Contract
}

export interface RNS {
  web3: Web3
  contracts: Contracts
  compose(): void
  addr(domain: string): Promise<string>
}
