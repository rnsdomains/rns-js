import { Composable, Options, ContractAddresses, Contracts } from "./types";
import Web3 from "web3";
import { createRegistry, createContractAddresses } from './factories'; 


export abstract class Composer implements Composable {
  private _contractAddresses!: ContractAddresses;
  private _composed!: boolean;
  protected _contracts!: Contracts;

  /**
   * Create RNS library.
   *
   * @remarks
   * If web3 points to RSK Mainnet or RSK Testnet, no options are required. Contract addresses are detected automatically.
   * 
   * @param web3 - Web3 instance 
   * @param options - Overrides network defaults. Optional on RSK Mainnet and RSK Testnet, required for other networks.
   */
  constructor (public web3: Web3, options?: Options) {
    if(options && options.contractAddresses) {
      this._contractAddresses = options.contractAddresses
    }
  }

  /**
   * Detects current network and intantiates the contracts based on that network or in the addresses provided in the constructor.
   *
   * @throws NO_ADDRESSES_PROVIDED if the network is not RSK Mainnet or RSK Testnet and the options parameter was not provided in the constructor - KB005.
   */
  private async _detectNetwork() {
    if (!this._contractAddresses) {
      const networkId = await this.web3.eth.net.getId();
      this._contractAddresses = createContractAddresses(networkId)
    }

    if(!this._contracts) {
      this._contracts = {
        registry: createRegistry(this.web3, this._contractAddresses.registry)
      }
    }
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
}