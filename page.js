'use client';

import { useEffect, useMemo, useState } from 'react';
import { sampleCompanies } from '../lib/sample-data';
import { Building2, CalendarClock, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Eye, Flame, RefreshCw, Search, SlidersHorizontal, X } from 'lucide-react';

const DAY = 86400000;
const parseDate = value => { if (!value) return null; const text = String(value).trim(); let m = text.match(/^(\d{1,2})[-/]([0-1]?\d)[-/](\d{4})$/); if (m) return new Date(+m[3], +m[2] - 1, +m[1]); m = text.match(/^(\d{4})[-/]([0-1]?\d)[-/](\d{1,2})/); if (m) return new Date(+m[1], +m[2] - 1, +m[3]); const d = new Date(text); return Number.isNaN(d.getTime()) ? null : d; };
const daysSince = value => { const d = parseDate(value); if (!d) return null; const now = new Date(); now.setHours(0, 0, 0, 0); return Math.max(0, Math.floor((now - d) / DAY)); };
const dateLabel = value => { const d = parseDate(value); return d ? d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Not recorded'; };
const isDone = r => r.processStatus === 'Completed';
const isHot = r => String(r.status || '').toLowerCase().includes('hot');
const unique = (rows, key) => ['All', ...Array.from(new Set(rows.map(r => r[key]).filter(Boolean))).sort()];
const badgeClass = value => isHot({ status: value }) ? 'hot' : /completed|closed/i.test(value || '') ? 'done' : '';

export default function Dashboard() {
  const [companies, setCompanies] = useState(sampleCompanies);
  const [live, setLive] = useState(false);
  const [updated, setUpdated] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('overview');
  const [query, setQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [owner, setOwner] = useState('All');
  const [industry, setIndustry] = useState('All');
  const [status, setStatus] = useState('All');
  const [category, setCategory] = useState('All');
  const [segment, setSegment] = useState('All');
  const [sort, setSort] = useState({ key: 'days', dir: 'desc' });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const title = process.env.NEXT_PUBLIC_DASHBOARD_TITLE || 'Individual Companies Follow-up Status';

  const refresh = async () => { setLoading(true); try { const response = await fetch('/api/companies', { cache: 'no-store' }); const data = await response.json(); if (data.live && Array.isArray(data.companies)) { setCompanies(data.companies); setLive(true); setUpdated(data.refreshedAt || new Date().toISOString()); } } catch (_) {} finally { setLoading(false); } };
  useEffect(() => { refresh(); const timer = setInterval(refresh, 15 * 60 * 1000); return () => clearInterval(timer); }, []);

  const rows = useMemo(() => companies.map(r => ({ ...r, days: daysSince(r.lastConversation) })), [companies]);
  const active = rows.filter(r => !isDone(r));
  const hot = active.filter(isHot);
  const attention = active.filter(r => r.days === null || r.days > 15);
  const dated = active.filter(r => r.days !== null);
  const averageDays = dated.length ? Math.round(dated.reduce((total, r) => total + r.days, 0) / dated.length) : 0;
  const statusCounts = useMemo(() => { const map = {}; active.forEach(r => { const label = r.status || 'Not updated'; map[label] = (map[label] || 0) + 1; }); return Object.entries(map).sort((a, b) => b[1] - a[1]); }, [active]);
  const outreach = useMemo(() => Array.from({ length: 6 }, (_, index) => { const month = new Date(); month.setDate(1); month.setMonth(month.getMonth() - (5 - index)); return { label: month.toLocaleString('en', { month: 'short' }), count: rows.filter(r => { const date = parseDate(r.lastConversation); return date && date.getMonth() === month.getMonth() && date.getFullYear() === month.getFullYear(); }).length }; }), [rows]);
  const filtered = useMemo(() => rows.filter(r => {
    const text = [r.company, r.owner, r.industry, r.status, r.nextAction].join(' ').toLowerCase();
    const segmentMatch = segment === 'All' || (segment === 'Hot' && isHot(r)) || (segment === 'Attention' && (r.days === null || r.days > 15) && !isDone(r)) || (segment === 'Completed' && isDone(r));
    return text.includes(query.toLowerCase()) && (owner === 'All' || r.owner === owner) && (industry === 'All' || r.industry === industry) && (status === 'All' || r.status === status) && (category === 'All' || r.category === category) && segmentMatch;
  }), [rows, query, owner, industry, status, category, segment]);
  const sorted = useMemo(() => [...filtered].sort((a, b) => { let x = a[sort.key], y = b[sort.key]; if (sort.key === 'days') { x = x === null ? 9999 : x; y = y === null ? 9999 : y; } else { x = String(x || '').toLowerCase(); y = String(y || '').toLowerCase(); } return x > y ? (sort.dir === 'asc' ? 1 : -1) : x < y ? (sort.dir === 'asc' ? -1 : 1) : 0; }), [filtered, sort]);
  const perPage = 12, pages = Math.max(1, Math.ceil(sorted.length / perPage)), visible = sorted.slice((page - 1) * perPage, page * perPage);
  useEffect(() => setPage(1), [query, owner, industry, status, category, segment]);
  const choose = value => { setSegment(segment === value ? 'All' : value); setTab('portfolio'); };
  const clear = () => { setQuery(''); setOwner('All'); setIndustry('All'); setStatus('All'); setCategory('All'); setSegment('All'); };
  const maxOutreach = Math.max(...outreach.map(x => x.count), 1);

  return <main>
    <header><div><p className="eyebrow">CORPORATE RELATIONS · LIVE PIPELINE</p><h1>{title}</h1><p className="subhead">Explore company relationships, outreach activity and follow-up priorities.</p></div><div className="headerActions"><div className="refreshStatus"><i className={live ? 'liveDot' : 'snapshotDot'} />{live ? 'Live Google Sheet' : 'Snapshot data'}<small>{updated ? 'Updated ' + new Date(updated).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Auto-refreshes every 15 min'}</small></div><button className="refreshButton" onClick={refresh} disabled={loading}><RefreshCw size={16} className={loading ? 'spin' : ''} />{loading ? 'Refreshing' : 'Refresh now'}</button></div></header>
    <nav>{[['overview', 'Overview'], ['action', 'Action centre'], ['portfolio', 'Company portfolio']].map(([key, label]) => <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>{label}{key === 'action' && attention.length ? <b>{attention.length}</b> : null}</button>)}</nav>
    <section className="kpis">
      <Metric label="Total companies" value={rows.length} icon={<Building2 size={20} />} hint="All tracked relationships" active={segment === 'All'} onClick={() => choose('All')} />
      <Metric label="Hot accounts" value={hot.length} icon={<Flame size={20} />} hint="Active, high-priority opportunities" active={segment === 'Hot'} onClick={() => choose('Hot')} />
      <Metric label="Avg. days since conversation" value={averageDays} icon={<CalendarClock size={20} />} hint="Across active accounts" active={segment === 'Attention'} onClick={() => choose('Attention')} />
    </section>
    <section className="toolbar"><label className="search"><Search size={17} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search company, owner, industry or next action" />{query && <button onClick={() => setQuery('')} aria-label="Clear search"><X size={15} /></button>}</label><button className="filterButton" onClick={() => setFiltersOpen(!filtersOpen)}><SlidersHorizontal size={16} />Filters</button>{(query || owner !== 'All' || industry !== 'All' || status !== 'All' || category !== 'All' || segment !== 'All') && <button className="clearButton" onClick={clear}>Clear all</button>}</section>
    {filtersOpen && <section className="filters"><Select label="Owner" value={owner} change={setOwner} options={unique(rows, 'owner')} /><Select label="Industry" value={industry} change={setIndustry} options={unique(rows, 'industry')} /><Select label="Company status" value={status} change={setStatus} options={unique(rows, 'status')} /><Select label="Relationship category" value={category} change={setCategory} options={unique(rows, 'category')} /></section>}
    {tab === 'overview' && <><section className="analytics"><article className="panel"><div className="panelHead"><div><h2>Pipeline by company status</h2><p>Click a status to drill into matching companies.</p></div></div><div className="statusList">{statusCounts.map(([label, count]) => <button key={label} onClick={() => { setStatus(status === label ? 'All' : label); setTab('portfolio'); }}><span className={'dot ' + badgeClass(label)} /><span>{label}</span><b>{count}</b><i><em style={{ width: (count / Math.max(...statusCounts.map(x => x[1]), 1)) * 100 + '%' }} /></i></button>)}</div></article><article className="panel"><div className="panelHead"><div><h2>Monthly outreach</h2><p>Last conversation dates across the last six months.</p></div></div><div className="bars">{outreach.map(item => <div key={item.label}><span style={{ height: (item.count / maxOutreach) * 120 + 8 }}><b>{item.count || ''}</b></span><small>{item.label}</small></div>)}</div></article></section><section className="panel"><div className="panelHead"><div><h2>Immediate attention</h2><p>Active accounts with no conversation date or no contact in more than 15 days.</p></div><button className="textButton" onClick={() => choose('Attention')}>View all <ChevronRight size={16} /></button></div><Table rows={attention.slice(0, 6)} sort={sort} setSort={setSort} select={setSelected} /></section></>}
    {tab === 'action' && <section className="panel"><div className="panelHead"><div><h2>Action centre</h2><p>{attention.length} accounts currently need attention.</p></div></div><Table rows={attention} sort={sort} setSort={setSort} select={setSelected} /></section>}
    {tab === 'portfolio' && <section className="panel"><div className="panelHead"><div><h2>Company portfolio</h2><p>{sorted.length} matching companies · Select any row to see full details.</p></div><span className="resultTag">{segment === 'All' ? 'All records' : segment}</span></div><Table rows={visible} sort={sort} setSort={setSort} select={setSelected} /><div className="pagination"><span>Showing {sorted.length ? (page - 1) * perPage + 1 : 0}–{Math.min(page * perPage, sorted.length)} of {sorted.length}</span><div><button disabled={page === 1} onClick={() => setPage(page - 1)}><ChevronLeft size={16} /></button><b>{page} / {pages}</b><button disabled={page === pages} onClick={() => setPage(page + 1)}><ChevronRight size={16} /></button></div></div></section>}
    <footer>{live ? 'Connected securely to Google Sheets · Refreshes automatically every 15 minutes.' : 'Add the Google credentials in Vercel to activate live Sheet data.'}</footer>
    {selected && <Details company={selected} close={() => setSelected(null)} />}
  </main>;
}
function Metric({ label, value, icon, hint, active, onClick }) { return <button className={'kpi ' + (active ? 'chosen' : '')} onClick={onClick}><span className="kicon">{icon}</span><span>{label}</span><strong>{value}</strong><small>{hint}</small></button>; }
function Select({ label, value, change, options }) { return <label className="filter"><span>{label}</span><select value={value} onChange={e => change(e.target.value)}>{options.map(option => <option key={option}>{option}</option>)}</select></label>; }
function Table({ rows, sort, setSort, select }) { const fields = [['company', 'Company'], ['owner', 'Owner'], ['status', 'Status'], ['industry', 'Industry'], ['lastConversation', 'Last conversation'], ['days', 'Days since'], ['nextAction', 'Next action']]; const toggle = key => setSort(current => ({ key, dir: current.key === key && current.dir === 'desc' ? 'asc' : 'desc' })); return <div className="tableWrap"><table><thead><tr>{fields.map(([key, label]) => <th key={key}><button onClick={() => toggle(key)}>{label}{sort.key === key && (sort.dir === 'asc' ? <ChevronUp /> : <ChevronDown />)}</button></th>)}<th /></tr></thead><tbody>{rows.map((row, index) => <tr key={row.company + index} onClick={() => select(row)}><td><b>{row.company}</b><small>{row.category || 'Uncategorised'}</small></td><td>{row.owner || '—'}</td><td><span className={'badge ' + badgeClass(row.status)}>{row.status || 'Not updated'}</span></td><td>{row.industry || '—'}</td><td>{dateLabel(row.lastConversation)}</td><td>{row.days === null ? <span className="badge danger">Missing</span> : <span className={'badge ' + (row.days > 15 ? 'danger' : 'ok')}>{row.days} days</span>}</td><td className="nextAction">{row.nextAction}</td><td><Eye size={17} /></td></tr>)}</tbody></table>{!rows.length && <div className="empty">No matching companies. Try clearing a filter.</div>}</div>; }
function Details({ company, close }) { return <div className="drawerBack" onClick={close}><aside className="drawer" onClick={e => e.stopPropagation()}><button className="close" onClick={close}><X /></button><p className="eyebrow">COMPANY PROFILE</p><h2>{company.company}</h2><div className="detailBadges"><span className={'badge ' + badgeClass(company.status)}>{company.status || 'Not updated'}</span><span className="badge">{company.processStatus}</span></div><dl>{[['Owner', company.owner], ['Industry', company.industry], ['Category', company.category], ['Expected CTC', company.expectedCtc], ['Last conversation', dateLabel(company.lastConversation)], ['Days since conversation', company.days === null ? 'Not recorded' : company.days + ' days'], ['Targeted month', company.targetMonth]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || 'Not updated'}</dd></div>)}</dl><section className="nextBox"><span>Next planned action</span><b>{company.nextAction}</b></section></aside></div>; }
