export const asyncExpectThrowError = async (prom: any, expectedError?: string) => {
  await expect(prom()).rejects.toThrow(expectedError);
};

export const expectThrowError = (fn: any, expectedError?: string) => {
  let error;
  try {
    fn();
  } catch (_error) {
    error = _error.message;
  } finally {
    expect(error).toBe(expectedError);
  }
};
