import RNSRegistryData from '@rsksmart/rns-registry/RNSRegistryData.json';
import ResolverV1Data from '@rsksmart/rns-resolver/ResolverV1Data.json';
import ProxyAdminData from '@rsksmart/rns-resolver/ProxyAdminData.json';
import ProxyFactoryData from '@rsksmart/rns-resolver/ProxyFactoryData.json';
import {
  contract, defaultSender,
} from '@openzeppelin/test-environment';
import { encodeCall } from '@openzeppelin/upgrades';
import { labelhash } from '../../src/utils';

export const deployDefinitiveResolver = async (): Promise<{
  proxy: any, registry: any
}> => {
  const Registry = contract.fromABI(RNSRegistryData.abi, RNSRegistryData.bytecode);
  const ResolverV1 = contract.fromABI(ResolverV1Data.abi, ResolverV1Data.bytecode);
  const ProxyFactory = contract.fromABI(ProxyFactoryData.abi, ProxyFactoryData.bytecode);
  const ProxyAdmin = contract.fromABI(ProxyAdminData.abi, ProxyAdminData.bytecode);

  const registry = await Registry.new();
  const proxyFactory = await ProxyFactory.new();
  const proxyAdmin = await ProxyAdmin.new();
  const resolverV1 = await ResolverV1.new();

  const salt = '16';
  const data = encodeCall('initialize', ['address'], [registry.address]);
  await proxyFactory.deploy(salt, resolverV1.address, proxyAdmin.address, data);

  const resolverAddress = await proxyFactory.getDeploymentAddress(salt, defaultSender);

  const proxy = contract.fromABI(ResolverV1Data.abi, ResolverV1Data.bytecode, resolverAddress);

  await registry.setDefaultResolver(resolverAddress);

  await registry.setSubnodeOwner('0x00', labelhash('rsk'), defaultSender);

  return { registry, proxy };
};
