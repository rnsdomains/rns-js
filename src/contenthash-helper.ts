// most of te code has been copied from https://github.com/ensdomains/ui/blob/b7d36a2a96f6c991a8e109f91f9bd6fb6b1f4589/src/utils/contents.js
import contentHash from 'content-hash';
import ErrorWrapper from './errors/ErrorWrapper';
import { Options } from './types';
import { UNSUPPORTED_CONTENTHASH_PROTOCOL } from './errors';

export default class extends ErrorWrapper {
  constructor(options?: Options) {
    super(options && options.lang);
  }

  decodeContenthash(encoded: string) {
    let decoded = '';
    let protocolType = '';

    try {
      decoded = contentHash.decode(encoded);
      const codec = contentHash.getCodec(encoded);
      if (codec === 'ipfs-ns') {
        protocolType = 'ipfs';
      } else if (codec === 'swarm-ns') {
        protocolType = 'bzz';
      } else if (codec === 'onion') {
        protocolType = 'onion';
      } else if (codec === 'onion3') {
        protocolType = 'onion3';
      } else {
        this._throw(UNSUPPORTED_CONTENTHASH_PROTOCOL);
      }
    } catch (e) {
      this._throw(UNSUPPORTED_CONTENTHASH_PROTOCOL);
    }

    return { decoded, protocolType };
  }

  encodeContenthash(text: string): string {
    let content = '';
    let contentType = '';
    if (text) {
      const matched = text.match(/^(ipfs|bzz|onion|onion3):\/\/(.*)/)
        || text.match(/\/(ipfs)\/(.*)/);
      if (matched) {
        ([, contentType, content] = matched);
      }

      try {
        if (contentType === 'ipfs') {
          if (content.length >= 4) {
            return `0x${contentHash.fromIpfs(content)}`;
          }
        } else if (contentType === 'bzz') {
          if (content.length >= 4) {
            return `0x${contentHash.fromSwarm(content)}`;
          }
        } else if (contentType === 'onion') {
          if (content.length === 16) {
            return `0x${contentHash.encode('onion', content)}`;
          }
        } else if (contentType === 'onion3') {
          if (content.length === 56) {
            return `0x${contentHash.encode('onion3', content)}`;
          }
        } else {
          this._throw(UNSUPPORTED_CONTENTHASH_PROTOCOL);
        }
      } catch (err) {
        this._throw(UNSUPPORTED_CONTENTHASH_PROTOCOL);
      }
    }

    return '';
  }
}
