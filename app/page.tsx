import Link from "next/link"
import { ChefHat, QrCode, BarChart3, Users, Zap, Shield, Download, ArrowRight, Mail } from "lucide-react"

// ─── Data ─────────────────────────────────────────────────────────────────────

const features = [
  {
    icon: QrCode,
    title: "QR Code Ordering",
    description: "Customers scan, browse & order from their phone. No app download needed. Orders go straight to the kitchen.",
  },
  {
    icon: Zap,
    title: "Kitchen Display System",
    description: "Real-time order cards for your kitchen team. Accept, prepare & serve faster with live WebSocket updates.",
  },
  {
    icon: BarChart3,
    title: "Smart Analytics",
    description: "Track revenue, peak hours, top dishes & customer behaviour in real-time from your dashboard.",
  },
  {
    icon: Users,
    title: "Staff Management",
    description: "Manage roles & permissions for kitchen staff, waiters, cashiers & managers across all branches.",
  },
  {
    icon: Shield,
    title: "Multi-Tenant SaaS",
    description: "Each restaurant gets fully isolated data, menus & analytics. One platform, unlimited restaurants.",
  },
  {
    icon: ChefHat,
    title: "Instant Menu Updates",
    description: "Mark items sold out, update prices & set daily specials in seconds. Changes reflect immediately on QR menus.",
  },
]

const tiers = [
  {
    name: "Starter",
    price: "KES 3,000",
    period: "/month",
    description: "Perfect for single-location restaurants",
    features: [
      "QR code ordering",
      "Menu management",
      "Up to 20 tables",
      "Basic dashboard",
      "Email support",
    ],
    cta: "Start free trial",
    ctaSub: "14 days free, no card needed",
    highlight: false,
  },
  {
    name: "Pro",
    price: "KES 7,000",
    period: "/month",
    description: "For growing restaurants that need more",
    features: [
      "Everything in Starter",
      "Analytics dashboard",
      "WhatsApp alerts",
      "Staff management",
      "Customer database",
      "Priority support",
    ],
    cta: "Start free trial",
    ctaSub: "14 days free, no card needed",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "KES 15,000",
    period: "/month",
    description: "Multi-branch chains & franchises",
    features: [
      "Everything in Pro",
      "Multi-branch support",
      "Inventory management",
      "Advanced analytics",
      "API access",
      "Dedicated support",
    ],
    cta: "Contact Us",
    // UX FIX: Enterprise gets a contextually appropriate sub-label instead of
    // the trial copy — keeps the rhythm without making a false promise.
    ctaSub: "Custom onboarding included",
    highlight: false,
  },
]

const stats = [
  { value: "< 30s", label: "Order to kitchen time" },
  { value: "Zero", label: "Hardware required" },
  { value: "99.9%", label: "Uptime SLA" },
  { value: "5 roles", label: "Staff permission levels" },
]

// ─── Navbar ────────────────────────────────────────────────────────────────────

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-zinc-100">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center">
            <ChefHat className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-zinc-900">Mezzani</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors">Features</a>
          <a href="#how-it-works" className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors">How it works</a>
          <a href="#qr-codes" className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors">QR Codes</a>
          <a href="#pricing" className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors">Pricing</a>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-zinc-700 hover:text-zinc-900 transition-colors">
            Log in
          </Link>
          <Link
            href="/register"
            className="text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl transition-colors"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  )
}

// ─── Hero ──────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="pt-32 pb-20 px-6 bg-[#F8FAFC]">
      <div className="max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          ⭐ Multi-tenant SaaS for African restaurants
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-zinc-900 leading-tight tracking-tight">
          One platform,{" "}
          <span className="text-orange-500">every restaurant</span>
        </h1>
        <p className="mt-6 text-lg text-zinc-500 max-w-2xl mx-auto leading-relaxed">
          QR ordering, kitchen management, analytics & more — all in one platform.
          Built for everything from nyama choma joints to fine dining chains. No hardware needed.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-4 rounded-2xl transition-all shadow-lg shadow-orange-100 text-sm"
          >
            Start free trial →
          </Link>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white border border-zinc-200 hover:border-zinc-300 text-zinc-700 font-semibold px-8 py-4 rounded-2xl transition-all text-sm"
          >
            View Dashboard Demo
          </Link>
        </div>
        {/* UX IMPROVEMENT: moved trust copy directly under CTAs — reduces anxiety at the decision point */}
        <p className="mt-4 text-xs text-zinc-400">No credit card required · Setup in under 5 minutes</p>
      </div>

      {/* Dashboard preview */}
      <div className="max-w-5xl mx-auto mt-16">
        <div className="bg-white rounded-3xl border border-zinc-200 shadow-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-100 bg-zinc-50">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
            </div>
            <div className="flex-1 bg-white border border-zinc-200 rounded-lg px-3 py-1 text-xs text-zinc-400 text-center">
              app.mezzani.co.ke/dashboard
            </div>
          </div>
          <div className="flex">
            <div className="w-48 bg-gradient-to-b from-[#0f172a] to-[#111827] p-4 space-y-1 hidden md:block">
              <div className="flex items-center gap-2 mb-4 px-2">
                <div className="w-5 h-5 rounded bg-orange-500 flex items-center justify-center">
                  <ChefHat className="w-3 h-3 text-white" />
                </div>
                <span className="text-xs font-bold text-white">Mezzani</span>
              </div>
              <p className="text-xs text-zinc-500 px-2 mb-2">Mama Njeri Kitchen</p>
              {["Overview", "Orders", "Menu", "Tables", "Staff", "Analytics"].map((item, i) => (
                <div
                  key={item}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs ${
                    i === 0
                      ? "bg-orange-500/10 text-orange-400 border-l-2 border-orange-500"
                      : "text-zinc-500"
                  }`}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-current" />
                  {item}
                </div>
              ))}
            </div>
            <div className="flex-1 p-5 bg-[#F8FAFC]">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {[
                  { label: "Today's Orders", value: "63" },
                  { label: "Active Tables", value: "8" },
                  { label: "Revenue", value: "KES 47,850" },
                  { label: "Best Seller", value: "Nyama Choma" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white rounded-xl border border-zinc-200 p-3">
                    <p className="text-xs text-zinc-400">{stat.label}</p>
                    <p className="text-sm font-bold text-zinc-900 mt-0.5 truncate">{stat.value}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-white rounded-xl border border-zinc-200 p-3">
                  <p className="text-xs font-semibold text-zinc-700 mb-2">Recent Orders</p>
                  {[
                    { table: 4, status: "new", total: "KES 1,050" },
                    { table: 7, status: "preparing", total: "KES 800" },
                    { table: 12, status: "ready", total: "KES 1,550" },
                  ].map((o) => (
                    <div key={o.table} className="flex items-center justify-between py-1.5 border-b border-zinc-50 last:border-0">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-md bg-zinc-900 text-white text-xs font-bold flex items-center justify-center">
                          {o.table}
                        </div>
                        <span className="text-xs text-zinc-600">Table {o.table}</span>
                      </div>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                        o.status === "new" ? "bg-orange-100 text-orange-700" :
                        o.status === "preparing" ? "bg-yellow-100 text-yellow-700" :
                        "bg-emerald-100 text-emerald-700"
                      }`}>
                        {o.status}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-xl border border-zinc-200 p-3">
                  <p className="text-xs font-semibold text-zinc-700 mb-2">Top Dishes</p>
                  {[
                    { name: "Nyama Choma", orders: 45 },
                    { name: "Chicken Pilau", orders: 38 },
                    { name: "Beef Burger", orders: 32 },
                  ].map((d, i) => (
                    <div key={d.name} className="flex items-center gap-2 py-1.5">
                      <span className="text-xs text-zinc-400 w-3">{i + 1}</span>
                      <div className="flex-1">
                        <div className="flex justify-between mb-0.5">
                          <span className="text-xs text-zinc-700">{d.name}</span>
                          <span className="text-xs text-zinc-400">{d.orders}</span>
                        </div>
                        <div className="h-1 bg-zinc-100 rounded-full">
                          <div className="h-full bg-orange-500 rounded-full" style={{ width: `${(d.orders / 45) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Multi-tenant Trust Bar ────────────────────────────────────────────────────

function TrustBar() {
  return (
    <section className="bg-white border-y border-zinc-100 py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <p className="text-center text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-10">
          Built for scale from day one
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              badge: "Multi-Tenant",
              title: "Each restaurant is fully isolated",
              desc: "Every restaurant gets its own data silo — menus, staff, orders, analytics. No cross-tenant data leakage. Ever.",
              detail: "Owner → Branches → Tables → Menus → Staff",
            },
            {
              badge: "Multi-Branch",
              title: "Manage all your locations from one place",
              desc: "Add branches for Westlands, Kilimani, CBD — all under one account. Switch between them in the sidebar.",
              detail: "One login. All branches. Zero friction.",
            },
            {
              badge: "Multi-Role",
              title: "Right access for every team member",
              desc: "Five distinct roles with granular permissions. Kitchen staff can't touch the menu. Waiters can't close bills.",
              detail: "Owner · Manager · Waiter · Kitchen · Cashier",
            },
          ].map((item) => (
            <div key={item.badge} className="relative p-6 rounded-2xl bg-[#F8FAFC] border border-zinc-200 hover:border-orange-200 transition-colors">
              <span className="inline-block bg-orange-100 text-orange-700 text-xs font-bold px-2.5 py-1 rounded-full mb-3">
                {item.badge}
              </span>
              <h3 className="text-sm font-bold text-zinc-900 mb-2">{item.title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed mb-3">{item.desc}</p>
              <p className="text-xs font-mono text-zinc-400 bg-white border border-zinc-100 rounded-lg px-3 py-2">
                {item.detail}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Stats ─────────────────────────────────────────────────────────────────────

function Stats() {
  return (
    <section className="bg-[#0f172a] py-16 px-6">
      <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <p className="text-3xl font-bold text-orange-400">{stat.value}</p>
            <p className="text-sm text-zinc-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── Features ──────────────────────────────────────────────────────────────────

function Features() {
  return (
    <section id="features" className="py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-zinc-900">Everything your restaurant needs</h2>
          <p className="mt-3 text-zinc-500 max-w-xl mx-auto">
            One platform to run your entire restaurant operation — no matter how many locations.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.title}
                className="p-6 rounded-2xl border border-zinc-200 hover:border-orange-200 hover:shadow-md transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center mb-4 group-hover:bg-orange-100 transition-colors">
                  <Icon className="w-5 h-5 text-orange-500" />
                </div>
                <h3 className="text-sm font-bold text-zinc-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ─── QR Codes Section ──────────────────────────────────────────────────────────

function QRCodesSection() {
  return (
    <section id="qr-codes" className="py-24 px-6 bg-[#0f172a]">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left — copy */}
          <div>
            <span className="inline-block bg-orange-500/10 text-orange-400 text-xs font-bold px-3 py-1.5 rounded-full mb-4">
              📱 Included on every plan
            </span>
            <h2 className="text-3xl font-bold text-white mb-4">
              Table QR codes,<br />ready to print
            </h2>
            <p className="text-zinc-400 leading-relaxed mb-6">
              Generate unique QR codes for every table in your restaurant. Customers scan and start ordering instantly — no app, no account, no friction.
            </p>
            <ul className="space-y-3 mb-8">
              {[
                "One QR code per table — tied to your branch",
                "Codes are session-aware — expire when you close a table",
                "Download as PNG — print and laminate",
                "Regenerate anytime from your dashboard",
              ].map((point) => (
                <li key={point} className="flex items-start gap-2.5 text-sm text-zinc-300">
                  <span className="text-orange-400 font-bold shrink-0 mt-0.5">✓</span>
                  {point}
                </li>
              ))}
            </ul>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              Get your QR codes →
            </Link>
            <p className="text-xs text-zinc-500 mt-3">
              Log in to your dashboard → Tables → Start session → Show QR
            </p>
          </div>

          {/* Right — visual */}
          <div className="flex flex-col gap-4">
            {/* QR mockup */}
            <div className="bg-white rounded-2xl p-6 flex items-center gap-5">
              <div className="w-24 h-24 bg-zinc-900 rounded-xl flex items-center justify-center shrink-0">
                <QrCode className="w-14 h-14 text-white" />
              </div>
              <div>
                <p className="text-xs text-zinc-400 mb-1">Table 4 · Westlands Branch</p>
                <p className="text-sm font-bold text-zinc-900">Mama Njeri Kitchen</p>
                <p className="text-xs text-zinc-500 mt-1 font-mono">mezzani.co.ke/menu/session-id</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Active</span>
                  <span className="text-xs text-zinc-400">Expires in 90 min</span>
                </div>
              </div>
            </div>

            {/* Flow steps */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { step: "1", label: "Customer scans", icon: "📱" },
                { step: "2", label: "Browses & orders", icon: "🍽️" },
                { step: "3", label: "Kitchen gets it", icon: "🔔" },
              ].map((s) => (
                <div key={s.step} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                  <div className="text-xl mb-1">{s.icon}</div>
                  <p className="text-xs text-zinc-400">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Plans */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-xs font-semibold text-zinc-300 mb-3">QR codes included on every plan</p>
              <div className="space-y-2">
                {[
                  { plan: "Starter", tables: "Up to 20 tables", color: "text-zinc-400" },
                  { plan: "Pro", tables: "Up to 50 tables", color: "text-orange-400" },
                  { plan: "Enterprise", tables: "Unlimited tables", color: "text-emerald-400" },
                ].map((p) => (
                  <div key={p.plan} className="flex items-center justify-between">
                    <span className={`text-xs font-medium ${p.color}`}>{p.plan}</span>
                    <span className="text-xs text-zinc-500">{p.tables}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── How It Works ──────────────────────────────────────────────────────────────

function HowItWorks() {
  const steps = [
    { step: "01", title: "Register your restaurant", desc: "Sign up, add your branches and create your digital menu in minutes." },
    { step: "02", title: "Print your QR codes", desc: "Download unique QR codes for each table from your dashboard. Stick them on and you're live." },
    { step: "03", title: "Customers scan & order", desc: "Guests scan the QR, browse your menu and place orders directly from their phones." },
    { step: "04", title: "Kitchen gets notified", desc: "Orders appear instantly on the kitchen display. Staff update status in real time." },
  ]

  return (
    <section id="how-it-works" className="py-24 px-6 bg-[#F8FAFC]">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-zinc-900">Up and running in minutes</h2>
          <p className="mt-3 text-zinc-500">No hardware. No training. No IT department needed.</p>
        </div>
        <div className="space-y-0">
          {steps.map((step, i) => (
            <div key={step.step} className="flex gap-6 pb-10 relative">
              {i < steps.length - 1 && (
                <div className="absolute left-5 top-10 bottom-0 w-px bg-zinc-200" />
              )}
              <div className="w-10 h-10 rounded-full bg-orange-500 text-white text-sm font-bold flex items-center justify-center shrink-0 relative z-10">
                {i + 1}
              </div>
              <div className="pt-1.5">
                <p className="text-xs font-mono text-orange-500 mb-1">{step.step}</p>
                <h3 className="text-base font-bold text-zinc-900">{step.title}</h3>
                <p className="text-sm text-zinc-500 mt-1 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Pricing ───────────────────────────────────────────────────────────────────

function Pricing() {
  return (
    <section id="pricing" className="py-24 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-zinc-900">Simple, transparent pricing</h2>
          <p className="mt-3 text-zinc-500">Start free. Scale as you grow. No hidden fees.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-2xl border p-6 relative flex flex-col ${
                tier.highlight
                  ? "border-orange-400 shadow-lg shadow-orange-50"
                  : "border-zinc-200"
              }`}
            >
              {tier.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              <div className="mb-5">
                <p className="text-sm font-semibold text-zinc-700">{tier.name}</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-bold text-zinc-900">{tier.price}</span>
                  <span className="text-sm text-zinc-400">{tier.period}</span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">{tier.description}</p>
              </div>

              {/* UX IMPROVEMENT: flex-1 on the feature list pushes the CTA block to the
                  bottom of every card — all three CTAs sit at the same visual baseline. */}
              <ul className="space-y-2.5 mb-6 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-zinc-600">
                    <span className="text-emerald-500 font-bold shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA block — button + sub-label grouped together */}
              <div>
                <Link
                  href={tier.name === "Enterprise" ? "/contact" : "/register"}
                  className={`block w-full text-center text-sm font-semibold py-3 rounded-xl transition-all ${
                    tier.highlight
                      ? "bg-orange-500 hover:bg-orange-600 text-white shadow-sm shadow-orange-200"
                      : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                  }`}
                >
                  {tier.cta}
                </Link>
                {/* ✅ ctaSub rendered for all tiers — Enterprise shows "Custom onboarding included" */}
                {tier.ctaSub && (
                  <p className="text-xs text-zinc-400 text-center mt-2">{tier.ctaSub}</p>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-10 text-center">
          <p className="text-xs text-zinc-400">
            No setup fees · Cancel anytime · Instant activation · Works on any device
          </p>
          <p className="text-xs text-zinc-500 mt-2">
            All plans include VAT. Need a custom quote?{" "}
            <Link href="/contact" className="underline underline-offset-2 hover:text-zinc-600 transition-colors">
              Talk to us
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}

// ─── CTA ───────────────────────────────────────────────────────────────────────

function CTA() {
  return (
    <section className="py-24 px-6 bg-[#0f172a]">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-white">
          Ready to modernise your restaurant?
        </h2>
        <p className="mt-4 text-zinc-400">
          Join restaurants across Africa using Mezzani to serve faster, track better and grow smarter.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register"
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-4 rounded-2xl transition-all text-sm"
          >
            Start for free →
          </Link>
          <Link
            href="/login"
            className="bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-2xl transition-all text-sm"
          >
            Sign in
          </Link>
        </div>
        {/* UX IMPROVEMENT: repeat the no-risk message at the final conversion point */}
        <p className="mt-4 text-xs text-zinc-500">14-day free trial · No credit card required</p>
      </div>
    </section>
  )
}

// ─── Footer ────────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="bg-[#0f172a] border-t border-white/10 py-8 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-orange-500 flex items-center justify-center">
            <ChefHat className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-bold text-white">Mezzani</span>
          <span className="text-zinc-500 text-sm">— Restaurant OS for Africa</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/login" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">Login</Link>
          <Link href="/register" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">Register</Link>
          <Link href="/dashboard" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">Dashboard</Link>
          <Link href="/kitchen" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">Kitchen</Link>
          {/* UX IMPROVEMENT: contact link in footer — Enterprise users looking for sales often
              land here after scanning the whole page */}
          <Link href="/contact" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">Contact</Link>
        </div>
        <p className="text-xs text-zinc-600">© 2026 Mezzani. All rights reserved.</p>
      </div>
    </footer>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <TrustBar />
      <Stats />
      <Features />
      <QRCodesSection />
      <HowItWorks />
      <Pricing />
      <CTA />
      <Footer />
    </div>
  )
}