import { Prisma, type PrismaClient } from '@prisma/client';
import type { NoteDto, NoteWriteRequest } from '@taverna/contracts';

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
  listNotes,
  type NoteWithAuthor,
  type NotesDb,
  updateNote,
} from './repo.js';

const noteLimit = 500;

type AccessContext = {
  campaignId: string;
  campaignOwnerId: string;
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
    campaignId,
    campaignOwnerId: campaign.ownerId,
    membershipId: membership.id,
  };
}

function canManageNote(note: NoteWithAuthor, campaignOwnerId: string, userId: string): boolean {
  return campaignOwnerId === userId || note.author.userId === userId;
}

function noteDto(
  note: NoteWithAuthor,
  campaignOwnerId: string,
  userId: string,
): NoteDto {
  const canManage = canManageNote(note, campaignOwnerId, userId);
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
): Promise<{items: NoteDto[]}> {
  const context = await requireActiveMember(db, campaignId, userId);
  const notes = await listNotes(db, campaignId);
  return {
    items: notes.map((note) => noteDto(note, context.campaignOwnerId, userId)),
  };
}

export async function createCampaignNote(
  db: PrismaClient,
  campaignId: string,
  userId: string,
  payload: NoteWriteRequest,
): Promise<NoteDto> {
  const context = await requireActiveMember(db, campaignId, userId);
  const sessionDate = calendarDateToDate(payload.sessionDate);
  const note = await db.$transaction(async (tx) => {
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
  }, {isolationLevel: Prisma.TransactionIsolationLevel.Serializable});

  return noteDto(note, context.campaignOwnerId, userId);
}

async function requireEditableNote(
  db: NotesDb,
  campaignId: string,
  noteId: string,
  userId: string,
): Promise<{context: AccessContext; note: NoteWithAuthor}> {
  const context = await requireActiveMember(db, campaignId, userId);
  const note = await findNote(db, campaignId, noteId);
  if (!note) {
    throw new AppError(404, 'NOT_FOUND', 'Note not found');
  }
  if (!canManageNote(note, context.campaignOwnerId, userId)) {
    throw new AppError(403, 'FORBIDDEN', 'Note access denied');
  }

  return {context, note};
}

export async function updateCampaignNote(
  db: NotesDb,
  campaignId: string,
  noteId: string,
  userId: string,
  payload: NoteWriteRequest,
): Promise<NoteDto> {
  const {context} = await requireEditableNote(db, campaignId, noteId, userId);
  const note = await updateNote(db, noteId, {
    body: payload.body,
    sessionDate: calendarDateToDate(payload.sessionDate),
  });
  return noteDto(note, context.campaignOwnerId, userId);
}

export async function deleteCampaignNote(
  db: NotesDb,
  campaignId: string,
  noteId: string,
  userId: string,
): Promise<void> {
  await requireEditableNote(db, campaignId, noteId, userId);
  await deleteNote(db, noteId);
}
