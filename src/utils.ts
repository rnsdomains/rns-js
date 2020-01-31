import Web3 from "web3";

export const hasMethod = async(web3: Web3, contractAddress: string, signatureHash: string) => {
  const code = await web3.eth.getCode(contractAddress);
  return code.indexOf(signatureHash.slice(2, signatureHash.length)) > 0;
}