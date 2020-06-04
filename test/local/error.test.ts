import RNSError from '../../src/errors';

describe('RNSError', () => {
  it('should be an instance of Error', () => {
    try {
      throw new RNSError('testing');
    } catch (err) {
      expect(err).toBeInstanceOf(Error);
    }
  });

  it('should contain an id', () => {
    try {
      throw new RNSError('testing');
    } catch (err) {
      expect(err.id).toBeTruthy();
    }
  });

  it('should contain a message', () => {
    try {
      throw new RNSError('testing');
    } catch (err) {
      expect(err.message).toBeTruthy();
    }
  });

  it('should contain a reference to dev portal url with error id', () => {
    try {
      throw new RNSError('testing');
    } catch (err) {
      const stringId = err.id.toString().toLowerCase();
      expect(err.ref).toBeTruthy();
      expect(err.ref.indexOf(stringId)).toBeTruthy();
    }
  });
});
