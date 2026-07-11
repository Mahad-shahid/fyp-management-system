import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.post('/auth/login', { email, password });
      const { access_token, role, user_id, full_name } = res.data;
      login({ role, user_id, full_name, email }, access_token);
      toast.success(`Welcome, ${full_name}`);
      if (role === 'admin') navigate('/admin');
      else if (role === 'advisor') navigate('/advisor');
      else navigate('/student');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--navy)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Background decoration */}
      <div style={{
        position: 'absolute', top: '-120px', right: '-120px',
        width: '400px', height: '400px', borderRadius: '50%',
        background: 'rgba(123,29,29,0.15)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-80px', left: '-80px',
        width: '280px', height: '280px', borderRadius: '50%',
        background: 'rgba(123,29,29,0.1)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: '420px', position: 'relative' }}>

        {/* Card */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '40px 36px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}>

          {/* Logo + title */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{
              width: '56px', height: '56px',
              background: 'var(--wine)',
              borderRadius: '14px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 4px 14px rgba(123,29,29,0.35)',
            }}>
              <span style={{ color: 'white', fontWeight: 800, fontSize: '18px' }}>FYP</span>
            </div>
            <h1 style={{
              fontSize: '22px', fontWeight: 700,
              color: 'var(--navy)', margin: '0 0 4px',
            }}>
              FYPMS
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-mid)', margin: 0 }}>
              Final Year Project Management System
            </p>
            <p style={{ fontSize: '11px', color: 'var(--text-light)', margin: '2px 0 0' }}>
              Institute of Business Management · CS Department
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{
                display: 'block', fontSize: '12px', fontWeight: 500,
                color: 'var(--text-mid)', marginBottom: '6px',
              }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input"
                placeholder="you@iobm.edu.pk"
                required
              />
            </div>

            <div>
              <label style={{
                display: 'block', fontSize: '12px', fontWeight: 500,
                color: 'var(--text-mid)', marginBottom: '6px',
              }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: '14px', marginTop: '4px' }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Dev credentials */}
          <div style={{
            marginTop: '24px',
            padding: '12px 14px',
            background: 'var(--off-white)',
            borderRadius: '8px',
            border: '1px solid var(--border)',
          }}>
            <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-mid)', marginBottom: '6px' }}>
              Quick login (dev)
            </p>
            {[
              ['Admin',   'admin@iobm.edu.pk',    'admin123'],
              ['Advisor', 'advisor1@iobm.edu.pk', 'advisor123'],
              ['Student', 'irtiza@student.iobm.edu.pk', 'student123'],
            ].map(([role, email, pass]) => (
              <button
                key={role}
                type="button"
                onClick={() => { setEmail(email); setPassword(pass); }}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '11px', color: 'var(--text-light)',
                  padding: '2px 0', transition: 'color 0.15s',
                }}
                onMouseEnter={e => e.target.style.color = 'var(--wine)'}
                onMouseLeave={e => e.target.style.color = 'var(--text-light)'}
              >
                {role}: {email}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p style={{
          textAlign: 'center', marginTop: '20px',
          fontSize: '11px', color: '#475569',
        }}>
          Session 2025-2026 · IoBM CS Department
        </p>
      </div>
    </div>
  );
}