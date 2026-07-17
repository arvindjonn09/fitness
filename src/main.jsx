import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity, AlertTriangle, Building2, CheckCircle2, ChevronRight,
  ClipboardCheck, HeartPulse, LayoutDashboard, Mail, ShieldCheck,
  UserPlus, Users, UserRound, XCircle
} from 'lucide-react';
import './styles.css';

const navItems = [
  ['organisation', Building2, 'Organisation signup'],
  ['staff', UserPlus, 'Staff & coaches'],
  ['team', Users, 'Create team'],
  ['invite', Mail, 'Invite players'],
  ['accept', ShieldCheck, 'Player onboarding'],
  ['checkin', ClipboardCheck, 'Daily check-in'],
  ['dashboard', LayoutDashboard, 'Coach dashboard'],
  ['player', UserRound, 'Individual player']
];

const players = [
  { name: 'Arvind J.', position: 'Midfielder', readiness: 88, status: 'ready' },
  { name: 'James R.', position: 'Goalkeeper', readiness: 91, status: 'ready' },
  { name: 'Noah K.', position: 'Defender', readiness: 71, status: 'monitor' },
  { name: 'Liam P.', position: 'Forward', readiness: 48, status: 'review' },
  { name: 'Ethan M.', position: 'Defender', readiness: 85, status: 'ready' },
  { name: 'Oliver T.', position: 'Midfielder', readiness: 87, status: 'ready' },
  { name: 'Lucas B.', position: 'Forward', readiness: 68, status: 'monitor' },
  { name: 'Henry S.', position: 'Defender', readiness: null, status: 'missing' },
  { name: 'Leo W.', position: 'Defender', readiness: 90, status: 'ready' },
  { name: 'Jack D.', position: 'Midfielder', readiness: 84, status: 'ready' }
];

const questions = [
  { id: 'sleepHours', title: 'How many hours did you sleep?', type: 'number', help: 'Enter total sleep, including naps if relevant.' },
  { id: 'sleepQuality', title: 'How would you rate your sleep quality?', low: 'Very poor', high: 'Excellent' },
  { id: 'energy', title: 'How energetic do you feel today?', low: 'No energy', high: 'Fully energised' },
  { id: 'fatigue', title: 'How fatigued do you feel?', low: 'Not fatigued', high: 'Extremely fatigued', inverse: true },
  { id: 'soreness', title: 'How sore are your muscles?', low: 'No soreness', high: 'Extreme soreness', inverse: true },
  { id: 'stress', title: 'How stressed do you feel?', low: 'Calm', high: 'Extremely stressed', inverse: true },
  { id: 'motivation', title: 'How motivated are you to train or play?', low: 'Not motivated', high: 'Fully motivated' },
  { id: 'pain', title: 'Do you have pain or discomfort?', type: 'select', options: ['No', 'Mild', 'Moderate', 'Severe'] },
  { id: 'painArea', title: 'Where is the pain?', type: 'select', options: ['No pain', 'Head or neck', 'Shoulder', 'Back', 'Hip', 'Hamstring', 'Knee', 'Ankle or foot', 'Other'] },
  { id: 'illness', title: 'Do you have illness symptoms?', type: 'select', options: ['No', 'Cold or cough', 'Fever', 'Stomach issue', 'Headache', 'Other'] },
  { id: 'readiness', title: 'How ready do you feel to train or play today?', low: 'Not ready', high: 'Fully ready' },
  { id: 'note', title: 'Is there anything the coach should know?', type: 'textarea', help: 'Optional private note to authorised staff.' }
];

function Field({ label, children }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

function PageHeader({ title, subtitle, tag }) {
  return <header className="page-header"><div><h1>{title}</h1><p>{subtitle}</p></div>{tag && <span className="tag">{tag}</span>}</header>;
}

function Organisation({ next }) {
  return <><PageHeader title="Organisation signup" subtitle="The first verified user becomes the organisation owner." tag="Setup 1 of 4" />
    <div className="two-col"><section className="card"><h2>Create your organisation</h2><div className="form-grid">
      <Field label="Organisation name"><input defaultValue="Western Sydney Football Academy" /></Field>
      <Field label="Organisation type"><select defaultValue="academy"><option value="academy">Sports academy</option><option>Club</option><option>School</option></select></Field>
      <Field label="Primary sport"><select><option>Football</option><option>Cricket</option><option>Rugby</option></select></Field>
      <Field label="Country"><select><option>Australia</option></select></Field>
      <Field label="Owner full name"><input defaultValue="Daniel Smith" /></Field>
      <Field label="Work email"><input type="email" defaultValue="daniel@example.com" /></Field>
    </div><Field label="Password"><input type="password" defaultValue="password123" /></Field>
    <button className="primary" onClick={next}>Create organisation <ChevronRight size={17} /></button></section>
    <aside className="card summary"><h2>Foundation</h2><p>Players belong to teams, while coaches receive permission to manage assigned teams. This prevents one coach from permanently owning player records.</p><ul><li>Email verification</li><li>Role-based permissions</li><li>Multiple teams and coaches</li><li>Audit history</li></ul></aside></div></>;
}

function Staff() {
  return <><PageHeader title="Staff and coaches" subtitle="Invite staff and control access separately from their job title." tag="Setup 2 of 4" /><div className="two-col">
    <section className="card"><h2>Invite staff member</h2><Field label="Full name"><input defaultValue="Sarah Lee" /></Field><Field label="Email"><input defaultValue="sarah@example.com" /></Field><Field label="Designation"><select><option>Head coach</option><option>Assistant coach</option><option>Fitness coach</option><option>Physiotherapist</option><option>Analyst</option></select></Field><Field label="Assigned team"><select><option>Under 18 Boys</option><option>Senior Team</option></select></Field><div className="checks"><label><input type="checkbox" defaultChecked /> View wellness data</label><label><input type="checkbox" defaultChecked /> Add coach notes</label><label><input type="checkbox" /> Invite or remove players</label><label><input type="checkbox" /> View injury details</label></div><button className="primary">Send staff invitation</button></section>
    <section className="card"><h2>Current staff</h2><DataTable rows={[['Daniel Smith','Organisation owner','All teams','Active'],['Sarah Lee','Head coach','U18 Boys','Pending'],['Michael Tan','Physiotherapist','Senior Team','Active']]} /></section></div></>;
}

function Team() {
  return <><PageHeader title="Create a team" subtitle="Team membership connects players and authorised staff." tag="Setup 3 of 4" /><section className="card"><div className="form-grid three">
    <Field label="Team name"><input defaultValue="Under 18 Boys" /></Field><Field label="Sport"><select><option>Football</option></select></Field><Field label="Age group"><select><option>Under 18</option></select></Field><Field label="Season"><input defaultValue="2026" /></Field><Field label="Competition"><input defaultValue="NSW Youth League" /></Field><Field label="Timezone"><select><option>Australia/Sydney</option></select></Field><Field label="Training days"><input defaultValue="Tuesday, Thursday" /></Field><Field label="Match day"><select><option>Saturday</option></select></Field><Field label="Head coach"><select><option>Sarah Lee</option></select></Field>
  </div><button className="primary">Create team</button></section></>;
}

function Invite() {
  return <><PageHeader title="Invite players" subtitle="Send secure invitations individually or import the squad by CSV." tag="Setup 4 of 4" /><div className="two-col"><section className="card"><h2>Invite one player</h2><Field label="Player full name"><input defaultValue="Arvind Jonnalagadda" /></Field><Field label="Email"><input defaultValue="arvind@example.com" /></Field><div className="form-grid"><Field label="Position"><select><option>Midfielder</option></select></Field><Field label="Jersey number"><input defaultValue="8" /></Field></div><Field label="Parent or guardian email"><input placeholder="Required where applicable" /></Field><div className="button-row"><button className="primary">Send invitation</button><button className="secondary">Upload CSV</button></div></section><section className="card"><h2>Invitation status</h2><DataTable rows={[['Arvind J.','Midfielder','Pending'],['James R.','Goalkeeper','Accepted'],['Noah K.','Defender','Expired']]} /></section></div></>;
}

function Accept() {
  return <><PageHeader title="Player onboarding" subtitle="Preview of the secure invitation link opened by a player." tag="Mobile flow" /><div className="phone"><div className="phone-head"><strong>Join Under 18 Boys</strong><small>Western Sydney Football Academy</small></div><div className="phone-body"><div className="notice">Coach Sarah Lee invited you to join this team.</div><h2>Create your account</h2><Field label="Email"><input value="arvind@example.com" readOnly /></Field><Field label="Create password"><input type="password" defaultValue="password123" /></Field><Field label="Date of birth"><input type="date" /></Field><Field label="Playing position"><select><option>Midfielder</option></select></Field><Field label="Emergency contact"><input placeholder="Name and phone number" /></Field><label className="consent"><input type="checkbox" defaultChecked /> I understand which authorised staff can view my wellness information.</label><button className="primary full">Accept and join team</button></div></div></>;
}

function Scale({ value, onChange }) {
  return <div className="scale">{Array.from({length:10},(_,i)=>i+1).map(n=><button key={n} className={value===n?'selected':''} onClick={()=>onChange(n)}>{n}</button>)}</div>;
}

function Checkin() {
  const [answers,setAnswers]=useState({sleepHours:7.5,sleepQuality:8,energy:8,fatigue:3,soreness:2,stress:3,motivation:9,pain:'No',painArea:'No pain',illness:'No',readiness:9,note:''});
  const update=(id,value)=>setAnswers(v=>({...v,[id]:value}));
  return <><PageHeader title="Daily player check-in" subtitle="Twelve focused questions designed to take roughly 90 seconds." tag="Player flow" /><section className="card checkin-card"><div className="progress"><span style={{width:'58%'}} /></div><p className="muted small">7 of 12 questions previewed</p><div className="question-grid">{questions.map((q,index)=><div className="question" key={q.id}><div className="question-title"><b>{index+1}</b><h3>{q.title}</h3></div>{q.help&&<p className="small muted">{q.help}</p>}{q.type==='number'?<input type="number" step="0.5" value={answers[q.id]} onChange={e=>update(q.id,e.target.value)} />:q.type==='select'?<select value={answers[q.id]} onChange={e=>update(q.id,e.target.value)}>{q.options.map(o=><option key={o}>{o}</option>)}</select>:q.type==='textarea'?<textarea value={answers[q.id]} onChange={e=>update(q.id,e.target.value)} placeholder="Optional note" />:<><div className="scale-labels"><span>1 = {q.low}</span><span>10 = {q.high}</span></div><Scale value={answers[q.id]} onChange={v=>update(q.id,v)} /></>}</div>)}</div><button className="primary submit"><CheckCircle2 size={18}/> Submit today’s check-in</button></section></>;
}

function Dashboard({ openPlayer }) {
  const avg=Math.round(players.filter(p=>p.readiness).reduce((s,p)=>s+p.readiness,0)/players.filter(p=>p.readiness).length);
  return <><PageHeader title="Coach dashboard" subtitle="Under 18 Boys · Today’s squad overview" tag="Live preview" /><div className="metrics"><Metric value={avg} label="Team readiness / 100" icon={Activity}/><Metric value="23/27" label="Check-ins completed" icon={ClipboardCheck}/><Metric value="3" label="Players to monitor" icon={AlertTriangle}/><Metric value="1" label="High-risk alert" icon={HeartPulse}/></div><div className="two-col dashboard-grid"><section className="card"><h2>Team readiness heatmap</h2><div className="heatmap">{players.map(p=><button key={p.name} className={`player-tile ${p.status}`} onClick={p.name.startsWith('Arvind')?openPlayer:undefined}><strong>{p.name}</strong><span>{p.readiness?`${p.readiness} · ${p.position}`:'No check-in'}</span></button>)}</div><div className="legend"><span><i className="ready"/>Ready</span><span><i className="monitor"/>Monitor</span><span><i className="review"/>Review</span><span><i className="missing"/>Missing</span></div></section><section className="card"><h2>Seven-day team readiness</h2><BarChart values={[74,79,72,69,76,82,84]} labels={['Mon','Tue','Wed','Thu','Fri','Sat','Sun']} /></section></div><div className="two-col dashboard-grid"><section className="card"><h2>Team body map</h2><div className="body-map"><div className="person"><i className="head"/><i className="torso"/><i className="arm left"/><i className="arm right"/><i className="leg left hot"/><i className="leg right warm"/></div><div><p><Status type="review" text="4 reports"/> Left knee</p><p><Status type="monitor" text="2 reports"/> Right hamstring</p><p><Status type="monitor" text="1 report"/> Lower back</p></div></div></section><section className="card"><h2>Priority alerts</h2><div className="alerts"><Alert icon={XCircle} title="Liam P." text="Severe knee pain and fatigue 8/10" type="review"/><Alert icon={AlertTriangle} title="Lucas B." text="Only 4.5 hours sleep" type="monitor"/><Alert icon={AlertTriangle} title="Noah K." text="Readiness dropped 18 points" type="monitor"/></div></section></div></>;
}

function Player() {
  return <><PageHeader title="Arvind Jonnalagadda" subtitle="Midfielder · Jersey 8 · Active" tag="Individual view" /><div className="metrics"><Metric value="88" label="Readiness" icon={Activity}/><Metric value="7.5h" label="Sleep" icon={ClipboardCheck}/><Metric value="3/10" label="Fatigue" icon={AlertTriangle}/><Metric value="2/10" label="Soreness" icon={HeartPulse}/></div><div className="two-col dashboard-grid"><section className="card"><h2>Today’s answers</h2><DataTable rows={[['Sleep quality','8/10'],['Energy','8/10'],['Stress','3/10'],['Motivation','9/10'],['Pain','None'],['Illness','None'],['Self-rated readiness','9/10']]} /></section><section className="card"><h2>Personal readiness trend</h2><BarChart values={[79,82,76,84,86,88]} labels={['Mon','Tue','Wed','Thu','Fri','Today']} /></section></div><section className="card decision"><h2>Coach decision</h2><div className="decision-grid"><button className="primary">Full training</button><button className="secondary">Modified training</button><button className="danger">Rest or medical review</button></div><p className="muted small">The score supports a decision. It does not medically clear a player.</p></section></>;
}

function Metric({value,label,icon:Icon}) { return <div className="card metric"><Icon size={20}/><strong>{value}</strong><span>{label}</span></div>; }
function Status({type,text}) { return <span className={`status ${type}`}>{text}</span>; }
function Alert({icon:Icon,title,text,type}) { return <div className="alert"><Icon size={20}/><div><strong>{title}</strong><p>{text}</p></div><Status type={type} text={type==='review'?'Medical review':'Monitor'} /></div>; }
function BarChart({values,labels}) { const max=Math.max(...values); return <div className="bar-chart">{values.map((v,i)=><div className="bar-wrap" key={labels[i]}><b>{v}</b><div className="bar" style={{height:`${(v/max)*170}px`}}/><span>{labels[i]}</span></div>)}</div>; }
function DataTable({rows}) { return <div className="table-wrap"><table><tbody>{rows.map((r,i)=><tr key={i}>{r.map((c,j)=><td key={j}>{j===r.length-1&&['Active','Pending','Accepted','Expired'].includes(c)?<Status type={c==='Active'||c==='Accepted'?'ready':c==='Pending'?'monitor':'missing'} text={c}/>:c}</td>)}</tr>)}</tbody></table></div>; }

function App() {
  const [screen,setScreen]=useState('organisation');
  const Current=useMemo(()=>({organisation:Organisation,staff:Staff,team:Team,invite:Invite,accept:Accept,checkin:Checkin,dashboard:Dashboard,player:Player})[screen],[screen]);
  const currentIndex=navItems.findIndex(([id])=>id===screen);
  return <div className="app"><aside className="sidebar"><div className="brand"><Activity/><div><strong>TeamReady</strong><small>Wellness preview</small></div></div><nav>{navItems.map(([id,Icon,label],i)=><button key={id} className={screen===id?'active':''} onClick={()=>setScreen(id)}><span>{i+1}</span><Icon size={17}/>{label}</button>)}</nav></aside><main><Current next={()=>setScreen(navItems[Math.min(currentIndex+1,navItems.length-1)][0])} openPlayer={()=>setScreen('player')} /></main></div>;
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
