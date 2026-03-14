"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Shield,
  Menu,
  X,
  ChevronRight,
  LayoutDashboard,
  FileText,
  Smartphone,
  Clock,
  AlertTriangle,
  Activity,
  CheckCircle2,
  ArrowRight,
  Globe,
  Lock,
  BarChart3,
  Settings,
} from "lucide-react";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* ── Sticky Nav ── */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#3730a3]">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-[#1f2937] tracking-tight">
                SafeGuard
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              <a
                href="#features"
                className="text-sm text-gray-500 hover:text-[#1f2937] transition-colors"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="text-sm text-gray-500 hover:text-[#1f2937] transition-colors"
              >
                How it works
              </a>
              <a
                href="#product"
                className="text-sm text-gray-500 hover:text-[#1f2937] transition-colors"
              >
                Platform
              </a>
            </nav>

            <div className="hidden md:flex items-center gap-4">
              <Link
                href="/login"
                className="text-sm font-medium text-[#1f2937] hover:text-[#2563eb] transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d4ed8] transition-colors"
              >
                Get started <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <button
              className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-white px-4 py-4 space-y-1">
            <a
              href="#features"
              className="block rounded-lg px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="block rounded-lg px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              How it works
            </a>
            <a
              href="#product"
              className="block rounded-lg px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              Platform
            </a>
            <div className="pt-2 border-t mt-2">
              <Link
                href="/login"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2563eb] px-4 py-3 text-sm font-semibold text-white hover:bg-[#1d4ed8] transition-colors"
              >
                Get started <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ── Hero ── */}
      <section className="relative bg-[#3730a3] pt-16 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-1.5 mb-8">
              <span className="h-1.5 w-1.5 rounded-full bg-[#60a5fa]" />
              <span className="text-xs font-semibold text-white/80 tracking-widest uppercase">
                DNS-Layer Protection
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.1] tracking-tight mb-6">
              Internet safety for every child in your care
            </h1>
            <p className="text-lg md:text-xl text-indigo-200 max-w-2xl mx-auto mb-10 leading-relaxed">
              Real-time DNS filtering, device management, and safeguarding
              reports — purpose-built for children&apos;s residential homes.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-lg bg-[#2563eb] px-7 py-3.5 text-base font-semibold text-white hover:bg-[#1d4ed8] transition-colors shadow-lg shadow-indigo-950/40"
              >
                Access the platform <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#product"
                className="inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/10 px-7 py-3.5 text-base font-semibold text-white hover:bg-white/20 transition-colors"
              >
                See how it works
              </a>
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-indigo-200/80">
              {[
                "No hardware required",
                "5-minute device setup",
                "Ofsted-aligned reporting",
              ].map((t) => (
                <div key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-[#60a5fa] flex-shrink-0" />
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative h-16">
          <svg
            viewBox="0 0 1440 64"
            className="absolute bottom-0 w-full"
            fill="none"
            preserveAspectRatio="none"
          >
            <path
              d="M0 64L1440 64L1440 0C1440 0 1080 64 720 64C360 64 0 0 0 0L0 64Z"
              fill="#f8fafc"
            />
          </svg>
        </div>
      </section>

      {/* ── Proof bar ── */}
      <section className="bg-[#f8fafc] border-b border-gray-100 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { stat: "40+", label: "Children's homes protected" },
              { stat: "2M+", label: "DNS queries filtered monthly" },
              { stat: "99.9%", label: "Platform uptime SLA" },
              { stat: "<50ms", label: "Avg DNS response time" },
            ].map(({ stat, label }) => (
              <div key={label}>
                <div className="text-3xl font-bold text-[#3730a3] mb-1.5">
                  {stat}
                </div>
                <div className="text-sm text-gray-500">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Product preview ── */}
      <section id="product" className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#dbeafe] px-4 py-1.5 mb-5">
              <span className="text-xs font-semibold text-[#1e40af] tracking-widest uppercase">
                Platform Preview
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#1f2937] mb-4">
              Designed for care staff, not IT teams
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              A clear, structured interface that gives you the control you need
              without the complexity you don&apos;t.
            </p>
          </div>

          {/* Tab selector */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1 gap-1">
              {["Dashboard", "Reports", "Device Control"].map((tab, i) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(i)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activeTab === i
                      ? "bg-white shadow-sm text-[#1f2937] border border-gray-200"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Product mockup */}
          <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-2xl shadow-gray-200/80">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 bg-gray-100 border-b border-gray-200 px-4 py-3">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-400/60" />
                <div className="h-3 w-3 rounded-full bg-yellow-400/60" />
                <div className="h-3 w-3 rounded-full bg-green-400/60" />
              </div>
              <div className="flex-1 mx-4">
                <div className="bg-white rounded-md px-3 py-1 text-xs text-gray-400 border border-gray-200 max-w-xs mx-auto text-center font-mono">
                  app.safeguard.io/
                  {activeTab === 0
                    ? "dashboard"
                    : activeTab === 1
                      ? "reports"
                      : "settings"}
                </div>
              </div>
            </div>

            {/* App chrome */}
            <div className="flex bg-white" style={{ minHeight: 380 }}>
              {/* Sidebar */}
              <div className="hidden md:flex w-52 flex-col border-r bg-white flex-shrink-0">
                <div className="flex items-center gap-2 border-b px-4 py-3.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#3730a3] flex-shrink-0">
                    <Shield className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-[#1f2937]">
                    SafeGuard
                  </span>
                </div>
                <div className="border-b px-3 py-2.5">
                  <div className="rounded-md bg-gray-50 border border-gray-200 px-2.5 py-1.5 text-xs text-gray-600 flex items-center justify-between">
                    <span>Meadow House</span>
                    <span className="text-gray-400">▾</span>
                  </div>
                </div>
                <nav className="flex-1 px-2 py-3 space-y-0.5">
                  {[
                    {
                      label: "Dashboard",
                      icon: LayoutDashboard,
                      active: activeTab === 0,
                    },
                    {
                      label: "Reports",
                      icon: FileText,
                      active: activeTab === 1,
                    },
                    {
                      label: "Settings",
                      icon: Settings,
                      active: activeTab === 2,
                    },
                  ].map(({ label, icon: Icon, active }) => (
                    <div
                      key={label}
                      className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium cursor-pointer transition-colors ${
                        active
                          ? "bg-[#eff6ff] text-[#2563eb]"
                          : "text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </div>
                  ))}
                </nav>
                <div className="border-t px-3 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-[#dbeafe] flex items-center justify-center text-[9px] font-bold text-[#2563eb] flex-shrink-0">
                      JD
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold text-[#1f2937]">
                        Jane Davies
                      </div>
                      <div className="text-[9px] text-gray-400">
                        Home Manager
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main content */}
              <div className="flex-1 bg-[#f8fafc] p-5 overflow-hidden">
                {activeTab === 0 && <DashboardPreview />}
                {activeTab === 1 && <ReportsPreview />}
                {activeTab === 2 && <DevicesPreview />}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="bg-[#f8fafc] py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#dbeafe] px-4 py-1.5 mb-5">
              <span className="text-xs font-semibold text-[#1e40af] tracking-widest uppercase">
                Capabilities
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#1f2937] mb-4">
              Everything you need to keep children safe online
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Built specifically for children&apos;s residential care — not
              adapted from a consumer product.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: Globe,
                title: "DNS Content Filtering",
                description:
                  "Block harmful categories at the DNS layer before content loads. Works on any device without installing software.",
              },
              {
                icon: Smartphone,
                title: "Per-Device Control",
                description:
                  "Assign devices to individual children. Enable or disable internet access instantly from the dashboard.",
              },
              {
                icon: Clock,
                title: "Access Scheduling",
                description:
                  "Set time-based internet rules per child. Automatically enforce bedtime and school-hour restrictions.",
              },
              {
                icon: FileText,
                title: "Safeguarding Reports",
                description:
                  "Exportable logs of blocked content events, filtered by child, device, or category. Ofsted-ready documentation.",
              },
              {
                icon: AlertTriangle,
                title: "Unknown Device Detection",
                description:
                  "Instantly identify and assign any new device that joins your network. No device goes unmonitored.",
              },
              {
                icon: Activity,
                title: "Real-Time Monitoring",
                description:
                  "Live DNS query stream showing what's being accessed right now. Respond to concerns in seconds.",
              },
            ].map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#dbeafe] mb-4">
                  <Icon className="h-5 w-5 text-[#2563eb]" />
                </div>
                <h3 className="text-base font-semibold text-[#1f2937] mb-2">
                  {title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#dbeafe] px-4 py-1.5 mb-5">
              <span className="text-xs font-semibold text-[#1e40af] tracking-widest uppercase">
                How It Works
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#1f2937] mb-4">
              Up and running in minutes
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              No network changes. No hardware. Install a profile on each device
              and you&apos;re protected.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {[
              {
                step: "01",
                icon: Smartphone,
                title: "Install the profile",
                description:
                  "Send a mobileconfig profile to each device. It takes 30 seconds per device and requires no IT knowledge.",
              },
              {
                step: "02",
                icon: Lock,
                title: "DNS queries route through SafeGuard",
                description:
                  "All DNS lookups pass through our filtering layer. Harmful categories are blocked before the page loads.",
              },
              {
                step: "03",
                icon: BarChart3,
                title: "Monitor and respond",
                description:
                  "View live activity, receive safeguarding alerts, and generate audit reports — all from one dashboard.",
              },
            ].map(({ step, icon: Icon, title, description }) => (
              <div key={step} className="relative text-center">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eff6ff] border-2 border-[#dbeafe] mb-5 relative">
                  <Icon className="h-7 w-7 text-[#2563eb]" />
                  <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#3730a3] text-[10px] font-bold text-white">
                    {step.slice(1)}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-[#1f2937] mb-2">
                  {title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA band ── */}
      <section className="bg-[#3730a3] py-20 md:py-24">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to protect every child in your care?
          </h2>
          <p className="text-lg text-indigo-200 mb-10">
            Join homes across the UK using SafeGuard to maintain robust online
            safeguarding.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-[#2563eb] px-8 py-3.5 text-base font-semibold text-white hover:bg-[#1d4ed8] transition-colors shadow-lg shadow-indigo-950/40"
            >
              Access the platform <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="mailto:hello@safeguard.io"
              className="inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/10 px-8 py-3.5 text-base font-semibold text-white hover:bg-white/20 transition-colors"
            >
              Contact us
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#312e81] py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                  <Shield className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-semibold text-white">
                  SafeGuard
                </span>
              </div>
              <p className="text-sm text-indigo-300/80 max-w-xs leading-relaxed">
                DNS-layer internet safety purpose-built for children&apos;s
                residential homes.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-8 text-sm">
              <div className="space-y-2">
                <div className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-3">
                  Platform
                </div>
                <a
                  href="#features"
                  className="block text-indigo-300/70 hover:text-white transition-colors"
                >
                  Features
                </a>
                <a
                  href="#how-it-works"
                  className="block text-indigo-300/70 hover:text-white transition-colors"
                >
                  How it works
                </a>
                <Link
                  href="/login"
                  className="block text-indigo-300/70 hover:text-white transition-colors"
                >
                  Sign in
                </Link>
              </div>
              <div className="space-y-2">
                <div className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-3">
                  Legal
                </div>
                <a
                  href="#"
                  className="block text-indigo-300/70 hover:text-white transition-colors"
                >
                  Privacy Policy
                </a>
                <a
                  href="#"
                  className="block text-indigo-300/70 hover:text-white transition-colors"
                >
                  Terms of Service
                </a>
                <a
                  href="mailto:hello@safeguard.io"
                  className="block text-indigo-300/70 hover:text-white transition-colors"
                >
                  Contact
                </a>
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-indigo-400/50">
              © 2026 SafeGuard. All rights reserved.
            </p>
            <p className="text-xs text-indigo-400/50">
              Built for UK Children&apos;s Residential Care
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── Product Preview Sub-components ──

function DashboardPreview() {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-sm font-bold text-[#1f2937]">Dashboard</h2>
        <p className="text-xs text-gray-400">
          Real-time overview · Meadow House
        </p>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
        <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
        <span className="text-xs text-amber-700">
          2 unknown devices detected on the network
        </span>
      </div>

      <div className="space-y-2">
        {[
          { initials: "AB", age: 14, devices: 2, online: true, blocked: 3 },
          { initials: "CK", age: 16, devices: 1, online: true, blocked: 0 },
          { initials: "MR", age: 13, devices: 1, online: false, blocked: 1 },
        ].map(({ initials, age, devices, online, blocked }) => (
          <div
            key={initials}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-full bg-[#dbeafe] flex items-center justify-center text-xs font-semibold text-[#2563eb] flex-shrink-0">
                {initials}
              </div>
              <div>
                <div className="text-xs font-semibold text-[#1f2937]">
                  {initials} · Age {age}
                </div>
                <div className="text-[10px] text-gray-400">
                  {devices} device{devices > 1 ? "s" : ""}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {blocked > 0 && (
                <span className="rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-[10px] text-red-600 font-medium">
                  {blocked} blocked
                </span>
              )}
              <div
                className={`h-1.5 w-1.5 rounded-full ${online ? "bg-green-500" : "bg-gray-300"}`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReportsPreview() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-[#1f2937]">
            Safeguarding Reports
          </h2>
          <p className="text-xs text-gray-400">Event log · Last 7 days</p>
        </div>
        <button className="rounded-md bg-[#2563eb] px-3 py-1.5 text-[10px] font-semibold text-white">
          Export
        </button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <div className="grid grid-cols-4 border-b bg-gray-50 px-3 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
          <span>Child</span>
          <span>Category</span>
          <span>Domain</span>
          <span>Time</span>
        </div>
        {[
          {
            child: "AB",
            category: "Adult Content",
            domain: "blocked.example",
            time: "2 min ago",
            color: "text-red-600",
          },
          {
            child: "AB",
            category: "Social Media",
            domain: "blocked.social",
            time: "14 min ago",
            color: "text-orange-500",
          },
          {
            child: "MR",
            category: "Adult Content",
            domain: "blocked.site",
            time: "1 hr ago",
            color: "text-red-600",
          },
          {
            child: "CK",
            category: "Gaming",
            domain: "game.site",
            time: "3 hr ago",
            color: "text-yellow-600",
          },
        ].map(({ child, category, domain, time, color }, i) => (
          <div
            key={i}
            className="grid grid-cols-4 border-b last:border-0 px-3 py-2 text-[10px] items-center"
          >
            <div className="flex items-center gap-1.5">
              <div className="h-5 w-5 rounded-full bg-[#dbeafe] flex items-center justify-center text-[9px] font-bold text-[#2563eb]">
                {child}
              </div>
            </div>
            <span className={`font-semibold ${color}`}>{category}</span>
            <span className="text-gray-400 font-mono truncate">{domain}</span>
            <span className="text-gray-400">{time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DevicesPreview() {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-sm font-bold text-[#1f2937]">Device Control</h2>
        <p className="text-xs text-gray-400">Manage per-child device access</p>
      </div>

      <div className="space-y-2">
        {[
          { name: "AB's iPhone 16", child: "AB", type: "iPhone", enabled: true },
          { name: "AB's iPad", child: "AB", type: "iPad", enabled: false },
          { name: "CK's Android", child: "CK", type: "Android", enabled: true },
          { name: "MR's Laptop", child: "MR", type: "Laptop", enabled: true },
        ].map(({ name, child, type, enabled }) => (
          <div
            key={name}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                <Smartphone className="h-4 w-4 text-gray-400" />
              </div>
              <div>
                <div className="text-xs font-semibold text-[#1f2937]">
                  {name}
                </div>
                <div className="text-[10px] text-gray-400">
                  {child} · {type}
                </div>
              </div>
            </div>
            <div
              className={`h-5 w-9 rounded-full relative transition-colors ${enabled ? "bg-[#2563eb]" : "bg-gray-200"}`}
            >
              <div
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-4" : "translate-x-0.5"}`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
