import Web3 from 'web3';
import { TransactionReceipt } from 'web3-eth';
import {
  Composable, Options, ContractAddresses, Contracts,
} from './types';
import { createRegistry, createContractAddresses } from './factories';
import RNSError, { LIBRARY_NOT_COMPOSED } from './errors';
import { getCurrentAddress } from './utils';

export default abstract class implements Composable {
  private _contractAddresses!: ContractAddresses;

  private _composed!: boolean;

  private _currentNetworkId!: number;

  protected _contracts!: Contracts;

  public blockchainApi: Web3;

  /**
   * Create RNS library.
   *
   * @remarks
   * If the blockchain api points to RSK Mainnet or RSK Testnet, no options are required. Contract addresses are detected automatically.
   *
   * @param blockchainApi - Web3 or Rsk3 instance
   * @param options - Overrides network defaults. Optional on RSK Mainnet and RSK Testnet, required for other networks.
   */
  constructor(blockchainApi: Web3 | any, options?: Options) {
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

  protected async estimateGasAndSendTransaction(
    contractMethod: () => any,
  ): Promise<TransactionReceipt> {
    const sender = await getCurrentAddress(this.blockchainApi);

    const estimated = await contractMethod().estimateGas({ from: sender });

    const gas = Math.floor(estimated * 1.1);

    return new Promise((resolve, reject) => contractMethod()
      .send({ from: sender, gas })
      .on('confirmation', (confirmations: Number, receipt: TransactionReceipt) => resolve(receipt))
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
