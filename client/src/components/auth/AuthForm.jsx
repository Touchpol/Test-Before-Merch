import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import PopUp from '../ui/PopUp';
import googleLogo from '../../../assets/SVG-Logo/google.svg';

export default function AuthForm({ mode = 'login' }) {
  const isRegister = mode === 'register';

  const [form, setForm] = useState({
    username: '',
    email: '',
    mobile: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [googleComingSoonOpen, setGoogleComingSoonOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { login, register } = useAuth();

  const destination = location.state?.from ?? '/';

  useEffect(() => {
    if (!successOpen) return;
    const timer = setTimeout(() => {
      navigate(destination);
    }, 1500);
    return () => clearTimeout(timer);
  }, [successOpen, destination, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!form.email.trim() || !form.password) return 'Please enter your email and password';
    if (isRegister && !form.username.trim()) return 'Please enter your full name';
    if (form.password.length < 6) return 'Password must be at least 6 characters';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationMessage = validate();
    setError(validationMessage);
    if (validationMessage) return;

    const result = isRegister
      ? await register({ username: form.username, email: form.email, password: form.password })
      : await login(form.email, form.password);

    if (!result.success) {
      setError(result.message);
      return;
    }

    setSuccessMessage(
      isRegister
        ? 'Registration Successful'
        : 'Login Successful',
    );
    setSuccessOpen(true);
  };

  const inputClasses =
    'h-16 w-full rounded-lg bg-gray-400/40 px-4 text-xl text-ink placeholder:text-black/50 focus:outline-2 focus:outline-primary';

  return (
    <>
      <PopUp open={successOpen} onClose={() => navigate(destination)}>
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-success/15">
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
              <path
                d="M4 13.5L10 19.5L22 6.5"
                stroke="#22c55e"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <h2 className="text-xl font-semibold text-ink">{successMessage}</h2>
          <Button variant="primary" onClick={() => navigate(destination)}>
            Continue
          </Button>
        </div>
      </PopUp>

      {/* Pop-up แจ้งเตือน Google Sign-in Coming Soon */}
      <PopUp open={googleComingSoonOpen} onClose={() => setGoogleComingSoonOpen(false)}>
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sparkles className="size-7 text-primary" />
          </span>
          <h2 className="text-xl font-bold text-ink">Google Sign-in Coming Soon</h2>
          <p className="max-w-xs text-sm leading-relaxed text-ink/70">
            Google Sign-in is currently under development. Please sign in with your email and password.
          </p>
          <Button
            type="button"
            variant="primary"
            className="mt-2 min-w-[120px]"
            onClick={() => setGoogleComingSoonOpen(false)}
          >
            Got it
          </Button>
        </div>
      </PopUp>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <h1 className="text-center text-2xl font-semibold text-ink">
          {isRegister ? 'Create your Account' : 'Login to your Account'}
        </h1>

        {isRegister && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="username" className="text-sm font-medium text-ink/70">
              Full Name
            </label>
            <input
              id="username"
              name="username"
              type="text"
              placeholder="type here"
              value={form.username}
              onChange={handleChange}
              className={inputClasses}
            />
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium text-ink/70">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="type here"
            value={form.email}
            onChange={handleChange}
            className={inputClasses}
          />
        </div>

        {isRegister && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="mobile" className="text-sm font-medium text-ink/70">
              Mobile Number
            </label>
            <input
              id="mobile"
              name="mobile"
              type="tel"
              placeholder="type here"
              value={form.mobile}
              onChange={handleChange}
              className={inputClasses}
            />
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium text-ink/70">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="type here"
            value={form.password}
            onChange={handleChange}
            className={inputClasses}
          />
        </div>

        {error && <p className="text-center text-sm text-error">{error}</p>}

        {!isRegister && (
          <Link
            to="/forgot-password"
            className="-mt-2 text-center text-sm text-violet hover:underline"
          >
            Forgot Password?
          </Link>
        )}

        <Button type="submit" variant="highlight" size="lg" className="mt-2 h-14 w-full">
          {isRegister ? 'Create Account' : 'Login'}
        </Button>

        <p className="text-center text-xl font-medium text-gray-400">- OR -</p>

        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-14 w-full gap-3 cursor-pointer"
          onClick={() => setGoogleComingSoonOpen(true)}
        >
          <img src={googleLogo} alt="" className="size-6" />
          Login with Google
        </Button>

        {isRegister ? (
          <p className="text-center text-lg text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-violet hover:underline">
              Log in
            </Link>
          </p>
        ) : (
          <p className="text-center text-lg text-gray-500">
            Don&rsquo;t have an account?{' '}
            <Link to="/register" className="font-medium text-violet hover:underline">
              Sign up
            </Link>
          </p>
        )}
      </form>
    </>
  );
}