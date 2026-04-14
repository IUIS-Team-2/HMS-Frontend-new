import React, { useState } from 'react';
import { useAuth } from '../App';
import {
  PATIENTS, INVOICES, MEDICINES, HMS_USERS, BRANCHES, DEPARTMENTS,
  BILL_ITEMS, fmt, fmtDate, getFilteredPatients, getFilteredInvoices, downloadCSV,
} from '../data/hmsData';
import {
  Badge, BranchPill, StatCard, Card, CardHeader, Btn, Table,
  Modal, Field, Input, Select, TabBar, Alert, PageHeader, NavItem, OCEAN,
} from '../components/ui';

// ─── Nav config per role ──────────────────────────────────────────────────────
const NAV_BY_ROLE = {
  admin: [
    { label:'Overview',    items:[{id:'dashboard',icon:'📊',label:'Dashboard'},{id:'patients',icon:'🧑‍⚕️',label:'Patients'},{id:'reports',icon:'📋',label:'Reports'}] },
    { label:'Finance',     items:[{id:'billing',icon:'✏️',label:'Edit Bills'},{id:'invoices',icon:'💳',label:'Invoices'}] },
    { label:'Management',  items:[{id:'users',icon:'👥',label:'Manage Employees'},{id:'pharmacy',icon:'💊',label:'Pharmacy'},{id:'discharge',icon:'🚪',label:'Discharge'}] },
  ],
  employee: [
    { label:'My Dashboard', items:[{id:'dashboard',icon:'📊',label:'Dashboard'},{id:'patients',icon:'🧑‍⚕️',label:'Patients'},{id:'reports',icon:'📋',label:'Reports'},{id:'billing',icon:'✏️',label:'Billing'}] },
  ],
  'employee-pharma': [
    { label:'My Dashboard', items:[{id:'dashboard',icon:'📊',label:'Dashboard'},{id:'patients',icon:'🧑‍⚕️',label:'Patients'},{id:'pharmacy',icon:'💊',label:'Pharmacy'}] },
  ],
};

function getRoleKey(user) {
  if (user.role === 'admin') return 'admin';
  if (user.role === 'employee' && user.dept === 'Pharmacy') return 'employee-pharma';
  return 'employee';
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ page, setPage, branch, setBranch, user, onLogout }) {
  const [branchOpen, setBranchOpen] = useState(false);
  const navSections = NAV_BY_ROLE[getRoleKey(user)] || NAV_BY_ROLE.employee;
  const roleLabel = { admin:'Admin', employee:'Employee', superadmin:'Super Admin' }[user.role] || user.role;

  // Employees only see their assigned branch
  const branchOptions = user.role === 'admin'
    ? Object.entries(BRANCHES).filter(([k]) => k !== 'all')
    : [[user.branch, BRANCHES[user.branch]]];

  return (
    <div style={{ width:230, minHeight:'100vh', background:OCEAN[900], display:'flex', flexDirection:'column', position:'fixed', top:0, left:0, zIndex:50 }}>
      {/* Logo */}
      <div style={{ padding:'20px 16px 16px', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'rgba(255,255,255,0.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🏥</div>
          <div>
            <div style={{ color:'#fff', fontWeight:700, fontSize:14 }}>Sangi Hospital</div>
            <div style={{ color:'rgba(255,255,255,0.45)', fontSize:10, textTransform:'uppercase', letterSpacing:'0.08em' }}>IPD Portal</div>
          </div>
        </div>
      </div>

      {/* Branch */}
      <div style={{ padding:'12px 8px', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6, paddingLeft:8 }}>Branch</div>
        {user.role === 'admin' ? (
          <>
            <button onClick={() => setBranchOpen(o => !o)} style={{ width:'100%', padding:'8px 12px', borderRadius:8, background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.15)', color:'#fff', fontSize:13, cursor:'pointer', display:'flex', justifyContent:'space-between' }}>
              <span>{BRANCHES[branch]?.label || 'Select'}</span><span>{branchOpen?'▴':'▾'}</span>
            </button>
            {branchOpen && (
              <div style={{ background:'rgba(255,255,255,0.08)', borderRadius:8, marginTop:4, overflow:'hidden' }}>
                {branchOptions.map(([k,v]) => (
                  <div key={k} onClick={() => { setBranch(k); setBranchOpen(false); }} style={{ padding:'8px 14px', fontSize:13, cursor:'pointer', color:branch===k?'#60a5fa':'rgba(255,255,255,0.7)', fontWeight:branch===k?600:400 }}>{v.label}</div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div style={{ padding:'8px 12px', borderRadius:8, background:'rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.7)', fontSize:13 }}>
            {BRANCHES[user.branch]?.label}
          </div>
        )}
      </div>

      {/* Nav */}
      <div style={{ flex:1, overflowY:'auto', padding:'8px 0' }}>
        {navSections.map(sec => (
          <div key={sec.label} style={{ marginBottom:8 }}>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', padding:'8px 24px 4px' }}>{sec.label}</div>
            {sec.items.map(item => (
              <NavItem key={item.id} icon={item.icon} label={item.label} active={page===item.id} onClick={() => setPage(item.id)} />
            ))}
          </div>
        ))}
      </div>

      {/* User Footer */}
      <div style={{ padding:'12px', borderTop:'1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:'rgba(255,255,255,0.07)', borderRadius:10 }}>
          <div style={{ width:32, height:32, borderRadius:8, background:OCEAN[400], display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, color:'#fff', fontWeight:700, flexShrink:0 }}>
            {user.name.charAt(0)}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:12, color:'#fff', fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user.name}</div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)' }}>{roleLabel}{user.dept ? ` · ${user.dept}` : ''}</div>
          </div>
          <button onClick={onLogout} title="Logout" style={{ background:'none', border:'none', color:'rgba(255,255,255,0.4)', cursor:'pointer', fontSize:16 }}>⏻</button>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard Home ───────────────────────────────────────────────────────────
function DashboardHome({ branch, user }) {
  const fp = getFilteredPatients(branch);
  const fi = getFilteredInvoices(branch);
  const totalBills = fp.reduce((a, p) => a + p.bills, 0);
  const cashPts = fp.filter(p => p.admType==='Cash').length;
  const cashlessPts = fp.filter(p => p.admType==='Cashless').length;
  const admitted = fp.filter(p => !p.dod).length;
  const discharged = fp.filter(p => p.dod).length;

  return (
    <div>
      <PageHeader title="Dashboard" sub={`${BRANCHES[branch]?.label} · ${new Date().toLocaleDateString('en-IN',{dateStyle:'long'})}`}
        actions={[
          <Btn key="e" onClick={() => downloadCSV(fp,'patients.csv')}>↓ Export</Btn>,
        ]}
      />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }}>
        <StatCard label="Total Admissions" value={fp.length} sub={`${admitted} active · ${discharged} discharged`} />
        <StatCard label="Discharged" value={discharged} sub="Completed" accent="#0f766e" />
        <StatCard label="Total Billing" value={fmt(totalBills)} sub={`${cashPts} Cash · ${cashlessPts} Cashless`} accent="#7c3aed" />
        <StatCard label="Pending Discharge" value={admitted} sub="Currently admitted" accent="#d97706" />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <Card>
          <CardHeader title="Recent Patients" action={<BranchPill branch={branch} />} />
          <Table
            data={fp.slice(0,5)}
            columns={[
              { label:'Patient', render:r=><div><div style={{fontWeight:600,fontSize:13}}>{r.name}</div><div style={{fontSize:11,color:'#9ca3af'}}>{r.uhid}</div></div> },
              { label:'Ward/Bed', render:r=>`${r.ward} · ${r.bed}` },
              { label:'DOD', render:r=>r.dod ? new Date(r.dod).toLocaleDateString('en-IN') : <Badge variant="amber">Pending</Badge> },
              { label:'Type', render:r=><Badge variant={r.admType==='Cash'?'teal':'blue'}>{r.admType}</Badge> },
            ]}
          />
        </Card>
        <Card>
          <CardHeader title="Billing Overview" />
          <Table
            data={fi.slice(0,5)}
            columns={[
              { label:'Invoice', render:r=><span style={{fontSize:11,fontFamily:'monospace',color:'#6b7280'}}>{r.id}</span> },
              { label:'Patient', key:'patient' },
              { label:'Amount', render:r=><span style={{fontWeight:600}}>{fmt(r.amount)}</span>, align:'right' },
              { label:'Status', render:r=><Badge variant={r.status==='Approved'?'green':'amber'}>{r.status}</Badge> },
            ]}
          />
        </Card>
      </div>
    </div>
  );
}

// ─── Patients Page ────────────────────────────────────────────────────────────
function PatientsPage({ branch }) {
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const fp = getFilteredPatients(branch).filter(p => {
    if (tab==='cash' && p.admType!=='Cash') return false;
    if (tab==='cashless' && p.admType!=='Cashless') return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.uhid.includes(search)) return false;
    return true;
  });

  return (
    <div>
      <PageHeader title="Patients History" sub={`${BRANCHES[branch]?.label} · All admissions record`}
        actions={[<Btn key="dl" onClick={() => downloadCSV(fp,'patients.csv')}>↓ Download Excel</Btn>]}
      />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
        <StatCard label="Total Admissions" value={getFilteredPatients(branch).length} />
        <StatCard label="Discharged" value={getFilteredPatients(branch).filter(p=>p.dod).length} accent="#0f766e" />
        <StatCard label="Pending Discharge" value={getFilteredPatients(branch).filter(p=>!p.dod).length} accent="#d97706" />
        <StatCard label="Bills Generated" value={getFilteredPatients(branch).filter(p=>p.billStatus==='Generated').length} accent="#7c3aed" />
      </div>
      <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:'14px 20px', marginBottom:16, display:'flex', alignItems:'center', gap:16 }}>
        <span style={{ fontSize:13, color:'#6b7280', fontWeight:500 }}>🗂 Filter By</span>
        <input type="date" onChange={()=>{}} style={{ padding:'7px 12px', border:'1px solid #d1d5db', borderRadius:8, fontSize:13, outline:'none' }} />
        <select style={{ padding:'7px 12px', border:'1px solid #d1d5db', borderRadius:8, fontSize:13, outline:'none' }}>
          <option>All Months</option>
          {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(m=><option key={m}>{m}</option>)}
        </select>
        <select style={{ padding:'7px 12px', border:'1px solid #d1d5db', borderRadius:8, fontSize:13, outline:'none' }}>
          <option>All Years</option>
          {[2023,2024,2025,2026].map(y=><option key={y}>{y}</option>)}
        </select>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name or UHID…"
          style={{ padding:'7px 12px', border:'1px solid #d1d5db', borderRadius:8, fontSize:13, outline:'none', marginLeft:'auto', width:220 }} />
        <span style={{ fontSize:13, color:'#6b7280' }}>{fp.length} records found</span>
      </div>
      <Card padding="0">
        <Table
          data={fp}
          columns={[
            { label:'#', render:(_,i)=>i+1 },
            { label:'Patient', render:r=><div><div style={{fontWeight:600}}>{r.name}</div><div style={{fontSize:11,color:'#9ca3af'}}>{r.uhid} · Adm #{r.id.split('-')[1]}</div></div> },
            { label:'Date of Admission', render:r=>fmtDate(r.doa) },
            { label:'Expected Discharge', render:r=>r.dod ? <button style={{padding:'4px 12px',border:'1px solid #d1d5db',borderRadius:6,fontSize:12,cursor:'pointer',background:'#fff'}}>{new Date(r.dod).toLocaleDateString('en-IN')}</button> : <button style={{padding:'4px 12px',border:'1px solid #d1d5db',borderRadius:6,fontSize:12,cursor:'pointer',background:'#fff'}}>Set Date</button> },
            { label:'Medical History', render:r=>r.medHistory ? <Badge variant="green">✓ Filled</Badge> : <Badge variant="amber">⚠ Not Filled</Badge> },
            { label:'Discharge Status', render:r=>r.dod ? <Badge variant="green">Recovered</Badge> : <Badge variant="blue">Admitted</Badge> },
            { label:'Bill', render:r=>r.billStatus==='Generated' ? <Badge variant="green">✓ Generated</Badge> : <Badge variant="amber">Pending</Badge> },
            { label:'', render:r=><Btn size="sm" onClick={()=>setSelected(r)}>View</Btn> },
          ]}
        />
      </Card>

      <Modal open={!!selected} onClose={()=>setSelected(null)} title={`Patient — ${selected?.name}`}>
        {selected && <>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
            {[['UHID',selected.uhid],['Age',`${selected.age} yrs`],['Ward / Bed',`${selected.ward} / ${selected.bed}`],['Branch',BRANCHES[selected.branch]?.label],['Billing Type',selected.admType],['Status',selected.status],['Admitted On',fmtDate(selected.doa)],['Discharge',selected.dod?fmtDate(selected.dod):'Not yet'],['Total Bill',fmt(selected.bills)],['Bill Status',selected.billStatus]].map(([k,v])=>(
              <div key={k}><div style={{fontSize:11,color:'#9ca3af',fontWeight:600,marginBottom:2}}>{k}</div><div style={{fontSize:14,color:'#111827',fontWeight:500}}>{v}</div></div>
            ))}
          </div>
          <div style={{ display:'flex', gap:8, justifyContent:'flex-end', paddingTop:16, borderTop:'1px solid #f3f4f6' }}>
            <Btn onClick={()=>downloadCSV([selected],`${selected.id}_summary.csv`)}>↓ Download</Btn>
            <Btn variant="primary" onClick={()=>setSelected(null)}>Close</Btn>
          </div>
        </>}
      </Modal>
    </div>
  );
}

// ─── Reports Page ─────────────────────────────────────────────────────────────
function ReportsPage({ branch }) {
  const fp = getFilteredPatients(branch);
  return (
    <div>
      <PageHeader title="Reports & Summaries" sub={BRANCHES[branch]?.label}
        actions={[<Btn key="dl" variant="primary" onClick={()=>downloadCSV(fp,'reports.csv')}>↓ Download All</Btn>]}
      />
      <Card padding="0">
        <Table
          data={fp}
          columns={[
            { label:'Patient', render:r=><div><div style={{fontWeight:600}}>{r.name}</div><div style={{fontSize:11,color:'#9ca3af'}}>{r.uhid}</div></div> },
            { label:'Ward', key:'ward' },
            { label:'Branch', render:r=><BranchPill branch={r.branch}/> },
            { label:'DOA', render:r=>new Date(r.doa).toLocaleDateString('en-IN') },
            { label:'DOD', render:r=>r.dod?new Date(r.dod).toLocaleDateString('en-IN'):<Badge variant="amber">Pending</Badge> },
            { label:'Status', render:r=><Badge variant={r.status==='Recovered'?'green':r.status==='Critical'?'red':'teal'}>{r.status}</Badge> },
            { label:'Bill', render:r=><span style={{fontWeight:600}}>{fmt(r.bills)}</span> },
            { label:'', render:r=><Btn size="sm" onClick={()=>downloadCSV([r],`${r.id}.csv`)}>↓ Download</Btn> },
          ]}
        />
      </Card>
    </div>
  );
}

// ─── Bill Edit Page (Admin only) ──────────────────────────────────────────────
function BillingPage({ branch, user }) {
  const fp = getFilteredPatients(branch).filter(p => p.billStatus === 'Pending');
  const [selPat, setSelPat] = useState(fp[0] || null);
  const [items, setItems] = useState(BILL_ITEMS[fp[0]?.id] || []);

  const select = (p) => { setSelPat(p); setItems(BILL_ITEMS[p.id] || []); };
  const update = (id, field, val) => setItems(prev => prev.map(it => it.id===id ? {...it,[field]:Number(val),amount:field==='rate'?Number(val)*it.qty:it.rate*Number(val)} : it));
  const total = items.reduce((a,i)=>a+i.amount, 0);
  const canEdit = user.role === 'admin' || user.dept === 'Billing';

  return (
    <div>
      <PageHeader title={canEdit ? 'Edit Bills' : 'View Bills'} sub="Billing management" />
      <div style={{ display:'grid', gridTemplateColumns:'260px 1fr', gap:16 }}>
        <Card padding="0">
          <div style={{ padding:'14px 16px', borderBottom:'1px solid #f3f4f6', fontSize:13, fontWeight:600 }}>Patients</div>
          {fp.map(p => (
            <div key={p.id} onClick={() => select(p)} style={{ padding:'12px 16px', cursor:'pointer', borderBottom:'1px solid #f9fafb', background:selPat?.id===p.id?OCEAN[50]:'transparent', borderLeft:selPat?.id===p.id?`3px solid ${OCEAN[400]}`:'3px solid transparent' }}>
              <div style={{fontSize:13,fontWeight:600}}>{p.name}</div>
              <div style={{fontSize:11,color:'#9ca3af'}}>{p.uhid} · {fmt(p.bills)}</div>
            </div>
          ))}
        </Card>

        <Card>
          {selPat ? <>
            <CardHeader title={`${canEdit?'Editing':'Viewing'} — ${selPat.name}`}
              action={<div style={{display:'flex',gap:8}}>
                <Btn onClick={()=>downloadCSV(items,`bill_${selPat.id}.csv`)}>↓ Download</Btn>
                {canEdit && <Btn variant="primary" onClick={()=>alert('Saved!')}>Save All</Btn>}
              </div>}
            />
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
              <thead>
                <tr style={{background:OCEAN[900]}}>
                  {['Item','Rate (₹)','Qty','Amount (₹)',''].map((h,i)=>(
                    <th key={i} style={{padding:'10px 14px',color:'#93c5fd',fontWeight:600,fontSize:11,textAlign:i>0?'right':'left',textTransform:'uppercase',letterSpacing:'0.06em'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item,ri)=>(
                  <tr key={item.id} style={{borderBottom:'1px solid #f3f4f6',background:ri%2===0?'#fff':'#f9fafb'}}>
                    <td style={{padding:'10px 14px',fontWeight:500}}>{item.item}</td>
                    <td style={{padding:'10px 14px',textAlign:'right'}}>
                      {canEdit ? <input type="number" value={item.rate} onChange={e=>update(item.id,'rate',e.target.value)}
                        style={{width:90,padding:'5px 8px',border:'1px solid #d1d5db',borderRadius:6,fontSize:13,textAlign:'right'}}/> : fmt(item.rate)}
                    </td>
                    <td style={{padding:'10px 14px',textAlign:'right'}}>
                      {canEdit ? <input type="number" value={item.qty} onChange={e=>update(item.id,'qty',e.target.value)}
                        style={{width:60,padding:'5px 8px',border:'1px solid #d1d5db',borderRadius:6,fontSize:13,textAlign:'right'}}/> : item.qty}
                    </td>
                    <td style={{padding:'10px 14px',textAlign:'right',fontWeight:600}}>{fmt(item.amount)}</td>
                    <td style={{padding:'10px 14px',textAlign:'right'}}>{canEdit&&<Btn size="sm">Save</Btn>}</td>
                  </tr>
                ))}
                <tr style={{background:OCEAN[50]}}>
                  <td colSpan={3} style={{padding:'12px 14px',fontWeight:700,textAlign:'right',color:OCEAN[700]}}>Total</td>
                  <td style={{padding:'12px 14px',textAlign:'right',fontWeight:800,fontSize:16,color:OCEAN[600]}}>{fmt(total)}</td>
                  <td/>
                </tr>
              </tbody>
            </table>
          </> : <div style={{textAlign:'center',padding:40,color:'#9ca3af'}}>No pending bills</div>}
        </Card>
      </div>
    </div>
  );
}

// ─── Invoices Page (view only — no approve) ───────────────────────────────────
function InvoicesPage({ branch }) {
  const [tab, setTab] = useState('all');
  const fi = getFilteredInvoices(branch).filter(i => {
    if (tab==='cash' && i.type!=='Cash') return false;
    if (tab==='cashless' && i.type!=='Cashless') return false;
    return true;
  });
  return (
    <div>
      <PageHeader title="Invoices" sub={`${fi.length} invoices · ${BRANCHES[branch]?.label}`}
        actions={[<Btn key="dl" onClick={()=>downloadCSV(fi,'invoices.csv')}>↓ Download</Btn>]}
      />
      <TabBar tabs={[{id:'all',label:'All'},{id:'cash',label:'Cash'},{id:'cashless',label:'Cashless'}]} active={tab} onChange={setTab} />
      <Card padding="0">
        <Table
          data={fi}
          columns={[
            { label:'Invoice', render:r=><span style={{fontSize:12,fontFamily:'monospace',color:'#6b7280'}}>{r.id}</span> },
            { label:'Patient', render:r=><span style={{fontWeight:600}}>{r.patient}</span> },
            { label:'Date', key:'date' },
            { label:'Amount', render:r=><span style={{fontWeight:700}}>{fmt(r.amount)}</span>, align:'right' },
            { label:'Type', render:r=><Badge variant={r.type==='Cash'?'teal':'blue'}>{r.type}</Badge> },
            { label:'Branch', render:r=><BranchPill branch={r.branch}/> },
            { label:'Status', render:r=><Badge variant={r.status==='Approved'?'green':'amber'}>{r.status}</Badge> },
            { label:'', render:()=><Btn size="sm" onClick={()=>window.print()}>Print</Btn> },
          ]}
        />
      </Card>
    </div>
  );
}

// ─── Pharmacy ─────────────────────────────────────────────────────────────────
function PharmacyPage({ branch, user }) {
  const meds = branch==='all' ? MEDICINES : MEDICINES.filter(m=>m.branch===branch);
  const canEdit = user.role==='admin' || user.dept==='Pharmacy';
  const lowStock = meds.filter(m=>m.stock<=m.reorderAt);

  return (
    <div>
      <PageHeader title="Pharmacy" sub={`${meds.length} medicines`}
        actions={[<Btn key="dl" onClick={()=>downloadCSV(meds,'pharmacy.csv')}>↓ Download</Btn>]}
      />
      {lowStock.length>0 && <Alert type="danger">⚠️ Low stock: {lowStock.map(m=>m.name).join(', ')}</Alert>}
      <Card padding="0">
        <Table
          data={meds}
          columns={[
            { label:'Code', render:r=><span style={{fontSize:11,fontFamily:'monospace',color:'#9ca3af'}}>{r.id}</span> },
            { label:'Medicine', render:r=><span style={{fontWeight:600}}>{r.name}</span> },
            { label:'Category', render:r=><Badge variant="gray">{r.category}</Badge> },
            { label:'Stock', render:r=><span style={{color:r.stock<=r.reorderAt?'#b91c1c':'#111827',fontWeight:600}}>{r.stock} {r.stock<=r.reorderAt?'⚠':''}</span> },
            { label:'Unit', key:'unit' },
            { label:'Price', render:r=>fmt(r.price), align:'right' },
            { label:'', render:()=>canEdit&&<div style={{display:'flex',gap:4}}><Btn size="sm">Edit Qty</Btn><Btn size="sm">Edit Price</Btn></div> },
          ]}
        />
      </Card>
    </div>
  );
}

// ─── Discharge Page ───────────────────────────────────────────────────────────
function DischargePage({ branch }) {
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({date:'',summary:'',followup:''});
  const fp = getFilteredPatients(branch);

  return (
    <div>
      <PageHeader title="Discharge Management" sub={BRANCHES[branch]?.label}
        actions={[<Btn key="dl" onClick={()=>downloadCSV(fp,'discharge.csv')}>↓ Download</Btn>]}
      />
      <Card padding="0">
        <Table
          data={fp}
          columns={[
            { label:'Patient', render:r=><div><div style={{fontWeight:600}}>{r.name}</div><div style={{fontSize:11,color:'#9ca3af'}}>{r.uhid}</div></div> },
            { label:'Ward', key:'ward' },
            { label:'Type', render:r=><Badge variant={r.admType==='Cash'?'teal':'blue'}>{r.admType}</Badge> },
            { label:'DOD', render:r=>r.dod?new Date(r.dod).toLocaleDateString('en-IN'):<Badge variant="amber">Not Set</Badge> },
            { label:'Bill', render:r=><span style={{fontWeight:600}}>{fmt(r.bills)}</span> },
            { label:'Status', render:r=><Badge variant={r.status==='Critical'?'red':r.status==='Recovered'?'green':'teal'}>{r.status}</Badge> },
            { label:'', render:r=><Btn size="sm" variant="primary" onClick={()=>setSelected(r)}>Process</Btn> },
          ]}
        />
      </Card>

      <Modal open={!!selected} onClose={()=>setSelected(null)} title={`Discharge — ${selected?.name}`}>
        {selected && <>
          <Alert type="warn">Confirm all bills are cleared before processing.</Alert>
          <Field label="Discharge Date"><Input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} /></Field>
          <Field label="Summary">
            <textarea value={form.summary} onChange={e=>setForm(f=>({...f,summary:e.target.value}))} rows={3} placeholder="Summary notes…"
              style={{width:'100%',padding:'8px 12px',border:'1px solid #d1d5db',borderRadius:8,fontSize:13,resize:'vertical',boxSizing:'border-box'}} />
          </Field>
          <Field label="Follow-up Date"><Input type="date" value={form.followup} onChange={e=>setForm(f=>({...f,followup:e.target.value}))} /></Field>
          <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:8}}>
            <Btn onClick={()=>setSelected(null)}>Cancel</Btn>
            <Btn variant="primary" onClick={()=>{alert(`${selected.name} discharged!`);setSelected(null);}}>Confirm</Btn>
          </div>
        </>}
      </Modal>
    </div>
  );
}

// ─── Employee Management (Admin creates employees) ────────────────────────────
function EmployeesPage({ user }) {
  const branchUsers = HMS_USERS.filter(u => u.role==='employee' && (user.branch==='all'||u.branch===user.branch));
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({name:'',username:'',password:'',confirmPassword:'',dept:'Billing',branch:user.branch});
  const [showEmpPass, setShowEmpPass] = useState(false);
  const [showEmpConfirm, setShowEmpConfirm] = useState(false);
  const [users, setUsers] = useState(branchUsers);

  const create = () => {
    if (!form.name||!form.username||!form.password) return alert('Fill all fields');
    setUsers(p=>[...p,{id:`U-0${p.length+10}`,role:'employee',status:'Active',createdBy:user.username,...form}]);
    setModal(false);
    setForm({name:'',username:'',password:'',dept:'Billing',branch:user.branch});
  };

  return (
    <div>
      <PageHeader title="Manage Employees" sub={`${users.length} employees`}
        actions={[<Btn key="c" variant="primary" onClick={()=>setModal(true)}>+ Create Employee</Btn>]}
      />
      <Card padding="0">
        <Table
          data={users}
          columns={[
            { label:'Name', render:r=><span style={{fontWeight:600}}>{r.name}</span> },
            { label:'Department', render:r=><Badge variant="gray">{r.dept}</Badge> },
            { label:'Branch', render:r=><BranchPill branch={r.branch}/> },
            { label:'Username', render:r=><span style={{fontSize:12,fontFamily:'monospace',color:'#6b7280'}}>{r.username}</span> },
            { label:'Status', render:r=><Badge variant="green">{r.status}</Badge> },
            { label:'', render:()=><Btn size="sm">Edit</Btn> },
          ]}
        />
      </Card>

      <Modal open={modal} onClose={()=>setModal(false)} title="Create Employee">
        <Field label="Full Name"><Input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Full name" /></Field>
        <Field label="Username"><Input value={form.username} onChange={e=>setForm(f=>({...f,username:e.target.value}))} placeholder="username" /></Field>
        <Field label="Password"><Input type="password" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} placeholder="Password" /></Field>
        <Field label="Department">
          <Select value={form.dept} onChange={e=>setForm(f=>({...f,dept:e.target.value}))} options={DEPARTMENTS} />
        </Field>
        <Field label="Branch">
          <Select value={form.branch} onChange={e=>setForm(f=>({...f,branch:e.target.value}))}
            options={[{value:'laxmi',label:'Laxmi Nagar'},{value:'raya',label:'Raya'}]} />
        </Field>
        <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:8}}>
          <Btn onClick={()=>setModal(false)}>Cancel</Btn>
          <Btn variant="primary" onClick={create}>Create</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ─── Root AdminPanel ──────────────────────────────────────────────────────────
export default function AdminPanel() {
  const { user, logout } = useAuth();
  const [page, setPage] = useState('dashboard');
  const [branch, setBranch] = useState(user?.branch || 'laxmi');

  const pages = {
    dashboard: <DashboardHome branch={branch} user={user} />,
    patients:  <PatientsPage branch={branch} />,
    reports:   <ReportsPage branch={branch} />,
    billing:   <BillingPage branch={branch} user={user} />,
    invoices:  <InvoicesPage branch={branch} />,
    users:     <EmployeesPage user={user} />,
    pharmacy:  <PharmacyPage branch={branch} user={user} />,
    discharge: <DischargePage branch={branch} />,
  };

  return (
    <div style={{ display:'flex', fontFamily:"'Segoe UI',system-ui,sans-serif", background:'#f8fafc', minHeight:'100vh' }}>
      <Sidebar page={page} setPage={setPage} branch={branch} setBranch={setBranch} user={user} onLogout={logout} />
      <main style={{ marginLeft:230, flex:1, padding:'28px 32px', minHeight:'100vh' }}>
        {pages[page] || pages.dashboard}
      </main>
    </div>
  );
}
