import { useState, useEffect } from "react";
import { Ico, IC } from "../ui/Icons";

export default function LiveDate() {
  const [now,setNow]=useState(new Date());
  useEffect(()=>{const t=setInterval(()=>setNow(new Date()),60000);return()=>clearInterval(t);},[]);
  const d=now.toLocaleDateString("en-IN",{weekday:"short",day:"2-digit",month:"short",year:"numeric"});
  return(
    <div className="hdr-date">
      <span className="hdr-date-ico"><Ico d={IC.calendar} size={13} sw={2}/></span>
      {d}
    </div>
  );
}