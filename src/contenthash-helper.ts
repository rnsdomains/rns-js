import contentHash from 'content-hash';
import ErrorWrapper from './errors/ErrorWrapper';
import { Options } from './types';
import { UNSUPPORTED_CONTENTHASH_PROTOCOL } from './errors';

export default class extends ErrorWrapper {
  constructor(options?: Options) {
    super(options && options.lang);
  }

  decodeContenthash(encoded: string): string {
    let decoded;

    try {
      decoded = contentHash.decode(encoded);
      const codec = contentHash.getCodec(encoded);
      if (codec === 'ipfs-ns') {
        return `ipfs://${decoded}`;
      }

      if (codec === 'swarm-ns') {
        return `bzz://${decoded}`;
      }

      if (codec === 'onion') {
        return `onion://${decoded}`;
      }

      if (codec === 'onion3') {
        return `onion3://${decoded}`;
      }

      this._throw(UNSUPPORTED_CONTENTHASH_PROTOCOL);
    } catch (e) {
      this._throw(UNSUPPORTED_CONTENTHASH_PROTOCOL);
    }

    return ''; // TODO
  }

  encodeContenthash(text: string): string {
    let content = '';
    let contentType = '';
    if (text) {
      const matched = 
        text.match(/^(ipfs|bzz|onion|onion3):\/\/(.*)/) || 
        text.match(/\/(ipfs)\/(.*)/);
      if (matched) {
        contentType = matched[1];
        content = matched[2];
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

    return ''; // TODO
  }
}
