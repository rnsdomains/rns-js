import { Contract } from 'web3-eth-contract';

export interface ContractAddresses {
  rns: string
}

export interface Options {
  contractAddresses: ContractAddresses
}

export interface Contracts {
  registry: Contract
}

export interface RNS {
  contracts: Contracts
  addr(domain: string): Promise<string>
}
