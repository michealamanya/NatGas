import {
  ArrowLeft, ArrowRight, Briefcase, Calendar,
  CheckCircle2, Loader2, MapPin, Upload, X,
} from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, Job } from '../api/client';
import { JobCard } from './Home';

const TYPE: Record<string,string> = {
  FULL_TIME:'Full-time', PART_TIME:'Part-time',
  CONTRACT:'Contract', INTERNSHIP:'Internship', CONSULTANT:'Consultant',
};

/* ─── Careers listing ───────────────────────────────────────────────────── */
export default function Careers() {
  const [jobs, setJobs]       = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Job[]>('/jobs?limit=50')
      .then(r => setJobs(r.data ?? []))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, []);

  const featured = jobs.filter(j => j.isFeatured);
  const rest     = jobs.filter(j => !j.isFeatured);

  return (
    <>
      <div className="page-hero">
        <div className="page-hero-wrap">
          <div className="chip">CAREERS &amp; OPPORTUNITIES</div>
          <h1>Join the NATGAS team.</h1>
          <p>
            We are Uganda's leading LPG technical services company and we are growing.
            Help us deliver safe, reliable energy to homes and businesses across Uganda.
          </p>
        </div>
      </div>

      {/* Why join */}
      <section className="section" style={{ background: '#fff' }}>
        <div className="wrap">
          <div className="section-head">
            <div>
              <span className="chip-sm">WHY WORK WITH US</span>
              <h2>Build your career in energy.</h2>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 18 }}>
            {[
              { icon: CheckCircle2, t: 'Growth opportunities',   d: 'Training, certifications and career development for every team member.' },
              { icon: Briefcase,    t: 'Meaningful work',        d: 'Every role contributes to safer, cleaner energy access across Uganda.' },
              { icon: MapPin,       t: 'Multiple locations',     d: 'Roles available in Kampala, Entebbe and across the country.' },
              { icon: Calendar,     t: 'Competitive benefits',   d: 'Competitive salaries, health insurance and professional development.' },
            ].map(({ icon: Icon, t, d }) => (
              <div className="svc-card" key={t}>
                <div className="svc-icon"><Icon size={20} /></div>
                <h3>{t}</h3><p>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Jobs */}
      <section className="section" style={{ background: 'var(--cream)' }}>
        <div className="wrap">
          {loading ? (
            <div className="loading-state"><Loader2 size={26} className="spin" /><span>Loading vacancies…</span></div>
          ) : jobs.length === 0 ? (
            <div className="empty-state">
              <Briefcase size={52} strokeWidth={1.5} />
              <h3>No open vacancies right now</h3>
              <p>Check back soon or send us your CV speculatively.</p>
              <Link className="btn btn-dark" to="/contact">Send speculative application</Link>
            </div>
          ) : (
            <>
              {featured.length > 0 && (
                <div style={{ marginBottom: 36 }}>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--green)', marginBottom: 16 }}>
                    Featured positions
                  </h3>
                  <div className="job-list">
                    {featured.map(j => <JobCard key={j.id} j={j} />)}
                  </div>
                </div>
              )}
              {rest.length > 0 && (
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--green)', marginBottom: 16 }}>
                    All open positions
                  </h3>
                  <div className="job-list">
                    {rest.map(j => <JobCard key={j.id} j={j} />)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <div className="cta-band">
        <div className="cta-wrap">
          <div>
            <h2>Don't see a role that fits?</h2>
            <p>Send us your CV and we'll reach out when a suitable position opens.</p>
          </div>
          <div className="cta-btns">
            <Link className="btn btn-primary" to="/contact">Send your CV</Link>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Job detail + application ──────────────────────────────────────────── */
export function JobDetail() {
  const { slug }   = useParams<{ slug: string }>();
  const navigate   = useNavigate();
  const [job, setJob]             = useState<Job | null>(null);
  const [loading, setLoading]     = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError]         = useState('');
  const [cvFile, setCvFile]       = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!slug) return;
    api<Job>(`/jobs/${slug}`)
      .then(r => setJob(r.data))
      .catch(() => setJob(null))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const fd = new FormData(e.currentTarget);
    if (cvFile) fd.set('cv', cvFile);
    try {
      await api(`/jobs/${job!.id}/apply`, { method: 'POST', body: fd, headers: {} });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Please try again.');
    }
  };

  if (loading) return <div className="loading-state" style={{ minHeight: '60vh' }}><Loader2 size={28} className="spin" /></div>;
  if (!job)    return (
    <div className="empty-state" style={{ minHeight: '60vh' }}>
      <h3>Job not found</h3>
      <button className="btn btn-outline btn-sm" onClick={() => navigate('/careers')}>← Back to careers</button>
    </div>
  );

  const deadline = job.deadline ? new Date(job.deadline) : null;
  const expired  = deadline ? deadline < new Date() : false;

  return (
    <>
      <div className="page-hero">
        <div className="page-hero-wrap">
          <Link to="/careers" className="page-hero-back"><ArrowLeft size={13} /> Careers</Link>
          <div className="chip">{TYPE[job.employmentType] ?? job.employmentType}</div>
          <h1>{job.title}</h1>
          {job.department && <p>{job.department} {job.location ? `· ${job.location}` : ''}</p>}
        </div>
      </div>

      <section className="section" style={{ background: '#fff' }}>
        <div className="wrap">
          <div className="jd-wrap">
            {/* Content */}
            <div>
              <div className="jd-section">
                <h3>About this role</h3>
                <p>{job.description}</p>
              </div>
              {job.responsibilities && (
                <div className="jd-section">
                  <h3>Responsibilities</h3>
                  <pre>{job.responsibilities}</pre>
                </div>
              )}
              {job.requirements && (
                <div className="jd-section">
                  <h3>Requirements</h3>
                  <pre>{job.requirements}</pre>
                </div>
              )}
              {job.benefits && (
                <div className="jd-section">
                  <h3>Benefits</h3>
                  <pre>{job.benefits}</pre>
                </div>
              )}

              {/* Application form */}
              {!expired ? (
                <div className="app-form">
                  <h3>Apply for this position</h3>
                  {submitted ? (
                    <div className="form-ok">
                      <h4>✓ Application submitted!</h4>
                      <p>Thank you for applying for <strong>{job.title}</strong>. Our HR team will review your application and get back to you.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit}>
                      <div className="fg-row2">
                        <div className="fg"><label>Full name *</label><input required name="fullName" /></div>
                        <div className="fg"><label>Email address *</label><input required type="email" name="email" /></div>
                      </div>
                      <div className="fg-row2">
                        <div className="fg"><label>Phone number</label><input type="tel" name="phone" /></div>
                        <div className="fg"><label>LinkedIn URL</label><input type="url" name="linkedInUrl" /></div>
                      </div>

                      {/* CV upload */}
                      <div className="fg">
                        <label>CV / Resume</label>
                        <div className="upload-zone" onClick={() => fileRef.current?.click()}>
                          {cvFile ? (
                            <span style={{ color: 'var(--green)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                              <CheckCircle2 size={15} /> {cvFile.name}
                              <button type="button" onClick={e => { e.stopPropagation(); setCvFile(null); }}
                                style={{ background: 'none', border: 0, color: '#9b5b00', cursor: 'pointer', display: 'flex' }}>
                                <X size={13} />
                              </button>
                            </span>
                          ) : (
                            <>
                              <Upload size={20} style={{ opacity: .4, display: 'block', margin: '0 auto 8px' }} />
                              <span>Click to upload your CV</span>
                              <span style={{ display: 'block', fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>PDF or Word, max 10MB</span>
                            </>
                          )}
                        </div>
                        <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }}
                          onChange={e => setCvFile(e.target.files?.[0] ?? null)} />
                      </div>

                      <div className="fg">
                        <label>Cover letter</label>
                        <textarea name="coverLetter" rows={5} placeholder="Tell us why you're a great fit…" />
                      </div>

                      {error && <div className="form-err">{error}</div>}
                      <button className="btn btn-dark btn-full" type="submit">
                        Submit application <ArrowRight size={14} />
                      </button>
                    </form>
                  )}
                </div>
              ) : (
                <div className="form-err">Application deadline has passed for this position.</div>
              )}
            </div>

            {/* Sidebar */}
            <div className="jd-sidebar">
              <h3>Position details</h3>
              {[
                { icon: Briefcase, label: 'Type',       val: TYPE[job.employmentType] ?? job.employmentType },
                { icon: MapPin,    label: 'Location',   val: job.location ?? 'Uganda' },
                { icon: Briefcase, label: 'Department', val: job.department ?? '—' },
                { icon: Calendar,  label: 'Deadline',   val: deadline ? deadline.toLocaleDateString('en-UG',{year:'numeric',month:'long',day:'numeric'}) : 'Open' },
              ].map(({ icon: Icon, label, val }) => (
                <div className="jd-meta-row" key={label}>
                  <Icon size={15} />
                  <div><span>{label}</span><b>{val}</b></div>
                </div>
              ))}
              {job.salaryRange && (
                <div className="jd-meta-row">
                  <span style={{ fontSize: 16 }}>💰</span>
                  <div><span>Salary</span><b>{job.salaryRange}</b></div>
                </div>
              )}
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <Link to="/contact" className="btn btn-outline btn-sm btn-full">Contact HR team</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
