'use client';
import {useEffect,useMemo,useState} from 'react';
import {sampleCompanies} from '../lib/sample-data';
import {Building2,CheckCircle2,Clock3,Flame,Search,TriangleAlert} from 'lucide-react';

const TODAY=new Date(); TODAY.setHours(0,0,0,0);
const parseSheetDate=value=>{
 if(!value)return null;
 const text=String(value).trim();
 let match=text.match(/^(\d{1,2})[-\/]([0-1]?\d)[-\/](\d{4})$/);
 if(match){const date=new Date(Number(match[3]),Number(match[2])-1,Number(match[1]));return Number.isNaN(date.getTime())?null:date}
 match=text.match(/^(\d{4})[-\/]([0-1]?\d)[-\/](\d{1,2})/);
 if(match){const date=new Date(Number(match[1]),Number(match[2])-1,Number(match[3]));return Number.isNaN(date.getTime())?null:date}
 const date=new Date(text);return Number.isNaN(date.getTime())?null:date;
};
const age=value=>{const date=parseSheetDate(value);return date?Math.max(0,Math.floor((TODAY-date)/86400000)):null};
const displayDate=value=>{const date=parseSheetDate(value);return date?`${String(date.getDate()).padStart(2,'0')}-${String(date.getMonth()+1).padStart(2,'0')}-${date.getFullYear()}`:'Not recorded'};
const badge=(v,type='')=><span className={'badge '+type}>{v||'Not updated'}</span>;
export default function Dashboard(){
 const dashboardTitle=process.env.NEXT_PUBLIC_DASHBOARD_TITLE||'Individual Companies Follow-up Status';
 const [tab,setTab]=useState('overview'); const [query,setQuery]=useState('');
 const [categoryFilter,setCategoryFilter]=useState('All'); const [statusFilter,setStatusFilter]=useState('All'); const [ctcFilter,setCtcFilter]=useState('All');
 const [companies,setCompanies]=useState(sampleCompanies); const [live,setLive]=useState(false);
 useEffect(()=>{fetch('/api/companies',{cache:'no-store'}).then(r=>r.json()).then(d=>{if(d.live&&d.companies?.length){setCompanies(d.companies);setLive(true)}}).catch(()=>{})},[]);
 const rows=useMemo(()=>companies.map(x=>({...x,days:age(x.lastConversation)})),[companies]);
 const completed=rows.filter(x=>x.processStatus==='Completed');
 const attention=rows.filter(x=>x.processStatus!=='Completed'&&(x.days===null||x.days>15));
 const recent=rows.filter(x=>x.days!==null&&x.days<=15).length;
 const categories=['All',...new Set(rows.map(x=>x.category).filter(Boolean))];
 const statuses=['All',...new Set(rows.map(x=>x.status).filter(Boolean))];
 const ctcs=['All',...new Set(rows.map(x=>x.expectedCtc).filter(Boolean))];
 const filtered=rows.filter(x=>x.company.toLowerCase().includes(query.toLowerCase())&&(categoryFilter==='All'||x.category===categoryFilter)&&(statusFilter==='All'||x.status===statusFilter)&&(ctcFilter==='All'||x.expectedCtc===ctcFilter));
 const kpis=[
  ['Portfolio',rows.length,Building2,'All tracked companies'],
  ['15-day compliance',Math.round(recent/rows.length*100)+'%',CheckCircle2,'Contacted in last 15 days'],
  ['Needs attention',attention.length,TriangleAlert,'Overdue or missing date'],
  ['Hot accounts',rows.filter(x=>x.status==='Hot').length,Flame,'High-priority relationships'],
  ['Processes completed',completed.length,CheckCircle2,'Completed account register'],
  ['No conversation date',rows.filter(x=>x.days===null).length,Clock3,'Data or follow-up missing']
 ];
 return <main><header><div><p className="eyebrow">CORPORATE RELATIONS</p><h1>{dashboardTitle}</h1></div><div className="refresh"><i className={live?'liveDot':'snapshotDot'}/>{live?'Live Google Sheet':'Snapshot data'} · {TODAY.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</div></header>
 <nav>{[['overview','Overview'],['actions','Action centre'],['completed','Completed accounts'],['portfolio','Full portfolio']].map(([k,v])=><button key={k} className={tab===k?'active':''} onClick={()=>setTab(k)}>{v}</button>)}</nav>
 {tab==='overview'&&<><section className="kpis">{kpis.map(([l,v,I,s])=><article className="kpi" key={l}><div className="kicon"><I size={20}/></div><p>{l}</p><strong>{v}</strong><small>{s}</small></article>)}</section>
 <section className="grid"><article className="panel span2"><div className="panelhead"><div><h2>Immediate attention</h2><p>Active companies exceeding the 15-day limit or missing a conversation date.</p></div><button onClick={()=>setTab('actions')}>View all</button></div><Table rows={attention.slice(0,6)}/></article>
 <article className="panel"><h2>Portfolio health</h2><p className="muted">Relationship recency across all accounts</p><div className="health"><Ring value={Math.round(recent/rows.length*100)}/><div className="legend"><span><i className="green"/>Within 15 days <b>{recent}</b></span><span><i className="red"/>Needs attention <b>{attention.length}</b></span><span><i className="blue"/>Completed <b>{completed.length}</b></span></div></div></article></section></>}
 {tab==='actions'&&<section className="panel"><div className="panelhead"><div><h2>Action centre</h2><p>Prioritised active accounts requiring follow-up or record completion.</p></div></div><Table rows={attention}/></section>}
 {tab==='completed'&&<section className="panel completed"><div className="panelhead"><div><h2>Completed accounts</h2><p>Completed processes retained for selections, SIP follow-up and relationship nurturing.</p></div></div><Table rows={completed}/></section>}
 {tab==='portfolio'&&<section className="panel"><div className="panelhead"><div><h2>Complete list of companies</h2><p>{filtered.length} companies · Use the dropdowns in the column headers to filter.</p></div><label className="search"><Search size={17}/><input placeholder="Search company" value={query} onChange={e=>setQuery(e.target.value)}/></label></div><Table rows={filtered} full filters={{categoryFilter,setCategoryFilter,categories,statusFilter,setStatusFilter,statuses,ctcFilter,setCtcFilter,ctcs}}/></section>}
 <footer>{live?'Connected securely to Google Sheets. Refresh the page to retrieve the latest entries.':'Add the Google credentials in Vercel to activate live Sheet data.'}</footer></main>
}
function HeaderFilter({label,value,setValue,options}){return <span className="thFilter"><span>{label}</span><select className={value==='All'?'':'selected'} aria-label={'Filter '+label} value={value} onChange={e=>setValue(e.target.value)} title={'Filter '+label}>{options.map(x=><option key={x} value={x}>{x}</option>)}</select></span>}
function Table({rows,full=false,filters}){return <div className={'tablewrap '+(full?'fullTable':'')}><table><thead><tr><th>Company</th>{full&&<th><HeaderFilter label="New/Existing/Assigned/Top 51 Aspirational/Top 50 Existing" value={filters.categoryFilter} setValue={filters.setCategoryFilter} options={filters.categories}/></th>}<th>{full?<HeaderFilter label="Status" value={filters.statusFilter} setValue={filters.setStatusFilter} options={filters.statuses}/>: 'Status'}</th>{full&&<th><HeaderFilter label="Expected CTC" value={filters.ctcFilter} setValue={filters.setCtcFilter} options={filters.ctcs}/></th>}<th>Last conversation date</th><th>Days since conversation</th><th>Next action</th><th>Process</th></tr></thead><tbody>{rows.map(r=><tr key={r.company}><td><b>{r.company}</b>{!full&&<small>{r.category}</small>}</td>{full&&<td>{badge(r.category)}</td>}<td>{badge(r.status,r.status==='Hot'?'hot':/^(completed|closed)$/i.test(r.status)?'done':'')}</td>{full&&<td>{r.expectedCtc||'Not updated'}</td>}<td>{displayDate(r.lastConversation)}</td><td>{r.days===null?badge('Missing','danger'):r.days>15?badge(r.days+' days','danger'):badge(r.days+' days','ok')}</td><td>{r.nextAction}</td><td>{badge(r.processStatus,r.processStatus==='Completed'?'done':'')}</td></tr>)}</tbody></table>{!rows.length&&<div className="empty">No matching companies</div>}</div>}
function Ring({value}){return <div className="ring" style={{'--p':value}}><span><b>{value}%</b><small>compliance</small></span></div>}
