import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PrimaryButton from '../components/PrimaryButton';

export const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      await register(name, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-dvh bg-[#33231c] text-[#fff7ed]">
      <div className="relative isolate flex min-h-dvh items-center justify-center overflow-x-hidden bg-[radial-gradient(circle_at_18%_18%,rgba(255,157,77,0.12),transparent_32%),radial-gradient(circle_at_82%_16%,rgba(255,100,54,0.10),transparent_30%),radial-gradient(circle_at_62%_82%,rgba(143,79,38,0.20),transparent_38%),#33231c] px-4 py-8 shadow-[inset_0_0_90px_rgba(16,8,5,0.34)] sm:px-6 lg:py-10">
        <div className="pointer-events-none absolute left-[7%] top-[12%] z-0 h-72 w-72 rounded-full bg-[#ff8a3d]/[0.12] blur-3xl" />
        <div className="pointer-events-none absolute bottom-[10%] right-[10%] z-0 h-80 w-80 rounded-full bg-[#7a3a1d]/[0.18] blur-3xl" />
        <div className="pointer-events-none absolute left-[34%] top-[54%] z-0 h-52 w-72 rounded-full bg-[#ffcf9f]/[0.055] blur-3xl" />

        <section className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-[#fff0e0]/[0.10] bg-[#160e0bf2] shadow-[0_30px_86px_rgba(12,6,4,0.52),inset_0_1px_rgba(255,255,255,0.04)] backdrop-blur-2xl lg:grid-cols-[0.94fr_1.06fr]">
          <div className="relative overflow-hidden border-b border-amber-100/[0.08] bg-[linear-gradient(135deg,rgba(255,100,54,0.12),rgba(255,255,255,0.022)),#1b110de8] p-7 sm:p-9 lg:border-b-0 lg:border-r lg:border-amber-100/[0.07] lg:p-12">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.10]"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(255,240,224,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(255,240,224,0.14) 1px, transparent 1px)',
                backgroundSize: '48px 48px',
                maskImage: 'linear-gradient(145deg, transparent 6%, black 38%, transparent 84%)',
                WebkitMaskImage: 'linear-gradient(145deg, transparent 6%, black 38%, transparent 84%)',
              }}
            />
            <div className="pointer-events-none absolute -left-16 top-28 h-44 w-44 rounded-full border border-amber-100/[0.08] opacity-60" />
            <div className="pointer-events-none absolute -left-8 top-36 h-28 w-28 rounded-full border border-orange-200/[0.08] opacity-60" />

            <div className="relative z-10 flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fffaf2] text-base font-extrabold text-[#34231c] shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
                P
              </div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#ffb074]/90">
                PARANOIDPLANNER
              </p>
            </div>

            <div className="relative z-10 mt-12 max-w-sm lg:mt-14">
              <h1 className="text-3xl font-bold leading-tight text-[#fff7ed] sm:text-4xl">
                Plan smarter.{' '}
                <span className="bg-gradient-to-r from-[#fff7ed] via-[#ffd8a8] to-[#ff9d4d] bg-clip-text text-transparent">
                  Study calmer.
                </span>
              </h1>
              <p className="mt-5 text-sm leading-6 text-[#d2c2b5]">
                Stay on top of modules, deadlines, and study sessions in one focused workspace.
              </p>
            </div>

            <div className="relative z-10 mt-9 grid gap-3 text-sm text-[#d8c8bb]">
              {['Prioritise deadlines', 'Plan study blocks', 'Track academic workload'].map((point) => (
                <div key={point} className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-[#ff8a4c] shadow-[0_0_14px_rgba(255,100,54,0.35)]" />
                  <span>{point}</span>
                </div>
              ))}
            </div>

            <div className="relative z-10 mt-12 hidden min-h-[310px] sm:block" aria-hidden="true">
              <div className="absolute left-6 top-6 h-60 w-80 rounded-full bg-[#ff7a2f]/[0.14] blur-3xl" />
              <div className="absolute left-16 top-20 h-44 w-56 rounded-full bg-[#ffcf9f]/[0.075] blur-3xl" />

              <div className="absolute right-1 top-5 rounded-full border border-orange-200/15 bg-[#24150f]/85 px-3.5 py-2 text-xs font-semibold text-[#ffd2aa] shadow-[0_14px_30px_rgba(8,4,3,0.26)]">
                Module Pressure: High
              </div>

              <div className="absolute -left-1 bottom-10 rounded-[13px] border border-white/10 bg-[#0f0907]/[0.82] px-3.5 py-3 shadow-[0_18px_36px_rgba(8,4,3,0.28)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#a9988c]">
                  Study block
                </p>
                <p className="mt-1 text-sm font-semibold text-[#fff7ed]">
                  7:00 PM
                </p>
              </div>

              <div className="absolute -right-2 bottom-0 w-40 rounded-[14px] border border-white/10 bg-[#120b08]/80 p-3 shadow-[0_18px_36px_rgba(8,4,3,0.24)]">
                <div className="mb-2 flex items-center justify-between text-[11px] font-semibold text-[#d8c8bb]">
                  <span>Week load</span>
                  <span className="text-[#ffcf9f]">68%</span>
                </div>
                <div className="grid grid-cols-5 gap-1">
                  {[72, 44, 84, 58, 34].map((height, index) => (
                    <span key={height + index} className="flex h-10 items-end rounded bg-white/[0.045]">
                      <span
                        className="w-full rounded bg-gradient-to-t from-[#ff6436] to-[#ffcf9f]"
                        style={{ height: `${height}%` }}
                      />
                    </span>
                  ))}
                </div>
              </div>

              <div className="relative mx-auto w-full max-w-[360px] rounded-[18px] border border-[#fff0e0]/[0.16] bg-[#120b08]/[0.90] p-5 shadow-[0_32px_68px_rgba(8,4,3,0.48),0_0_34px_rgba(255,116,54,0.075),inset_0_1px_rgba(255,255,255,0.05)] backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#ffb074]">
                      Today&apos;s focus
                    </p>
                    <p className="mt-1 text-base font-semibold text-[#fff7ed]">
                      3 due this week
                    </p>
                  </div>
                  <span className="rounded-full border border-amber-200/15 bg-amber-300/10 px-3 py-1 text-xs font-semibold text-amber-100">
                    Active
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  <div className="rounded-[13px] border border-white/10 bg-white/[0.055] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-[#fff7ed]">
                          CS2030S Quiz
                        </p>
                        <p className="mt-1 text-xs text-[#b9a99d]">
                          Priority review before lecture
                        </p>
                      </div>
                      <span className="mt-1 h-2.5 w-2.5 rounded-full bg-orange-300 shadow-[0_0_12px_rgba(253,186,116,0.38)]" />
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-[#ff6436] to-[#ffcf9f]" />
                    </div>
                  </div>

                  <div className="grid grid-cols-[1fr_auto] gap-3">
                    <div className="rounded-[13px] border border-white/10 bg-[#0f0907]/70 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#a9988c]">
                        Next block
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[#fff7ed]">
                        7:00 PM study
                      </p>
                    </div>
                    <div className="grid min-w-16 place-items-center rounded-[13px] border border-amber-200/15 bg-amber-300/10 px-3 text-sm font-bold text-[#ffcf9f]">
                      90m
                    </div>
                  </div>

                  <div className="rounded-[13px] border border-white/10 bg-white/[0.04] p-3">
                    <div className="mb-2 flex items-center justify-between text-xs text-[#b9a99d]">
                      <span>Mini schedule</span>
                      <span className="font-semibold text-[#ffcf9f]">Tonight</span>
                    </div>
                    <div className="flex gap-1.5">
                      <span className="h-2 flex-1 rounded-full bg-[#ff6436]" />
                      <span className="h-2 flex-[1.4] rounded-full bg-[#ff9d4d]" />
                      <span className="h-2 flex-[0.8] rounded-full bg-white/15" />
                      <span className="h-2 flex-1 rounded-full bg-white/10" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute left-5 top-1 -z-10 h-full w-full rounded-[22px] border border-white/[0.05] bg-white/[0.022]" />
            </div>

            <div className="relative z-10 mt-8 rounded-[14px] border border-white/10 bg-[#120b08]/70 p-4 shadow-[0_18px_38px_rgba(8,4,3,0.28)] sm:hidden">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#ffb074]">
                    Today&apos;s focus
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#fff7ed]">
                    3 due this week
                  </p>
                </div>
                <span className="rounded-full border border-amber-200/15 bg-amber-300/10 px-3 py-1 text-xs font-semibold text-amber-100">
                  Active
                </span>
              </div>

              <div className="mt-4 space-y-3">
                <div className="rounded-[11px] border border-white/10 bg-white/[0.045] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[#fff7ed]">
                        CS2030S Quiz
                      </p>
                      <p className="mt-1 text-xs text-[#b9a99d]">
                        Priority review
                      </p>
                    </div>
                    <span className="mt-1 h-2 w-2 rounded-full bg-orange-300 shadow-[0_0_12px_rgba(253,186,116,0.38)]" />
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-2/3 rounded-full bg-[#ff9d4d]" />
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-[11px] border border-white/10 bg-[#0f0907]/70 px-3 py-2.5">
                  <span className="text-xs font-medium text-[#d8c8bb]">
                    7:00 PM study block
                  </span>
                  <span className="text-xs font-semibold text-[#ffcf9f]">
                    90 min
                  </span>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex bg-[#120b08]/[0.84] p-7 sm:p-9 lg:p-12 xl:p-14">
            <div className="mx-auto flex w-full max-w-md flex-col justify-center">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-[#fff7ed]">
                  Create your account
                </h1>
                <p className="mt-3 text-sm leading-6 text-[#b9a99d]">
                  Start planning your semester with ParanoidPlanner.
                </p>
              </div>

              {error && (
                <div className="mb-6 rounded-xl border border-[#ff744c]/35 bg-[#701f10]/25 px-4 py-3 text-sm font-medium text-[#ffc1ae]" role="alert">
                  {error}
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <label className="mb-3 block text-sm font-semibold text-[#f6d8ca]">
                    Full name
                  </label>
                  <input
                    className="w-full rounded-2xl border border-white/[0.12] bg-[#100905]/85 px-4 py-3.5 text-sm text-[#fff7ed] outline-none transition placeholder:text-[#9b897b] focus:border-[#f59e0b] focus:ring-2 focus:ring-[#f59e0b]/20 disabled:cursor-not-allowed disabled:opacity-70"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    autoComplete="name"
                  />
                </div>

                <div>
                  <label className="mb-3 block text-sm font-semibold text-[#f6d8ca]">
                    Email address
                  </label>
                  <input
                    className="w-full rounded-2xl border border-white/[0.12] bg-[#100905]/85 px-4 py-3.5 text-sm text-[#fff7ed] outline-none transition placeholder:text-[#9b897b] focus:border-[#f59e0b] focus:ring-2 focus:ring-[#f59e0b]/20 disabled:cursor-not-allowed disabled:opacity-70"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    autoComplete="email"
                  />
                </div>

                <div>
                  <label className="mb-3 block text-sm font-semibold text-[#f6d8ca]">
                    Password
                  </label>
                  <input
                    className="w-full rounded-2xl border border-white/[0.12] bg-[#100905]/85 px-4 py-3.5 text-sm text-[#fff7ed] outline-none transition placeholder:text-[#9b897b] focus:border-[#f59e0b] focus:ring-2 focus:ring-[#f59e0b]/20 disabled:cursor-not-allowed disabled:opacity-70"
                    type="password"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    autoComplete="new-password"
                  />
                  <p className="mt-2 text-xs font-medium text-[#9f8f82]">
                    At least 6 characters
                  </p>
                </div>

                <div>
                  <label className="mb-3 block text-sm font-semibold text-[#f6d8ca]">
                    Confirm password
                  </label>
                  <input
                    className="w-full rounded-2xl border border-white/[0.12] bg-[#100905]/85 px-4 py-3.5 text-sm text-[#fff7ed] outline-none transition placeholder:text-[#9b897b] focus:border-[#f59e0b] focus:ring-2 focus:ring-[#f59e0b]/20 disabled:cursor-not-allowed disabled:opacity-70"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    autoComplete="new-password"
                  />
                </div>

                <PrimaryButton
                  loading={loading}
                  className="mt-2 w-full transition-transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#f59e0b]/35 focus:ring-offset-2 focus:ring-offset-[#120b08] active:translate-y-0"
                  style={{ padding: '14px 20px', boxShadow: '0 18px 44px rgba(245,158,11,0.28), 0 0 22px rgba(255,157,77,0.08)' }}
                >
                  {loading ? 'Creating account...' : 'Create account'}
                </PrimaryButton>
              </div>

              <p className="mt-8 text-center text-sm text-[#b9a99d]">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-semibold text-[#ffb074] transition-colors hover:text-[#f9e76a] focus:outline-none focus:ring-2 focus:ring-[#f59e0b]/40"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
};
