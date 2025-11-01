import React, { useCallback } from 'react';
import {
  FormFieldContainer,
  InlineInfoLink,
  Label,
  RadioBox,
  RadioBoxGroup,
  TextInput,
  Description,
  css,
  spacing,
} from '@mongodb-js/compass-components';
import type ConnectionStringUrl from 'mongodb-connection-string-url';
import type { AuthMechanism } from 'mongodb';
import type { ConnectionOptions } from 'mongodb-data-service';

import type { UpdateConnectionFormField } from '../../../hooks/use-connect-form';
import type { ConnectionFormError } from '../../../utils/validation';
import { errorMessageByFieldName } from '../../../utils/validation';
import {
  getConnectionStringPassword,
  getConnectionStringUsername,
} from '../../../utils/connection-string-helpers';

const textInputWithLabelStyles = css({
  marginTop: spacing[100],
});

const defaultAuthMechanismOptions: {
  title: string;
  value: AuthMechanism;
}[] = [
  {
    title: 'Default',
    value: 'DEFAULT',
  },
  {
    title: 'SCRAM-SHA-1',
    value: 'SCRAM-SHA-1',
  },
  {
    title: 'SCRAM-SHA-256',
    value: 'SCRAM-SHA-256',
  },
];

function AuthenticationDefault({
  errors,
  connectionStringUrl,
  updateConnectionFormField,
  connectionOptions,
}: {
  connectionStringUrl: ConnectionStringUrl;
  errors: ConnectionFormError[];
  updateConnectionFormField: UpdateConnectionFormField;
  connectionOptions: ConnectionOptions;
}): React.ReactElement {
  const password = getConnectionStringPassword(connectionStringUrl);
  const username = getConnectionStringUsername(connectionStringUrl);

  const credentialGenerationCommand =
    connectionOptions.credentialGeneration?.command || '';
  const credentialGenerationTTL =
    connectionOptions.credentialGeneration?.ttl || 3600;

  const selectedAuthMechanism = (
    connectionStringUrl.searchParams.get('authMechanism') ?? ''
  ).toUpperCase();
  const selectedAuthTab =
    defaultAuthMechanismOptions.find(
      ({ value }) => value === selectedAuthMechanism
    ) ?? defaultAuthMechanismOptions[0];

  const onAuthMechanismSelected = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      event.preventDefault();
      updateConnectionFormField({
        type: 'update-search-param',
        currentKey: 'authMechanism',
        value: event.target.value,
      });
    },
    [updateConnectionFormField]
  );

  const usernameError = errorMessageByFieldName(errors, 'username');
  const passwordError = errorMessageByFieldName(errors, 'password');

  const hasCredentialGeneration = !!credentialGenerationCommand;

  return (
    <>
      <FormFieldContainer>
        <TextInput
          onChange={({
            target: { value },
          }: React.ChangeEvent<HTMLInputElement>) => {
            updateConnectionFormField({
              type: 'update-username',
              username: value,
            });
          }}
          label="Username"
          data-testid="connection-username-input"
          errorMessage={usernameError}
          state={usernameError ? 'error' : undefined}
          value={username || ''}
          optional
          disabled={hasCredentialGeneration}
        />
      </FormFieldContainer>
      <FormFieldContainer>
        <TextInput
          onChange={({
            target: { value },
          }: React.ChangeEvent<HTMLInputElement>) => {
            updateConnectionFormField({
              type: 'update-password',
              password: value,
            });
          }}
          label="Password"
          type="password"
          data-testid="connection-password-input"
          value={password || ''}
          errorMessage={passwordError}
          state={passwordError ? 'error' : undefined}
          optional
          disabled={hasCredentialGeneration}
        />
      </FormFieldContainer>
      <FormFieldContainer>
        <Label
          htmlFor="credential-generation-command-input"
          id="credentialGenerationCommandLabel"
        >
          Dynamic Credential Generation Command
        </Label>
        <InlineInfoLink
          aria-label="Credential Generation Documentation"
          href="https://docs.mongodb.com/compass/current/"
        />
        <Description className={textInputWithLabelStyles}>
          Shell command to generate credentials dynamically. Must output JSON
          with &quot;username&quot; and &quot;password&quot; fields.
        </Description>
        <TextInput
          className={textInputWithLabelStyles}
          onChange={({
            target: { value },
          }: React.ChangeEvent<HTMLInputElement>) => {
            updateConnectionFormField({
              type: 'update-credential-generation-command',
              command: value,
            });
          }}
          id="credential-generation-command-input"
          aria-labelledby="credentialGenerationCommandLabel"
          data-testid="connection-credential-generation-command-input"
          value={credentialGenerationCommand}
          optional
          placeholder="e.g., ./get-mongo-credentials.sh"
        />
      </FormFieldContainer>
      {hasCredentialGeneration && (
        <FormFieldContainer>
          <Label
            htmlFor="credential-generation-ttl-input"
            id="credentialGenerationTtlLabel"
          >
            Credential Cache TTL (seconds)
          </Label>
          <Description className={textInputWithLabelStyles}>
            Time in seconds to cache generated credentials before regenerating.
          </Description>
          <TextInput
            className={textInputWithLabelStyles}
            onChange={({
              target: { value },
            }: React.ChangeEvent<HTMLInputElement>) => {
              const ttl = parseInt(value, 10);
              if (!isNaN(ttl) && ttl > 0) {
                updateConnectionFormField({
                  type: 'update-credential-generation-ttl',
                  ttl,
                });
              }
            }}
            id="credential-generation-ttl-input"
            aria-labelledby="credentialGenerationTtlLabel"
            data-testid="connection-credential-generation-ttl-input"
            value={credentialGenerationTTL.toString()}
            type="number"
            optional
          />
        </FormFieldContainer>
      )}
      <FormFieldContainer>
        <Label htmlFor="authSourceInput" id="authSourceLabel">
          Authentication Database
        </Label>
        <InlineInfoLink
          aria-label="Authentication Database Documentation"
          href="https://docs.mongodb.com/manual/reference/connection-string/#mongodb-urioption-urioption.authSource"
        />
        <TextInput
          className={textInputWithLabelStyles}
          onChange={({
            target: { value },
          }: React.ChangeEvent<HTMLInputElement>) => {
            if (value === '') {
              updateConnectionFormField({
                type: 'delete-search-param',
                key: 'authSource',
              });
              return;
            }
            updateConnectionFormField({
              type: 'update-search-param',
              currentKey: 'authSource',
              value,
            });
          }}
          id="authSourceInput"
          aria-labelledby="authSourceLabel"
          value={connectionStringUrl.searchParams.get('authSource') ?? ''}
          optional
        />
      </FormFieldContainer>
      <FormFieldContainer>
        <Label htmlFor="authentication-mechanism-radio-box-group">
          Authentication Mechanism
        </Label>
        <RadioBoxGroup
          onChange={onAuthMechanismSelected}
          id="authentication-mechanism-radio-box-group"
          value={selectedAuthTab.value}
        >
          {defaultAuthMechanismOptions.map(({ title, value }) => {
            return (
              <RadioBox
                id={`${value}-tab-button`}
                data-testid={`${value}-tab-button`}
                checked={selectedAuthTab.value === value}
                value={value}
                key={value}
              >
                {title}
              </RadioBox>
            );
          })}
        </RadioBoxGroup>
      </FormFieldContainer>
    </>
  );
}

export default AuthenticationDefault;
