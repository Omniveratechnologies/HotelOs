import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Save, Bell, ShieldCheck, User } from "lucide-react";
import Topbar from "../components/layout/Topbar.jsx";
import Field from "../components/ui/Field.jsx";
import { inputClass } from "../components/ui/inputClass.js";
import Button from "../components/ui/Button.jsx";
import { currentAdmin } from "../data/mockData.js";

function SectionCard({ icon: Icon, title, description, children }) {
  return (
    <div className="border-line rounded-2xl border bg-white p-5 sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <div className="bg-signal-100 text-signal-600 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
          <Icon size={17} strokeWidth={2.25} />
        </div>
        <div>
          <h3 className="font-display text-ink-body font-bold">{title}</h3>
          {description && (
            <p className="text-ink-muted mt-0.5 text-sm">{description}</p>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange, label, description }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-3">
      <span>
        <span className="text-ink-body block text-sm font-semibold">
          {label}
        </span>
        {description && (
          <span className="text-ink-muted block text-xs">{description}</span>
        )}
      </span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-signal-500" : "bg-ink-950/15"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </label>
  );
}

export default function Settings() {
  const { onMenuClick } = useOutletContext();
  const [name, setName] = useState(currentAdmin.name);
  const [email, setEmail] = useState(currentAdmin.email);
  const [notifyExpiry, setNotifyExpiry] = useState(true);
  const [notifyRequests, setNotifyRequests] = useState(true);
  const [notifyTransactions, setNotifyTransactions] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleSave(e) {
    e.preventDefault();
    // TODO: wire to PATCH /api/admin/profile once backend is connected
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  }

  return (
    <>
      <Topbar
        title="Settings"
        subtitle="Manage your admin profile, security, and notifications."
        onMenuClick={onMenuClick}
      />

      <main className="flex-1 space-y-5 px-5 pb-10 lg:px-8">
        <form onSubmit={handleSave} className="space-y-5">
          <SectionCard
            icon={User}
            title="Profile"
            description="This information is visible to your team."
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Full name">
                <input
                  className={inputClass()}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>
              <Field label="Email address">
                <input
                  type="email"
                  className={inputClass()}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard
            icon={Bell}
            title="Notifications"
            description="Choose what you get notified about."
          >
            <div className="divide-line divide-y">
              <Toggle
                checked={notifyExpiry}
                onChange={setNotifyExpiry}
                label="Subscription expiry alerts"
                description="Get notified 7 days before a hotel's subscription expires."
              />
              <Toggle
                checked={notifyRequests}
                onChange={setNotifyRequests}
                label="New service requests"
                description="Get notified when a hotel submits a new request."
              />
              <Toggle
                checked={notifyTransactions}
                onChange={setNotifyTransactions}
                label="Daily transaction summary"
                description="A daily email with food transaction totals per hotel."
              />
            </div>
          </SectionCard>

          <SectionCard
            icon={ShieldCheck}
            title="Security"
            description="Keep your super admin account secure."
          >
            <Toggle
              checked={twoFactor}
              onChange={setTwoFactor}
              label="Two-factor authentication"
              description="Require a verification code in addition to your password."
            />
          </SectionCard>

          <div className="flex items-center gap-3">
            <Button type="submit" icon={Save}>
              Save changes
            </Button>
            {saved && (
              <span className="text-signal-600 text-sm font-medium">
                Saved.
              </span>
            )}
          </div>
        </form>
      </main>
    </>
  );
}
