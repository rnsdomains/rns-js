import { ErrorDictionary } from '../src/types';
import * as errors from '../src/errors/errors.json';

export const asyncExpectThrowRNSError = async (prom: any, expectedError: string) => {
  let error;
  try {
    await prom();
  } catch (_error) {
    error = _error;
  } finally {
    const expectedErrorId = (errors as ErrorDictionary)[expectedError].id;
    expect(error.id).toBe(expectedErrorId);
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
    const expectedErrorId = (errors as ErrorDictionary)[expectedError].id;
    expect(error.id).toBe(expectedErrorId);
  }
};
