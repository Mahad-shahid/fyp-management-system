import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleLabels = {
    admin:   { label: 'Administrator', color: '#7B1D1D', bg: '#F9F0F0' },
    advisor: { label: 'Advisor',       color: '#065F46', bg: '#DCFCE7' },
    student: { label: 'Student',       color: '#1E40AF', bg: '#DBEAFE' },
  };

  const role = user ? roleLabels[user.role] : null;

  const navLinks = {
    admin:   [
      { label: 'Dashboard',   path: '/admin' },
      { label: 'Groups',      path: '/admin/groups' },
      { label: 'Proposals',   path: '/admin/proposals' },
      { label: 'Users',       path: '/admin/users' },
    ],
    advisor: [
      { label: 'Dashboard', path: '/advisor' },
    ],
    student: [
      { label: 'Dashboard',  path: '/student' },
      { label: 'Documents',  path: '/student/documents' },
    ],
  };

  const links = user ? (navLinks[user.role] || []) : [];

  return (
    <nav style={{
      background: 'var(--navy)',
      borderBottom: '3px solid var(--wine)',
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '58px',
      position: 'sticky',
      top: 0,
      zIndex: 40,
    }}>

      {/* Left — Logo + nav links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px',
            background: 'var(--wine)',
            borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: 'white', fontWeight: 700, fontSize: '13px' }}>FYP</span>
          </div>
          <div>
            <p style={{ color: 'white', fontWeight: 600, fontSize: '14px', lineHeight: 1.2 }}>FYPMS</p>
            <p style={{ color: '#94A3B8', fontSize: '10px', lineHeight: 1.2 }}>IoBM · CS Department</p>
          </div>
        </div>

        {/* Nav links */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {links.map(link => {
              const isActive = location.pathname === link.path;
              return (
                <button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  style={{
                    background: isActive ? 'rgba(123,29,29,0.4)' : 'transparent',
                    color: isActive ? 'white' : '#94A3B8',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '13px',
                    fontWeight: isActive ? 500 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { if (!isActive) e.target.style.color = 'white'; }}
                  onMouseLeave={e => { if (!isActive) e.target.style.color = '#94A3B8'; }}
                >
                  {link.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Right — User info + logout */}
      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ color: 'white', fontSize: '13px', fontWeight: 500, lineHeight: 1.3 }}>
              {user.full_name}
            </p>
            {role && (
              <span style={{
                background: role.bg,
                color: role.color,
                fontSize: '10px',
                fontWeight: 600,
                padding: '1px 8px',
                borderRadius: '99px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}>
                {role.label}
              </span>
            )}
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: 'transparent',
              color: '#94A3B8',
              border: '1px solid #334155',
              borderRadius: '7px',
              padding: '6px 12px',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              e.target.style.color = 'white';
              e.target.style.borderColor = '#7B1D1D';
            }}
            onMouseLeave={e => {
              e.target.style.color = '#94A3B8';
              e.target.style.borderColor = '#334155';
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </nav>
  );
}