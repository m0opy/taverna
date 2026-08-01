import type {NpcDto} from '@taverna/contracts';
import {Button} from '@gravity-ui/uikit';
import {useEffect, useState} from 'react';
import {useParams} from 'react-router-dom';

import {useCampaign} from '../../../entities/campaign/api/use-campaigns';
import {useNpcs} from '../../../entities/npc/api/use-npcs';
import {useNpcFilter} from '../../../features/npc/filter/model/use-npc-filter';
import {useDeleteNpc} from '../../../features/npc/delete/model/use-delete-npc';
import {CampaignDetailErrorState} from '../../../widgets/campaign-detail/ui/CampaignDetail';
import {CampaignTabs} from '../../../widgets/campaign-detail/ui/CampaignTabs';
import {NpcEditor} from '../../../widgets/npc-editor/ui/NpcEditor';
import {NpcList} from '../../../widgets/npc-list/ui/NpcList';
import {ApiError} from '../../../shared/api/client';
import {ConfirmDialog} from '../../../shared/ui/ConfirmDialog';
import styles from './CampaignNpcsPage.module.css';

export function CampaignNpcsPage() {
  const {id = ''} = useParams<{id: string}>();
  const campaign = useCampaign(id);
  const filter = useNpcFilter();
  const npcs = useNpcs(id, filter.tag);
  const deleteNpc = useDeleteNpc(id);
  const [editor, setEditor] = useState<'create' | NpcDto | null>(null);
  const [npcToDelete, setNpcToDelete] = useState<NpcDto | null>(null);

  useEffect(() => {
    if (filter.tag && npcs.data && !npcs.data.availableTags.some((tag) => tag.toLocaleLowerCase() === filter.tag?.toLocaleLowerCase())) {
      filter.setTag();
    }
  }, [filter, npcs.data]);

  if (campaign.isPending) {
    return <main className={styles.page}><p className={styles.statusMessage}>Открываем бестиарий…</p></main>;
  }
  if (campaign.isError || !campaign.data) {
    const status = campaign.error instanceof ApiError ? campaign.error.status : null;
    return <CampaignDetailErrorState status={status} onRetry={() => void campaign.refetch()} />;
  }

  return (
    <main className={styles.page}>
      <header className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>Кампания · {campaign.data.title}</p>
          <h1>NPC <span>· {npcs.data?.items.length ?? '…'}</span></h1>
          <p className={styles.intro}>Лица, слухи и связи, которые помогают не потерять нить приключения.</p>
        </div>
        <Button view="action" size="l" onClick={() => setEditor('create')}>Добавить NPC</Button>
      </header>

      <CampaignTabs campaignId={id} isOwner={campaign.data.myRole === 'master'} section="npc" />

      {deleteNpc.error && (
        <p className={styles.actionError} role="alert">
          {deleteNpc.error instanceof ApiError && deleteNpc.error.status === 403 ? 'У вас нет доступа к этой карточке.' : 'Не удалось удалить NPC. Попробуйте ещё раз.'}
        </p>
      )}

      {npcs.isPending ? (
        <section className={styles.loadingState} aria-label="Загрузка NPC"><span /><span /><span /></section>
      ) : npcs.isError || !npcs.data ? (
        <section className={styles.errorState} role="alert">
          <p className={styles.eyebrow}>{npcs.error instanceof ApiError ? npcs.error.status : 'Ошибка'}</p>
          <h2>{npcs.error instanceof ApiError && npcs.error.status === 403 ? 'Нет доступа к NPC' : 'NPC недоступны'}</h2>
          <p>{npcs.error instanceof ApiError && npcs.error.status === 403 ? 'Только активные участники могут читать карточки.' : 'Проверьте соединение и попробуйте ещё раз.'}</p>
          <button className={styles.retryButton} type="button" onClick={() => void npcs.refetch()}>Повторить</button>
        </section>
      ) : (
        <NpcList
          availableTags={npcs.data.availableTags}
          items={npcs.data.items}
          onCreate={() => setEditor('create')}
          onDelete={setNpcToDelete}
          onEdit={(npc) => setEditor(npc)}
          onTagChange={filter.setTag}
          {...(deleteNpc.isPending && deleteNpc.variables ? {deletingNpcId: deleteNpc.variables} : {})}
          {...(filter.tag ? {selectedTag: filter.tag} : {})}
        />
      )}

      {editor && (
        <NpcEditor
          campaignId={id}
          items={npcs.data?.items ?? []}
          key={editor === 'create' ? 'create' : editor.id}
          npc={editor === 'create' ? null : editor}
          onCancel={() => setEditor(null)}
          onSaved={() => setEditor(null)}
        />
      )}

      {npcToDelete && (
        <ConfirmDialog
          description="Связи с этим NPC тоже будут удалены. Вернуть карточку после удаления будет нельзя."
          isPending={deleteNpc.isPending}
          title={`Удалить NPC «${npcToDelete.name}»?`}
          onCancel={() => setNpcToDelete(null)}
          onConfirm={() => deleteNpc.mutate(npcToDelete.id, {onSuccess: () => setNpcToDelete(null)})}
        />
      )}
    </main>
  );
}

export default CampaignNpcsPage;
