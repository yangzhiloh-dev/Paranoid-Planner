// Navbar Component which contains the app shell navigation

import { useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaTachometerAlt, FaTasks, FaCalendarAlt, FaBook } from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';
import PrimaryButton from './PrimaryButton';
import SecondaryButton from './SecondaryButton';
import IconWrap from './ui/IconWrap';

export const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { label: 'Dashboard', path: '/dashboard', icon: FaTachometerAlt },
    { label: 'Modules', path: '/modules', icon: FaBook },
    { label: 'Tasks', path: '/tasks', icon: FaTasks },
    { label: 'Schedule', path: '/schedule', icon: FaCalendarAlt },
  ];

  return (
    <>
      <aside className="hidden lg:flex fixed inset-y-0 left-6 z-40 w-72 flex-col rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur-2xl">
        <div className="flex flex-col gap-8 h-full">
          <div>
            <Link to="/dashboard" className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-amber-300/15 text-amber-300 shadow-[0_18px_45px_rgba(245,158,11,0.18)]">
                <span className="text-lg font-semibold">P</span>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Paranoid</p>
                <p className="text-xl font-semibold text-white">Planner</p>
              </div>
            </Link>

            <div className="mt-8 rounded-[28px] border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Workspace</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-3xl bg-slate-900 text-slate-100 text-sm font-semibold">
                  {user?.name?.charAt(0)?.toUpperCase() || 'S'}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{user?.name || 'Student'}</p>
                  <p className="truncate text-xs text-slate-400">Focus-driven planning</p>
                </div>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-2">
            {navLinks.map(({ label, path, icon: Icon }) => {
              const isActive = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  className={`group flex items-center gap-4 rounded-3xl px-4 py-3 text-sm font-semibold transition ${isActive
                    ? 'bg-amber-300/18 text-white shadow-[0_16px_40px_rgba(245,158,11,0.16)]'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                >
                  <IconWrap className={isActive ? 'bg-amber-300 text-slate-950' : 'bg-white/10 text-slate-300'}>
                    <Icon size={18} />
                  </IconWrap>
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto rounded-[28px] border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Signed in as</p>
            <p className="mt-3 text-sm font-semibold text-white">{user?.email || 'No email'}</p>
            <div className="mt-4">
              <SecondaryButton type="button" onClick={handleLogout} className="w-full px-4 py-3 text-sm font-semibold">
                Logout
              </SecondaryButton>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:hidden fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-[#1a0f08]/95 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-300/15 text-amber-300">
              P
            </div>
            <div>
              <p className="text-sm font-semibold text-white">ParanoidPlanner</p>
              <p className="text-xs text-slate-500">Focus-driven planning</p>
            </div>
          </Link>
          <button
            type="button"
            onClick={() => navigate('/tasks')}
            className="inline-flex items-center rounded-2xl bg-amber-300 px-3 py-2 text-xs font-semibold text-slate-950 transition hover:bg-amber-400"
          >
            New Task
          </button>
        </div>
      </div>

      <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#1a0f08]/95 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl justify-between px-4 py-2">
          {navLinks.map(({ label, path, icon: Icon }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`inline-flex flex-1 flex-col items-center gap-1 rounded-3xl px-3 py-2 text-[11px] font-semibold transition ${isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                <IconWrap className={isActive ? 'bg-amber-300 text-slate-950' : 'bg-white/10 text-slate-400'}>
                  <Icon size={16} />
                </IconWrap>
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
};