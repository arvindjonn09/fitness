import 'dotenv/config';
import crypto from 'node:crypto';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();
const app = express();
const port = Number(process.env.PORT || 4000);
const jwtSecret = process.env.JWT_SECRET || 'development-only-secret';
const inviteExpiryDays = Number(process.env.INVITE_EXPIRY_DAYS || 7);

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
const json = (value, fallback = []) => {
  try { return JSON.parse(value); } catch { return fallback; }
};
const makeJwt = (user) => jwt.sign({ sub: user.id, email: user.email }, jwtSecret, { expiresIn: '7d' });

function readinessScore(input) {
  const positive = input.sleepQuality * 0.16 + input.energy * 0.16 + input.motivation * 0.10 + input.selfReadiness * 0.22;
  const negative = input.fatigue * 0.14 + input.soreness * 0.10 + input.stress * 0.07;
  let score = Math.round((positive + (10 - negative)) * 10 / 2);
  const risks = [];
  if (input.sleepHours < 5) risks.push('Sleep below five hours');
  if (input.fatigue >= 8) risks.push('Very high fatigue');
  if (input.soreness >= 8) risks.push('Very high soreness');
  if (input.hasPain && (input.painSeverity || 0) >= 7) risks.push('Severe pain reported');
  if (input.illnessSymptoms) risks.push('Illness symptoms reported');
  score = Math.max(0, Math.min(100, score));
  if (risks.includes('Severe pain reported') || risks.includes('Illness symptoms reported')) score = Math.min(score, 49);
  const availability = score >= 80 ? 'AVAILABLE' : score >= 65 ? 'MONITOR' : score >= 50 ? 'MODIFIED' : 'UNAVAILABLE';
  return { score, risks, availability };
}

const requireAuth = asyncRoute(async (req, res, next) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try {
    const payload = jwt.verify(token, jwtSecret);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) return res.status(401).json({ error: 'Account not found' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
});

async function teamMembership(userId, teamId) {
  return prisma.teamMembership.findUnique({ where: { teamId_userId: { teamId, userId } } });
}

const requireTeamPermission = (allowedRoles) => asyncRoute(async (req, res, next) => {
  const teamId = req.params.teamId || req.body.teamId;
  const membership = await teamMembership(req.user.id, teamId);
  if (!membership || membership.status !== 'ACTIVE' || !allowedRoles.includes(membership.role)) {
    return res.status(403).json({ error: 'You do not have permission for this team' });
  }
  req.teamMembership = membership;
  next();
});

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'teamready-api' }));

app.post('/api/auth/register-organisation', asyncRoute(async (req, res) => {
  const schema = z.object({
    fullName: z.string().min(2), email: z.string().email(), password: z.string().min(8),
    organisationName: z.string().min(2), organisationType: z.string().min(2), primarySport: z.string().min(2), country: z.string().min(2)
  });
  const input = schema.parse(req.body);
  const exists = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
  if (exists) return res.status(409).json({ error: 'Email already registered' });
  const passwordHash = await bcrypt.hash(input.password, 12);
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({ data: { fullName: input.fullName, email: input.email.toLowerCase(), passwordHash } });
    const organisation = await tx.organisation.create({ data: { name: input.organisationName, type: input.organisationType, primarySport: input.primarySport, country: input.country } });
    await tx.organisationMembership.create({ data: { organisationId: organisation.id, userId: user.id, role: 'OWNER' } });
    await tx.auditLog.create({ data: { organisationId: organisation.id, actorId: user.id, action: 'organisation.created', entityType: 'organisation', entityId: organisation.id } });
    return { user, organisation };
  });
  res.status(201).json({ token: makeJwt(result.user), user: { id: result.user.id, fullName: result.user.fullName, email: result.user.email }, organisation: result.organisation });
}));

app.post('/api/auth/login', asyncRoute(async (req, res) => {
  const input = z.object({ email: z.string().email(), password: z.string().min(1) }).parse(req.body);
  const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) return res.status(401).json({ error: 'Incorrect email or password' });
  res.json({ token: makeJwt(user), user: { id: user.id, fullName: user.fullName, email: user.email } });
}));

app.get('/api/me', requireAuth, asyncRoute(async (req, res) => {
  const memberships = await prisma.organisationMembership.findMany({ where: { userId: req.user.id, status: 'ACTIVE' }, include: { organisation: true } });
  const teams = await prisma.teamMembership.findMany({ where: { userId: req.user.id, status: 'ACTIVE' }, include: { team: true } });
  res.json({ user: { id: req.user.id, fullName: req.user.fullName, email: req.user.email }, organisations: memberships, teams });
}));

app.post('/api/organisations/:organisationId/teams', requireAuth, asyncRoute(async (req, res) => {
  const membership = await prisma.organisationMembership.findUnique({ where: { organisationId_userId: { organisationId: req.params.organisationId, userId: req.user.id } } });
  if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) return res.status(403).json({ error: 'Organisation admin permission required' });
  const input = z.object({ name: z.string().min(2), sport: z.string().min(2), ageGroup: z.string().optional(), season: z.string().optional(), competition: z.string().optional(), timezone: z.string().default('Australia/Sydney'), trainingDays: z.string().optional(), matchDay: z.string().optional() }).parse(req.body);
  const team = await prisma.team.create({ data: { ...input, organisationId: req.params.organisationId } });
  await prisma.teamMembership.create({ data: { teamId: team.id, userId: req.user.id, role: 'HEAD_COACH', designation: 'Organisation owner' } });
  res.status(201).json(team);
}));

app.post('/api/teams/:teamId/invitations', requireAuth, requireTeamPermission(['HEAD_COACH']), asyncRoute(async (req, res) => {
  const input = z.object({
    email: z.string().email(), fullName: z.string().min(2), type: z.enum(['STAFF', 'PLAYER']),
    role: z.enum(['HEAD_COACH','ASSISTANT_COACH','FITNESS_COACH','PHYSIOTHERAPIST','DOCTOR','ANALYST','PLAYER']),
    designation: z.string().optional(), permissions: z.array(z.string()).default([]), position: z.string().optional(), jerseyNumber: z.string().optional(), guardianEmail: z.string().email().optional()
  }).parse(req.body);
  const team = await prisma.team.findUnique({ where: { id: req.params.teamId } });
  if (!team) return res.status(404).json({ error: 'Team not found' });
  const rawToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + inviteExpiryDays * 86400000);
  const invitation = await prisma.invitation.create({ data: {
    organisationId: team.organisationId, teamId: team.id, email: input.email.toLowerCase(), fullName: input.fullName,
    type: input.type, role: input.role, designation: input.designation, permissionsJson: JSON.stringify(input.permissions),
    position: input.position, jerseyNumber: input.jerseyNumber, guardianEmail: input.guardianEmail,
    tokenHash: hashToken(rawToken), expiresAt, invitedById: req.user.id
  }});
  await prisma.auditLog.create({ data: { organisationId: team.organisationId, actorId: req.user.id, action: 'invitation.created', entityType: 'invitation', entityId: invitation.id, metadataJson: JSON.stringify({ teamId: team.id, email: invitation.email, role: invitation.role }) } });
  res.status(201).json({ invitation: { ...invitation, tokenHash: undefined }, acceptUrl: `${process.env.APP_URL || 'http://localhost:5173'}/accept-invite?token=${rawToken}`, emailDelivery: 'Not configured. The acceptance URL is returned for local development.' });
}));

app.get('/api/invitations/:token', asyncRoute(async (req, res) => {
  const invitation = await prisma.invitation.findUnique({ where: { tokenHash: hashToken(req.params.token) }, include: { team: true, organisation: true, invitedBy: { select: { fullName: true } } } });
  if (!invitation || invitation.status !== 'PENDING') return res.status(404).json({ error: 'Invitation not found or no longer active' });
  if (invitation.expiresAt < new Date()) {
    await prisma.invitation.update({ where: { id: invitation.id }, data: { status: 'EXPIRED' } });
    return res.status(410).json({ error: 'Invitation expired' });
  }
  res.json({ id: invitation.id, fullName: invitation.fullName, email: invitation.email, type: invitation.type, role: invitation.role, team: invitation.team, organisation: invitation.organisation, invitedBy: invitation.invitedBy });
}));

app.post('/api/invitations/:token/accept', asyncRoute(async (req, res) => {
  const input = z.object({ password: z.string().min(8), mobile: z.string().optional(), dateOfBirth: z.string().optional(), emergencyName: z.string().optional(), emergencyPhone: z.string().optional(), consentAccepted: z.literal(true) }).parse(req.body);
  const invitation = await prisma.invitation.findUnique({ where: { tokenHash: hashToken(req.params.token) } });
  if (!invitation || invitation.status !== 'PENDING' || invitation.expiresAt < new Date()) return res.status(410).json({ error: 'Invitation expired or unavailable' });
  const existing = await prisma.user.findUnique({ where: { email: invitation.email } });
  const passwordHash = await bcrypt.hash(input.password, 12);
  const result = await prisma.$transaction(async (tx) => {
    const user = existing ? await tx.user.update({ where: { id: existing.id }, data: { mobile: input.mobile || existing.mobile } }) : await tx.user.create({ data: { email: invitation.email, fullName: invitation.fullName, passwordHash, mobile: input.mobile, dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined } });
    await tx.organisationMembership.upsert({ where: { organisationId_userId: { organisationId: invitation.organisationId, userId: user.id } }, create: { organisationId: invitation.organisationId, userId: user.id, role: invitation.type === 'PLAYER' ? 'MEMBER' : 'STAFF' }, update: { status: 'ACTIVE', role: invitation.type === 'PLAYER' ? 'MEMBER' : 'STAFF' } });
    if (invitation.teamId) await tx.teamMembership.upsert({ where: { teamId_userId: { teamId: invitation.teamId, userId: user.id } }, create: { teamId: invitation.teamId, userId: user.id, role: invitation.role, designation: invitation.designation, permissionsJson: invitation.permissionsJson, position: invitation.position, jerseyNumber: invitation.jerseyNumber }, update: { status: 'ACTIVE', role: invitation.role, designation: invitation.designation } });
    if (invitation.type === 'PLAYER') await tx.playerProfile.upsert({ where: { userId: user.id }, create: { userId: user.id, emergencyName: input.emergencyName, emergencyPhone: input.emergencyPhone, consentAcceptedAt: new Date() }, update: { emergencyName: input.emergencyName, emergencyPhone: input.emergencyPhone, consentAcceptedAt: new Date() } });
    await tx.invitation.update({ where: { id: invitation.id }, data: { status: 'ACCEPTED', acceptedById: user.id, acceptedAt: new Date() } });
    return user;
  });
  res.json({ token: makeJwt(result), user: { id: result.id, fullName: result.fullName, email: result.email } });
}));

app.post('/api/teams/:teamId/check-ins', requireAuth, requireTeamPermission(['PLAYER']), asyncRoute(async (req, res) => {
  const input = z.object({
    checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), sleepHours: z.number().min(0).max(16),
    sleepQuality: z.number().int().min(1).max(10), energy: z.number().int().min(1).max(10), fatigue: z.number().int().min(1).max(10),
    soreness: z.number().int().min(1).max(10), stress: z.number().int().min(1).max(10), motivation: z.number().int().min(1).max(10),
    hasPain: z.boolean(), painLocation: z.string().optional(), painSeverity: z.number().int().min(1).max(10).optional(), illnessSymptoms: z.string().optional(),
    selfReadiness: z.number().int().min(1).max(10), playerNote: z.string().max(1000).optional()
  }).parse(req.body);
  const readiness = readinessScore(input);
  const checkIn = await prisma.dailyCheckIn.upsert({ where: { teamId_playerId_checkInDate: { teamId: req.params.teamId, playerId: req.user.id, checkInDate: input.checkInDate } }, create: { ...input, teamId: req.params.teamId, playerId: req.user.id, calculatedReadiness: readiness.score, availability: readiness.availability, riskReasonsJson: JSON.stringify(readiness.risks) }, update: { ...input, calculatedReadiness: readiness.score, availability: readiness.availability, riskReasonsJson: JSON.stringify(readiness.risks) } });
  res.status(201).json({ ...checkIn, riskReasons: readiness.risks });
}));

app.get('/api/teams/:teamId/dashboard', requireAuth, requireTeamPermission(['HEAD_COACH','ASSISTANT_COACH','FITNESS_COACH','PHYSIOTHERAPIST','DOCTOR','ANALYST']), asyncRoute(async (req, res) => {
  const date = String(req.query.date || new Date().toISOString().slice(0, 10));
  const players = await prisma.teamMembership.findMany({ where: { teamId: req.params.teamId, role: 'PLAYER', status: 'ACTIVE' }, include: { user: { select: { id: true, fullName: true } } } });
  const checkIns = await prisma.dailyCheckIn.findMany({ where: { teamId: req.params.teamId, checkInDate: date } });
  const byPlayer = new Map(checkIns.map(c => [c.playerId, c]));
  const rows = players.map(p => {
    const c = byPlayer.get(p.userId);
    return { playerId: p.userId, fullName: p.user.fullName, position: p.position, jerseyNumber: p.jerseyNumber, completed: Boolean(c), readiness: c?.calculatedReadiness ?? null, availability: c?.availability ?? 'MISSING', risks: c ? json(c.riskReasonsJson) : [] };
  });
  const completed = checkIns.length;
  const average = completed ? Math.round(checkIns.reduce((sum, c) => sum + c.calculatedReadiness, 0) / completed) : null;
  const bodyMap = checkIns.filter(c => c.hasPain && c.painLocation).reduce((acc, c) => { acc[c.painLocation] = (acc[c.painLocation] || 0) + 1; return acc; }, {});
  res.json({ date, summary: { totalPlayers: players.length, completed, missing: players.length - completed, teamReadiness: average, available: checkIns.filter(c => c.availability === 'AVAILABLE').length, monitor: checkIns.filter(c => c.availability === 'MONITOR').length, modified: checkIns.filter(c => c.availability === 'MODIFIED').length, unavailable: checkIns.filter(c => c.availability === 'UNAVAILABLE').length }, players: rows, bodyMap });
}));

app.get('/api/teams/:teamId/players/:playerId', requireAuth, requireTeamPermission(['HEAD_COACH','ASSISTANT_COACH','FITNESS_COACH','PHYSIOTHERAPIST','DOCTOR','ANALYST']), asyncRoute(async (req, res) => {
  const membership = await prisma.teamMembership.findUnique({ where: { teamId_userId: { teamId: req.params.teamId, userId: req.params.playerId } }, include: { user: { select: { id: true, fullName: true, email: true } } } });
  if (!membership || membership.role !== 'PLAYER') return res.status(404).json({ error: 'Player not found in team' });
  const checkIns = await prisma.dailyCheckIn.findMany({ where: { teamId: req.params.teamId, playerId: req.params.playerId }, orderBy: { checkInDate: 'desc' }, take: 30 });
  res.json({ player: { ...membership.user, position: membership.position, jerseyNumber: membership.jerseyNumber }, checkIns: checkIns.map(c => ({ ...c, risks: json(c.riskReasonsJson) })) });
}));

app.post('/api/teams/:teamId/players/:playerId/notes', requireAuth, requireTeamPermission(['HEAD_COACH','ASSISTANT_COACH','FITNESS_COACH','PHYSIOTHERAPIST','DOCTOR']), asyncRoute(async (req, res) => {
  const input = z.object({ note: z.string().min(2).max(2000), isMedical: z.boolean().default(false) }).parse(req.body);
  if (input.isMedical && !['PHYSIOTHERAPIST','DOCTOR','HEAD_COACH'].includes(req.teamMembership.role)) return res.status(403).json({ error: 'Medical note permission required' });
  const note = await prisma.coachNote.create({ data: { teamId: req.params.teamId, playerId: req.params.playerId, authorId: req.user.id, note: input.note, isMedical: input.isMedical } });
  res.status(201).json(note);
}));

app.use((error, _req, res, _next) => {
  if (error instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', details: error.issues });
  console.error(error);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => console.log(`TeamReady API listening on http://localhost:${port}`));

process.on('SIGINT', async () => { await prisma.$disconnect(); process.exit(0); });
process.on('SIGTERM', async () => { await prisma.$disconnect(); process.exit(0); });
