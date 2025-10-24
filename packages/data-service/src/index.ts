import connect from './connect';
import type {
  ConnectionOptions,
  ConnectionSshOptions,
  CredentialGenerationOptions,
} from './connection-options';
import type {
  DataService,
  UpdatePreview,
  UpdatePreviewChange,
} from './data-service';
import { configuredKMSProviders } from './instance-detail-helper';
import { createConnectionAttempt } from './connection-attempt';
import type { ConnectionAttempt } from './connection-attempt';
import { credentialCache } from './credential-cache';

export type {
  ConnectionAttempt,
  ConnectionOptions,
  ConnectionSshOptions,
  CredentialGenerationOptions,
  DataService,
  UpdatePreview,
  UpdatePreviewChange,
};
export {
  connect,
  configuredKMSProviders,
  createConnectionAttempt,
  credentialCache,
};

export type { ReauthenticationHandler } from './connect-mongo-client';
export type { ExplainExecuteOptions } from './data-service';
export type { IndexDefinition } from './index-detail-helper';
export type {
  SearchIndex,
  SearchIndexStatus,
} from './search-index-detail-helper';
export type { InstanceDetails } from './instance-detail-helper';
