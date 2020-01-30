export const asyncExpectThrowError = async (prom: any, expectedError?: string) => {
  await expect(prom()).rejects.toThrow(expectedError);
}
