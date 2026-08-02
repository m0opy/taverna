import {Button} from '@gravity-ui/uikit';
import type {ChangeEvent, FormEvent} from 'react';

import {TextAreaField, TextField} from '../../../../shared/ui/form-fields';
import styles from './JoinCampaignForm.module.css';

interface JoinCampaignFormProps {
  characterClass: string;
  characterInfo: string;
  characterName: string;
  errorMessage?: string;
  fieldErrors?: Record<string, string> | undefined;
  isPending: boolean;
  onCharacterClassUpdate: (value: string) => void;
  onCharacterInfoChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  onCharacterNameUpdate: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  openCampaignHref?: string | undefined;
}

export function JoinCampaignForm(props: JoinCampaignFormProps) {
  return (
    <form className={styles.form} onSubmit={props.onSubmit}>
      <h2>Представьте персонажа</h2>
      <TextField label="Имя персонажа" onUpdate={props.onCharacterNameUpdate} placeholder="Например, Лорас" tone="dark" value={props.characterName} {...(props.fieldErrors?.characterName ? {validationState: 'invalid' as const, errorMessage: props.fieldErrors.characterName} : {})} />
      <TextField controlProps={{maxLength: 60}} hint={`${props.characterClass.length}/60`} label="Класс персонажа (необязательно)" onUpdate={props.onCharacterClassUpdate} placeholder="Например, бард" tone="dark" value={props.characterClass} {...(props.fieldErrors?.characterClass ? {validationState: 'invalid' as const, errorMessage: props.fieldErrors.characterClass} : {})} />
      <TextAreaField hint={props.fieldErrors?.characterInfo ?? `${props.characterInfo.length}/300`} label="О персонаже (необязательно)" maxLength={300} onChange={props.onCharacterInfoChange} placeholder="Коротко опишите героя" rows={4} tone="dark" value={props.characterInfo} />
      {props.errorMessage && !props.fieldErrors && <p className={styles.error} role="alert">{props.errorMessage}</p>}
      {props.openCampaignHref && <a className={styles.link} href={props.openCampaignHref}>Открыть кампанию</a>}
      <Button view="action" size="xl" type="submit" loading={props.isPending} disabled={props.isPending}>Вступить в кампанию</Button>
    </form>
  );
}
