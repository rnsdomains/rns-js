/**
 * RSK Mainnet and Testnet network ids. Used to identify the current network.
 */
export enum NetworkId {
  RSK_MAINNET = 30,
  RSK_TESTNET = 31
}

/**
 * Represents some of the chain hexas listed in SLIP44 (https://github.com/satoshilabs/slips/blob/master/slip-0044.md)
 */
export enum ChainId {
  RSK = '0x80000089',
  BTC = '0x80000000',
  ETH = '0x8000003c',
  LTC = '0x80000002',
  DOGE = '0x80000003',
  MONA = '0x80000016',
  DASH = '0x80000005',
  ETC = '0x8000003d',
  XDAI = '0x800002bc',
  XRP = '0x80000090',
  BCH = '0x80000091',
  BNB = '0x800002ca',
  XLM = '0x80000094',
  ATOM = '0x80000076',
  TRX = '0x800000c3',
  NEM = '0x8000002b',
  EOS = '0x800000c2',
  KSM = '0x800001b2'
}

/**
 * Supported feedback languages
 */
export enum Lang {
  en = 'en',
  es = 'es',
  ja = 'ja',
  ko = 'ko',
  pt = 'pt',
  ru = 'ru',
  zh = 'zh'
}
