import {coverKeys} from '@taverna/contracts';
import {Button} from '@gravity-ui/uikit';
import {useNavigate} from 'react-router-dom';

import {coverLabels} from '../../../../entities/campaign/model/presentation';
import {TextAreaField, TextField} from '../../../../shared/ui/form-fields';
import {useCreateCampaign} from '../model/use-create-campaign';
import './create-campaign-form.css';

export function CreateCampaignForm() {
  const navigate = useNavigate();
  const form = useCreateCampaign();

  return (
    <form className="editor-form" onSubmit={form.submit}>
      <TextField autoFocus label="Название" onUpdate={form.setTitle} placeholder="Например, Пепел Северной башни" value={form.title} {...(form.error?.fields?.title ? {validationState: 'invalid' as const, errorMessage: form.error.fields.title} : {})} />
      <TextAreaField hint={`${form.synopsis.length}/500`} label="Синопсис" maxLength={500} onChange={(event) => form.setSynopsis(event.target.value)} placeholder="Коротко опишите мир, завязку или цель приключения" rows={6} value={form.synopsis} />
      <fieldset className="cover-field"><legend>Обложка</legend><div className="cover-grid">{coverKeys.map((cover) => <button className={cover === form.coverKey ? `cover-option cover-option--${cover} is-selected` : `cover-option cover-option--${cover}`} type="button" key={cover} onClick={() => form.setCoverKey(cover)}><span>✦</span>{coverLabels[cover]}</button>)}</div></fieldset>
      {form.error && <p className="form-error" role="alert">{form.error.message}</p>}
      <div className="actions editor-actions"><Button type="submit" view="action" size="xl" loading={form.isPending} disabled={form.isPending}>Создать кампанию</Button><Button type="button" size="xl" view="outlined" onClick={() => navigate('/campaigns')}>Отмена</Button></div>
    </form>
  );
}
