import RNSError from '../src/errors';

export const PUBLIC_NODE_MAINNET = 'https://public-node.rsk.co';
export const PUBLIC_NODE_TESTNET = 'https://public-node.testnet.rsk.co';

const asyncTryCatchAssert = async (prom: any, assertion: (error: any) => void) => {
  let error;
  try {
    await prom();
  } catch (_error) {
    error = _error;
  } finally {
    assertion(error);
  }
};

export const asyncExpectThrowRNSError = async (prom: any, expectedError: string) => {
  await asyncTryCatchAssert(
    prom,
    (error) => expect(error).toEqual(new RNSError(expectedError)),
  );
};

export const asyncExpectThrowVMRevert = async (prom: any) => {
  await asyncTryCatchAssert(
    prom,
    (error) => expect(error.message).toContain('VM Exception while processing transaction: revert'),
  );
};

export const asyncExpectThrowError = async (prom: any) => {
  await asyncTryCatchAssert(
    prom,
    (error) => expect(error).toBeInstanceOf(Error),
  );
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
