const KEY = "health_services_endorsements_v1";
const STATUSES = [
  "CONSULTATION","FTW-IN PERSON","FTW-ONLINE","HOSPITAL CONDUCTION",
  "WRA","WME","SICK LEAVE","SL NOTIFICATION","ML","ML NOTIFICATION"
];

const $ = id => document.getElementById(id);
let currentViewId = null;

function loadData(){
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); }
  catch(e){ return []; }
}
function saveData(data){ localStorage.setItem(KEY, JSON.stringify(data)); }

function uid(){
  return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2,9);
}
function today(){
  return new Date().toISOString().slice(0,10);
}
function esc(v){
  return String(v ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
}

function init(){
  $("date").value = today();

  for(let i=1;i<=6;i++){
    const label=document.createElement("label");
    label.innerHTML=`Nurse on Duty ${i}<input class="nurse-input" data-order="${i}">`;
    $("nurseGrid").appendChild(label);
  }

  addEmployee();
  bind();
  renderRecords();
}

function addEmployee(){
  const tr=document.createElement("tr");
  tr.innerHTML=`
    <td class="row-number"></td>
    <td><input class="emp-name"></td>
    <td><input class="emp-diagnosis"></td>
    <td><input class="emp-remarks"></td>
    <td><select class="emp-status"><option value="">Select status</option>${STATUSES.map(x=>`<option>${x}</option>`).join("")}</select></td>
    <td><input class="emp-labor" type="date"></td>
    <td><input class="emp-return" type="date"></td>
    <td><button type="button" class="icon-remove">×</button></td>`;
  $("employeeBody").appendChild(tr);
  renumber();
  tr.querySelector(".icon-remove").onclick=()=>{tr.remove();renumber();};
}
function renumber(){
  [...document.querySelectorAll("#employeeBody tr")].forEach((r,i)=>{
    r.querySelector(".row-number").textContent=i+1;
  });
}

function bind(){
  document.querySelectorAll(".nav-btn").forEach(b=>{
    b.onclick=()=>showPage(b.dataset.page);
  });
  $("addEmployee").onclick=addEmployee;
  $("saveBtn").onclick=saveEndorsement;
  $("clearBtn").onclick=clearForm;
  $("refreshBtn").onclick=renderRecords;
  $("searchBox").oninput=renderRecords;
  $("dateFilter").onchange=renderRecords;
  $("clearFilters").onclick=()=>{
    $("searchBox").value=""; $("dateFilter").value=""; renderRecords();
  };
  $("backBtn").onclick=()=>showPage("records");
  $("printBtn").onclick=()=>window.print();
  $("exportBtn").onclick=exportBackup;
  $("importFile").onchange=importBackup;
}

function showPage(page){
  document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));
  if(page==="new") $("page-new").classList.add("active");
  if(page==="records"){ $("page-records").classList.add("active"); renderRecords(); }
  if(page==="view") $("page-view").classList.add("active");
  document.querySelectorAll(".nav-btn").forEach(x=>x.classList.toggle("active",x.dataset.page===page));
}

function saveEndorsement(){
  const date=$("date").value, shift=$("shift").value;
  if(!date || !shift){ message("Please enter the Date and Shift.",true); return; }

  const employees=[...document.querySelectorAll("#employeeBody tr")].map(r=>({
    employee_name:r.querySelector(".emp-name").value.trim(),
    complaint_diagnosis:r.querySelector(".emp-diagnosis").value.trim(),
    remarks:r.querySelector(".emp-remarks").value.trim(),
    status:r.querySelector(".emp-status").value,
    date_of_labor:r.querySelector(".emp-labor").value,
    date_of_return:r.querySelector(".emp-return").value
  })).filter(x=>x.employee_name);

  const nurses=[...document.querySelectorAll(".nurse-input")].map(x=>x.value.trim()).filter(Boolean);

  const record={
    id:uid(),
    endorsement_date:date,
    shift,
    outgoing_nurse:$("outgoing").value.trim(),
    incoming_nurse:$("incoming").value.trim(),
    charge_nurse:$("charge").value.trim(),
    endorsement_remark:$("endorsementRemark").value,
    general_endorsement_remark:$("generalRemark").value,
    nurses,
    employees,
    created_at:new Date().toLocaleString()
  };

  const data=loadData();
  data.push(record);
  saveData(data);
  message("ENDORSEMENT SAVED SUCCESSFULLY.");
  setTimeout(clearForm,700);
}

function clearForm(){
  $("date").value=today();
  ["shift","outgoing","incoming","charge","endorsementRemark","generalRemark"].forEach(id=>$(id).value="");
  document.querySelectorAll(".nurse-input").forEach(x=>x.value="");
  $("employeeBody").innerHTML="";
  addEmployee();
  $("formMessage").textContent="";
  $("formMessage").className="message";
}

function message(text,error=false){
  $("formMessage").textContent=text;
  $("formMessage").className=error?"message error":"message success";
}

function renderRecords(){
  const q=($("searchBox")?.value||"").trim().toLowerCase();
  const date=$("dateFilter")?.value||"";
  let data=loadData().slice().sort((a,b)=>
    (b.endorsement_date||"").localeCompare(a.endorsement_date||"") ||
    (b.created_at||"").localeCompare(a.created_at||"")
  );

  data=data.filter(r=>{
    const text=[
      r.outgoing_nurse,r.incoming_nurse,r.charge_nurse,
      ...(r.nurses||[]),...(r.employees||[]).map(x=>x.employee_name)
    ].join(" ").toLowerCase();
    return (!q || text.includes(q)) && (!date || r.endorsement_date===date);
  });

  $("recordCount").textContent=`${data.length} record${data.length===1?"":"s"} found`;

  $("recordsBody").innerHTML=data.length ? data.map(r=>`
    <tr>
      <td>${esc(r.endorsement_date)}</td>
      <td>${esc(r.shift)}</td>
      <td>${esc(r.outgoing_nurse)}</td>
      <td>${esc(r.incoming_nurse)}</td>
      <td>${(r.employees||[]).length}</td>
      <td>${esc(r.created_at)}</td>
      <td>
        <button class="btn secondary" onclick="viewRecord('${r.id}')">View</button>
        <button class="btn secondary" onclick="deleteRecord('${r.id}')">Delete</button>
      </td>
    </tr>`).join("") :
    `<tr><td colspan="7" class="empty">No endorsement records found.</td></tr>`;
}

function viewRecord(id){
  const r=loadData().find(x=>x.id===id);
  if(!r) return;
  currentViewId=id;

  $("viewContent").innerHTML=`
    <div class="view-head">
      <div><b>Date</b><br>${esc(r.endorsement_date)}</div>
      <div><b>Shift</b><br>${esc(r.shift)}</div>
      <div><b>Outgoing Nurse</b><br>${esc(r.outgoing_nurse)}</div>
      <div><b>Incoming Nurse</b><br>${esc(r.incoming_nurse)}</div>
      <div><b>Charge Nurse</b><br>${esc(r.charge_nurse)}</div>
      <div><b>Saved</b><br>${esc(r.created_at)}</div>
    </div>

    <h3>Nurse on Duty</h3>
    <ol>${(r.nurses||[]).map(n=>`<li>${esc(n)}</li>`).join("") || "<li>None recorded</li>"}</ol>

    <h3>Endorsement Remark</h3>
    <div class="view-remark">${esc(r.endorsement_remark||"")}</div>

    <h3>General Endorsement Remark</h3>
    <div class="view-remark">${esc(r.general_endorsement_remark||"")}</div>

    <h3>Employee Endorsement</h3>
    <div class="table-scroll">
    <table>
      <thead><tr><th>#</th><th>Employee Name</th><th>Complaint / Diagnosis</th><th>Remarks</th><th>Status</th><th>Date of Labor</th><th>Date of Return</th></tr></thead>
      <tbody>${(r.employees||[]).map((x,i)=>`
        <tr><td>${i+1}</td><td>${esc(x.employee_name)}</td><td>${esc(x.complaint_diagnosis)}</td>
        <td>${esc(x.remarks)}</td><td class="status">${esc(x.status)}</td>
        <td>${esc(x.date_of_labor)}</td><td>${esc(x.date_of_return)}</td></tr>`).join("") || `<tr><td colspan="7" class="empty">No employees recorded.</td></tr>`}
      </tbody>
    </table>
    </div>`;
  renderPrintDocument(r);
  showPage("view");
}

function deleteRecord(id){
  if(!confirm("Delete this endorsement record? This cannot be undone.")) return;
  saveData(loadData().filter(x=>x.id!==id));
  renderRecords();
}

function exportBackup(){
  const payload={
    app:"Health Services Nurse Endorsement System",
    version:1,
    exported_at:new Date().toISOString(),
    records:loadData()
  };
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url; a.download="health-services-endorsement-backup.json"; a.click();
  URL.revokeObjectURL(url);
}

function importBackup(event){
  const file=event.target.files[0];
  if(!file) return;
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const obj=JSON.parse(reader.result);
      if(!Array.isArray(obj.records)) throw new Error("Invalid backup file.");
      if(!confirm(`Import ${obj.records.length} record(s)? Existing records will be replaced.`)) return;
      saveData(obj.records);
      renderRecords();
      alert("Backup imported successfully.");
    }catch(e){alert("Could not import backup: "+e.message);}
    event.target.value="";
  };
  reader.readAsText(file);
}


function formatPrintDate(v){
  if(!v) return "";
  const d=new Date(v+"T00:00:00");
  if(Number.isNaN(d.getTime())) return v;
  const months=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return String(d.getDate()).padStart(2,"0")+months[d.getMonth()]+d.getFullYear();
}

function checkedShift(actual, target){
  return actual===target ? "☑" : "☐";
}

function rowsForStatus(record,status,columns="normal",count=9){
  const list=(record.employees||[]).filter(x=>x.status===status);
  let html="";
  for(let i=0;i<count;i++){
    const x=list[i];
    if(columns==="ml"){
      html+=`<tr><td>${x?i+1:""}</td><td>${x?esc(x.employee_name):""}</td><td>${x?(status==="ML"?formatPrintDate(x.date_of_return):formatPrintDate(x.date_of_labor)):""}</td></tr>`;
    }else{
      html+=`<tr><td>${x?i+1:""}</td><td>${x?esc(x.employee_name):""}</td><td>${x?esc(x.complaint_diagnosis):""}</td><td>${x?esc(x.remarks):""}</td></tr>`;
    }
  }
  return html;
}

function printSection(title,status,count=9,columns="normal",extraClass=""){
  const ml=columns==="ml";
  return `<div class="print-section ${extraClass}">
    <div class="print-section-title">${title}</div>
    <table class="print-table">
      <thead>${ml
        ? `<tr><th>NO.</th><th>NAME OF EMPLOYEE</th><th>${status==="ML"?"EXPECTED DATE OF RETURN":"EXPECTED DATE OF LABOR"}</th></tr>`
        : `<tr><th>NO.</th><th>NAME OF EMPLOYEE</th><th>COMPLAINT / DIAGNOSIS</th><th>REMARKS</th></tr>`}
      </thead>
      <tbody>${rowsForStatus(window.__printRecord,status,columns,count)}</tbody>
    </table>
  </div>`;
}

function renderPrintDocument(r){
  window.__printRecord=r;
  const summaryStatuses=[
    ["Total Number of Consultations:","CONSULTATION"],
    ["Total Number of FTW Issued Online:","FTW-ONLINE"],
    ["Total Number of FTW Issued In-person:","FTW-IN PERSON"],
    ["Total Number of Hospital Conduction:","HOSPITAL CONDUCTION"],
    ["Total Number of WRA:","WRA"],
    ["Total Number of WME:","WME"],
    ["Total Number of Sick Leave:","SICK LEAVE"],
    ["Total Number of Sick Leave Notification:","SL NOTIFICATION"],
    ["Total Number of Maternity Leave:","ML"],
    ["Total Number of Maternity Leave Notification:","ML NOTIFICATION"]
  ];
  const countStatus=s=> (r.employees||[]).filter(x=>x.status===s).length;

  const nod=(r.nurses||[]).slice(0,6);
  while(nod.length<6) nod.push("");

  const page1=`
  <div class="print-page print-page-1">
    <img class="print-logo" src="assets/health-services-logo.png">
    <div class="print-title">CLINIC NURSE ENDORSEMENT FORM</div>
    <div class="print-header-line">
      <div class="shift">SHIFT TIME:
        ${checkedShift(r.shift,"5:00 AM - 2:00 PM")} 5:00 AM - 2:00 PM
        &nbsp;&nbsp;${checkedShift(r.shift,"1:00 PM - 10:00 PM")} 1:00 PM - 10:00 PM
        &nbsp;&nbsp;${checkedShift(r.shift,"9:00 PM - 6:00 AM")} 9:00 PM - 6:00 AM
      </div>
      <div class="date">DATE: ${formatPrintDate(r.endorsement_date)}</div>
    </div>
    <div class="print-nod">
      <div class="nod-label">NOD:</div>
      <div class="nod-list">
        ${nod.map((n,i)=>`<div class="nod-row">${esc(n)}</div>`).join("")}
      </div>
      <div></div>
    </div>
    ${printSection("CONSULTATIONS IN-PERSON","CONSULTATION",10)}
    ${printSection("FIT TO WORK IN-PERSON","FTW-IN PERSON",9)}
    ${printSection("FIT TO WORK ONLINE","FTW-ONLINE",9)}
    ${printSection("HOSPITAL CONDUCTION","HOSPITAL CONDUCTION",9)}
  </div>`;

  const page2=`
  <div class="print-page print-page-2">
    ${printSection("WORK RELATED ACCIDENT","WRA",8)}
    ${printSection("WORK MEDICAL EMERGENCY","WME",8)}
    ${printSection("SICK LEAVE","SICK LEAVE",8,"normal","sick")}
    ${printSection("MATERNITY LEAVE","ML",8,"ml","ml")}
    ${printSection("MATERNITY LEAVE NOTIFICATION","ML NOTIFICATION",8,"ml","ml")}
  </div>`;

  const page3=`
  <div class="print-page print-page-3">
    <div class="carry-rows"><table><tbody>
      <tr><td></td><td></td><td></td></tr>
      <tr><td></td><td></td><td></td></tr>
      <tr><td></td><td></td><td></td></tr>
      <tr><td></td><td></td><td></td></tr>
    </tbody></table></div>

    <div class="remark-title">ENDORSEMENT REMARK</div>
    <div class="remark-box">${esc(r.endorsement_remark||"")}</div>
    <div class="remark-title">GENERAL ENDORSEMENT REMARK</div>
    <div class="remark-box general-box">${esc(r.general_endorsement_remark||"")}</div>

    <div class="summary-title">SUMMARY <span style="float:right;padding-right:.15in">TOTAL</span></div>
    <table class="summary-table"><tbody>
      ${summaryStatuses.map(x=>`<tr><td>${x[0]}</td><td>${countStatus(x[1])}</td></tr>`).join("")}
    </tbody></table>

    <div class="signatures">
      <div class="sig"><div class="sig-label">CHARGE NURSE:</div><div class="sig-line">${esc(r.charge_nurse||"")}</div></div>
      <div class="sig"><div class="sig-label">OUTGOING NURSE:</div><div class="sig-line">${esc(r.outgoing_nurse||"")}</div></div>
      <div class="sig"><div class="sig-label">INCOMING NURSE:</div><div class="sig-line">${esc(r.incoming_nurse||"")}</div></div>
      <div class="sig"><div class="sig-label">INCOMING NURSE:</div><div class="sig-line"></div></div>
      <div class="sig"><div class="sig-label">INCOMING NURSE:</div><div class="sig-line"></div></div>
      <div class="sig"><div class="sig-label">INCOMING NURSE:</div><div class="sig-line"></div></div>
    </div>

    <div class="approval">
      <div class="sig"><div class="sig-line">ISRAEL S. GARCIA</div><div>Manager, CI for HR and Admin, and Health<br>Services Operations</div></div>
      <div class="sig"><div class="sig-line">DR. MARICEL S. EDNILAN</div><div>Occupational Health Physician</div></div>
    </div>
  </div>`;

  let el=document.getElementById("printDocument");
  if(!el){
    el=document.createElement("div");
    el.id="printDocument";
    el.className="print-document";
    document.body.appendChild(el);
  }
  el.innerHTML=page1+page2+page3;
}


init();
