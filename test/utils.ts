import RNSError from '../src/errors';

export const asyncExpectThrowRNSError = async (prom: any, expectedError: string) => {
  let error;
  try {
    await prom();
  } catch (_error) {
    error = _error;
  } finally {
    expect(error).toEqual(new RNSError(expectedError));
  }
};

export const asyncExpectThrowError = async (prom: any) => {
  let error;
  try {
    await prom();
  } catch (_error) {
    error = _error;
  } finally {
    expect(error).toBeInstanceOf(Error);
  }
};

export const expectThrowRNSError = (fn: any, expectedError: string) => {
  let error;
  try {
    fn();
  } catch (_error) {
    error = _error;
  } finally {
    expect(error).toEqual(new RNSError(expectedError));
  }
};
