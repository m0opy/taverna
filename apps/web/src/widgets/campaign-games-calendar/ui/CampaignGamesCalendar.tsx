import type {DayButtonProps} from '@daypicker/react';
import {DayPicker} from '@daypicker/react';
import {ru} from '@daypicker/react/locale/ru';
import '@daypicker/react/style.css';
import type {GameDto} from '@taverna/contracts';
import {PencilToSquare, TrashBin} from '@gravity-ui/icons';
import {Button} from '@gravity-ui/uikit';
import {useMemo, useState} from 'react';

import {useGames} from '../../../entities/game/api/use-games';
import {useDeleteGame} from '../../../features/game/delete/model/use-delete-game';
import {
  calendarDateFromUtcDate,
  calendarDateToUtcDate,
  calendarMonthKey,
  currentCalendarDate,
  formatCalendarMonth,
  monthFromCalendarDate,
} from '../../../shared/lib/calendar';
import {formatCampaignDate} from '../../../shared/lib/date';
import {GameEditor} from '../../game-editor/ui/GameEditor';
import styles from './CampaignGamesCalendar.module.css';

type EditorState =
  | {kind: 'create'; date: string}
  | {game: GameDto; kind: 'edit'}
  | null;

interface MonthGameGroup {
  date: string;
  games: GameDto[];
}

function gameNoun(count: number) {
  const remainder = count % 100;
  if (remainder >= 11 && remainder <= 14) return 'игр';
  switch (count % 10) {
    case 1: return 'игра';
    case 2:
    case 3:
    case 4: return 'игры';
    default: return 'игр';
  }
}

function formatDayNumber(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {day: 'numeric', timeZone: 'UTC'}).format(calendarDateToUtcDate(value));
}

function formatDayMeta(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {month: 'short', weekday: 'short', timeZone: 'UTC'})
    .format(calendarDateToUtcDate(value))
    .replace('.', '');
}

function GameDayButton({day, hasGames, children, onDoubleClick, onPlan, ...props}: DayButtonProps & {
  hasGames: boolean;
  onPlan: ((date: string) => void) | undefined;
}) {
  return (
    <button
      {...props}
      onDoubleClick={(event) => {
        onDoubleClick?.(event);
        if (!event.defaultPrevented) onPlan?.(day.isoDate);
      }}
    >
      <span>{children}</span>
      {hasGames && <span aria-hidden="true" className={styles.dayDot} />}
    </button>
  );
}

function MonthGamesList({deletingGameId, groups, isOwner, onDelete, onEdit}: {
  deletingGameId: string | null;
  groups: MonthGameGroup[];
  isOwner: boolean;
  onDelete: (game: GameDto) => void;
  onEdit: (game: GameDto) => void;
}) {
  if (groups.length === 0) {
    return <p className={styles.emptyMonth}>В этом месяце игр пока не запланировано.</p>;
  }

  return (
    <ol aria-label="Игры в выбранном месяце" className={styles.monthList}>
      {groups.map((group) => (
        <li className={styles.dayGroup} key={group.date}>
          <time className={styles.dateMarker} dateTime={group.date}>
            <strong>{formatDayNumber(group.date)}</strong>
            <span>{formatDayMeta(group.date)}</span>
          </time>
          <ul className={styles.dayGames}>
            {group.games.map((game) => (
              <li className={styles.gameRow} key={game.id}>
                <div>
                  {game.scheduledTime && <time className={styles.gameTime}>{game.scheduledTime}</time>}
                  {game.description ? <p>{game.description}</p> : <p className={styles.placeholder}>Игра запланирована.</p>}
                </div>
                {isOwner && (
                  <div className={styles.actions}>
                    <button
                      aria-label={`Изменить игру на ${formatCampaignDate(game.scheduledFor)}`}
                      className={styles.action}
                      title="Изменить игру"
                      type="button"
                      onClick={() => onEdit(game)}
                    >
                      <PencilToSquare aria-hidden="true" />
                    </button>
                    <button
                      aria-label={deletingGameId === game.id ? 'Удаление игры' : `Удалить игру на ${formatCampaignDate(game.scheduledFor)}`}
                      className={`${styles.action} ${styles.deleteAction}`}
                      disabled={deletingGameId === game.id}
                      title="Удалить игру"
                      type="button"
                      onClick={() => onDelete(game)}
                    >
                      <TrashBin aria-hidden="true" />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}

export function CampaignGamesCalendar({campaignId, isOwner}: {
  campaignId: string;
  isOwner: boolean;
}) {
  const [month, setMonth] = useState(() => monthFromCalendarDate(currentCalendarDate()));
  const [selectedDate, setSelectedDate] = useState<string | null>(currentCalendarDate());
  const [editor, setEditor] = useState<EditorState>(null);
  const [deletingGameId, setDeletingGameId] = useState<string | null>(null);
  const monthKey = calendarMonthKey(month);
  const games = useGames(campaignId, monthKey);
  const deleteGame = useDeleteGame(campaignId);
  const gamesByDate = useMemo(() => {
    const result = new Map<string, GameDto[]>();
    for (const game of games.data?.items ?? []) {
      result.set(game.scheduledFor, [...(result.get(game.scheduledFor) ?? []), game]);
    }
    return result;
  }, [games.data?.items]);
  const groups = useMemo<MonthGameGroup[]>(() => (
    [...gamesByDate.keys()]
      .sort()
      .map((date) => ({
        date,
        games: gamesByDate.get(date) ?? [],
      }))
  ), [gamesByDate]);
  const datesWithGames = useMemo(() => groups.map((group) => calendarDateToUtcDate(group.date)), [groups]);
  const gameCountForDate = (date: string) => gamesByDate.get(date)?.length ?? 0;
  const monthGameCount = games.data?.items.length ?? 0;
  const selectedDateLabel = selectedDate ? formatCampaignDate(selectedDate) : null;
  const startPlanning = (date: string) => {
    setSelectedDate(date);
    setEditor({kind: 'create', date});
  };
  const removeGame = (game: GameDto) => {
    setDeletingGameId(game.id);
    deleteGame.mutate(game.id, {onSettled: () => setDeletingGameId(null)});
  };

  return (
    <section aria-labelledby="campaign-games-calendar-title" className={styles.section}>
      <header className={styles.heading}>
        <p className={styles.eyebrow}>Планирование</p>
        <h2 id="campaign-games-calendar-title">Расписание кампании</h2>
      </header>

      {games.isPending ? (
        <div aria-busy="true" className={styles.loading} role="status">
          <p>Загружаем игры месяца…</p>
          <div aria-hidden="true" className={styles.loadingGrid} />
        </div>
      ) : games.isError ? (
        <div className={styles.error} role="alert">
          <p>Не удалось загрузить расписание за этот месяц.</p>
          <Button size="l" view="outlined" onClick={() => void games.refetch()}>Повторить</Button>
        </div>
      ) : (
        <div className={styles.content}>
          <div className={styles.calendarPanel}>
            <DayPicker
              animate
              aria-label="Календарь запланированных игр"
              className={styles.calendar ?? 'campaign-games-calendar'}
              components={{
                DayButton: (props) => (
                  <GameDayButton
                    {...props}
                    hasGames={gameCountForDate(props.day.isoDate) > 0}
                    onPlan={isOwner ? startPlanning : undefined}
                  />
                ),
              }}
              fixedWeeks
              labels={{
                labelDayButton: (date, modifiers) => {
                  const formattedDate = new Intl.DateTimeFormat('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    weekday: 'long',
                    year: 'numeric',
                    timeZone: 'UTC',
                  }).format(date);
                  const count = gameCountForDate(calendarDateFromUtcDate(date));
                  const state = [modifiers.today && 'сегодня', modifiers.selected && 'выбрано'].filter(Boolean).join(', ');

                  return [state, formattedDate, count > 0 && `${count} ${gameNoun(count)}`].filter(Boolean).join(', ');
                },
              }}
              locale={ru}
              modifiers={{hasGames: datesWithGames}}
              modifiersClassNames={{hasGames: styles.hasGames ?? 'has-games'}}
              month={month}
              mode="single"
              noonSafe
              selected={selectedDate ? calendarDateToUtcDate(selectedDate) : undefined}
              showOutsideDays
              timeZone="UTC"
              onMonthChange={(nextMonth) => {
                setMonth(nextMonth);
                setSelectedDate(null);
              }}
              onSelect={(date) => {
                if (date) setSelectedDate(calendarDateFromUtcDate(date));
              }}
            />
            {isOwner && (
              <p aria-live="polite" className={styles.selectionHint} id="calendar-selection-hint">
                {selectedDateLabel ? `Выбрано: ${selectedDateLabel}` : 'Выберите дату в календаре, чтобы запланировать игру.'}
              </p>
            )}
          </div>

          <aside aria-live="polite" className={styles.monthPanel}>
            <header className={styles.monthHeading}>
              <div>
                <p className={styles.monthLabel}>{monthGameCount} {gameNoun(monthGameCount)} в месяце</p>
                <h3>{formatCalendarMonth(month)}</h3>
              </div>
              {isOwner && (
                <Button
                  aria-describedby="calendar-selection-hint"
                  disabled={!selectedDate}
                  size="l"
                  view="action"
                  onClick={() => selectedDate && startPlanning(selectedDate)}
                >
                  Запланировать
                </Button>
              )}
            </header>
            <MonthGamesList
              deletingGameId={deletingGameId}
              groups={groups}
              isOwner={isOwner}
              onDelete={removeGame}
              onEdit={(game) => setEditor({kind: 'edit', game})}
            />
          </aside>
        </div>
      )}

      {editor && (
        <GameEditor
          campaignId={campaignId}
          defaultDate={editor.kind === 'edit' ? editor.game.scheduledFor : editor.date}
          game={editor.kind === 'edit' ? editor.game : null}
          onCancel={() => setEditor(null)}
          onSaved={(game) => {
            setMonth(monthFromCalendarDate(game.scheduledFor));
            setSelectedDate(game.scheduledFor);
            setEditor(null);
          }}
        />
      )}
    </section>
  );
}
