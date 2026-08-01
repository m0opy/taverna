import type {LoginRequest, RegisterRequest} from '@taverna/contracts';

export type AuthMode = 'login' | 'register';

export interface AuthFormValues {
  email: string;
  name: string;
  password: string;
}

export function authPath(mode: AuthMode): `/auth/${AuthMode}` {
  return `/auth/${mode}`;
}

export function authPayload(mode: AuthMode, values: AuthFormValues): LoginRequest | RegisterRequest {
  if (mode === 'login') {
    return {email: values.email, password: values.password};
  }

  return {name: values.name, email: values.email, password: values.password};
}
