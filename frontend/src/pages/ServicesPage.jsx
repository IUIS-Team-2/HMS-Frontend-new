import { useState } from "react";
import { T, PAY_MODES, MASTER_ROOMS, MASTER_CONSULTANTS, MASTER_SERVICES } from "../data/constants";
import { Ico, IC } from "../components/ui/Icons";
import { Card, Inp, Sel } from "../components/ui/SharedUI";

export default function ServicesPage({svcs, billing, onSave}){
  // Split the main services array into UI sections
  const [roomSvcs, setRoomSvcs] = useState(svcs.filter(s => s.type === 'Room Charge'));
  const [docSvcs, setDocSvcs] = useState(svcs.filter(s => s.type === 'Consultant'));
  const [genSvcs, setGenSvcs] = useState(svcs.filter(s => s.type !== 'Room Charge' && s.type !== 'Consultant'));
  const [billState, setBillState] = useState(billing);

  const addSvc = (setter, defaultType) => setter(s => [...s, { type: defaultType, code: "", title: "", rate: "", qty: "1" }]);
  const remSvc = (setter, i) => setter(s => s.filter((_, x) => x !== i));
  const updSvc = (setter, i, k, v) => setter(s => s.map((r, x) => x === i ? { ...r, [k]: v } : r));

  const handleRoomSelect = (i, title) => {
    const found = MASTER_ROOMS.find(r => r.title === title);
    if(found) { updSvc(setRoomSvcs, i, 'title', found.title); updSvc(setRoomSvcs, i, 'code', found.code); updSvc(setRoomSvcs, i, 'rate', found.rate); }
    else updSvc(setRoomSvcs, i, 'title', title);
  };

  const handleDocSelect = (i, title) => {
    const found = MASTER_CONSULTANTS.find(r => r.title === title);
    if(found) { updSvc(setDocSvcs, i, 'title', found.title); updSvc(setDocSvcs, i, 'code', found.code); updSvc(setDocSvcs, i, 'rate', found.rate); }
    else updSvc(setDocSvcs, i, 'title', title);
  };

  const handleGenCatSelect = (i, type) => {
    updSvc(setGenSvcs, i, 'type', type); updSvc(setGenSvcs, i, 'title', ''); updSvc(setGenSvcs, i, 'code', ''); updSvc(setGenSvcs, i, 'rate', '');
  };

  const handleGenItemSelect = (i, type, title) => {
    const found = MASTER_SERVICES[type]?.find(r => r.title === title);
    if(found) { updSvc(setGenSvcs, i, 'title', found.title); updSvc(setGenSvcs, i, 'code', found.code); updSvc(setGenSvcs, i, 'rate', found.rate); }
    else updSvc(setGenSvcs, i, 'title', title);
  };

  // Compile back together for saving
  const combinedSvcs = [...roomSvcs, ...docSvcs, ...genSvcs].filter(s => s.title || s.type);
  const total = combinedSvcs.reduce((a,s) => a + (parseFloat(s.rate)||0) * (parseInt(s.qty)||0), 0);
  const disc = parseFloat(billState.discount)||0; const adv = parseFloat(billState.advance)||0; const paid = parseFloat(billState.paidNow)||0; 
  const net = Math.max(0, total - disc - adv - paid);

  const MasterRow = ({ item, i, setter, isGen }) => (
    <div style={{display:"grid", gridTemplateColumns: isGen ? "1.2fr 2fr 100px 80px 70px 90px 36px" : "2fr 100px 80px 70px 90px 36px", gap: 10, alignItems:"center", padding:"11px 14px", background:T.offwhite, border:`1px solid ${T.border}`, borderRadius:12, marginBottom:10}}>
      {isGen && (
        <div className="sc-w"><select className="sc" value={item.type} onChange={e => handleGenCatSelect(i, e.target.value)}><option value="">Category...</option>{Object.keys(MASTER_SERVICES).map(c=><option key={c} value={c}>{c}</option>)}</select><span className="sc-a"><Ico d={IC.dn} size={11} sw={2.5}/></span></div>
      )}
      <div className="sc-w">
        <select className="sc" value={item.title} onChange={e => isGen ? handleGenItemSelect(i, item.type, e.target.value) : setter === setRoomSvcs ? handleRoomSelect(i, e.target.value) : handleDocSelect(i, e.target.value)}>
          <option value="">Select specific item...</option>
          {isGen && item.type && MASTER_SERVICES[item.type]?.map(o => <option key={o.title} value={o.title}>{o.title}</option>)}
          {!isGen && setter === setRoomSvcs && MASTER_ROOMS.map(o => <option key={o.title} value={o.title}>{o.title}</option>)}
          {!isGen && setter === setDocSvcs && MASTER_CONSULTANTS.map(o => <option key={o.title} value={o.title}>{o.title}</option>)}
        </select>
        <span className="sc-a"><Ico d={IC.dn} size={11} sw={2.5}/></span>
      </div>
      <input className="sc" placeholder="Code" value={item.code} readOnly style={{background: T.bgPage, color: T.textMuted}} />
      <input className="sc" type="number" placeholder="Rate ₹" value={item.rate} onChange={e => updSvc(setter, i, 'rate', e.target.value)} />
      <input className="sc" type="number" placeholder="Qty" min="1" value={item.qty} onChange={e => updSvc(setter, i, 'qty', e.target.value)} />
      <span className="svc-tot">₹{((parseFloat(item.rate)||0)*(parseInt(item.qty)||0)).toFixed(2)}</span>
      <button className="svc-del" onClick={() => remSvc(setter, i)}><Ico d={IC.trash} size={13} sw={2}/></button>
    </div>
  );

  return(<div className="form-page">
    <div className="page-hd"><h1>Service Charges</h1><p>Master Tariff: Auto-filling codes and rates for accurate billing</p></div>
    <div className="stat-grid">{[{l:"Total Items",v:combinedSvcs.length,s:"added"},{l:"Gross Total",v:`₹${total.toFixed(2)}`,s:"before deductions"},{l:"Discount",v:`₹${disc.toFixed(2)}`,s:"applied"},{l:"Net Payable",v:`₹${net.toFixed(2)}`,s:"final"}].map(sc=>(<div className="stat-card" key={sc.l}><div className="stat-lbl">{sc.l}</div><div className="stat-val">{sc.v}</div><div className="stat-sub">{sc.s}</div></div>))}</div>
    
    <Card icon={IC.bed} title="1. Room & Ward Charges" subtitle="Select room type and number of days" delay={0}>
      {roomSvcs.map((s,i) => <MasterRow key={i} item={s} i={i} setter={setRoomSvcs} isGen={false} />)}
      <button className="add-svc" onClick={() => addSvc(setRoomSvcs, 'Room Charge')}><Ico d={IC.plus} size={14} sw={2.5}/> Add Room Stay</button>
    </Card>

    <Card icon={IC.person} title="2. Consultant Visits" subtitle="Select doctor and number of visits" delay={0.05}>
      {docSvcs.map((s,i) => <MasterRow key={i} item={s} i={i} setter={setDocSvcs} isGen={false} />)}
      <button className="add-svc" onClick={() => addSvc(setDocSvcs, 'Consultant')}><Ico d={IC.plus} size={14} sw={2.5}/> Add Doctor Visit</button>
    </Card>

    <Card icon={IC.pulse} title="3. Diagnostics & General Services" subtitle="Radiology, ICU Care, Lab, and General Procedures" delay={0.1}>
      {genSvcs.map((s,i) => <MasterRow key={i} item={s} i={i} setter={setGenSvcs} isGen={true} />)}
      <button className="add-svc" onClick={() => addSvc(setGenSvcs, '')}><Ico d={IC.plus} size={14} sw={2.5}/> Add Procedure / Test</button>
    </Card>

    <Card icon={IC.wallet} title="Payment Details" subtitle="Discounts, advance payments and settlement" delay={0.15}>
      <div className="g2">
        <Inp label="Discount Amount (₹)" placeholder="0.00" type="number" value={billState.discount} onChange={e=>setBillState(p=>({...p, discount: e.target.value}))}/>
        <Inp label="Advance Payment (₹)" placeholder="Amount received earlier" type="number" value={billState.advance} onChange={e=>setBillState(p=>({...p, advance: e.target.value}))}/>
        <Inp label="Amount Paid Now (₹)" placeholder="Amount paid at discharge" type="number" value={billState.paidNow} onChange={e=>setBillState(p=>({...p, paidNow: e.target.value}))}/>
        <Sel label="Payment Mode" req opts={PAY_MODES} placeholder="Select mode" value={billState.paymentMode} onChange={e=>setBillState(p=>({...p, paymentMode: e.target.value}))}/>
      </div>
    </Card>

    <div className="btn-row"><button className="btn btn-accent" onClick={() => onSave(combinedSvcs, billState)}><Ico d={IC.check} size={15} sw={2.5}/> Save &amp; Go to Summary →</button></div>
  </div>);
}