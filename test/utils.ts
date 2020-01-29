export const asyncExpectThrowError = async (prom: any, expectedError?: string) => {
  let error;
  try {
    await prom();
  } catch (_error) {
    error = _error;
  } finally {
    expect(error).toBeTruthy();
    if (expectedError) {
      expect(error).toBe(expectedError);
    }
  };
}