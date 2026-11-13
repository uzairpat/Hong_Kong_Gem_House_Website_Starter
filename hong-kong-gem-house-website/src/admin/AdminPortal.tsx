import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import "./AdminPortal.css";
import BrandMark from "../components/BrandMark";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:4000").replace(/\/$/, "");

type ApiError = { error?: string };
type Admin = { id: string; email: string; fullName: string; role: "owner" };
type LoginReply = { mfaRequired: boolean; mfaSetupRequired: boolean; message: string };
type SetupReply = { secret: string; otpauthUri: string; account: string; issuer: string; instructions: string };
type Summary = {
  gemstone_count: number;
  published_count: number;
  enquiry_count: number;
  open_enquiry_count: number;
  customer_count: number;
  active_staff_count: number;
};
type DashboardData = {
  summary: Summary;
  recentActivity: Array<{ id: string; action: string; entity_type: string; entity_id: string | null; occurred_at: string }>;
  attention: Array<{ id: string; enquiry_number: string; name_snapshot: string; enquiry_type: string; priority: string; status: string; created_at: string }>;
  sales: { status: string; message: string };
  generatedAt: string;
};
type Gemstone = {
  id: string;
  reference_code: string;
  name: string;
  category: string;
  weight_carat: number | string | null;
  shape?: string | null;
  origin: string | null;
  colour?: string | null;
  clarity?: string | null;
  treatment?: string | null;
  certification_lab?: string | null;
  certification_number?: string | null;
  description?: string | null;
  acquisition_cost?: string | null;
  selling_price?: string | null;
  currency_code?: string | null;
  status: string;
  availability_status: string;
  public_price_mode: string;
  public_visibility: boolean;
  updated_at: string;
  image_path: string | null;
  cut?: string | null;
  dimensions_mm?: string | null;
  origin_region?: string | null;
  sourcing_method?: string | null;
  supplier_name?: string | null;
  supplier_reference?: string | null;
  ownership_type?: string;
  stock_location?: string | null;
  acquisition_date?: string | null;
  internal_notes?: string | null;
  public_title?: string | null;
  public_description?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
};
type Enquiry = {
  id: string;
  enquiry_number: string;
  name_snapshot: string;
  email_snapshot: string;
  company_snapshot: string | null;
  enquiry_type: string;
  gemstone_reference: string | null;
  status: string;
  priority: string;
  assigned_staff_name: string | null;
  assigned_staff_id?: string | null;
  message?: string;
  phone_snapshot?: string | null;
  created_at: string;
};
type Staff = {
  id: string;
  full_name: string;
  email: string | null;
  department: string | null;
  job_title: string | null;
  phone: string | null;
  employment_status: string;
};
type Customer = {
  id: string;
  full_name: string;
  email: string;
  company_name: string | null;
  phone: string | null;
  customer_status: string;
  source: string;
  created_at: string;
};

async function csrfToken(): Promise<string> {
  const response = await fetch(API_BASE_URL + "/api/auth/csrf", {
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  const result = await response.json().catch(() => ({})) as { csrfToken?: string };
  if (!response.ok || !result.csrfToken) {
    throw new Error("Could not start a secure request. Refresh the page and try again.");
  }
  return result.csrfToken;
}

async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method || "GET").toUpperCase();
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };
  if (init.body) headers["Content-Type"] = "application/json";
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    headers["X-CSRF-Token"] = await csrfToken();
  }
  const response = await fetch(API_BASE_URL + path, {
    ...init,
    method,
    credentials: "include",
    headers,
  });
  const result = await response.json().catch(() => ({})) as T & ApiError;
  if (!response.ok) throw new Error(result.error || "The request could not be completed.");
  return result;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
function labelFor(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
function initialsFor(value: string): string {
  return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

type LoginStage = "password" | "setup" | "verify" | "forgot" | "reset";

export function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const resetToken = params.get("token") || "";
  const [stage, setStage] = useState<LoginStage>(resetToken ? "reset" : location.pathname.endsWith("/forgot-password") ? "forgot" : "password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [secret, setSecret] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (resetToken) return;
    let mounted = true;
    void apiRequest<{ admin: Admin }>("/api/admin/me")
      .then(() => { if (mounted) navigate("/admin", { replace: true }); })
      .catch(() => undefined);
    return () => { mounted = false; };
  }, [navigate, resetToken, location.pathname]);

  const submitPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const result = await apiRequest<LoginReply>("/api/admin/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (result.mfaSetupRequired) {
        const setup = await apiRequest<SetupReply>("/api/admin/auth/mfa/setup", { method: "POST" });
        setSecret(setup.secret);
        setStage("setup");
        setMessage(setup.instructions);
      } else {
        setStage("verify");
        setMessage(result.message);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Sign-in failed.");
    } finally {
      setBusy(false);
    }
  };

  const submitCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await apiRequest<{ admin: Admin }>("/api/admin/auth/mfa/verify", {
        method: "POST",
        body: JSON.stringify({ code }),
      });
      setSecret("");
      navigate("/admin", { replace: true });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Verification failed.");
    } finally {
      setBusy(false);
    }
  };

  const submitForgot = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const result = await apiRequest<{ message: string }>("/api/admin/auth/password/forgot", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setMessage(result.message);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to request a password reset.");
    } finally {
      setBusy(false);
    }
  };

  const submitReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const result = await apiRequest<{ message: string }>("/api/admin/auth/password/reset", {
        method: "POST",
        body: JSON.stringify({ token: resetToken, password: newPassword }),
      });
      setMessage(result.message);
      setNewPassword("");
      setStage("password");
      navigate("/admin/login", { replace: true });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to reset the password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="admin-auth">
      <div className="admin-auth__brand">
        <BrandMark className="admin-auth__brand-mark" width={52} height={58} />
        <span>
          <strong>Hong Kong Gem House</strong>
          <small>OWNER ADMINISTRATION</small>
        </span>
      </div>
      <section className="admin-auth__panel">
        <p className="admin-eyebrow">SECURE OWNER ACCESS</p>
        <h1>{stage === "password" ? "Welcome back." : stage === "setup" ? "Secure your account." : stage === "verify" ? "Verify your identity." : stage === "forgot" ? "Reset your password." : "Choose a new password."}</h1>
        <p className="admin-auth__intro">
          {stage === "password" && "Sign in to manage gemstone inventory, customer enquiries and company operations."}
          {stage === "setup" && "Set up an authenticator app before entering the administration portal."}
          {stage === "verify" && "Enter the current six-digit code from your authenticator app."}
          {stage === "forgot" && "Enter your owner email address. The response will not reveal whether an account exists."}
          {stage === "reset" && "Choose a new password with at least 12 characters."}
        </p>

        {stage === "password" && (
          <form className="admin-form" onSubmit={submitPassword}>
            <label>Email address<input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
            <label>Password<input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
            <button className="admin-button admin-button--primary" disabled={busy}>{busy ? "Signing in…" : "Sign in securely"}</button>
            <button type="button" className="admin-text-button" onClick={() => { setStage("forgot"); setError(""); setMessage(""); }}>Forgot password?</button>
          </form>
        )}

        {stage === "setup" && (
          <form className="admin-form" onSubmit={submitCode}>
            <div className="admin-mfa-instructions">
              <strong>Authenticator setup key</strong>
              <code>{secret}</code>
              <button type="button" className="admin-button admin-button--secondary" onClick={() => void navigator.clipboard?.writeText(secret)}>Copy setup key</button>
              <small>In your authenticator app, add an account manually using this key. Keep it private. It will not be shown again after setup.</small>
            </div>
            <label>Six-digit verification code<input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} /></label>
            <button className="admin-button admin-button--primary" disabled={busy || code.length !== 6}>{busy ? "Verifying…" : "Confirm MFA and continue"}</button>
          </form>
        )}

        {stage === "verify" && (
          <form className="admin-form" onSubmit={submitCode}>
            <label>Authenticator code<input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} /></label>
            <button className="admin-button admin-button--primary" disabled={busy || code.length !== 6}>{busy ? "Verifying…" : "Verify and continue"}</button>
            <button type="button" className="admin-text-button" onClick={() => { setStage("password"); setCode(""); setPassword(""); }}>Back to sign in</button>
          </form>
        )}

        {stage === "forgot" && (
          <form className="admin-form" onSubmit={submitForgot}>
            <label>Owner email address<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
            <button className="admin-button admin-button--primary" disabled={busy}>{busy ? "Sending…" : "Send reset instructions"}</button>
            <button type="button" className="admin-text-button" onClick={() => setStage("password")}>Back to sign in</button>
          </form>
        )}

        {stage === "reset" && (
          <form className="admin-form" onSubmit={submitReset}>
            <label>New password<input type="password" autoComplete="new-password" minLength={12} required value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /></label>
            <button className="admin-button admin-button--primary" disabled={busy}>{busy ? "Updating…" : "Reset password"}</button>
          </form>
        )}

        {message && <p className="admin-inline-message" role="status">{message}</p>}
        {error && <p className="admin-inline-error" role="alert">{error}</p>}
        <p className="admin-auth__foot">This portal is restricted to authorised company administration.</p>
      </section>
    </main>
  );
}

const navigation = [
  { group: "OVERVIEW", items: [{ key: "overview", label: "Dashboard", icon: "◫" }] },
  { group: "CATALOGUE", items: [{ key: "gemstones", label: "Gemstone Inventory", icon: "◇" }, { key: "media", label: "Media & Certificates", icon: "▧" }] },
  { group: "CUSTOMERS & SALES", items: [{ key: "enquiries", label: "Enquiries", icon: "✉" }, { key: "customers", label: "Customers", icon: "♙" }, { key: "staff", label: "Staff Directory", icon: "♧" }, { key: "sales", label: "Quotes & Invoices", icon: "▤" }] },
  { group: "WEBSITE & GROWTH", items: [{ key: "cms", label: "Website Content", icon: "▣" }, { key: "analytics", label: "Analytics", icon: "⌁" }, { key: "reports", label: "Reports", icon: "▥" }] },
  { group: "ADMINISTRATION", items: [{ key: "activity", label: "Activity Logs", icon: "◷" }, { key: "settings", label: "Settings", icon: "⚙" }] },
];

const pageTitles: Record<string, string> = {
  overview: "Dashboard",
  gemstones: "Gemstone Inventory",
  media: "Media & Certificates",
  enquiries: "Customer Enquiries",
  customers: "Customer Directory",
  staff: "Staff Directory",
  sales: "Quotes & Invoices",
  cms: "Website Content",
  analytics: "Analytics",
  reports: "Reports",
  activity: "Activity Logs",
  settings: "Settings",
};

export function AdminPortal() {
  const navigate = useNavigate();
  const location = useLocation();
  const section = location.pathname.split("/")[2] || "overview";
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [checking, setChecking] = useState(true);
  const [pageError, setPageError] = useState("");
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [gemstones, setGemstones] = useState<Gemstone[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activity, setActivity] = useState<Array<{ id: string; action: string; entity_type: string; entity_id: string | null; occurred_at: string }>>([]);
  const [search, setSearch] = useState("");
  const [enquirySearch, setEnquirySearch] = useState("");
  const [showGemstoneForm, setShowGemstoneForm] = useState(false);
  const [gemstoneOptions, setGemstoneOptions] = useState<Record<string, Array<{ id: string; value: string }>>>({});
  const [editingGemstoneId, setEditingGemstoneId] = useState<string | null>(null);
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [enquiryNotes, setEnquiryNotes] = useState<Array<{ id: string; note: string; created_at: string }>>([]);
  const [noteDraft, setNoteDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [formMessage, setFormMessage] = useState("");
  const [gemstoneForm, setGemstoneForm] = useState({
    referenceCode: "", name: "", category: "ruby", weightCarat: "", shape: "",
    origin: "", colour: "", clarity: "", treatment: "", certificationLab: "",
    certificationNumber: "", description: "", availabilityStatus: "available",
    acquisitionCost: "", sellingPrice: "", currencyCode: "", publicPriceMode: "hidden",
    cut: "", dimensionsMm: "", originRegion: "", sourcingMethod: "", supplierName: "",
    supplierReference: "", ownershipType: "owned", stockLocation: "", acquisitionDate: "",
    internalNotes: "", publicTitle: "", publicDescription: "", seoTitle: "", seoDescription: "", publicVisibility: true, imageUrl: "",
  });
  const [staffForm, setStaffForm] = useState({ fullName: "", email: "", phone: "", department: "", jobTitle: "", employmentStatus: "active" });

  useEffect(() => {
    let mounted = true;
    setChecking(true);
    void apiRequest<{ admin: Admin }>("/api/admin/me")
      .then((result) => { if (mounted) setAdmin(result.admin); })
      .catch(() => { if (mounted) navigate("/admin/login", { replace: true }); })
      .finally(() => { if (mounted) setChecking(false); });
    return () => { mounted = false; };
  }, [navigate]);

  const loadDashboard = async () => {
    const result = await apiRequest<DashboardData>("/api/admin/dashboard/summary");
    setDashboard(result);
  };
  const addGemstoneOption = async (optionType: string) => {
    const value = window.prompt("Enter a new " + optionType.replace(/_/g, " ") + " option:");
    if (!value?.trim()) return;
    try {
      await apiRequest("/api/admin/gemstone-options", {
        method: "POST",
        body: JSON.stringify({ optionType, value: value.trim() }),
      });
      const options = await apiRequest<{ data: Record<string, Array<{ id: string; value: string }>> }>("/api/admin/gemstone-options");
      setGemstoneOptions(options.data || {});
      setFormMessage("New " + optionType.replace(/_/g, " ") + " option added.");
    } catch (error) {
      setFormMessage(error instanceof Error ? error.message : "Could not add this option.");
    }
  };

  const loadGemstones = async () => {
    const [result, options] = await Promise.all([
      apiRequest<{ data: Gemstone[] }>("/api/admin/gemstones?search=" + encodeURIComponent(search)),
      apiRequest<{ data: Record<string, Array<{ id: string; value: string }>> }>("/api/admin/gemstone-options"),
    ]);
    setGemstones(result.data);
    setGemstoneOptions(options.data || {});
  };
  const loadEnquiries = async () => {
    const [result, staffResult] = await Promise.all([
      apiRequest<{ data: Enquiry[] }>("/api/admin/enquiries?search=" + encodeURIComponent(enquirySearch)),
      apiRequest<{ data: Staff[] }>("/api/admin/staff"),
    ]);
    setEnquiries(result.data);
    setStaff(staffResult.data);
  };
  const loadStaff = async () => {
    const result = await apiRequest<{ data: Staff[] }>("/api/admin/staff");
    setStaff(result.data);
  };
  const loadCustomers = async () => {
    const result = await apiRequest<{ data: Customer[] }>("/api/admin/customers");
    setCustomers(result.data);
  };
  const loadActivity = async () => {
    const result = await apiRequest<{ data: typeof activity }>("/api/admin/audit-logs");
    setActivity(result.data);
  };

  useEffect(() => {
    if (!admin) return;
    setPageError("");
    const loader = section === "overview" ? loadDashboard
      : section === "gemstones" ? loadGemstones
      : section === "enquiries" ? loadEnquiries
      : section === "staff" ? loadStaff
      : section === "customers" ? loadCustomers
      : section === "activity" ? loadActivity
      : null;
    if (loader) void loader().catch((error) => setPageError(error instanceof Error ? error.message : "Unable to load this page."));
  }, [admin, section]);

  const openSection = (key: string) => {
    setPageError("");
    navigate(key === "overview" ? "/admin" : "/admin/" + key);
  };

  const logout = async () => {
    try {
      await apiRequest<{ message: string }>("/api/admin/auth/logout", { method: "POST" });
    } finally {
      navigate("/admin/login", { replace: true });
    }
  };

  const beginEditGemstone = (gemstone: Gemstone) => {
    setEditingGemstoneId(gemstone.id);
    setGemstoneForm({
      referenceCode: gemstone.reference_code,
      name: gemstone.name,
      category: gemstone.category,
      weightCarat: gemstone.weight_carat == null ? "" : String(gemstone.weight_carat),
      shape: gemstone.shape || "",
      origin: gemstone.origin || "",
      colour: gemstone.colour || "",
      clarity: gemstone.clarity || "",
      treatment: gemstone.treatment || "",
      certificationLab: gemstone.certification_lab || "",
      certificationNumber: gemstone.certification_number || "",
      description: gemstone.description || "",
      availabilityStatus: gemstone.availability_status,
      acquisitionCost: gemstone.acquisition_cost || "",
      sellingPrice: gemstone.selling_price || "",
      currencyCode: gemstone.currency_code || "",
      publicPriceMode: gemstone.public_price_mode,
      publicVisibility: gemstone.public_visibility,
      cut: gemstone.cut || "", dimensionsMm: gemstone.dimensions_mm || "",
      originRegion: gemstone.origin_region || "", sourcingMethod: gemstone.sourcing_method || "",
      supplierName: gemstone.supplier_name || "", supplierReference: gemstone.supplier_reference || "",
      ownershipType: gemstone.ownership_type || "owned", stockLocation: gemstone.stock_location || "",
      acquisitionDate: gemstone.acquisition_date ? String(gemstone.acquisition_date).slice(0, 10) : "",
      internalNotes: gemstone.internal_notes || "", publicTitle: gemstone.public_title || "",
      publicDescription: gemstone.public_description || "", seoTitle: gemstone.seo_title || "",
      seoDescription: gemstone.seo_description || "",
      imageUrl: gemstone.image_path || "",
    });
    setFormMessage("");
    setShowGemstoneForm(true);
  };

  const saveGemstone = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setFormMessage("");
    const payload = {
      ...gemstoneForm,
      weightCarat: gemstoneForm.weightCarat ? Number(gemstoneForm.weightCarat) : null,
      acquisitionCost: gemstoneForm.acquisitionCost ? Number(gemstoneForm.acquisitionCost) : null,
      sellingPrice: gemstoneForm.sellingPrice ? Number(gemstoneForm.sellingPrice) : null,
      currencyCode: gemstoneForm.currencyCode || null,
      acquisitionDate: gemstoneForm.acquisitionDate || null,
      imageUrl: gemstoneForm.imageUrl.trim() || null,
    };
    try {
      if (editingGemstoneId) {
        const updatePayload = Object.fromEntries(Object.entries(payload).filter(([key]) => key !== "referenceCode"));
        await apiRequest("/api/admin/gemstones/" + editingGemstoneId, {
          method: "PATCH",
          body: JSON.stringify(updatePayload),
        });
      } else {
        await apiRequest("/api/admin/gemstones", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      setShowGemstoneForm(false);
      setEditingGemstoneId(null);
      setGemstoneForm({
        referenceCode: "", name: "", category: "ruby", weightCarat: "", shape: "",
        origin: "", colour: "", clarity: "", treatment: "", certificationLab: "",
        certificationNumber: "", description: "", availabilityStatus: "available",
        acquisitionCost: "", sellingPrice: "", currencyCode: "", publicPriceMode: "hidden",
        cut: "", dimensionsMm: "", originRegion: "", sourcingMethod: "", supplierName: "",
        supplierReference: "", ownershipType: "owned", stockLocation: "", acquisitionDate: "",
        internalNotes: "", publicTitle: "", publicDescription: "", seoTitle: "", seoDescription: "", publicVisibility: true, imageUrl: "",
      });
      await loadGemstones();
      setFormMessage(editingGemstoneId ? "Gemstone details updated." : "Gemstone draft created.");
    } catch (error) {
      setFormMessage(error instanceof Error ? error.message : "Could not save gemstone.");
    } finally {
      setSaving(false);
    }
  };

  const openEnquiry = async (enquiry: Enquiry) => {
    setPageError("");
    setNoteDraft("");
    try {
      const result = await apiRequest<{
        data: Enquiry;
        notes: Array<{ id: string; note: string; created_at: string }>;
      }>("/api/admin/enquiries/" + enquiry.id);
      setSelectedEnquiry(result.data);
      setEnquiryNotes(result.notes);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to open enquiry.");
    }
  };

  const addEnquiryNote = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedEnquiry || !noteDraft.trim()) return;
    setSaving(true);
    try {
      await apiRequest("/api/admin/enquiries/" + selectedEnquiry.id + "/notes", {
        method: "POST",
        body: JSON.stringify({ note: noteDraft }),
      });
      const result = await apiRequest<{
        data: Enquiry;
        notes: Array<{ id: string; note: string; created_at: string }>;
      }>("/api/admin/enquiries/" + selectedEnquiry.id);
      setSelectedEnquiry(result.data);
      setEnquiryNotes(result.notes);
      setNoteDraft("");
      await loadEnquiries();
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to save internal note.");
    } finally {
      setSaving(false);
    }
  };

  const updateGemstoneStatus = async (gemstone: Gemstone, action: "publish" | "unpublish" | "archive" | "restore") => {
    const prompt = action === "archive"
      ? "Archive " + gemstone.reference_code + "? It will no longer appear in the public catalogue."
      : action === "publish"
        ? "Publish " + gemstone.reference_code + " to the public catalogue?"
        : action === "restore"
          ? "Restore " + gemstone.reference_code + " as an unpublished draft?"
          : "Unpublish " + gemstone.reference_code + "?";
    if (!window.confirm(prompt)) return;
    setPageError("");
    try {
      await apiRequest("/api/admin/gemstones/" + gemstone.id + "/" + action, { method: "POST" });
      await loadGemstones();
      setFormMessage("Gemstone status updated.");
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to update gemstone.");
    }
  };

  const updateEnquiry = async (enquiry: Enquiry, field: "status" | "priority" | "assignedStaffId", value: string) => {
    setPageError("");
    try {
      await apiRequest("/api/admin/enquiries/" + enquiry.id, {
        method: "PATCH",
        body: JSON.stringify({ [field]: field === "assignedStaffId" && !value ? null : value }),
      });
      await loadEnquiries();
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to update enquiry.");
    }
  };

  const beginEditStaff = (person: Staff) => {
    setEditingStaffId(person.id);
    setStaffForm({
      fullName: person.full_name,
      email: person.email || "",
      phone: person.phone || "",
      department: person.department || "",
      jobTitle: person.job_title || "",
      employmentStatus: person.employment_status,
    });
    setFormMessage("");
    setShowStaffForm(true);
  };

  const saveStaff = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setFormMessage("");
    const isEditing = Boolean(editingStaffId);
    try {
      await apiRequest(
        isEditing ? "/api/admin/staff/" + editingStaffId : "/api/admin/staff",
        { method: isEditing ? "PATCH" : "POST", body: JSON.stringify(staffForm) },
      );
      setShowStaffForm(false);
      setEditingStaffId(null);
      setStaffForm({ fullName: "", email: "", phone: "", department: "", jobTitle: "", employmentStatus: "active" });
      await loadStaff();
      setFormMessage(isEditing ? "Staff record updated." : "Staff record added. This does not create a portal login.");
    } catch (error) {
      setFormMessage(error instanceof Error ? error.message : "Could not save staff record.");
    } finally {
      setSaving(false);
    }
  };

  const selectedTitle = pageTitles[section] || "Administration";
  const pageContent = useMemo(() => {
    if (checking) return <div className="admin-loading">Checking owner access…</div>;
    if (!admin) return null;
    if (section === "overview") {
      return (
        <>
          <div className="admin-page-heading"><div><p className="admin-eyebrow">BUSINESS AT A GLANCE</p><h1>Good to see you.</h1><p>Here is the current operating picture for Hong Kong Gem House.</p></div><button className="admin-button admin-button--secondary" onClick={() => void loadDashboard()}>↻ Refresh</button></div>
          <div className="admin-kpi-grid">
            <KpiCard label="Total gemstones" value={dashboard?.summary.gemstone_count ?? "—"} note="Real inventory records" />
            <KpiCard label="Published listings" value={dashboard?.summary.published_count ?? "—"} note="Visible catalogue records" />
            <KpiCard label="Open enquiries" value={dashboard?.summary.open_enquiry_count ?? "—"} note={(dashboard?.summary.enquiry_count ?? 0) + " enquiries received"} />
            <KpiCard label="Active customers" value={dashboard?.summary.customer_count ?? "—"} note="Guest and registered profiles" />
            <KpiCard label="Active staff" value={dashboard?.summary.active_staff_count ?? "—"} note="Directory records, no staff logins" />
            <KpiCard label="Sales reporting" value="Not live" note="Awaiting approved finance settings" muted />
          </div>
          <div className="admin-dashboard-grid">
            <section className="admin-panel"><div className="admin-panel__heading"><div><p className="admin-eyebrow">NEEDS ATTENTION</p><h2>Open enquiries</h2></div><button className="admin-link-button" onClick={() => openSection("enquiries")}>View inbox →</button></div>
              {dashboard?.attention.length ? <div className="admin-activity-list">{dashboard.attention.map((item) => <button className="admin-attention-item" key={item.id} onClick={() => openSection("enquiries")}><span className={"admin-priority-dot admin-priority-dot--" + item.priority} /><span><strong>{item.name_snapshot}</strong><small>{item.enquiry_number} · {item.enquiry_type}</small></span><span className="admin-status">{labelFor(item.status)}</span></button>)}</div> : <EmptyState title="No open enquiries" text="New website enquiries will appear here after a successful submission." />}
            </section>
            <section className="admin-panel"><div className="admin-panel__heading"><div><p className="admin-eyebrow">RECENT CHANGES</p><h2>Activity log</h2></div><button className="admin-link-button" onClick={() => openSection("activity")}>View all →</button></div>
              {dashboard?.recentActivity.length ? <div className="admin-activity-list">{dashboard.recentActivity.map((item) => <div className="admin-activity-item" key={item.id}><span className="admin-activity-mark">•</span><span><strong>{labelFor(item.action)}</strong><small>{item.entity_type}{item.entity_id ? " · " + item.entity_id.slice(0, 8) : ""}</small></span><time>{formatDate(item.occurred_at)}</time></div>)}</div> : <EmptyState title="No activity yet" text="Administrative changes will be recorded here." />}
            </section>
          </div>
          <p className="admin-data-note">Updated {dashboard ? formatDate(dashboard.generatedAt) : "—"}. Website traffic and sales KPIs will appear when their integrations and commerce workflows are connected.</p>
        </>
      );
    }

    if (section === "gemstones") {
      return (
        <>
          <div className="admin-page-heading"><div><p className="admin-eyebrow">CATALOGUE CONTROL</p><h1>Gemstone Inventory</h1><p>Maintain one accurate record for each physical gemstone.</p></div><button className="admin-button admin-button--primary" onClick={() => { setEditingGemstoneId(null); setGemstoneForm({ referenceCode: "", name: "", category: "ruby", weightCarat: "", shape: "", origin: "", colour: "", clarity: "", treatment: "", certificationLab: "", certificationNumber: "", description: "", availabilityStatus: "available", acquisitionCost: "", sellingPrice: "", currencyCode: "", publicPriceMode: "hidden", cut: "", dimensionsMm: "", originRegion: "", sourcingMethod: "", supplierName: "", supplierReference: "", ownershipType: "owned", stockLocation: "", acquisitionDate: "", internalNotes: "", publicTitle: "", publicDescription: "", seoTitle: "", seoDescription: "", publicVisibility: true, imageUrl: "" }); setShowGemstoneForm(true); }}>＋ Add gemstone</button></div>
          <div className="admin-toolbar"><input aria-label="Search gemstone inventory" placeholder="Search reference, name or origin…" value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void loadGemstones(); }} /><button className="admin-button admin-button--secondary" onClick={() => void loadGemstones()}>Search</button></div>
          {formMessage && <p className="admin-inline-message">{formMessage}</p>}
          <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Reference / Gemstone</th><th>Category</th><th>Carat</th><th>Availability</th><th>Publication</th><th>Price display</th><th>Updated</th><th>Actions</th></tr></thead><tbody>
            {gemstones.map((gemstone) => <tr key={gemstone.id}><td><div className="admin-gemstone-record">{gemstone.image_path ? <img className="admin-gemstone-thumb" src={gemstone.image_path} alt="" loading="lazy" /> : <span className="admin-gemstone-thumb" aria-hidden="true" />}<span><strong>{gemstone.reference_code}</strong><small>{gemstone.name}</small></span></div></td><td>{labelFor(gemstone.category)}</td><td>{gemstone.weight_carat ?? "—"}</td><td><span className={"admin-pill admin-pill--" + gemstone.availability_status}>{labelFor(gemstone.availability_status)}</span></td><td><span className={"admin-pill admin-pill--" + gemstone.status}>{labelFor(gemstone.status)}</span></td><td>{labelFor(gemstone.public_price_mode)}</td><td>{formatDate(gemstone.updated_at)}</td><td><div className="admin-row-actions"><button onClick={() => beginEditGemstone(gemstone)}>Edit</button>{gemstone.status === "archived" ? <button onClick={() => void updateGemstoneStatus(gemstone, "restore")}>Restore</button> : gemstone.status === "published" ? <button onClick={() => void updateGemstoneStatus(gemstone, "unpublish")}>Unpublish</button> : <button onClick={() => void updateGemstoneStatus(gemstone, "publish")}>Publish</button>}<button onClick={() => void updateGemstoneStatus(gemstone, "archive")} disabled={gemstone.status === "archived"}>Archive</button></div></td></tr>)}
            {!gemstones.length && <tr><td colSpan={8}><EmptyState title="No inventory records found" text="Add the first verified gemstone record, or adjust your search." /></td></tr>}
          </tbody></table></div>
          {showGemstoneForm && <div className="admin-modal-backdrop" role="presentation"><section className="admin-modal admin-gemstone-wizard" role="dialog" aria-modal="true" aria-labelledby="gemstone-form-title">
            <div className="admin-panel__heading"><div><p className="admin-eyebrow">NEW INVENTORY RECORD</p><h2 id="gemstone-form-title">{editingGemstoneId ? "Edit gemstone" : "Add gemstone"}</h2></div><button className="admin-icon-button" onClick={() => setShowGemstoneForm(false)} aria-label="Close">×</button></div>
                        <form className="admin-form admin-form--grid" onSubmit={saveGemstone}>
              <div className="admin-form__section-title">Gemstone details</div>
              <label>Reference code *<input required disabled={Boolean(editingGemstoneId)} value={gemstoneForm.referenceCode} onChange={(event) => setGemstoneForm({ ...gemstoneForm, referenceCode: event.target.value.toUpperCase() })} placeholder="RBY-009" /></label>
              <label>Gemstone name *<input required value={gemstoneForm.name} onChange={(event) => setGemstoneForm({ ...gemstoneForm, name: event.target.value })} placeholder="Natural Ruby" /></label>
              <label>Category *<select required value={gemstoneForm.category} onChange={(event) => setGemstoneForm({ ...gemstoneForm, category: event.target.value })}><option value="ruby">Ruby</option><option value="sapphire">Blue Sapphire</option><option value="emerald">Emerald</option><option value="rare">Rare Gemstone</option></select></label>
              <label>Carat weight<input type="number" min="0.01" step="0.01" value={gemstoneForm.weightCarat} onChange={(event) => setGemstoneForm({ ...gemstoneForm, weightCarat: event.target.value })} placeholder="e.g. 1.30" /></label>
              <label>Shape<select value={gemstoneForm.shape} onChange={(event)=>setGemstoneForm({...gemstoneForm,shape:event.target.value})}><option value="">Select shape</option>{(gemstoneOptions.shape||[]).map(x=><option key={x.id} value={x.value}>{x.value}</option>)}</select><button type="button" className="admin-option-add" onClick={()=>void addGemstoneOption("shape")}>＋ Add option</button></label>
              <label>Origin<select value={gemstoneForm.origin} onChange={(event)=>setGemstoneForm({...gemstoneForm,origin:event.target.value})}><option value="">Select origin</option>{(gemstoneOptions.origin||[]).map(x=><option key={x.id} value={x.value}>{x.value}</option>)}</select><button type="button" className="admin-option-add" onClick={()=>void addGemstoneOption("origin")}>＋ Add option</button></label>
              <label>Colour<select value={gemstoneForm.colour} onChange={(event)=>setGemstoneForm({...gemstoneForm,colour:event.target.value})}><option value="">Select colour</option>{(gemstoneOptions.colour||[]).map(x=><option key={x.id} value={x.value}>{x.value}</option>)}</select><button type="button" className="admin-option-add" onClick={()=>void addGemstoneOption("colour")}>＋ Add option</button></label>
              <label>Clarity<select value={gemstoneForm.clarity} onChange={(event)=>setGemstoneForm({...gemstoneForm,clarity:event.target.value})}><option value="">Select clarity</option>{(gemstoneOptions.clarity||[]).map(x=><option key={x.id} value={x.value}>{x.value}</option>)}</select><button type="button" className="admin-option-add" onClick={()=>void addGemstoneOption("clarity")}>＋ Add option</button></label>
              <label>Treatment<select value={gemstoneForm.treatment} onChange={(event)=>setGemstoneForm({...gemstoneForm,treatment:event.target.value})}><option value="">Select treatment</option>{(gemstoneOptions.treatment||[]).map(x=><option key={x.id} value={x.value}>{x.value}</option>)}</select><button type="button" className="admin-option-add" onClick={()=>void addGemstoneOption("treatment")}>＋ Add option</button></label>
              <label>Cut grade<select value={gemstoneForm.cut} onChange={(event)=>setGemstoneForm({...gemstoneForm,cut:event.target.value})}><option value="">Select cut</option>{(gemstoneOptions.cut||[]).map(x=><option key={x.id} value={x.value}>{x.value}</option>)}</select><button type="button" className="admin-option-add" onClick={()=>void addGemstoneOption("cut")}>＋ Add option</button></label>
              <label>Dimensions (mm)<input value={gemstoneForm.dimensionsMm} onChange={(event)=>setGemstoneForm({...gemstoneForm,dimensionsMm:event.target.value})} placeholder="e.g. 8.2 × 6.1 × 4.3" /></label>
              <label>Origin region / mine<input value={gemstoneForm.originRegion} onChange={(event)=>setGemstoneForm({...gemstoneForm,originRegion:event.target.value})} /></label>
              <label>Certification lab<select value={gemstoneForm.certificationLab} onChange={(event)=>setGemstoneForm({...gemstoneForm,certificationLab:event.target.value})}><option value="">Select laboratory</option>{(gemstoneOptions.certification_lab||[]).map(x=><option key={x.id} value={x.value}>{x.value}</option>)}</select><button type="button" className="admin-option-add" onClick={()=>void addGemstoneOption("certification_lab")}>＋ Add option</button></label>
              <label>Certificate number<input value={gemstoneForm.certificationNumber} onChange={(event)=>setGemstoneForm({...gemstoneForm,certificationNumber:event.target.value})} /></label>
              <label>Availability<select value={gemstoneForm.availabilityStatus} onChange={(event) => setGemstoneForm({ ...gemstoneForm, availabilityStatus: event.target.value })}><option value="available">Available</option><option value="reserved">Reserved</option><option value="sold">Sold</option><option value="unavailable">Unavailable</option></select></label>

              <div className="admin-form__section-title">Internal commercial details</div>
              <label>Acquisition cost<input type="number" min="0" step="0.01" value={gemstoneForm.acquisitionCost} onChange={(event)=>setGemstoneForm({...gemstoneForm,acquisitionCost:event.target.value})} /></label>
              <label>Selling price<input type="number" min="0" step="0.01" value={gemstoneForm.sellingPrice} onChange={(event)=>setGemstoneForm({...gemstoneForm,sellingPrice:event.target.value})} /></label>
              <label>Currency code<input maxLength={3} placeholder="e.g. HKD" value={gemstoneForm.currencyCode} onChange={(event)=>setGemstoneForm({...gemstoneForm,currencyCode:event.target.value.toUpperCase()})} /></label>
              <label>Public price mode<select value={gemstoneForm.publicPriceMode} onChange={(event)=>setGemstoneForm({...gemstoneForm,publicPriceMode:event.target.value})}><option value="hidden">Hide price</option><option value="enquiry">Enquire for price</option><option value="fixed">Show fixed price</option></select></label>
              <label>Ownership type<select value={gemstoneForm.ownershipType} onChange={(event)=>setGemstoneForm({...gemstoneForm,ownershipType:event.target.value})}><option value="owned">Company owned</option><option value="consignment">Consignment</option><option value="client_owned">Client owned</option><option value="sourced_to_order">Sourced to order</option></select></label>
              <label>Supplier / owner name<input value={gemstoneForm.supplierName} onChange={(event)=>setGemstoneForm({...gemstoneForm,supplierName:event.target.value})} /></label>
              <label>Supplier reference<input value={gemstoneForm.supplierReference} onChange={(event)=>setGemstoneForm({...gemstoneForm,supplierReference:event.target.value})} /></label>
              <label>Sourcing method<input value={gemstoneForm.sourcingMethod} onChange={(event)=>setGemstoneForm({...gemstoneForm,sourcingMethod:event.target.value})} placeholder="Direct sourcing, broker, etc." /></label>
              <label>Stock location<input value={gemstoneForm.stockLocation} onChange={(event)=>setGemstoneForm({...gemstoneForm,stockLocation:event.target.value})} /></label>
              <label>Acquisition date<input type="date" value={gemstoneForm.acquisitionDate} onChange={(event)=>setGemstoneForm({...gemstoneForm,acquisitionDate:event.target.value})} /></label>
              <label className="admin-form__full">Internal description<textarea rows="3" value={gemstoneForm.description} onChange={(event)=>setGemstoneForm({...gemstoneForm,description:event.target.value})} /></label>
              <label className="admin-form__full">Internal notes<textarea rows="3" value={gemstoneForm.internalNotes} onChange={(event)=>setGemstoneForm({...gemstoneForm,internalNotes:event.target.value})} /></label>
              <p className="admin-form__helper admin-form__full">Acquisition cost, supplier details, internal description and notes are private. They are never returned by the public catalogue API.</p>

              <div className="admin-form__section-title">Public gemstone listing</div>
              <label>Public display title<input value={gemstoneForm.publicTitle} onChange={(event)=>setGemstoneForm({...gemstoneForm,publicTitle:event.target.value})} placeholder="Defaults to gemstone name" /></label>
              <label>Public primary image URL<input type="url" value={gemstoneForm.imageUrl} onChange={(event)=>setGemstoneForm({...gemstoneForm,imageUrl:event.target.value})} placeholder="https://.../gemstone-image.jpg" /></label>
              {gemstoneForm.imageUrl && <div className="admin-gemstone-image-preview admin-form__full"><img src={gemstoneForm.imageUrl} alt="Gemstone image preview" onError={(event)=>{event.currentTarget.style.display="none";}} /><span>Preview of the primary public image</span></div>}
              <label className="admin-form__full">Public description<textarea rows="4" value={gemstoneForm.publicDescription} onChange={(event)=>setGemstoneForm({...gemstoneForm,publicDescription:event.target.value})} placeholder="Description displayed on the public gemstone page" /></label>
              <label>SEO title<input value={gemstoneForm.seoTitle} onChange={(event)=>setGemstoneForm({...gemstoneForm,seoTitle:event.target.value})} /></label>
              <label>SEO description<textarea rows="2" value={gemstoneForm.seoDescription} onChange={(event)=>setGemstoneForm({...gemstoneForm,seoDescription:event.target.value})} /></label>
              <label className="admin-form__full admin-checkbox-label"><input type="checkbox" checked={gemstoneForm.publicVisibility} onChange={(event)=>setGemstoneForm({...gemstoneForm,publicVisibility:event.target.checked})} /> Allow this gemstone to appear in public collections after publication</label>
              <p className="admin-form__helper admin-form__full">The primary public image URL is shared with the website collection and gemstone detail page. Use a public HTTPS image URL. Managed image/video uploads and private certificate files will be added after the storage provider is selected. Never paste private certificate links here.</p>

              <div className="admin-form__actions admin-form__full">
                <button type="button" className="admin-button admin-button--secondary" onClick={()=>setShowGemstoneForm(false)}>Cancel</button>
                <button className="admin-button admin-button--primary" disabled={saving}>{saving?"Saving…":editingGemstoneId?"Save changes":"Save gemstone draft"}</button>
              </div>
            </form>
          </section></div>}
        </>
      );
    }

    if (section === "enquiries") {
      return (
        <>
          <div className="admin-page-heading"><div><p className="admin-eyebrow">CUSTOMER RELATIONSHIPS</p><h1>Enquiries</h1><p>Review website messages, set priority, assign team members and track each conversation.</p></div></div>
          <div className="admin-toolbar"><input aria-label="Search enquiries" placeholder="Search enquiry, customer or email…" value={enquirySearch} onChange={(event) => setEnquirySearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void loadEnquiries(); }} /><button className="admin-button admin-button--secondary" onClick={() => void loadEnquiries()}>Search</button></div>
          <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Enquiry / Date</th><th>Contact</th><th>Interest</th><th>Assigned staff</th><th>Priority</th><th>Status</th><th>Details</th></tr></thead><tbody>
            {enquiries.map((item) => <tr key={item.id}><td><strong>{item.enquiry_number}</strong><small>{formatDate(item.created_at)}</small></td><td><strong>{item.name_snapshot}</strong><small>{item.email_snapshot}</small></td><td>{item.gemstone_reference ? item.gemstone_reference + " · " : ""}{item.enquiry_type}</td><td><select className="admin-inline-select" aria-label={"Assignee for " + item.enquiry_number} value={item.assigned_staff_id || ""} onChange={(event) => void updateEnquiry(item, "assignedStaffId", event.target.value)}><option value="">Unassigned</option>{staff.filter((person) => person.employment_status === "active").map((person) => <option key={person.id} value={person.id}>{person.full_name}</option>)}</select></td><td><select className="admin-inline-select" aria-label={"Priority for " + item.enquiry_number} value={item.priority} onChange={(event) => void updateEnquiry(item, "priority", event.target.value)}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select></td><td><select className="admin-inline-select" aria-label={"Status for " + item.enquiry_number} value={item.status} onChange={(event) => void updateEnquiry(item, "status", event.target.value)}><option value="new">New</option><option value="assigned">Assigned</option><option value="in_progress">In Progress</option><option value="waiting_customer">Waiting for Customer</option><option value="quotation_sent">Quotation Sent</option><option value="won">Won</option><option value="lost">Lost</option><option value="closed">Closed</option></select></td><td><button className="admin-link-button" onClick={() => void openEnquiry(item)}>Open →</button></td></tr>)}
            {!enquiries.length && <tr><td colSpan={7}><EmptyState title="No enquiries yet" text="The public contact form creates records here after a visitor submits a message successfully." /></td></tr>}
          </tbody></table></div>
          {selectedEnquiry && <div className="admin-modal-backdrop" role="presentation"><section className="admin-modal admin-modal--narrow admin-enquiry-modal" role="dialog" aria-modal="true" aria-labelledby="enquiry-detail-title">
            <div className="admin-panel__heading"><div><p className="admin-eyebrow">{selectedEnquiry.enquiry_number}</p><h2 id="enquiry-detail-title">Enquiry details</h2></div><button className="admin-icon-button" onClick={() => setSelectedEnquiry(null)} aria-label="Close enquiry">×</button></div>
            <div className="admin-enquiry-contact"><strong>{selectedEnquiry.name_snapshot}</strong><a href={"mailto:" + selectedEnquiry.email_snapshot}>{selectedEnquiry.email_snapshot}</a><span>{selectedEnquiry.company_snapshot || "Individual enquiry"}{selectedEnquiry.phone_snapshot ? " · " + selectedEnquiry.phone_snapshot : ""}</span></div>
            <div className="admin-enquiry-meta"><span>{selectedEnquiry.enquiry_type}</span><span>{selectedEnquiry.gemstone_reference || "General enquiry"}</span><span>{formatDate(selectedEnquiry.created_at)}</span></div>
            {selectedEnquiry.gemstone_reference && <div className="admin-enquiry-inventory-link"><span>Linked inventory item: <strong>{selectedEnquiry.gemstone_reference}</strong></span><button type="button" className="admin-button admin-button--secondary" onClick={() => { const reference = selectedEnquiry.gemstone_reference || ""; setSelectedEnquiry(null); setSearch(reference); openSection("gemstones"); }}>Open gemstone inventory →</button></div>}
            <div className="admin-enquiry-message"><p className="admin-eyebrow">CUSTOMER MESSAGE</p><p>{selectedEnquiry.message || "Message not available."}</p></div>
            <div className="admin-panel__heading"><div><p className="admin-eyebrow">PRIVATE RECORD</p><h2>Internal notes</h2></div></div>
            <div className="admin-enquiry-notes">{enquiryNotes.map((note) => <article key={note.id}><p>{note.note}</p><time>{formatDate(note.created_at)}</time></article>)}{!enquiryNotes.length && <p className="admin-empty__note">No internal notes have been added.</p>}</div>
            <form className="admin-form admin-note-form" onSubmit={addEnquiryNote}><label>Add a private note<textarea rows={3} value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} placeholder="Record a call, follow-up or internal context…" required /></label><div className="admin-form__actions"><button type="button" className="admin-button admin-button--secondary" onClick={() => setSelectedEnquiry(null)}>Close</button><button className="admin-button admin-button--primary" disabled={saving || !noteDraft.trim()}>{saving ? "Saving…" : "Save internal note"}</button></div></form>
          </section></div>}
        </>
      );
    }

    if (section === "customers") {
      return <><div className="admin-page-heading"><div><p className="admin-eyebrow">RELATIONSHIP DIRECTORY</p><h1>Customers</h1><p>Customer profiles created from enquiries and registered accounts.</p></div></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Customer</th><th>Company</th><th>Contact</th><th>Type / Source</th><th>Status</th><th>Added</th></tr></thead><tbody>{customers.map((item) => <tr key={item.id}><td><strong>{item.full_name}</strong></td><td>{item.company_name || "—"}</td><td><strong>{item.email}</strong><small>{item.phone || "No phone supplied"}</small></td><td>{labelFor(item.source)}</td><td><span className="admin-pill">{labelFor(item.customer_status)}</span></td><td>{formatDate(item.created_at)}</td></tr>)}{!customers.length && <tr><td colSpan={6}><EmptyState title="No customer profiles yet" text="Customer and guest profiles will appear after the first website enquiry." /></td></tr>}</tbody></table></div></>;
    }

    if (section === "staff") {
      return <><div className="admin-page-heading"><div><p className="admin-eyebrow">TEAM OPERATIONS</p><h1>Staff Directory</h1><p>Maintain employee details and assign work without granting portal login access.</p></div><button className="admin-button admin-button--primary" onClick={() => { setEditingStaffId(null); setStaffForm({ fullName: "", email: "", phone: "", department: "", jobTitle: "", employmentStatus: "active" }); setShowStaffForm(true); }}>＋ Add staff record</button></div>
        <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Name</th><th>Role / Department</th><th>Email</th><th>Employment</th><th>Actions</th></tr></thead><tbody>{staff.map((item) => <tr key={item.id}><td><strong>{item.full_name}</strong><small>{item.phone || "No phone supplied"}</small></td><td>{item.job_title || "—"}<small>{item.department || "—"}</small></td><td>{item.email || "—"}</td><td><span className="admin-pill">{labelFor(item.employment_status)}</span></td><td><div className="admin-row-actions"><button onClick={() => beginEditStaff(item)}>Edit</button></div></td></tr>)}{!staff.length && <tr><td colSpan={5}><EmptyState title="No staff records yet" text="Add employees here. A staff record does not create a login." /></td></tr>}</tbody></table></div>
        {showStaffForm && <div className="admin-modal-backdrop" role="presentation"><section className="admin-modal admin-modal--narrow" role="dialog" aria-modal="true" aria-labelledby="staff-form-title"><div className="admin-panel__heading"><div><p className="admin-eyebrow">TEAM DIRECTORY</p><h2 id="staff-form-title">{editingStaffId ? "Edit staff record" : "Add staff record"}</h2></div><button className="admin-icon-button" onClick={() => { setShowStaffForm(false); setEditingStaffId(null); }} aria-label="Close">×</button></div><form className="admin-form" onSubmit={saveStaff}><label>Full name *<input required value={staffForm.fullName} onChange={(event) => setStaffForm({ ...staffForm, fullName: event.target.value })} /></label><label>Email<input type="email" value={staffForm.email} onChange={(event) => setStaffForm({ ...staffForm, email: event.target.value })} /></label><label>Phone<input value={staffForm.phone} onChange={(event) => setStaffForm({ ...staffForm, phone: event.target.value })} /></label><label>Job title<input value={staffForm.jobTitle} onChange={(event) => setStaffForm({ ...staffForm, jobTitle: event.target.value })} /></label><label>Department<input value={staffForm.department} onChange={(event) => setStaffForm({ ...staffForm, department: event.target.value })} /></label><label>Employment status<select value={staffForm.employmentStatus} onChange={(event) => setStaffForm({ ...staffForm, employmentStatus: event.target.value })}><option value="active">Active</option><option value="inactive">Inactive</option><option value="on_leave">On leave</option></select></label><p className="admin-form__helper">This maintains a directory record only. Employee login accounts are disabled in the owner-only first release.</p><div className="admin-form__actions"><button type="button" className="admin-button admin-button--secondary" onClick={() => { setShowStaffForm(false); setEditingStaffId(null); }}>Cancel</button><button className="admin-button admin-button--primary" disabled={saving}>{saving ? "Saving…" : editingStaffId ? "Save changes" : "Save staff record"}</button></div></form></section></div>}
      </>;
    }

    if (section === "activity") {
      return <><div className="admin-page-heading"><div><p className="admin-eyebrow">SECURITY & ACCOUNTABILITY</p><h1>Activity Logs</h1><p>Administrative changes recorded with actor, entity and timestamp.</p></div></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Time</th><th>Action</th><th>Module</th><th>Record ID</th></tr></thead><tbody>{activity.map((item) => <tr key={item.id}><td>{formatDate(item.occurred_at)}</td><td><strong>{labelFor(item.action)}</strong></td><td>{labelFor(item.entity_type)}</td><td>{item.entity_id || "—"}</td></tr>)}{!activity.length && <tr><td colSpan={4}><EmptyState title="No activity recorded" text="Sensitive owner actions will appear here." /></td></tr>}</tbody></table></div></>;
    }

    const deferred: Record<string, { title: string; description: string; items: string[] }> = {
      media: { title: "Storage provider setup is pending", description: "The database is ready to track media metadata, but file uploads must wait until the Replit/AWS storage choice and access model are reviewed. Public gemstone imagery and private certificates will use separate delivery rules.", items: ["Provider-neutral metadata tables are ready", "No bucket or storage credentials have been created", "Private certificates will not be served from public URLs"] },
      sales: { title: "Commerce configuration is pending", description: "Quotations, orders, invoices and payment allocations will be connected after the company confirms currency, tax rules, document numbering and payment allocation policy.", items: ["Financial documents will preserve issued versions", "Payments will support partial and multi-invoice allocations", "External payments will be recorded; no payment gateway is implied"] },
      cms: { title: "Structured website editing is planned", description: "The CMS will edit the six existing public sections without replacing the carefully designed single-page layout or its section anchors.", items: ["Home", "Our Heritage", "Our Gemstones", "Quality & Trust", "Global Presence", "Contact"] },
      analytics: { title: "Analytics integration is pending", description: "GA4 and first-party event data will be shown separately. WhatsApp button clicks will not be represented as received WhatsApp conversations.", items: ["First-party event table is ready", "GA4 property and consent policy are still required", "No personally identifying enquiry data will be sent to GA4"] },
      reports: { title: "Reports will follow the connected workflows", description: "Operational and commercial reports will become meaningful once inventory, CRM and commerce data are populated and validated.", items: ["Inventory and availability", "Enquiry source and conversion", "Quotation, invoice and payment reporting"] },
      settings: { title: "Company settings and integrations", description: "Configure company identity, business rules and connected services after the owner confirms the outstanding decisions.", items: ["Currency, tax and invoice identity", "Transactional email sender", "Storage provider and analytics property", "WhatsApp Business integration (later phase)"] },
    };
    const info = deferred[section] || deferred.settings;
    return <><div className="admin-page-heading"><div><p className="admin-eyebrow">CONFIGURATION / ROADMAP</p><h1>{selectedTitle}</h1><p>Planned module — not presented as live functionality.</p></div></div><section className="admin-deferred-panel"><span className="admin-deferred-icon">◇</span><h2>{info.title}</h2><p>{info.description}</p><ul>{info.items.map((item) => <li key={item}>{item}</li>)}</ul></section></>;
  }, [checking, admin, section, dashboard, gemstones, enquiries, customers, staff, activity, pageError, search, enquirySearch, showGemstoneForm, editingGemstoneId, showStaffForm, saving, formMessage, gemstoneForm, staffForm, editingStaffId, selectedEnquiry, enquiryNotes, noteDraft, gemstoneOptions]);

  if (checking || !admin) {
    return <main className="admin-app"><div className="admin-loading">Loading owner portal…</div></main>;
  }

  return (
    <div className="admin-app">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand"><BrandMark className="admin-sidebar__logo" width={48} height={53} /><span><strong>HONG KONG<br />GEM HOUSE</strong><small>ADMIN PORTAL</small></span></div>
        <div className="admin-sidebar__rule" />
        <nav aria-label="Administration navigation">
          {navigation.map((group) => <div className="admin-nav-group" key={group.group}><p>{group.group}</p>{group.items.map((item) => <button key={item.key} className={section === item.key ? "is-active" : ""} onClick={() => openSection(item.key)}><span aria-hidden="true">{item.icon}</span>{item.label}</button>)}</div>)}
        </nav>
        <div className="admin-sidebar__bottom"><div className="admin-owner-mini"><span>{initialsFor(admin.fullName)}</span><div><strong>{admin.fullName}</strong><small>Company owner</small></div></div><button className="admin-logout" onClick={() => void logout()}>Sign out ↗</button></div>
      </aside>
      <main className="admin-main">
        <header className="admin-topbar"><div><span className="admin-topbar__crumb">ADMINISTRATION</span><strong>{selectedTitle}</strong></div><div className="admin-topbar__right"><span className="admin-secure-indicator">● Owner session secured</span><button className="admin-topbar__avatar" title={admin.email}>{initialsFor(admin.fullName)}</button></div></header>
        <div className="admin-content">
          {pageError && <p className="admin-inline-error" role="alert">{pageError}</p>}
          {pageContent}
        </div>
      </main>
    </div>
  );
}

function KpiCard({ label, value, note, muted = false }: { label: string; value: string | number; note: string; muted?: boolean }) {
  return <article className={"admin-kpi" + (muted ? " admin-kpi--muted" : "")}><span>{label}</span><strong>{value}</strong><small>{note}</small></article>;
}
function EmptyState({ title, text }: { title: string; text: string }) {
  return <div className="admin-empty"><strong>{title}</strong><span>{text}</span></div>;
}
