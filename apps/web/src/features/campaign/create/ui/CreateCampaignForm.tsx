import {coverKeys} from '@taverna/contracts';
import {Button} from '@gravity-ui/uikit';
import {useNavigate} from 'react-router-dom';

import {coverLabels} from '../../../../entities/campaign/model/presentation';
import coverStyles from '../../../../entities/campaign/ui/CampaignCover.module.css';
import {TextAreaField, TextField} from '../../../../shared/ui/form-fields';
import {useCreateCampaign} from '../model/use-create-campaign';
import styles from './CreateCampaignForm.module.css';

export function CreateCampaignForm() {
  const navigate = useNavigate();
  const form = useCreateCampaign();

  return (
    <form className={styles.form} onSubmit={form.submit}>
      <TextField autoFocus label="Название" onUpdate={form.setTitle} placeholder="Например, Пепел Северной башни" value={form.title} {...(form.error?.fields?.title ? {validationState: 'invalid' as const, errorMessage: form.error.fields.title} : {})} />
      <TextAreaField hint={`${form.synopsis.length}/500`} label="Синопсис" maxLength={500} onChange={(event) => form.setSynopsis(event.target.value)} placeholder="Коротко опишите мир, завязку или цель приключения" rows={6} value={form.synopsis} />
      <fieldset className={styles.coverField}><legend>Обложка</legend><div aria-label="Выбор обложки" className={styles.coverGrid} role="radiogroup">{coverKeys.map((cover) => <button aria-checked={cover === form.coverKey} className={`${styles.coverOption} ${coverStyles[cover]} ${cover === form.coverKey ? styles.selected : ''}`} role="radio" type="button" key={cover} onClick={() => form.setCoverKey(cover)}><span>✦</span>{coverLabels[cover]}</button>)}</div></fieldset>
      {form.error && <p className={styles.formError} role="alert">{form.error.message}</p>}
      <div className={styles.actions}><Button type="submit" view="action" size="xl" loading={form.isPending} disabled={form.isPending}>Создать кампанию</Button><Button type="button" size="xl" view="outlined" onClick={() => navigate('/campaigns')}>Отмена</Button></div>
    </form>
  );
}
