import { DEVPORTAL_ERRORS_URL } from './constants';
import { errorMessages, UNKNOWN } from './errors';

export default class RNSError extends Error {
  ref: string;

  id: string;

  constructor(errorId: string) {
    let error = errorMessages.find((e) => e.id === errorId);
    if (!error) {
      error = {
        id: UNKNOWN,
        message: 'Unknown error',
      };
    }

    super(error.message);
    this.id = error.id;
    this.ref = `${DEVPORTAL_ERRORS_URL}#${error.id.toLowerCase()}`;
  }
}
