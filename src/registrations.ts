import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';
import Composer from './composer';
import { Registrations, Options } from './types';
import {
  isValidDomain, isValidTld, isValidLabel, labelhash, namehash, hasMethod,
} from './utils';
import RNSError, {
  INVALID_DOMAIN, SEARCH_DOMAINS_UNDER_AVAILABLE_TLDS, INVALID_LABEL,
  NO_TLD_OWNER, NO_AVAILABLE_METHOD,
} from './errors';
import { ZERO_ADDRESS, AVAILABLE_INTERFACE, AVAILABLE_TLDS } from './constants';
import { createRskOwner } from './factories';

export default class extends Composer implements Registrations {
  /**
   *
   * @param blockchainApi - current Web3 or Rsk3 instance
   * @param registry - RNS Registry Web3 Contract instance
   */
  constructor(public blockchainApi: Web3 | any, options?: Options) {
    super(blockchainApi, options);
  }

  private async _createTldOwner(
    tld: string,
    errorMessage: string,
    contractFactory: (blockchainApi: Web3 | any, address: string) => Contract,
  ): Promise<Contract> {
    const nodeOwnerAddress: string = await this._contracts.registry.methods.owner(
      namehash(tld),
    ).call();

    if (nodeOwnerAddress === ZERO_ADDRESS) {
      throw new RNSError(NO_TLD_OWNER);
    }

    const hasAvailableMethod = await hasMethod(
      this.blockchainApi,
      nodeOwnerAddress,
      AVAILABLE_INTERFACE,
    );
    if (!hasAvailableMethod) {
      throw new RNSError(errorMessage);
    }

    const nodeOwner: Contract = contractFactory(this.blockchainApi, nodeOwnerAddress);

    return nodeOwner;
  }

  private async _searchAvailabilityByLabel(label: string): Promise<string[]> {
    if (!isValidLabel(label)) {
      throw new RNSError(INVALID_LABEL);
    }

    let availables = [];

    const promises = AVAILABLE_TLDS.map(async (tld) => {
      const domain = `${label}.${tld}`;
      if (await this._searchAvailabilityByDomain(domain)) {
        return domain;
      }
      return '';
    });

    availables = await Promise.all(promises);

    return availables.filter((domain) => domain !== '');
  }


  private async _searchAvailabilityByDomain(domain: string): Promise<boolean> {
    if (!isValidDomain(domain)) {
      throw new RNSError(INVALID_DOMAIN);
    }
    if (!isValidTld(domain)) {
      throw new RNSError(SEARCH_DOMAINS_UNDER_AVAILABLE_TLDS);
    }

    const [label, tld] = domain.split('.');

    const nodeOwner = await this._createTldOwner(tld, NO_AVAILABLE_METHOD, createRskOwner);

    const hash = labelhash(label);

    const available = await nodeOwner.methods.available(hash).call();

    if (available && label.length < 5) {
      return false;
    }

    return available;
  }

  async available(domain: string): Promise<boolean | string[]> {
    await this.compose();

    const { length } = domain.split('.');
    if (length === 1) {
      return this._searchAvailabilityByLabel(domain);
    }

    if (length === 2) {
      return this._searchAvailabilityByDomain(domain);
    }

    return false;
  }
}
