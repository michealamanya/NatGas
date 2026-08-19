import { ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, User } from '../../api/client';

export default function Login({ onLogin }: { onLogin: (u: User) => void }) {
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const navigate = useNavigate();

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(''); setLoading(true);
    const values = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const r = await api<{ user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      onLogin(r.data.user);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrap">
      {/* ── Left branding panel ── */}
      <div className="login-l">
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 36 }}>
          <img
            src="/naticon.jpeg"
            alt="Natgas Uganda Limited"
            style={{ height: 56, width: 'auto', objectFit: 'contain' }}
          />
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', lineHeight: 1.1 }}>
              NATGAS
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', color: '#5aab9a', textTransform: 'uppercase' }}>
              UGANDA LIMITED
            </div>
          </div>
        </div>

        <h1>Staff Admin Portal</h1>
        <p>
          Securely manage NATGAS Uganda's digital platform —
          products, services, news, jobs and more.
        </p>

        <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { title: 'Role-based access control', sub: 'Permissions enforced for every user role.' },
            { title: 'Full audit trail',           sub: 'Every action logged with timestamp.' },
            { title: 'Secure HTTP-only sessions',  sub: 'Industry-standard authentication.' },
          ].map(({ title, sub }) => (
            <div key={title} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 32, height: 32, background: 'rgba(255,255,255,.08)', borderRadius: 7, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <ShieldCheck size={15} style={{ color: '#7ad4c0' }} />
              </div>
              <div>
                <b style={{ display: 'block', fontSize: 13, color: '#fff', marginBottom: 2 }}>{title}</b>
                <span style={{ fontSize: 12, color: '#5a9a90' }}>{sub}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="login-r">
        <div className="login-box">
          {/* Logo mark for mobile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
            <img src="/naticon.jpeg" alt="Natgas Uganda" style={{ height: 44, width: 'auto', objectFit: 'contain' }} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--green)', letterSpacing: '-.3px' }}>NATGAS</div>
              <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '1.8px', color: '#2e8b2e', textTransform: 'uppercase' }}>UGANDA LIMITED</div>
            </div>
          </div>

          <h2>Welcome back</h2>
          <p>Sign in with your staff credentials.</p>

          <form onSubmit={submit}>
            <div className="fg">
              <label htmlFor="login-email">Email address</label>
              <input
                id="login-email"
                required
                type="email"
                name="email"
                autoComplete="email"
                placeholder="you@natgasuganda.com"
              />
            </div>

            <div className="fg">
              <label htmlFor="login-password">Password</label>
              <div className="pwd-wrap">
                <input
                  id="login-password"
                  required
                  type={showPwd ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  placeholder="Your password"
                />
                <button
                  type="button"
                  className="pwd-eye"
                  onClick={() => setShowPwd(s => !s)}
                  aria-label={showPwd ? 'Hide password' : 'Show password'}
                >
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && <div className="form-err" style={{ marginBottom: 12 }}>{error}</div>}

            <button
              className="btn btn-dark btn-full"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Signing in…' : <><span>Sign in</span> <ArrowRight size={14} /></>}
            </button>
          </form>

          <Link to="/" className="login-back">← Return to website</Link>
        </div>
      </div>
    </div>
  );
}
