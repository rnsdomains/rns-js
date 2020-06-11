import RNSRegistryData from '@rsksmart/rns-registry/RNSRegistryData.json';
import AddrResolverData from '@rsksmart/rns-resolver/AddrResolverData.json';
import NameResolverData from '@rsksmart/rns-reverse/NameResolverData.json';
import ReverseRegistrarData from '@rsksmart/rns-reverse/ReverseRegistrarData.json';
import ChainAddrResolverData from '@rsksmart/rns-resolver/ChainAddrResolverData.json';
import {
  contract, defaultSender,
} from '@openzeppelin/test-environment';
import { encodeCall } from '@openzeppelin/upgrades';
import ResolverV1Data from '../../src/resolvers/ResolverV1Data.json';
import ProxyAdminData from '../../src/resolvers/ProxyAdminData.json';
import ProxyFactoryData from '../../src/resolvers/ProxyFactoryData.json';
import { labelhash, namehash } from '../../src/utils';
import { asyncExpectThrowRNSError } from '../utils';
import { ZERO_ADDRESS } from '../../src/constants';
import { NO_RESOLVER } from '../../src/errors';
import RNS from '../../src/index';

export const deployRegistryAndCreateTldNode = async (): Promise<any> => {
  const Registry = contract.fromABI(RNSRegistryData.abi, RNSRegistryData.bytecode);

  const registry = await Registry.new();

  await registry.setSubnodeOwner('0x00', labelhash('rsk'), defaultSender);

  return registry;
};

export const deployPublicResolver = async (registry: any): Promise<any> => {
  const PublicResolver = contract.fromABI(AddrResolverData.abi, AddrResolverData.bytecode);
  return PublicResolver.new(registry.address);
};

export const deployNameResolver = async (registry: any): Promise<any> => {
  const NameResolver = contract.fromABI(NameResolverData.abi, NameResolverData.bytecode);
  return NameResolver.new(registry.address);
};

export const deployMultichainResolver = async (
  registry: any, publicResolver: any,
): Promise<any> => {
  const MultichainResolver = contract.fromABI(
    ChainAddrResolverData.abi, ChainAddrResolverData.bytecode,
  );

  return MultichainResolver.new(registry.address, publicResolver.address);
};

export const deployReverseRegistrar = (registry: any): Promise<any> => {
  const ReverseRegistrar = contract.fromABI(
    ReverseRegistrarData.abi,
    ReverseRegistrarData.bytecode,
  );

  return ReverseRegistrar.new(registry.address);
};
export const deployDefinitiveResolver = async (): Promise<{
  proxy: any, registry: any
}> => {
  const ResolverV1 = contract.fromABI(ResolverV1Data.abi, ResolverV1Data.bytecode);
  const ProxyFactory = contract.fromABI(ProxyFactoryData.abi, ProxyFactoryData.bytecode);
  const ProxyAdmin = contract.fromABI(ProxyAdminData.abi, ProxyAdminData.bytecode);

  const proxyFactory = await ProxyFactory.new();
  const proxyAdmin = await ProxyAdmin.new();
  const resolverV1 = await ResolverV1.new();

  const registry = await deployRegistryAndCreateTldNode();
  const salt = '16';
  const data = encodeCall('initialize', ['address'], [registry.address]);
  await proxyFactory.deploy(salt, resolverV1.address, proxyAdmin.address, data);

  const resolverAddress = await proxyFactory.getDeploymentAddress(salt, defaultSender);

  const proxy = contract.fromABI(ResolverV1Data.abi, ResolverV1Data.bytecode, resolverAddress);

  await registry.setResolver(namehash('rsk'), resolverAddress);

  return { registry, proxy };
};

export const expectNoResolverError = async (registry: any, fn: () => any) => {
  await registry.setSubnodeOwner(namehash('rsk'), labelhash('noresolver'), defaultSender);
  await registry.setResolver(namehash('noresolver.rsk'), ZERO_ADDRESS);

  await asyncExpectThrowRNSError(fn, NO_RESOLVER);
};

export const getRNSInstance = (blockchainApiInstance: any, registry: any) => {
  const options = {
    contractAddresses: {
      registry: registry.address,
    },
  };

  return new RNS(blockchainApiInstance, options);
};
