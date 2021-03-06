import Web3 from 'web3';
import {
  Composable, Options, ContractAddresses, Contracts,
} from './types';
import { createRegistry, createContractAddresses } from './factories';
import RNSError, { LIBRARY_NOT_COMPOSED, NO_ACCOUNTS_TO_SIGN } from './errors';
import { getCurrentAddress } from './utils';
import { TransactionOptions } from './types/options';
import ErrorWrapper from './errors/ErrorWrapper';

export default abstract class extends ErrorWrapper implements Composable {
  private _contractAddresses!: ContractAddresses;

  private _composed!: boolean;

  private _currentNetworkId!: number;

  protected _contracts!: Contracts;

  public blockchainApi: Web3;

  constructor(blockchainApi: Web3 | any, options?: Options) {
    super(options && options.lang);

    this.blockchainApi = blockchainApi as Web3;

    // rsk3 eth namespace are exposed in the top level namespace
    this.blockchainApi.eth = blockchainApi.eth || blockchainApi;

    if (options && options.contractAddresses) {
      this._contractAddresses = options.contractAddresses;
    }

    if (options && options.networkId) {
      this._currentNetworkId = options.networkId;
    }
  }

  /**
   * Detects current network and intantiates the contracts based on that network or in the addresses provided in the constructor.
   *
   * @throws NO_ADDRESSES_PROVIDED if the network is not RSK Mainnet or RSK Testnet and the options parameter was not provided in the constructor - KB005.
   */
  private async _detectNetwork() {
    const networkId = await this.blockchainApi.eth.net.getId();

    if (!this._contractAddresses) {
      this._contractAddresses = createContractAddresses(networkId);
    }

    if (!this._contracts) {
      this._contracts = {
        registry: createRegistry(this.blockchainApi, this._contractAddresses.registry),
      };
    }

    if (!this._currentNetworkId) {
      this._currentNetworkId = networkId;
    }
  }

  protected async getTxGas(contractMethod: any, sender?: string): Promise<number> {
    const from = sender || await getCurrentAddress(this.blockchainApi);

    const estimated = await contractMethod.estimateGas({ from });

    return Math.floor(estimated * 1.1);
  }

  protected async getTxOptions(
    contractMethod: any,
    customOptions?: TransactionOptions,
  ): Promise<TransactionOptions> {
    let options: TransactionOptions;

    if (customOptions && customOptions.from) {
      options = {
        from: customOptions.from,
      };
    } else {
      let sender;

      try {
        sender = await getCurrentAddress(this.blockchainApi);
      } catch {
        this._throw(NO_ACCOUNTS_TO_SIGN);
      }

      options = {
        from: sender,
      };
    }

    if (customOptions && customOptions.gas) {
      options = {
        ...options,
        gas: customOptions.gas,
      };
    } else {
      const gas = await this.getTxGas(contractMethod, options.from!);

      options = {
        ...options,
        gas,
      };
    }

    if (customOptions && customOptions.gasPrice) {
      options = {
        ...options,
        gasPrice: customOptions.gasPrice,
      };
    }

    return options;
  }

  protected async estimateGasAndSendTransaction(
    contractMethod: any,
    customOptions?: TransactionOptions,
  ): Promise<string> {
    const options = await this.getTxOptions(contractMethod, customOptions);

    return new Promise((resolve, reject) => contractMethod.send(options)
      .on('transactionHash', (hash: string) => resolve(hash))
      .on('error', reject));
  }

  /**
   * Detects the current network and instances the contracts.
   *
   * @throws NO_ADDRESSES_PROVIDED if the network is not RSK Mainnet or RSK Testnet and the options parameter was not provided in the constructor - KB005.
   */
  public async compose(): Promise<void> {
    if (!this._composed) {
      await this._detectNetwork();
      this._composed = true;
    }
  }

  /**
   * Returns the current networkId
   *
   * @throws LIBRARY_NOT_COMPOSED if the library was not previously composed with compose method - KB004.
   */
  get currentNetworkId(): number {
    if (!this._composed) {
      throw new RNSError(LIBRARY_NOT_COMPOSED);
    }

    return this._currentNetworkId;
  }
}
