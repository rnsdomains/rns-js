export const asyncExpectThrowRNSError = async (prom: any, expectedError?: string) => {
  let error;
  try {
    await prom();
  } catch (_error) {
    error = _error;
  } finally {
    expect(error.id).toBe(expectedError);
  }
};

export const expectThrowRNSError = (fn: any, expectedError?: string) => {
  let error;
  try {
    fn();
  } catch (_error) {
    error = _error;
  } finally {
    expect(error.id).toBe(expectedError);
  }
};
