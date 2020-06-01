import { DEVPORTAL_ERRORS_URL } from '../constants';
import errors from './errors.json';
import { ErrorDictionary } from '../types';

export default class extends Error {
  ref: string;

  id: string;

  constructor(errorId: string) {
    let error = (errors as ErrorDictionary)[errorId];
    if (!error) {
      error = {
        id: 'KB000',
        message: {
          en: 'Unknown error',
        },
      };
    }

    super(error.message.en);
    this.id = error.id;
    this.ref = `${DEVPORTAL_ERRORS_URL}#${error.id.toLowerCase()}`;
  }
}
