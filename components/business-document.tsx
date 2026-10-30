import React from 'react';
import {cents,money,totals,type Data,type Entry,type Item} from '@/lib/domain';
import {existingCompany,standardFindings,standardServices,standardTerms} from '@/lib/document-template';
const date=(v:string)=>v?new Date(v.length===10?v+'T12:00:00+08:00':v).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'Asia/Kuala_Lumpur'}):'—';
export function BusinessDocument({entry,company,customer}:{entry:Entry;company:Data;customer?:Data}){
 const d=entry.data,q=entry.kind==='quotations',t=totals(d);
 const profile:Data={...existingCompany};for(const [k,v] of Object.entries(company))if(v)profile[k]=v;
 const groups=[...new Set((d.items??[]).map((i:Item)=>i.area))] as string[];
 const amount=(i:Item)=>Math.round(Number(i.quantity)*cents(i.rate));
 const signatureName=profile.signatory,terms=d.terms||(q?standardTerms:'Payment is due within the agreed terms shown on this invoice.');
 return <article className="print-document existing-document">
  <header className="existing-letterhead">
   <img className="company-logo" src="/brand/tj-sons-logo.jpg" alt="TJ & Sons truck logo"/>
   <div className="company-letter-details">
    <div className="company-wordmark">{profile.companyName===existingCompany.companyName?<img src="/brand/tj-sons-wordmark.png" alt={profile.companyName}/>:<h2>{profile.companyName}</h2>}<b>({profile.registration})</b></div>
    <p>{profile.address}</p><p>{profile.postalAddress} &nbsp; TEL : {profile.phone} &nbsp; Email : {profile.email}</p><p>SST No: {profile.sstNumber}</p>
   </div>
   <div className="association-logo"><span>A Founding Company Of</span><img src="/brand/wastewater-association.jpg" alt="Sabah Waste Water Management Association"/></div>
  </header>
  <div className="existing-recipient-reference">
   <div className="existing-recipient"><b>{customer?.recipientTitle||'MANAGER'}</b><strong>{customer?.name??'Customer'}</strong>{customer?.additionalCompany&&<p>{customer.additionalCompany}</p>}<p>{customer?.address}</p>{customer?.contact&&<p>Attn: {customer.contact}</p>}</div>
   <dl className="existing-reference"><dt className="reference-kind">{q?'QUOTATION':'INVOICE'} :</dt><dd className="reference-kind">{d.number}</dd><dt>Your Reference :</dt><dd>{d.yourReference||'—'}</dd><dt>Our Reference :</dt><dd>{d.ourReference||'—'}</dd><dt>Date :</dt><dd>{date(d.date)}</dd>{!q&&d.dueDate&&<><dt>Due Date :</dt><dd>{date(d.dueDate)}</dd></>}{q&&d.validUntil&&<><dt>Valid Until :</dt><dd>{date(d.validUntil)}</dd></>}</dl>
  </div>
  <section className="existing-subject"><h1>{d.documentTitle||`${q?'QUOTATION':'INVOICE'} FOR SEPTIC TANK DESLUDGING & MANHOLE CLEANING`}</h1><h2>LOCATION : {d.site}</h2></section>
  <p className="existing-introduction">{d.introduction||(q?'We are pleased to submit our quotation for the desludging of Septic Tank and cleaning of associated manholes as detailed below:-':'Please find our invoice for the desludging of Septic Tank and cleaning of associated manholes as detailed below:-')}</p>
  <table className="existing-items"><colgroup><col style={{width:'5%'}}/><col style={{width:'16%'}}/><col style={{width:'31%'}}/><col style={{width:'5%'}}/><col style={{width:'6%'}}/><col style={{width:'16%'}}/><col style={{width:'21%'}}/></colgroup>
   <thead><tr>{['No.','Item','Description','Qty','Unit','Price/Unit','Total (RM)'].map(h=><th key={h}>{h}</th>)}</tr></thead>
   {groups.map((area,g)=>{const items=(d.items as Item[]).filter(i=>i.area===area);return <tbody key={area} className="existing-area"><tr className="area-heading"><td colSpan={2}>AREA {g+1} :</td><td colSpan={5}><u>{area}</u></td></tr>{items.map((i,n)=><tr className="service-line" key={n}><td>{g+1}.{n+1}</td><td>{i.serviceName||'Cleaning Service'}</td><td>{i.description}</td><td>{i.quantity}</td><td>{i.unit}</td><td className="numeric">{money(cents(i.rate))}</td><td className="numeric">{money(amount(i))}</td></tr>)}<tr className="area-subtotal"><td colSpan={6}>SUBTOTAL :</td><td className="numeric">{money(items.reduce((s,i)=>s+amount(i),0))}</td></tr></tbody>})}
   <tbody className="existing-general"><tr className="general-heading"><td colSpan={7}>GENERAL / OTHER CHARGES</td></tr><tr><td>G1</td><td colSpan={4}>Non-Scheduled Emergency Work</td><td className="numeric">RM 0.00</td><td className="numeric">—</td></tr><tr className="charge-note"><td/><td colSpan={6}>Rate to be quoted separately if required.</td></tr><tr><td>G2</td><td colSpan={2}>Mobilisation</td><td>1</td><td>L/S</td><td className="numeric">{money(cents(d.mobilisation??0))}</td><td className="numeric">{money(t.mobilisation)}</td></tr><tr className="charge-note"><td/><td colSpan={6}>{d.mobilisationNote||'One mobilisation covering all quoted areas under one continuous work programme.'}</td></tr></tbody>
   <tfoot>{t.discount>0&&<tr><td colSpan={6}>DISCOUNT ({d.discount}%) :</td><td className="numeric">−{money(t.discount)}</td></tr>}{t.tax>0&&<tr><td colSpan={6}>SST ({d.taxRate}%) :</td><td className="numeric">{money(t.tax)}</td></tr>}<tr className="existing-grand-total"><td colSpan={6}>TOTAL {q?'QUOTATION':'INVOICE'} AMOUNT:</td><td className="numeric">{money(t.total)}</td></tr></tfoot>
  </table>
  {(q||d.findings)&&<section className="existing-text-section"><h3>FINDINGS & RECOMMENDATION :</h3><p>{d.findings||standardFindings}</p></section>}
  {(q||d.services)&&<section className="existing-text-section"><h3>OUR SERVICES :</h3><p>{d.services||standardServices}</p></section>}
  <section className="existing-text-section existing-terms"><h3>{q?'TERMS & CONDITIONS :':'PAYMENT TERMS & CONDITIONS :'}</h3><p>{terms}</p>{company.bank&&<p>{company.bank}</p>}</section>
  <div className="existing-closing"><p>{q?'We trust that the above quotation provided is worthy of your consideration. Please do not hesitate to contact us if you need any further clarification.':'Thank you for your business. Please quote the invoice reference when making payment.'}</p>{q&&<p>We look forward to your favourable reply.</p>}<p>Thank you.</p></div>
  <div className="existing-signatures"><div><p>Yours sincerely,<br/>for {profile.companyName}</p><div className="manual-signature-space" aria-label="Space for authorised signature"/><strong>{signatureName}</strong>{profile.position&&<p>{profile.position}</p>}<p>Email : {profile.signatoryEmail}</p><p>H/P: {profile.phone}</p></div>{q&&<div className="customer-acceptance"><p>If this quotation is agreeable, kindly sign<br/>&amp; return this to us.</p><div className="manual-signature-space"/><div className="acceptance-line"/><p>Person in charge:<br/>Date :</p></div>}</div>
  <footer className="existing-footer"><p>“{profile.tagline}”</p><img src="/brand/registration-logos.jpg" alt="Malaysian government crest and CIDB Malaysia logos"/></footer>
 </article>
}
