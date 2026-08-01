import {Button} from '@gravity-ui/uikit';
import type {ChangeEvent, FormEvent} from 'react';

import {TextAreaField, TextField} from '../../../../shared/ui/form-fields';
import './join-campaign-form.css';

interface JoinCampaignFormProps {
  characterClass: string;
  characterInfo: string;
  characterName: string;
  errorMessage?: string;
  isPending: boolean;
  onCharacterClassUpdate: (value: string) => void;
  onCharacterInfoChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  onCharacterNameUpdate: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
}

export function JoinCampaignForm(props: JoinCampaignFormProps) {
  return (
    <form className="form-stack join-form" onSubmit={props.onSubmit}>
      <h2>Представьте персонажа</h2>
      <TextField label="Имя персонажа" onUpdate={props.onCharacterNameUpdate} placeholder="Например, Лорас" tone="dark" value={props.characterName} />
      <TextField label="Класс (необязательно)" onUpdate={props.onCharacterClassUpdate} placeholder="Например, бард" tone="dark" value={props.characterClass} />
      <TextAreaField label="О персонаже (необязательно)" maxLength={300} onChange={props.onCharacterInfoChange} placeholder="Коротко опишите героя" rows={4} tone="dark" value={props.characterInfo} />
      {props.errorMessage && <p className="form-error" role="alert">{props.errorMessage}</p>}
      <Button view="action" size="xl" type="submit" loading={props.isPending} disabled={props.isPending}>Вступить в кампанию</Button>
    </form>
  );
}
