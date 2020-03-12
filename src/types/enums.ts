/**
 * RSK Mainnet and Testnet network ids. Used to identify the current network.
 */
export enum NetworkId {
  RSK_MAINNET = 30,
  RSK_TESTNET = 31
}

/**
 * Represents some of the chain ids listed in SLIP44 (https://github.com/satoshilabs/slips/blob/master/slip-0044.md)
 */
export enum ChainId {
  RSK = '0x80000089',
  BITCOIN = '0x80000000',
  ETHEREUM = '0x8000003c',
  LITECOIN = '0x80000002'
}
