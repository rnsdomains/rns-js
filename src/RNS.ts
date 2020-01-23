import Web3 from 'web3';
import { default as RNSRegistryData } from '@rsksmart/rns-registry/RNSRegistryData.json';
import { Configuration, Address, Chain } from './types';
import { MainnetConfig, TestnetConfig } from './defaults';
const namehash = require('eth-ens-namehash').hash;

export default class RNS {
  constructor(private web3: Web3, private config?: Configuration) {
  }

  private async setConfig(): Promise<void> {
    // this.web3.eth.getChainId() wasn't working. It threw an internal error
    return this.web3.eth.net.getId().then(chainId => {
      if (chainId === Chain.MAINNET) {
        this.config = MainnetConfig;
      } else if (chainId === Chain.TESTNET) {
        this.config = TestnetConfig;
      }
    });
  }

  async getAddr(domain: string): Promise<Address> {
    try {
      await this.setConfig();

      if (!this.config) {
        throw new Error('No config defined for custom blockchain');
      }

      const node = namehash(domain);
      const rns = new this.web3.eth.Contract([
          {
              'constant': true,
              'inputs': [
                  {
                      'name': 'node',
                      'type': 'bytes32'
                  }
              ],
              'name': 'resolver',
              'outputs': [
                  {
                      'name': '',
                      'type': 'address'
                  }
              ],
              'payable': false,
              'stateMutability': 'view',
              'type': 'function'
          }
      ], this.config.rns);
      
      const resolverAddress = await rns.methods.resolver(node).call();

      if (resolverAddress === '0x0000000000000000000000000000000000000000') throw 'No resolver';
    
      // Check if it supports addr resolution
      const resolver = new this.web3.eth.Contract([
          {
              "constant": true,
              "inputs": [
                  {
                      "name": "interfaceID",
                      "type": "bytes4"
                  }
              ],
              "name": "supportsInterface",
              "outputs": [
                  {
                      "name": "",
                      "type": "bool"
                  }
              ],
              "payable": false,
              "stateMutability": "pure",
              "type": "function"
          }
      ], resolverAddress);
      const addrInterface = '0x3b3b57de';
      
      const supportsAddr = await resolver.methods.supportsInterface(addrInterface).call();
  
      if (!supportsAddr) throw 'No addr resolution';
      
      // Get the domain's associated address
      const addrResolver = new this.web3.eth.Contract([
          {
              "constant": true,
              "inputs": [
                  {
                      "name": "node",
                      "type": "bytes32"
                  }
              ],
              "name": "addr",
              "outputs": [
                  {
                      "name": "",
                      "type": "address"
                  }
              ],
              "payable": false,
              "stateMutability": "view",
              "type": "function"
          }
      ], resolverAddress);
      
      const addr = await addrResolver.methods.addr(node).call();
      
      if (addr === '0x0000000000000000000000000000000000000000') throw 'No addr resolutio set';
  
      return addr;
    } catch(err) {
      throw err;
    }
  }
}