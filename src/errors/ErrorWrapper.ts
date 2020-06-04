import RNSError from './RNSError';
import { Lang } from '../types/enums';

export default class {
  private lang: Lang;

  constructor(lang = Lang.en) {
    this.lang = lang;
  }

  protected _throw(errorId: string): Error {
    throw new RNSError(errorId, this.lang);
  }
}
