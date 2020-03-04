export const UNKNOWN = 'KB000';
export const NO_ADDR_RESOLUTION_SET = 'KB001';
export const NO_ADDR_RESOLUTION = 'KB002';
export const NO_RESOLVER = 'KB003';
export const LIBRARY_NOT_COMPOSED = 'KB004';
export const NO_ADDRESSES_PROVIDED = 'KB005';
export const NO_CHAIN_ADDR_RESOLUTION = 'KB006';
export const NO_CHAIN_ADDR_RESOLUTION_SET = 'KB007';
export const SEARCH_ONLY_SIMPLE_DOMAINS = 'KB008';
export const SEARCH_DOMAINS_UNDER_AVAILABLE_TLDS = 'KB009';
export const INVALID_DOMAIN = 'KB010';
export const INVALID_LABEL = 'KB011';
export const DOMAIN_NOT_EXISTS = 'KB012';
export const NO_NAME_RESOLUTION = 'KB013';
export const NO_REVERSE_RESOLUTION_SET = 'KB014';
export const NO_ACCOUNTS_TO_SIGN = 'KB015';
export const SUBDOMAIN_NOT_AVAILABLE = 'KB016';

export const errorMessages = [
  { id: NO_ADDR_RESOLUTION_SET, message: 'No addr resolution set' },
  { id: NO_ADDR_RESOLUTION, message: 'No addr resolution' },
  { id: NO_RESOLVER, message: 'No resolver' },
  { id: LIBRARY_NOT_COMPOSED, message: 'Library not composed' },
  { id: NO_ADDRESSES_PROVIDED, message: 'No contract addresses provided' },
  { id: NO_CHAIN_ADDR_RESOLUTION, message: 'No chain address resolution' },
  { id: NO_CHAIN_ADDR_RESOLUTION_SET, message: 'No chain address resolution set' },
  { id: SEARCH_ONLY_SIMPLE_DOMAINS, message: 'Search only domains' },
  { id: SEARCH_DOMAINS_UNDER_AVAILABLE_TLDS, message: 'Search only .rsk domains' },
  { id: INVALID_DOMAIN, message: 'Invalid domain, must be alphanumeric and lower case' },
  { id: INVALID_LABEL, message: 'Invalid label, must be alphanumeric and lower case' },
  { id: DOMAIN_NOT_EXISTS, message: 'The given domain does not exist' },
  { id: NO_NAME_RESOLUTION, message: 'No name resolution' },
  { id: NO_REVERSE_RESOLUTION_SET, message: 'No reverse resolution set' },
  { id: NO_ACCOUNTS_TO_SIGN, message: 'There are no accounts to sign the transaction' },
  { id: SUBDOMAIN_NOT_AVAILABLE, message: 'The subdomain is not available' },
];
