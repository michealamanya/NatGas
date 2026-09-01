import { Briefcase, FileText, Globe, Image, MessageSquare, Package, Settings, Users, Wrench } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';

type Dashboard = { counts?: { products:{total:number;published:number}; services:{total:number}; news:{total:number}; jobs:{total:number;open:number}; applications:{total:number;new:number}; contacts:{total:number;unread:number}; users:{total:number;active:number}; pages:{total:number} }; system?:{status:string;timestamp:string}; recentActivity?:Array<{id:string;action:string;resource:string;createdAt:string;user?:{firstName:string;lastName:string}}> };
export default function Dashboard() {
 const [data,setData]=useState<Dashboard>({});
 useEffect(()=>{api<Dashboard>('/admin/dashboard').then(r=>setData(r.data??{})).catch(()=>undefined)},[]);
 const c=data.counts; const cards=[
  {icon:Package,label:'Products',value:c?.products.total,to:'/admin/products',sub:`${c?.products.published??0} published`},
  {icon:Wrench,label:'Services',value:c?.services.total,to:'/admin/services',sub:'Public service catalogue'},
  {icon:MessageSquare,label:'Messages',value:c?.contacts.total,to:'/admin/messages',sub:`${c?.contacts.unread??0} unread`},
  {icon:Briefcase,label:'Jobs',value:c?.jobs.total,to:'/admin/jobs',sub:`${c?.applications.new??0} new applications`},
  {icon:Users,label:'Accounts',value:c?.users.total,to:'/admin/users',sub:`${c?.users.active??0} active`},
  {icon:FileText,label:'News',value:c?.news.total,to:'/admin/news',sub:'Published content'},
 ];
 return <div><div className="admin-page-head"><div><h1 className="admin-page-title">Overview</h1><p className="admin-page-sub">Your live NATGAS platform at a glance.</p></div><span className={`status-pill ${data.system?.status==='healthy'?'active':'suspended'}`}>{data.system?.status==='healthy'?'SYSTEM ONLINE':'CHECK SYSTEM'}</span></div><div className="stat-cards">{cards.map(({icon:Icon,label,value,to,sub})=><Link to={to} className="stat-card" key={label} style={{textDecoration:'none'}}><div style={{display:'flex',justifyContent:'space-between'}}><span className="stat-card-label">{label}</span><div className="stat-card-icon"><Icon size={18}/></div></div><div className="stat-card-value">{value??'—'}</div><span className="stat-card-sub">{sub}</span></Link>)}</div><div className="admin-card" style={{marginTop:24}}><div className="admin-card-head"><h3>Site controls</h3><span>Update public content instantly</span></div><div className="admin-card-body" style={{display:'flex',gap:12,flexWrap:'wrap'}}><Link className="btn btn-primary btn-sm" to="/admin/experience"><Globe size={14}/> Homepage visual & flyer</Link><Link className="btn btn-outline btn-sm" to="/admin/media"><Image size={14}/> Gallery & team</Link><Link className="btn btn-outline btn-sm" to="/admin/settings"><Settings size={14}/> Company & SEO settings</Link><Link className="btn btn-outline btn-sm" to="/admin/orders">Manage orders</Link></div></div><div className="admin-card" style={{marginTop:20}}><div className="admin-card-head"><h3>Recent activity</h3><Link to="/admin/audit">View audit log</Link></div><div className="admin-card-body">{data.recentActivity?.length?data.recentActivity.slice(0,6).map(item=><p key={item.id} style={{display:'flex',justifyContent:'space-between',gap:12,padding:'10px 0',borderBottom:'1px solid var(--border)',fontSize:13}}><span><b>{item.user?`${item.user.firstName} ${item.user.lastName}`:'System'}</b> {item.action.replace(/_/g,' ').toLowerCase()} <em>{item.resource}</em></span><small>{new Date(item.createdAt).toLocaleString()}</small></p>):<p className="media-empty">Activity will appear here as your team works.</p>}</div></div></div>;
}
