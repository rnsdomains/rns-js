import RNSError from './RNSError';
import { Lang } from '../types/enums';

interface IErrorWrapper {
  _throw(errorId: string): void;
}

export default class implements IErrorWrapper {
  private lang: Lang;

  constructor(lang: Lang) {
    this.lang = lang;
  }

  _throw(errorId: string) {
    throw new RNSError(errorId, this.lang);
  }
}
