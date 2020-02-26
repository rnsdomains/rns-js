import Web3 from 'web3';
import { AVAILABLE_TLDS } from './constants';

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
export const hasMethod = async(web3: Web3, contractAddress: string, signatureHash: string) => {
  const code = await web3.eth.getCode(contractAddress);
  return code.indexOf(signatureHash.slice(2, signatureHash.length)) > 0;
}

/**
 * Validates the given label
 * 
 * @param label - label to validate
 * 
 * @returns
 * true if valid, false if not
 */
export const validLabel = (label: string) => {
  return label && !label.match('[^a-z0-9]');
}

/**
 * Validates the given domain syntax
 * 
 * @param domain - domain to validate
 * 
 * @returns
 * true if valid, false if not
 */
export const validDomain = (domain:string) => {
  const labels = domain.split('.');

  if (labels.length < 1) {
    return false;
  }

  for (let i = 0; i < labels.length; i++) {
    const label = labels[i];

    if (!validLabel(label)) {
      return false;
    }
  }

  return true;
}


/**
 * Validates that the given domain amount of labels is 2
 * 
 * @param domain - domain to validate
 * 
 * @returns
 * true if valid, false if not
 */
export const validSimpleDomain = (domain:string) => {
  const labels = domain.split('.');

  return labels.length == 2;
}

/**
 * Validates the given domain TLD
 * 
 * @param domain - domain to validate
 * 
 * @returns
 * true if valid, false if not
 */
export const validTld = (domain:string) => {
  const labels = domain.split('.');

  const tld = labels[labels.length - 1];

  return AVAILABLE_TLDS.includes(tld);
}