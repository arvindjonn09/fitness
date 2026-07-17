import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Activity, Building2, CheckCircle2, ClipboardCheck, LayoutDashboard, LogOut, Mail, ShieldCheck, Users } from 'lucide-react';
import { authStore, teamReadyApi } from './api';
import './styles.css';
import './integration.css';

const today = new Date().toISOString().slice(0, 10);
const nav = [
  ['dashboard', LayoutDashboard, 'Dashboard'],
  ['organisation', Building2, 'Organisation'],
  ['team', Users, 'Create team'],
  ['invite', Mail, 'Invite player'],
  ['checkin', ClipboardCheck, 'Daily check-in'],
];

function Field({ label, children }) { return <label className="field"><span>{label}</span>{children}</label>; }
function Notice({ type = 'info', children }) { return <div className={`integration-notice ${type}`}>{children}</div>; }
function PageHeader({ title, subtitle, tag }) { return <header className="page-header"><div><h1>{title}</h1><p>{subtitle}</p></div>{tag && <span className="tag">{tag}</span>}</header>; }

function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ fullName: 'Daniel Smith', email: 'daniel@example.com', password: 'password123', organisationName: 'Western Sydney Football Academy', organisationType: 'Sports academy', primarySport: 'Football', country: 'Australia' });
  const change = (key) => (event) => setForm((value) => ({ ...value, [key]: event.target.value }));
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const result = mode === 'login' ? await teamReadyApi.login({ email: form.email, password: form.password }) : await teamReadyApi.registerOrganisation(form);
      authStore.set(result.token); onAuthenticated(result);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return <div className="auth-shell"><div className="auth-brand"><ShieldCheck size={30}/><div><strong>TeamReady</strong><small>Player wellness operations</small></div></div><form className="card auth-card" onSubmit={submit}><div className="auth-tabs"><button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Sign in</button><button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Create organisation</button></div><h1>{mode === 'login' ? 'Welcome back' : 'Launch your organisation'}</h1><p className="muted">Connect to the TeamReady API and continue with real data.</p>{error && <Notice type="error">{error}</Notice>}{mode === 'register' && <><div className="form-grid"><Field label="Owner name"><input value={form.fullName} onChange={change('fullName')}/></Field><Field label="Organisation"><input value={form.organisationName} onChange={change('organisationName')}/></Field><Field label="Organisation type"><input value={form.organisationType} onChange={change('organisationType')}/></Field><Field label="Primary sport"><input value={form.primarySport} onChange={change('primarySport')}/></Field></div><Field label="Country"><input value={form.country} onChange={change('country')}/></Field></>}<Field label="Email"><input type="email" value={form.email} onChange={change('email')} required/></Field><Field label="Password"><input type="password" value={form.password} onChange={change('password')} minLength={8} required/></Field><button className="primary full" disabled={busy}>{busy ? 'Connecting…' : mode === 'login' ? 'Sign in' : 'Create organisation'}</button></form></div>;
}

function TeamForm({ organisationId, onCreated }) {
  const [form, setForm] = useState({ name: 'Under 18 Boys', sport: 'Football', ageGroup: 'Under 18', season: '2026', competition: 'NSW Youth League', timezone: 'Australia/Sydney', trainingDays: 'Tuesday, Thursday', matchDay: 'Saturday' });
  const [state, setState] = useState({ busy: false, error: '', success: '' });
  const change = (key) => (e) => setForm((v) => ({ ...v, [key]: e.target.value }));
  async function submit(e) { e.preventDefault(); setState({ busy: true, error: '', success: '' }); try { const team = await teamReadyApi.createTeam(organisationId, form); setState({ busy: false, error: '', success: `${team.name} created.` }); onCreated(team); } catch (err) { setState({ busy: false, error: err.message, success: '' }); } }
  return <><PageHeader title="Create a team" subtitle="Create a live team record and assign the organisation owner as head coach." tag="Connected"/><form className="card" onSubmit={submit}>{state.error && <Notice type="error">{state.error}</Notice>}{state.success && <Notice type="success">{state.success}</Notice>}<div className="form-grid three">{Object.entries(form).map(([key, value]) => <Field key={key} label={key.replace(/([A-Z])/g, ' $1')}><input value={value} onChange={change(key)} required={['name','sport'].includes(key)}/></Field>)}</div><button className="primary" disabled={!organisationId || state.busy}>{state.busy ? 'Creating…' : 'Create team'}</button></form></>;
}

function InvitationForm({ teamId }) {
  const [form, setForm] = useState({ email: 'arvind@example.com', fullName: 'Arvind Jonnalagadda', type: 'PLAYER', role: 'PLAYER', position: 'Midfielder', jerseyNumber: '8', guardianEmail: '' });
  const [result, setResult] = useState(null); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const change = (key) => (e) => setForm((v) => ({ ...v, [key]: e.target.value }));
  async function submit(e) { e.preventDefault(); setBusy(true); setError(''); try { const body = { ...form, permissions: [], guardianEmail: form.guardianEmail || undefined }; setResult(await teamReadyApi.createInvitation(teamId, body)); } catch (err) { setError(err.message); } finally { setBusy(false); } }
  return <><PageHeader title="Invite a player" subtitle="Generate a secure, expiring player invitation from the backend." tag="Connected"/><form className="card" onSubmit={submit}>{error && <Notice type="error">{error}</Notice>}{result && <Notice type="success"><strong>Invitation created.</strong><br/><a href={result.acceptUrl}>{result.acceptUrl}</a></Notice>}<div className="form-grid"><Field label="Player name"><input value={form.fullName} onChange={change('fullName')}/></Field><Field label="Email"><input type="email" value={form.email} onChange={change('email')}/></Field><Field label="Position"><input value={form.position} onChange={change('position')}/></Field><Field label="Jersey number"><input value={form.jerseyNumber} onChange={change('jerseyNumber')}/></Field></div><Field label="Guardian email (optional)"><input type="email" value={form.guardianEmail} onChange={change('guardianEmail')}/></Field><button className="primary" disabled={!teamId || busy}>{busy ? 'Sending…' : 'Create invitation'}</button></form></>;
}

function Scale({ value, onChange }) { return <div className="scale">{Array.from({ length: 10 }, (_, i) => i + 1).map((n) => <button type="button" key={n} className={value === n ? 'selected' : ''} onClick={() => onChange(n)}>{n}</button>)}</div>; }
function CheckIn({ teamId }) {
  const [answers, setAnswers] = useState({ checkInDate: today, sleepHours: 7.5, sleepQuality: 8, energy: 8, fatigue: 3, soreness: 2, stress: 3, motivation: 9, hasPain: false, painLocation: '', painSeverity: 1, illnessSymptoms: '', selfReadiness: 9, playerNote: '' });
  const [status, setStatus] = useState({ busy: false, error: '', result: null });
  const set = (key, value) => setAnswers((v) => ({ ...v, [key]: value }));
  async function submit(e) { e.preventDefault(); setStatus({ busy: true, error: '', result: null }); try { const body = { ...answers, sleepHours: Number(answers.sleepHours), painLocation: answers.hasPain ? answers.painLocation : undefined, painSeverity: answers.hasPain ? Number(answers.painSeverity) : undefined, illnessSymptoms: answers.illnessSymptoms || undefined, playerNote: answers.playerNote || undefined }; setStatus({ busy: false, error: '', result: await teamReadyApi.submitCheckIn(teamId, body) }); } catch (err) { setStatus({ busy: false, error: err.message, result: null }); } }
  const scales = [['sleepQuality','Sleep quality'],['energy','Energy'],['fatigue','Fatigue'],['soreness','Soreness'],['stress','Stress'],['motivation','Motivation'],['selfReadiness','Readiness']];
  return <><PageHeader title="Daily check-in" subtitle="Submit the twelve-question wellness response to the selected team." tag="Connected"/><form className="card checkin-card" onSubmit={submit}>{status.error && <Notice type="error">{status.error}</Notice>}{status.result && <Notice type="success">Saved. Calculated readiness: <strong>{status.result.calculatedReadiness}</strong> · {status.result.availability}</Notice>}<div className="form-grid"><Field label="Check-in date"><input type="date" value={answers.checkInDate} onChange={(e) => set('checkInDate', e.target.value)}/></Field><Field label="Sleep hours"><input type="number" step="0.5" min="0" max="16" value={answers.sleepHours} onChange={(e) => set('sleepHours', e.target.value)}/></Field></div><div className="question-grid">{scales.map(([key,label]) => <div className="question" key={key}><h3>{label}</h3><Scale value={answers[key]} onChange={(value) => set(key, value)}/></div>)}</div><div className="form-grid"><Field label="Pain"><select value={answers.hasPain ? 'yes' : 'no'} onChange={(e) => set('hasPain', e.target.value === 'yes')}><option value="no">No</option><option value="yes">Yes</option></select></Field><Field label="Pain location"><input disabled={!answers.hasPain} value={answers.painLocation} onChange={(e) => set('painLocation', e.target.value)}/></Field><Field label="Pain severity"><input disabled={!answers.hasPain} type="number" min="1" max="10" value={answers.painSeverity} onChange={(e) => set('painSeverity', e.target.value)}/></Field><Field label="Illness symptoms"><input value={answers.illnessSymptoms} onChange={(e) => set('illnessSymptoms', e.target.value)}/></Field></div><Field label="Private note"><textarea value={answers.playerNote} onChange={(e) => set('playerNote', e.target.value)}/></Field><button className="primary" disabled={!teamId || status.busy}><CheckCircle2 size={18}/>{status.busy ? 'Submitting…' : 'Submit check-in'}</button></form></>;
}

function Dashboard({ teamId }) {
  const [data, setData] = useState(null); const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  async function load() { if (!teamId) return; setLoading(true); setError(''); try { setData(await teamReadyApi.dashboard(teamId, today)); } catch (err) { setError(err.message); } finally { setLoading(false); } }
  useEffect(() => { load(); }, [teamId]);
  const checkIns = data?.checkIns || data?.players || [];
  return <><PageHeader title="Coach dashboard" subtitle="Live team data returned by the backend API." tag={loading ? 'Loading' : 'Live'}/>{error && <Notice type="error">{error}</Notice>}{!teamId && <Notice>Select or create a team first.</Notice>}{data && <><div className="metrics"><div className="card metric"><Activity/><strong>{data.averageReadiness ?? data.teamReadiness ?? '—'}</strong><span>Team readiness</span></div><div className="card metric"><ClipboardCheck/><strong>{data.completedCount ?? checkIns.length}</strong><span>Completed check-ins</span></div><div className="card metric"><Users/><strong>{data.monitorCount ?? checkIns.filter((p) => ['MONITOR','MODIFIED'].includes(p.availability)).length}</strong><span>Monitor</span></div><div className="card metric"><ShieldCheck/><strong>{data.highRiskCount ?? checkIns.filter((p) => p.availability === 'UNAVAILABLE').length}</strong><span>High risk</span></div></div><section className="card dashboard-grid"><div className="section-title"><h2>Player readiness</h2><button className="secondary" onClick={load}>Refresh</button></div><div className="heatmap">{checkIns.length ? checkIns.map((item) => { const score = item.calculatedReadiness ?? item.readiness; const status = score == null ? 'missing' : score >= 80 ? 'ready' : score >= 65 ? 'monitor' : 'review'; return <div className={`player-tile ${status}`} key={item.id || item.playerId || item.email}><strong>{item.player?.fullName || item.fullName || 'Player'}</strong><span>{score ?? 'No check-in'}</span></div>; }) : <p className="muted">No check-ins for {today}.</p>}</div></section></>}</>;
}

function App() {
  const [session, setSession] = useState(null); const [loading, setLoading] = useState(Boolean(authStore.get())); const [page, setPage] = useState('dashboard'); const [selectedTeamId, setSelectedTeamId] = useState(localStorage.getItem('teamready_team') || '');
  async function refreshMe() { try { const me = await teamReadyApi.me(); setSession(me); if (!selectedTeamId && me.teams?.[0]?.team?.id) selectTeam(me.teams[0].team.id); } catch { authStore.clear(); setSession(null); } finally { setLoading(false); } }
  useEffect(() => { if (authStore.get()) refreshMe(); else setLoading(false); }, []);
  function authenticated() { refreshMe(); }
  function selectTeam(id) { setSelectedTeamId(id); localStorage.setItem('teamready_team', id); }
  function logout() { authStore.clear(); localStorage.removeItem('teamready_team'); setSession(null); }
  if (loading) return <div className="auth-shell"><div className="card">Loading TeamReady…</div></div>;
  if (!session) return <AuthScreen onAuthenticated={authenticated}/>;
  const organisation = session.organisations?.[0]?.organisation; const teams = session.teams || [];
  const content = page === 'dashboard' ? <Dashboard teamId={selectedTeamId}/> : page === 'organisation' ? <><PageHeader title={organisation?.name || 'Organisation'} subtitle="Authenticated organisation and account details." tag="Connected"/><div className="card"><h2>{session.user.fullName}</h2><p>{session.user.email}</p><p className="muted">{organisation?.primarySport} · {organisation?.country}</p></div></> : page === 'team' ? <TeamForm organisationId={organisation?.id} onCreated={() => refreshMe()}/> : page === 'invite' ? <InvitationForm teamId={selectedTeamId}/> : <CheckIn teamId={selectedTeamId}/>;
  return <div className="app"><aside className="sidebar"><div className="brand"><ShieldCheck/><div><strong>TeamReady</strong><small>{session.user.fullName}</small></div></div><div className="team-picker"><label>Active team</label><select value={selectedTeamId} onChange={(e) => selectTeam(e.target.value)}><option value="">Select team</option>{teams.map((membership) => <option value={membership.team.id} key={membership.team.id}>{membership.team.name} · {membership.role}</option>)}</select></div><nav>{nav.map(([id, Icon, label]) => <button key={id} className={page === id ? 'active' : ''} onClick={() => setPage(id)}><Icon size={17}/><span>{label}</span></button>)}</nav><button className="logout" onClick={logout}><LogOut size={17}/> Sign out</button></aside><main>{content}</main></div>;
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);
