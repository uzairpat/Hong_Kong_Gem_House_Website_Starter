
import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import './AuthPages.css';
import { useCustomerAuth } from '../contexts/CustomerAuthContext';

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'
).replace(/\/$/, '');


async function authRequest(
  path: string,
  method: 'GET' | 'POST',
  payload?: object
) {
  const headers: Record<string, string> = {};

  if (payload) {
    const csrfResponse = await fetch(`${API_BASE}/api/auth/csrf`, {
      method: 'GET',
      credentials: 'include',
    });

    const csrfResult = await csrfResponse.json();

    if (!csrfResponse.ok || !csrfResult.csrfToken) {
      throw new Error('Unable to establish a secure connection. Please refresh.');
    }

    headers['Content-Type'] = 'application/json';
    headers['X-CSRF-Token'] = csrfResult.csrfToken;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: 'include',
    headers: Object.keys(headers).length ? headers : undefined,
    body: payload ? JSON.stringify(payload) : undefined,
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      result.error || result.message || 'Something went wrong. Please try again.'
    );
  }

  return result;
}


function AuthLayout({
  eyebrow,
  title,
  description,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="auth-page">
      <section className="auth-showcase">
        <Link to="/" className="auth-showcase__brand">
          HONG KONG GEM HOUSE
          <span>EST. 1959</span>
        </Link>

        <div className="auth-showcase__content">
          <p>GENERATIONS OF TRUST</p>
          <h1>
            A Legacy of
            <span>Exceptional Beauty.</span>
          </h1>
          <p>
            Discover exceptional natural gemstones and enjoy a more
            personalised experience with your Hong Kong Gem House account.
          </p>
        </div>

        <div className="auth-showcase__bottom">
          RUBIES · SAPPHIRES · EMERALDS · RARE GEMSTONES
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <p className="auth-card__eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
          <p className="auth-card__description">{description}</p>

          {children}

          {footer && <div className="auth-card__footer">{footer}</div>}

          <Link to="/" className="auth-back-home">
            ← Back to Hong Kong Gem House
          </Link>
        </div>
      </section>
    </main>
  );
}

function AuthField({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoComplete,
  required = true,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label className="auth-field">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
      />
    </label>
  );
}

function AuthFeedback({
  error,
  success,
}: {
  error: string;
  success: string;
}) {
  if (!error && !success) return null;

  return (
    <div
      className={`auth-feedback${error ? ' auth-feedback--error' : ' auth-feedback--success'}`}
      role="status"
    >
      {error || success}
    </div>
  );
}

// CUSTOMER LOGIN
export function LoginPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { refreshUser } = useCustomerAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authRequest('/api/auth/login', 'POST', { email, password });
      await refreshUser();
      const requestedReturnTo = params.get('returnTo');
      const destination = requestedReturnTo?.startsWith('/') && !requestedReturnTo.startsWith('//')
        ? requestedReturnTo
        : '/';
      navigate(destination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="WELCOME BACK"
      title="Customer Login"
      description="Sign in to access your personal gemstone collection and enquiries."
      footer={
        <>
          Don't have an account? <Link to="/register">Create an account</Link>
        </>
      }
    >
      <form className="auth-form" onSubmit={submit}>
        <AuthField
          label="Email Address"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="Enter your email address"
          autoComplete="email"
        />

        <AuthField
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="Enter your password"
          autoComplete="current-password"
        />

        <div className="auth-form__forgot">
          <Link to="/forgot-password">Forgot password?</Link>
        </div>

        <AuthFeedback error={error} success="" />

        <button className="auth-submit" type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
          <span>→</span>
        </button>
      </form>
    </AuthLayout>
  );
}

// CUSTOMER REGISTRATION
export function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '',
    companyName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (form.password.length < 12) {
      setError('Your password must contain at least 12 characters.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Your passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await authRequest('/api/auth/register', 'POST', {
        fullName: form.fullName,
        companyName: form.companyName,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });

      navigate(`/verify-email?email=${encodeURIComponent(form.email)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="JOIN OUR COMMUNITY"
      title="Create Your Account"
      description="Register to manage your gemstone enquiries and personal shortlist."
      footer={
        <>
          Already registered? <Link to="/login">Sign in</Link>
        </>
      }
    >
      <form className="auth-form" onSubmit={submit}>
        <AuthField
          label="Full Name"
          value={form.fullName}
          onChange={(v) => update('fullName', v)}
          placeholder="Enter your full name"
          autoComplete="name"
        />

        <AuthField
          label="Company Name (Optional)"
          value={form.companyName}
          onChange={(v) => update('companyName', v)}
          placeholder="Enter your company name"
          autoComplete="organization"
          required={false}
        />

        <AuthField
          label="Email Address"
          type="email"
          value={form.email}
          onChange={(v) => update('email', v)}
          placeholder="Enter your email address"
          autoComplete="email"
        />

        <AuthField
          label="Phone Number"
          type="tel"
          value={form.phone}
          onChange={(v) => update('phone', v)}
          placeholder="Enter your phone number"
          autoComplete="tel"
        />

        <AuthField
          label="Password"
          type="password"
          value={form.password}
          onChange={(v) => update('password', v)}
          placeholder="Minimum 12 characters"
          autoComplete="new-password"
        />

        <AuthField
          label="Confirm Password"
          type="password"
          value={form.confirmPassword}
          onChange={(v) => update('confirmPassword', v)}
          placeholder="Enter your password again"
          autoComplete="new-password"
        />

        <AuthFeedback error={error} success="" />

        <button className="auth-submit" type="submit" disabled={loading}>
          {loading ? 'Creating account...' : 'Create Account'}
          <span>→</span>
        </button>
      </form>
    </AuthLayout>
  );
}

// FORGOT PASSWORD
export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await authRequest('/api/auth/forgot-password', 'POST', { email });
      setSuccess('If an account exists for this email, password recovery instructions will be sent.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to process your request.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="ACCOUNT RECOVERY"
      title="Forgot Password?"
      description="Enter the email address associated with your account to request password recovery."
      footer={<>Remember your password? <Link to="/login">Back to Login</Link></>}
    >
      <form className="auth-form" onSubmit={submit}>
        <AuthField
          label="Email Address"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="Enter your registered email"
          autoComplete="email"
        />

        <AuthFeedback error={error} success={success} />

        <button className="auth-submit" type="submit" disabled={loading}>
          {loading ? 'Processing...' : 'Send Recovery Instructions'}
          <span>→</span>
        </button>
      </form>
    </AuthLayout>
  );
}

// RESET PASSWORD
export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!token) {
      setError('Your password reset link is missing or invalid.');
      return;
    }

    if (password.length < 12) {
      setError('Your password must contain at least 12 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Your passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await authRequest('/api/auth/reset-password', 'POST', {
        token,
        password,
      });

      navigate('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="SECURE YOUR ACCOUNT"
      title="Reset Password"
      description="Choose a new password for your Hong Kong Gem House account."
      footer={<>Return to <Link to="/login">Customer Login</Link></>}
    >
      <form className="auth-form" onSubmit={submit}>
        <AuthField
          label="New Password"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="Minimum 12 characters"
          autoComplete="new-password"
        />

        <AuthField
          label="Confirm New Password"
          type="password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="Enter your new password again"
          autoComplete="new-password"
        />

        <AuthFeedback error={error} success="" />

        <button className="auth-submit" type="submit" disabled={loading}>
          {loading ? 'Updating...' : 'Update Password'}
          <span>→</span>
        </button>
      </form>
    </AuthLayout>
  );
}

// EMAIL VERIFICATION
export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const email = params.get('email') || '';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function verify() {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
        await authRequest('/api/auth/verify-email', 'POST', { token });
      setSuccess('Your email address has been verified. You can now sign in.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Email verification failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="EMAIL CONFIRMATION"
      title="Verify Your Email"
      description={
        token
          ? 'Confirm your email address to activate your customer account.'
          : `Please check your inbox${email ? ` at ${email}` : ''} for your verification link.`
      }
      footer={<>Already verified? <Link to="/login">Sign in</Link></>}
    >
      {token ? (
        <div className="auth-form">
          <AuthFeedback error={error} success={success} />

          {success ? (
            <Link className="auth-submit" to="/login">
              Continue to Login <span>→</span>
            </Link>
          ) : (
            <button className="auth-submit" onClick={verify} disabled={loading}>
              {loading ? 'Verifying...' : 'Verify Email Address'}
              <span>→</span>
            </button>
          )}
        </div>
      ) : (
        <div className="auth-verification-note">
          Your account will become active after you complete email verification.
        </div>
      )}
    </AuthLayout>
  );
}
