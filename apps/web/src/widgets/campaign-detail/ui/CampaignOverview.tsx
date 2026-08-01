import type {CoverKey} from '@taverna/contracts';
import {ChevronDown} from '@gravity-ui/icons';
import {useEffect, useRef, useState} from 'react';
import {flushSync} from 'react-dom';

import {formatCampaignDate, formatNextSessionMeta} from '../../../shared/lib/date';
import {NextSessionEditor} from '../../campaign-settings/ui/NextSessionEditor';
import coverStyles from '../../../entities/campaign/ui/CampaignCover.module.css';
import styles from './CampaignOverview.module.css';

interface CampaignOverviewProps {
  campaignId: string;
  coverKey: CoverKey;
  isOwner: boolean;
  nextSessionAt: string | null;
  synopsis: string;
}

const COLLAPSED_SYNOPSIS_HEIGHT = 176;

export function CampaignOverview({campaignId, coverKey, isOwner, nextSessionAt, synopsis}: CampaignOverviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCollapsible, setIsCollapsible] = useState(false);
  const [isDateEditorOpen, setIsDateEditorOpen] = useState(false);
  const [expandedSynopsisHeight, setExpandedSynopsisHeight] = useState(COLLAPSED_SYNOPSIS_HEIGHT);
  const synopsisWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = synopsisWrapRef.current;
    if (!element) return;

    const updateSynopsisSize = () => {
      const fullHeight = element.scrollHeight;
      setExpandedSynopsisHeight(fullHeight);
      setIsCollapsible(fullHeight > COLLAPSED_SYNOPSIS_HEIGHT + 1);
    };

    updateSynopsisSize();
    const resizeObserver = new ResizeObserver(updateSynopsisSize);
    resizeObserver.observe(element);

    return () => resizeObserver.disconnect();
  }, [synopsis]);

  const toggleSynopsis = () => {
    flushSync(() => {
      setIsExpanded((expanded) => !expanded);
    });
  };

  const shouldShowMask = isCollapsible && !isExpanded;

  return (
    <section className={`${styles.hero} ${coverStyles[coverKey]} ${shouldShowMask ? styles.collapsible : ''} ${isExpanded ? styles.expanded : ''}`}>
      <div className={styles.copy}>
        <p className={styles.eyebrow}>О кампании</p>
        <div
          ref={synopsisWrapRef}
          className={styles.synopsisWrap}
          style={{maxHeight: isExpanded ? expandedSynopsisHeight : COLLAPSED_SYNOPSIS_HEIGHT}}
        >
          <p className={styles.synopsis}>{synopsis || 'Мастер ещё не добавил описание этой истории.'}</p>
        </div>
      </div>
      {isCollapsible ? (
        <button
          aria-expanded={isExpanded}
          aria-label={isExpanded ? 'Свернуть предысторию' : 'Раскрыть предысторию'}
          className={styles.expandButton}
          title={isExpanded ? 'Свернуть предысторию' : 'Раскрыть предысторию'}
          type="button"
          onClick={toggleSynopsis}
        >
          <ChevronDown aria-hidden="true" className={styles.expandIcon} />
        </button>
      ) : null}
      <div className={styles.sessionBlock}>
        <span>Следующая игра</span>
        <strong>{nextSessionAt ? formatCampaignDate(nextSessionAt) : 'Дата не назначена'}</strong>
        {nextSessionAt && <small>{formatNextSessionMeta(nextSessionAt)}</small>}
        {isOwner && <button className={styles.sessionButton} type="button" onClick={() => setIsDateEditorOpen(true)}>{nextSessionAt ? 'Изменить' : 'Назначить'}</button>}
      </div>
      {isDateEditorOpen && <div className={styles.editorBackdrop} onMouseDown={(event) => event.target === event.currentTarget && setIsDateEditorOpen(false)}><NextSessionEditor campaignId={campaignId} nextSessionAt={nextSessionAt} onClose={() => setIsDateEditorOpen(false)} /></div>}
    </section>
  );
}
