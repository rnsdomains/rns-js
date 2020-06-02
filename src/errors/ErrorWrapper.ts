import RNSError from './RNSError';
import { Lang } from '../types/enums';

export default class {
  private lang: Lang;

  constructor(lang = Lang.en) {
    this.lang = lang;
  }

  protected _throw(errorId: string) {
    throw new RNSError(errorId, this.lang);
  }
}
