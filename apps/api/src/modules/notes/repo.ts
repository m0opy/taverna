import type { Prisma, PrismaClient } from '@prisma/client';

export type NotesDb = PrismaClient | Prisma.TransactionClient;
export type NoteListOrder = Prisma.NoteOrderByWithRelationInput[];

const noteInclude = {
  author: {
    select: {
      id: true,
      userId: true,
      characterName: true,
      leftAt: true,
      user: {select: {name: true}},
    },
  },
} satisfies Prisma.NoteInclude;

export type NoteWithAuthor = Prisma.NoteGetPayload<{
  include: typeof noteInclude;
}>;

export function findCampaign(db: NotesDb, campaignId: string) {
  return db.campaign.findUnique({
    where: {id: campaignId},
    select: {id: true, ownerId: true},
  });
}

export function findActiveMembership(db: NotesDb, campaignId: string, userId: string) {
  return db.membership.findFirst({
    where: {campaignId, userId, leftAt: null},
    select: {id: true},
  });
}

export function listNotes(db: NotesDb, campaignId: string) {
  return db.note.findMany({
    where: {campaignId},
    include: noteInclude,
    orderBy: [
      {sessionDate: {sort: 'desc', nulls: 'last'}},
      {createdAt: 'desc'},
    ],
  });
}

type NoteListFilters = {
  campaignId: string;
  orderBy: NoteListOrder;
  search?: string;
  skip?: number;
  take?: number;
};

function noteSearchWhere(search?: string): Prisma.NoteWhereInput | undefined {
  if (!search) {
    return undefined;
  }

  return {
    body: {contains: search, mode: 'insensitive'},
  };
}

export function listNotesPage(db: NotesDb, filters: NoteListFilters) {
  return db.note.findMany({
    where: {
      campaignId: filters.campaignId,
      ...noteSearchWhere(filters.search),
    },
    include: noteInclude,
    orderBy: filters.orderBy,
    skip: filters.skip,
    take: filters.take,
  });
}

export function countNotes(db: NotesDb, campaignId: string, search?: string) {
  return db.note.count({
    where: {
      campaignId,
      ...noteSearchWhere(search),
    },
  });
}

export function createNote(
  db: NotesDb,
  data: {campaignId: string; authorId: string; body: string; sessionDate: Date | null},
) {
  return db.note.create({data, include: noteInclude});
}

export function findNote(db: NotesDb, campaignId: string, noteId: string) {
  return db.note.findFirst({
    where: {id: noteId, campaignId},
    include: noteInclude,
  });
}

export function updateNote(
  db: NotesDb,
  noteId: string,
  data: {body: string; sessionDate: Date | null},
) {
  return db.note.update({where: {id: noteId}, data, include: noteInclude});
}

export function deleteNote(db: NotesDb, noteId: string) {
  return db.note.delete({where: {id: noteId}});
}
