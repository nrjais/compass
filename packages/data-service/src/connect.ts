import type { ConnectionOptions } from './connection-options';
import type { DataService } from './data-service';
import type { DataServiceImplLogger } from './logger';
import { DataServiceImpl } from './data-service';
import type { DevtoolsProxyOptions } from '@mongodb-js/devtools-proxy-support';
import { credentialCache } from './credential-cache';
import ConnectionStringUrl from 'mongodb-connection-string-url';

async function applyGeneratedCredentials(
  connectionOptions: ConnectionOptions
): Promise<ConnectionOptions> {
  if (!connectionOptions.credentialGeneration) {
    return connectionOptions;
  }

  const { credentialGeneration } = connectionOptions;

  const cacheKey = connectionOptions.connectionString;

  const { username, password } = await credentialCache.getCredentials(
    cacheKey,
    credentialGeneration
  );

  const uri = new ConnectionStringUrl(connectionOptions.connectionString);
  uri.username = username;
  uri.password = password;

  return {
    ...connectionOptions,
    connectionString: uri.toString(),
  };
}

export default async function connect({
  connectionOptions,
  proxyOptions,
  signal,
  logger,
  productName,
  productDocsLink,
}: {
  connectionOptions: ConnectionOptions;
  proxyOptions?: DevtoolsProxyOptions;
  signal?: AbortSignal;
  logger?: DataServiceImplLogger;
  productName?: string;
  productDocsLink?: string;
  connectionId?: string;
}): Promise<DataService> {
  const optionsWithCredentials = await applyGeneratedCredentials(
    connectionOptions
  );

  const dataService = new DataServiceImpl(
    optionsWithCredentials,
    logger,
    proxyOptions
  );
  await dataService.connect({
    signal,
    productName,
    productDocsLink,
  });
  return dataService;
}
