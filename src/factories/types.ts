import Web3 from "web3";
import { Contract } from "web3-eth-contract";

export type Web3ContractFactory = (web3: Web3) => Contract
