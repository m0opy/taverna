import {useAuthForm} from '../../model/use-auth-form';

export function useLogin(next: string) {
  return useAuthForm('login', next);
}
