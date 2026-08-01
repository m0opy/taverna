import {useAuthForm} from '../../model/use-auth-form';

export function useRegister(next: string) {
  return useAuthForm('register', next);
}
