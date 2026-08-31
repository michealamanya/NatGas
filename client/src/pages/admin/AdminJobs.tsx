import { Briefcase, ClipboardList, Loader2, Plus, Users, X } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { api, Job } from '../../api/client';

interface AdminJob extends Job { _count?: { applications: number }; }

export default function AdminJobs() {
  const [jobs, setJobs]       = useState<AdminJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState<AdminJob | null>(null);
  const [toast,    setToast]    = useState('');
  const [tab, setTab]           = useState<'jobs' | 'apps'>('jobs');

  const notify = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };
  const load = () => {
    setLoading(true);
    api<AdminJob[]>('/admin/jobs?limit=100')
      .then(r => setJobs(r.data ?? []))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const closeForm = () => { setShowForm(false); setEditing(null); };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      title:           fd.get('title'),
      department:      fd.get('department'),
      location:        fd.get('location'),
      employmentType:  fd.get('employmentType'),
      salaryRange:     fd.get('salaryRange'),
      description:     fd.get('description'),
      responsibilities:fd.get('responsibilities'),
      requirements:    fd.get('requirements'),
      benefits:        fd.get('benefits'),
      // Native date inputs return YYYY-MM-DD, while the secured API requires
      // an ISO timestamp. Send null to explicitly clear a previous deadline.
      deadline:        fd.get('deadline') ? new Date(`${fd.get('deadline')}T23:59:59.999Z`).toISOString() : null,
      status:          fd.get('status'),
      isFeatured:      fd.get('isFeatured') === 'on',
    };
    try {
      if (editing) {
        await api(`/admin/jobs/${editing.id}`, { method: 'PUT', body: JSON.stringify(payload) });
        notify('Job updated');
      } else {
        await api('/admin/jobs', { method: 'POST', body: JSON.stringify(payload) });
        notify('Job created');
      }
      closeForm(); load();
    } catch (err) { notify(err instanceof Error ? err.message : 'Failed'); }
  };

  const toggle = async (j: AdminJob) => {
    const s = j.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    try {
      await api(`/admin/jobs/${j.id}`, { method: 'PUT', body: JSON.stringify({ status: s }) });
      notify(`Job ${s.toLowerCase()}`); load();
    } catch (err) { notify(err instanceof Error ? err.message : 'Failed'); }
  };

  const del = async (j: AdminJob) => {
    if (!confirm(`Delete "${j.title}"?`)) return;
    try {
      await api(`/admin/jobs/${j.id}`, { method: 'DELETE' });
      notify('Job deleted'); load();
    } catch (err) { notify(err instanceof Error ? err.message : 'Failed'); }
  };

  return (
    <>
      <div className="jobs-page-header">
        <div>
          <h1 className="admin-page-title">Jobs &amp; Applications</h1>
          <p className="admin-page-sub">Manage vacancies and review applicants.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}>
          <Plus size={15} /> Post a job
        </button>
      </div>

      {/* Tabs */}
      <div className="jobs-tabs" role="tablist" aria-label="Jobs workspace">
        <button className={`jobs-tab ${tab==='jobs' ? 'active' : ''}`} onClick={() => setTab('jobs')}>
          <Briefcase size={13} /> Vacancies
        </button>
        <button className={`jobs-tab ${tab==='apps' ? 'active' : ''}`} onClick={() => setTab('apps')}>
          <Users size={13} /> Applications
        </button>
      </div>

      {showForm && (
        <div className="admin-card jobs-form-card">
          <div className="admin-card-header">
            <h3>{editing ? 'Edit job' : 'Post new job'}</h3>
            <button style={{ background:'none', border:0, cursor:'pointer' }} onClick={closeForm}><X size={18} /></button>
          </div>
          <div className="admin-card-body">
            <form className="jobs-form" onSubmit={handleSubmit}>
              <div className="form-row-2">
                <div className="form-group">
                  <label>Job title *</label>
                  <input required name="title" defaultValue={editing?.title} placeholder="e.g. LPG Installation Engineer" />
                </div>
                <div className="form-group">
                  <label>Department</label>
                  <input name="department" defaultValue={editing?.department ?? ''} placeholder="e.g. Technical" />
                </div>
              </div>
              <div className="form-row-2">
                <div className="form-group">
                  <label>Location</label>
                  <input name="location" defaultValue={editing?.location ?? ''} placeholder="e.g. Kampala" />
                </div>
                <div className="form-group">
                  <label>Employment type</label>
                  <select name="employmentType" defaultValue={editing?.employmentType ?? 'FULL_TIME'}>
                    <option value="FULL_TIME">Full-time</option>
                    <option value="PART_TIME">Part-time</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="INTERNSHIP">Internship</option>
                    <option value="CONSULTANT">Consultant</option>
                  </select>
                </div>
              </div>
              <div className="form-row-2">
                <div className="form-group">
                  <label>Salary range</label>
                  <input name="salaryRange" defaultValue={editing?.salaryRange ?? ''} placeholder="e.g. UGX 1,500,000 – 2,500,000" />
                </div>
                <div className="form-group">
                  <label>Application deadline</label>
                  <input type="date" name="deadline" defaultValue={editing?.deadline ? editing.deadline.substring(0,10) : ''} />
                </div>
              </div>
              <div className="form-group">
                <label>Job description *</label>
                <textarea required name="description" rows={4} defaultValue={editing?.description ?? ''} />
              </div>
              <div className="form-group">
                <label>Responsibilities</label>
                <textarea name="responsibilities" rows={5} defaultValue={editing?.responsibilities ?? ''} placeholder="List key responsibilities, one per line…" />
              </div>
              <div className="form-group">
                <label>Requirements</label>
                <textarea name="requirements" rows={5} defaultValue={editing?.requirements ?? ''} placeholder="List qualifications and requirements…" />
              </div>
              <div className="form-group">
                <label>Benefits</label>
                <textarea name="benefits" rows={3} defaultValue={editing?.benefits ?? ''} />
              </div>
              <div className="form-row-2">
                <div className="form-group">
                  <label>Status</label>
                  <select name="status" defaultValue={editing?.status ?? 'DRAFT'}>
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                  </select>
                </div>
                <div className="form-group" style={{ display:'flex', alignItems:'flex-end', paddingBottom: 4 }}>
                  <label style={{ display:'flex', alignItems:'center', gap: 8, cursor:'pointer' }}>
                    <input type="checkbox" name="isFeatured" defaultChecked={editing?.isFeatured} style={{ width:'auto' }} />
                    Mark as featured
                  </label>
                </div>
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button type="submit" className="btn btn-primary">{editing ? 'Save changes' : 'Post job'}</button>
                <button type="button" className="btn btn-outline" onClick={closeForm}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {tab === 'jobs' && (
        <div className="admin-card jobs-card">
          <div className="admin-card-header"><h3><Briefcase size={16} /> Vacancies <span>{jobs.length}</span></h3><p>Publish and manage current openings.</p></div>
          {loading ? (
            <div className="loading-state"><Loader2 size={22} className="spin" /></div>
          ) : (
            <div className="data-table-wrap">
              <table className="data-table">
                <thead><tr><th>Job title</th><th>Department</th><th>Type</th><th>Deadline</th><th>Status</th><th>Applicants</th><th>Actions</th></tr></thead>
                <tbody>
                  {jobs.map(j => (
                    <tr key={j.id}>
                      <td><b>{j.title}</b></td>
                      <td>{j.department ?? '—'}</td>
                      <td>{j.employmentType.replace('_',' ')}</td>
                      <td>{j.deadline ? new Date(j.deadline).toLocaleDateString() : 'Open'}</td>
                      <td><span className={`badge badge-${j.status.toLowerCase()}`}>{j.status}</span></td>
                      <td>{j._count?.applications ?? 0}</td>
                      <td>
                        <div className="actions">
                          <button className="tbl-btn" onClick={() => { setEditing(j); setShowForm(true); }}>Edit</button>
                          <button className="tbl-btn" onClick={() => toggle(j)}>
                            {j.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                          </button>
                          <button className="tbl-btn danger" onClick={() => del(j)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {jobs.length === 0 && (
                    <tr><td colSpan={7} style={{ textAlign:'center', color:'var(--muted)', padding:'32px' }}>No jobs posted yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'apps' && <ApplicationsTab />}
      {toast && <div className="toast-msg">{toast}</div>}
    </>
  );
}

function ApplicationsTab() {
  const [apps, setApps]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<any[]>('/admin/applications?limit=100')
      .then(r => setApps(r.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  const STATUS_COLORS: Record<string,string> = {
    NEW:'badge-new', REVIEWING:'badge-reviewing', SHORTLISTED:'badge-published',
    INTERVIEW:'badge-new', REJECTED:'badge-archived', HIRED:'badge-published',
  };

  return (
    <div className="admin-card jobs-card">
      <div className="admin-card-header"><h3><ClipboardList size={16} /> Applications <span>{apps.length}</span></h3><p>Review incoming candidate submissions.</p></div>
      {loading ? (
        <div className="loading-state"><Loader2 size={22} className="spin" /></div>
      ) : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead><tr><th>Applicant</th><th>Job</th><th>Applied</th><th>Status</th><th>CV</th></tr></thead>
            <tbody>
              {apps.map(a => (
                <tr key={a.id}>
                  <td><b>{a.fullName}</b><small>{a.email}</small></td>
                  <td>{a.job?.title ?? '—'}</td>
                  <td>{new Date(a.appliedAt).toLocaleDateString()}</td>
                  <td><span className={`badge ${STATUS_COLORS[a.status] ?? 'badge-draft'}`}>{a.status}</span></td>
                  <td>{a.cvUrl ? <a href={a.cvUrl} target="_blank" rel="noreferrer" className="btn-link" style={{ fontSize:13 }}>View CV</a> : '—'}</td>
                </tr>
              ))}
              {apps.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign:'center', color:'var(--muted)', padding:'32px' }}>No applications yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
