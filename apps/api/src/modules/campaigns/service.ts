import {randomBytes} from 'node:crypto';
import type {FastifyInstance} from 'fastify';
import {Prisma} from '@prisma/client';
import type {CampaignDetailDto, CampaignSummaryDto, CreateCampaignRequest, DeleteCampaignRequest, UpdateCampaignRequest} from '@taverna/contracts';
import {AppError} from '../../lib/errors.js';
import {calendarDateToUtcDate, currentCalendarDate, serializeCalendarDate} from '../../lib/calendar-date.js';
import {moveOrCreateNextSessionGame, recomputeCampaignNextSession} from '../games/next-session.js';

const include = {memberships: {where: {leftAt: null}, include: {user: true}, orderBy: {joinedAt: 'asc'}}} satisfies Prisma.CampaignInclude;
type Campaign = Prisma.CampaignGetPayload<{include: typeof include}>;
const db = (app: FastifyInstance) => { if (!app.prisma) throw new AppError(500, 'INTERNAL_ERROR', 'Database is unavailable'); return app.prisma; };
const calendar = serializeCalendarDate;
const dateValue = (value: string) => {
 const date = calendarDateToUtcDate(value, 'nextSessionAt');
 if (value < currentCalendarDate()) throw new AppError(400, 'VALIDATION_ERROR', 'Validation failed', {fields: {nextSessionAt: 'Choose today or a future date'}});
 return date!;
};
function dto(app: FastifyInstance, campaign: Campaign, userId: string): CampaignDetailDto {
 const mine=campaign.memberships.find((m)=>m.userId===userId); if(!mine) throw new AppError(403,'CAMPAIGN_FORBIDDEN','Campaign access denied');
 const summary: CampaignSummaryDto={id:campaign.id,title:campaign.title,coverKey:campaign.coverKey as CampaignSummaryDto['coverKey'],nextSessionAt:calendar(campaign.nextSessionAt),membersCount:campaign.memberships.length,myRole:campaign.ownerId===userId?'master':'player'};
 return {...summary,synopsis:campaign.synopsis,ownerId:campaign.ownerId,inviteUrl:campaign.ownerId===userId?`${app.appEnv.APP_ORIGIN}/join/${campaign.inviteToken.trim()}`:null,myMembershipId:mine.id,members:campaign.memberships.map((m)=>({id:m.id,user:{id:m.user.id,name:m.user.name},characterName:m.characterName,characterClass:m.characterClass,characterInfo:m.characterInfo,joinedAt:m.joinedAt.toISOString(),isOwner:m.userId===campaign.ownerId})),createdAt:campaign.createdAt.toISOString()};
}
export async function listCampaigns(app: FastifyInstance,userId:string){const items=await db(app).campaign.findMany({where:{memberships:{some:{userId,leftAt:null}}},include,orderBy:{createdAt:'desc'}});return {items:items.map(c=>{const d=dto(app,c,userId);return {id:d.id,title:d.title,coverKey:d.coverKey,nextSessionAt:d.nextSessionAt,membersCount:d.membersCount,myRole:d.myRole};})};}
export async function createCampaign(app:FastifyInstance,userId:string,p:CreateCampaignRequest){const campaign=await db(app).$transaction(async tx=>{if(await tx.campaign.count({where:{ownerId:userId}})>=20)throw new AppError(409,'CAMPAIGN_LIMIT_REACHED','Campaign limit reached');return tx.campaign.create({data:{...p,inviteToken:randomBytes(9).toString('base64url'),ownerId:userId,memberships:{create:{userId}}},include});},{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});return dto(app,campaign,userId);}
export async function getCampaign(app:FastifyInstance,id:string,userId:string){const c=await db(app).campaign.findUnique({where:{id},include});if(!c)throw new AppError(404,'NOT_FOUND','Campaign not found');return dto(app,c,userId);}
async function owner(app:FastifyInstance,id:string,userId:string){const c=await db(app).campaign.findUnique({where:{id},include});if(!c)throw new AppError(404,'NOT_FOUND','Campaign not found');if(c.ownerId!==userId)throw new AppError(403,'CAMPAIGN_FORBIDDEN','Campaign owner access required');return c;}
export async function updateCampaign(app:FastifyInstance,id:string,userId:string,p:UpdateCampaignRequest){await owner(app,id,userId);const {nextSessionAt,...data}=p;const c=await db(app).$transaction(async tx=>{if(nextSessionAt===null){await recomputeCampaignNextSession(tx,id);}else if(nextSessionAt!==undefined){await moveOrCreateNextSessionGame(tx,id,dateValue(nextSessionAt));}return tx.campaign.update({where:{id},data,include});});return dto(app,c,userId);}
export async function rotateInvite(app:FastifyInstance,id:string,userId:string){await owner(app,id,userId);const c=await db(app).campaign.update({where:{id},data:{inviteToken:randomBytes(9).toString('base64url')},include});return {inviteUrl:dto(app,c,userId).inviteUrl!};}
export async function deleteCampaign(app:FastifyInstance,id:string,userId:string,p:DeleteCampaignRequest){const c=await owner(app,id,userId);if(c.title!==p.confirmationTitle)throw new AppError(400,'VALIDATION_ERROR','Confirmation title does not match', {fields:{confirmationTitle:'Enter the exact campaign title'}});await db(app).campaign.delete({where:{id}});}
