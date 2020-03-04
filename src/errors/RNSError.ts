import { DEVPORTAL_ERRORS_URL } from '../constants';
import * as errors from './errors.json';
import { ErrorDictionary } from '../types';

export default class extends Error {
  ref: string;

  id: string;

  constructor(errorId: string) {
    let error = (errors as ErrorDictionary)[errorId];
    if (!error) {
      error = {
        id: 'KB000', message: 'Unknown error',
      };
    }

    super(error.message);
    this.id = error.id;
    this.ref = `${DEVPORTAL_ERRORS_URL}#${error.id.toLowerCase()}`;
  }
}
