import Web3 from 'web3';
import { AVAILABLE_TLDS } from './constants';
import { Utils } from './types';
import { hash as namehash } from 'eth-ens-namehash';

export default class implements Utils {
  
  constructor(private web3: Web3) { }
  
  /**
   * Checks if the contract in the given address has the given method 
   * 
   * @param web3 - Web3 instance 
   * @param contractAddress - address of the contract to check 
   * @param signatureHash - keccak256 of the method signature
   * 
   * @returns
   * true if method exists, false if not
   */
  async hasMethod(contractAddress: string, signatureHash: string): Promise<boolean>{
    const code = await this.web3.eth.getCode(contractAddress);
    return code.indexOf(signatureHash.slice(2, signatureHash.length)) > 0;
  }

  /**
   * Checks if the given web3 instance has accounts to sign txs
   * 
   * @param web3 - Web3 instance 
   * 
   * @returns
   * true if has accounts, false if not
   */
  async hasAccounts(web3: Web3): Promise<boolean> {
    let accounts = [];
    try {
      accounts = await web3.eth.getAccounts();
    } catch {
      return false;
    }
    return accounts.length > 0;
  }

  /**
   * Validates the given label
   * 
   * @param label - label to validate
   * 
   * @returns
   * true if valid, false if not
   */
  validLabel(label: string): boolean {
    if (label && !label.match('[^a-z0-9]')) {
      return true;
    }
    return false;
  }

  /**
   * Validates the given domain syntax
   * 
   * @param domain - domain to validate
   * 
   * @returns
   * true if valid, false if not
   */
  validDomain(domain:string): boolean {
    const labels = domain.split('.');

    if (labels.length < 1) {
      return false;
    }

    for (let i = 0; i < labels.length; i++) {
      const label = labels[i];

      if (!this.validLabel(label)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Validates the given domain TLD
   * 
   * @param domain - domain to validate
   * 
   * @returns
   * true if valid, false if not
   */
  validTld(domain:string): boolean {
    const labels = domain.split('.');

    const tld = labels[labels.length - 1];

    return AVAILABLE_TLDS.includes(tld);
  }

  /**
   * Returns namehash of the given domain
   * 
   * @param domain - domain to apply namehash function
   * 
   * @returns
   * namehash of the given domain
   */
  namehash(domain:string): string {
    return namehash(domain);
  }

  /**
   * Returns sha3 of the given label
   * 
   * @param label - label to apply sha3 function
   * 
   * @returns
   * sha3 of the given domain
   */
  sha3(label:string): string {
    return this.web3.utils.sha3(label) as string;
  }
}