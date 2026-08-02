import { Prisma, type PrismaClient } from '@prisma/client';
import type {
  NoteDto,
  NoteListQuery,
  NoteListResponse,
  NoteListSort,
  NoteWriteRequest,
} from '@taverna/contracts';

import { AppError } from '../../lib/errors.js';
import {
  calendarDateToDate,
  serializeCalendarDate,
} from './schemas.js';
import {
  countNotes,
  createNote,
  deleteNote,
  findActiveMembership,
  findCampaign,
  findNote,
  listNotesPage,
  type NoteListOrder,
  type NoteWithAuthor,
  type NotesDb,
  updateNote,
} from './repo.js';

const noteLimit = 500;
const defaultPageSize = 10;
const maxSerializableWriteAttempts = 3;
const defaultSort: NoteListSort = 'sessionDateDesc';

type AccessContext = {
  membershipId: string;
};

async function requireActiveMember(
  db: NotesDb,
  campaignId: string,
  userId: string,
): Promise<AccessContext> {
  const campaign = await findCampaign(db, campaignId);
  if (!campaign) {
    throw new AppError(404, 'NOT_FOUND', 'Campaign not found');
  }

  const membership = await findActiveMembership(db, campaignId, userId);
  if (!membership) {
    throw new AppError(403, 'CAMPAIGN_FORBIDDEN', 'Campaign access denied');
  }

  return {
    membershipId: membership.id,
  };
}

function canManageNote(note: NoteWithAuthor, userId: string): boolean {
  return note.author.userId === userId;
}

function noteDto(
  note: NoteWithAuthor,
  userId: string,
): NoteDto {
  const canManage = canManageNote(note, userId);
  return {
    id: note.id,
    campaignId: note.campaignId,
    author: {
      membershipId: note.author.id,
      userName: note.author.user.name,
      characterName: note.author.characterName,
      isActive: note.author.leftAt === null,
    },
    body: note.body,
    sessionDate: serializeCalendarDate(note.sessionDate),
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
    canEdit: canManage,
    canDelete: canManage,
  };
}

export async function getNotes(
  db: NotesDb,
  campaignId: string,
  userId: string,
  query: NoteListQuery = {},
): Promise<NoteListResponse> {
  const context = await requireActiveMember(db, campaignId, userId);
  const search = query.search?.trim() || undefined;
  const sort = query.sort ?? defaultSort;
  const pageSize = query.pageSize ?? defaultPageSize;
  const totalItems = await countNotes(db, campaignId, search);
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const page = Math.min(query.page ?? 1, totalPages);
  const notes = await listNotesPage(db, {
    campaignId,
    orderBy: noteListOrder(sort),
    search,
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return {
    items: notes.map((note) => noteDto(note, userId)),
    meta: {
      page,
      pageSize,
      totalItems,
      totalPages,
      search: search ?? null,
      sort,
    },
  };
}

function noteListOrder(sort: NoteListSort): NoteListOrder {
  switch (sort) {
    case 'sessionDateAsc':
      return [
        {sessionDate: {sort: 'asc', nulls: 'last'}},
        {createdAt: 'asc'},
      ];
    case 'updatedAtDesc':
      return [
        {updatedAt: 'desc'},
        {createdAt: 'desc'},
      ];
    case 'updatedAtAsc':
      return [
        {updatedAt: 'asc'},
        {createdAt: 'asc'},
      ];
    case 'sessionDateDesc':
    default:
      return [
        {sessionDate: {sort: 'desc', nulls: 'last'}},
        {createdAt: 'desc'},
      ];
  }
}

function isRetryableWriteConflict(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034';
}

async function runSerializableNoteWrite<T>(
  db: PrismaClient,
  operation: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  for (let attempt = 1; attempt <= maxSerializableWriteAttempts; attempt += 1) {
    try {
      return await db.$transaction(
        (tx) => operation(tx),
        {isolationLevel: Prisma.TransactionIsolationLevel.Serializable},
      );
    } catch (error) {
      if (!isRetryableWriteConflict(error)) {
        throw error;
      }

      if (attempt === maxSerializableWriteAttempts) {
        throw new AppError(409, 'CONFLICT', 'Заметка изменилась одновременно с другим действием. Повторите попытку.');
      }
    }
  }

  throw new AppError(500, 'INTERNAL_ERROR', 'Serializable note write failed unexpectedly');
}

export async function createCampaignNote(
  db: PrismaClient,
  campaignId: string,
  userId: string,
  payload: NoteWriteRequest,
): Promise<NoteDto> {
  const context = await requireActiveMember(db, campaignId, userId);
  const sessionDate = calendarDateToDate(payload.sessionDate);
  const note = await runSerializableNoteWrite(db, async (tx) => {
    const count = await countNotes(tx, campaignId);
    if (count >= noteLimit) {
      throw new AppError(409, 'NOTE_LIMIT_REACHED', 'Note limit reached');
    }

    return createNote(tx, {
      campaignId,
      authorId: context.membershipId,
      body: payload.body,
      sessionDate,
    });
  });

  return noteDto(note, userId);
}

async function requireEditableNote(
  db: NotesDb,
  campaignId: string,
  noteId: string,
  userId: string,
): Promise<void> {
  await requireActiveMember(db, campaignId, userId);
  const note = await findNote(db, campaignId, noteId);
  if (!note) {
    throw new AppError(404, 'NOT_FOUND', 'Note not found');
  }
  if (!canManageNote(note, userId)) {
    throw new AppError(403, 'FORBIDDEN', 'Note access denied');
  }
}

export async function updateCampaignNote(
  db: PrismaClient,
  campaignId: string,
  noteId: string,
  userId: string,
  payload: NoteWriteRequest,
): Promise<NoteDto> {
  return runSerializableNoteWrite(db, async (tx) => {
    await requireEditableNote(tx, campaignId, noteId, userId);
    const note = await updateNote(tx, noteId, {
      body: payload.body,
      sessionDate: calendarDateToDate(payload.sessionDate),
    });
    return noteDto(note, userId);
  });
}

export async function deleteCampaignNote(
  db: PrismaClient,
  campaignId: string,
  noteId: string,
  userId: string,
): Promise<void> {
  await runSerializableNoteWrite(db, async (tx) => {
    await requireEditableNote(tx, campaignId, noteId, userId);
    await deleteNote(tx, noteId);
  });
}
