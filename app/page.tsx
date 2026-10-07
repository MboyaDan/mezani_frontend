import Link from "next/link"
import { Logo } from "@/components/brand/logo"
import { ChefHat, QrCode, BarChart3, Users, Zap, Download, ArrowRight, Sparkles, Check } from "lucide-react"

// ─── Data ─────────────────────────────────────────────────────────────────────

const tiers = [
  {
    name: "Starter",
    price: "KES 3,000",
    period: "/month",
    description: "Perfect for single-location restaurants",
    features: [
      "1 branch",
      "QR code ordering",
      "Kitchen display",
      "Menu management",
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
      "Up to 3 branches",
      "Everything in Starter",
      "Sales analytics",
      "Staff management",
      "Inventory tracking",
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
    description: "Multi-branch restaurants & chains",
    features: [
      "Up to 8 branches",
      "Everything in Pro",
      "Mezzani AI assistant",
      "Advanced analytics",
      "Dedicated support",
      "Custom onboarding",
    ],
    cta: "Contact Us",
    ctaSub: "Custom onboarding included",
    highlight: false,
  },
]

// Honest, verifiable numbers only — no SLA claims we don't contractually
// offer or actively monitor.
const stats = [
  { value: "< 30s", label: "Order reaches the kitchen" },
  { value: "Zero", label: "Hardware required" },
  { value: "~5 min", label: "Typical setup time" },
  { value: "14 days", label: "Free trial" },
]

// ─── Navbar ────────────────────────────────────────────────────────────────────

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-zinc-100">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" aria-label="Mezzani home" className="flex items-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand">
          <Logo variant="horizontal" className="h-7" />
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <a href="#how-it-works" className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors">How it works</a>
          <a href="#mezzani-ai" className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors">Mezzani AI</a>
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
          🇰🇪 Now live in our first Nairobi restaurant
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-zinc-900 leading-tight tracking-tight">
          Run your restaurant{" "}
          <span className="text-orange-500">without the chaos</span>
        </h1>
        <p className="mt-6 text-lg text-zinc-500 max-w-2xl mx-auto leading-relaxed">
          Orders go from table to kitchen to service in real time. One simple system
          for QR ordering, kitchen orders, staff and sales — without expensive
          hardware or complicated setup.
        </p>
  <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
  <Link
    href="/register"
    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-4 rounded-2xl transition-all shadow-lg shadow-orange-100 text-sm"
  >
    Start your free trial →
  </Link>

  <a
    href="#how-it-works"
    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white border border-zinc-200 hover:border-zinc-300 text-zinc-700 font-semibold px-8 py-4 rounded-2xl transition-all text-sm"
  >
    See how it works
  </a>
</div>
        <p className="mt-4 text-xs text-zinc-400">
          14-day free trial · No credit card required · Works on any phone, tablet or computer
        </p>
      </div>
    </section>
  )
}

// ─── The Problem ───────────────────────────────────────────────────────────────

function Problem() {
  const pains = [
    "Orders get lost between the waiter and the kitchen",
    "Staff shouting across the restaurant to confirm an order",
    "Customers waiting, and nobody's sure whose order it is",
    "End of day, you still don't know what actually sold",
  ]

  return (
    <section className="py-20 px-6 bg-white border-y border-zinc-100">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-zinc-900">Sound familiar?</h2>
        <p className="mt-3 text-zinc-500">
          Most restaurants aren&apos;t losing money because the food is bad.
          They&apos;re losing it in the gaps between the table, the kitchen and the till.
        </p>
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
          {pains.map((pain) => (
            <div key={pain} className="flex items-start gap-3 bg-[#F8FAFC] border border-zinc-200 rounded-2xl p-4">
              <span className="text-red-400 font-bold shrink-0 mt-0.5">✕</span>
              <p className="text-sm text-zinc-600 leading-relaxed">{pain}</p>
            </div>
          ))}
        </div>
        <p className="mt-10 text-lg font-semibold text-zinc-900">
          Mezzani connects the whole restaurant — so nothing falls through.
        </p>
      </div>
    </section>
  )
}

// ─── How It Works (the workflow story) ─────────────────────────────────────────

function HowItWorks() {
  const steps = [
    {
      num: "01",
      actor: "CUSTOMER",
      title: "Scan the QR code on the table",
      desc: "No app to download. No account to create. The menu opens straight in their phone browser.",
      icon: QrCode,
    },
    {
      num: "02",
      actor: "CUSTOMER / WAITER",
      title: "Order goes into Mezzani",
      desc: "Guests order from their phone, or your waiter places it for them. Either way it lands in one place.",
      icon: ChefHat,
    },
    {
      num: "03",
      actor: "KITCHEN",
      title: "The kitchen sees it instantly",
      desc: "Orders appear on the kitchen screen the moment they're placed — no shouting, no paper tickets, nothing lost.",
      icon: Zap,
    },
    {
      num: "04",
      actor: "STAFF",
      title: "Status updates as it moves",
      desc: "Preparing → ready → served. Everyone knows where every order stands without asking.",
      icon: Users,
    },
    {
      num: "05",
      actor: "OWNER",
      title: "You see what's actually happening",
      desc: "Orders, revenue, best sellers, busiest hours — live, from your phone, wherever you are.",
      icon: BarChart3,
    },
  ]

  return (
    <section id="how-it-works" className="py-24 px-6 bg-[#F8FAFC]">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-zinc-900">From table to kitchen to dashboard</h2>
          <p className="mt-3 text-zinc-500">One connected system. No hardware. No training weekend.</p>
        </div>
        <div className="space-y-0">
          {steps.map((step, i) => {
            const Icon = step.icon
            return (
              <div key={step.num} className="flex gap-6 pb-10 relative">
                {i < steps.length - 1 && (
                  <div className="absolute left-5 top-10 bottom-0 w-px bg-zinc-200" />
                )}
                <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center shrink-0 relative z-10">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="pt-1">
                  <p className="text-xs font-bold text-orange-500 tracking-wider mb-1">
                    {step.num} — {step.actor}
                  </p>
                  <h3 className="text-base font-bold text-zinc-900">{step.title}</h3>
                  <p className="text-sm text-zinc-500 mt-1 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
// ─── Live Dashboard Preview ────────────────────────────────────────────────────

function DashboardPreview() {
  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-zinc-900">This is what you see</h2>
          <p className="mt-3 text-zinc-500 max-w-xl mx-auto">
            Not a report you run at the end of the month. What&apos;s happening in your restaurant, right now.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-zinc-200 shadow-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-100 bg-zinc-50">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
            </div>
            <div className="flex-1 bg-white border border-zinc-200 rounded-lg px-3 py-1 text-xs text-zinc-400 text-center">
              mezani.vercel.app/dashboard
            </div>
          </div>
          <div className="flex">
            <div className="w-48 bg-gradient-to-b from-[#0f172a] to-[#111827] p-4 space-y-1 hidden md:block">
              <div className="mb-4 px-2">
                <Logo variant="horizontal" tone="reversed" className="h-5" />
              </div>
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
        <p className="text-center text-xs text-zinc-400 mt-4">
          Sample data shown for illustration.
        </p>
      </div>
    </section>
  )
}

// ─── QR Codes Section ──────────────────────────────────────────────────────────

function QRCodesSection() {
  return (
    <section id="qr-codes" className="py-24 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold px-3 py-1.5 rounded-full mb-4">
              📱 Included on every plan
            </span>
            <h2 className="text-3xl font-bold text-zinc-900 mb-4">
              Turn every table into an ordering point
            </h2>
            <p className="text-zinc-500 leading-relaxed mb-6">
              No waiter needed just to take the order. The customer scans, sees your
              menu, places the order — and the kitchen has it seconds later.
              No app. No account. No waiting.
            </p>
            <ul className="space-y-3 mb-8">
              {[
                "One QR code per table — tied to your branch",
                "Codes expire when you close the table",
                "Download as PNG — print and laminate once",
                "Update your menu anytime, the QR stays the same",
              ].map((point) => (
                <li key={point} className="flex items-start gap-2.5 text-sm text-zinc-600">
                  <span className="text-orange-500 font-bold shrink-0 mt-0.5">✓</span>
                  {point}
                </li>
              ))}
            </ul>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              Get your QR codes →
            </Link>
          </div>

          <div className="flex flex-col gap-4">
            <div className="bg-[#0f172a] rounded-2xl p-6 flex items-center gap-5">
              <div className="w-24 h-24 bg-white rounded-xl flex items-center justify-center shrink-0">
                <QrCode className="w-14 h-14 text-zinc-900" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 mb-1">Table 4 · Westlands Branch</p>
                <p className="text-sm font-bold text-white">Scan to order</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-medium">Active</span>
                  <span className="text-xs text-zinc-500">Expires in 90 min</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { step: "1", label: "Customer scans", icon: "📱" },
                { step: "2", label: "Browses & orders", icon: "🍽️" },
                { step: "3", label: "Kitchen gets it", icon: "🔔" },
              ].map((s) => (
                <div key={s.step} className="bg-[#F8FAFC] border border-zinc-200 rounded-xl p-3 text-center">
                  <div className="text-xl mb-1">{s.icon}</div>
                  <p className="text-xs text-zinc-500">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Mezzani AI ────────────────────────────────────────────────────────────────

function MezzaniAI() {
  return (
    <section id="mezzani-ai" className="py-24 px-6 bg-[#0f172a]">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-2 bg-orange-500/10 text-orange-400 text-xs font-bold px-3 py-1.5 rounded-full mb-4">
              <Sparkles className="w-3 h-3" />
              Included on Enterprise
            </span>
            <h2 className="text-3xl font-bold text-white mb-4">
              Meet Mezzani AI
            </h2>
            <p className="text-zinc-400 leading-relaxed mb-6">
              Ask questions about your restaurant in plain language and get straight
              answers — without digging through reports or exporting spreadsheets.
              Mezzani AI reads your live branch data: orders, revenue, top dishes,
              busiest hours and stock levels.
            </p>
            <ul className="space-y-3 mb-8">
              {[
                "What sold best this week?",
                "When are we busiest?",
                "What am I running low on?",
                "How many orders are still in the kitchen?",
              ].map((q) => (
                <li key={q} className="flex items-start gap-2.5 text-sm text-zinc-300">
                  <span className="text-orange-400 font-bold shrink-0 mt-0.5">›</span>
                  {q}
                </li>
              ))}
            </ul>
          </div>

          {/* Chat mockup */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-white/10">
              <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-bold text-white">Mezzani AI</span>
            </div>

            <div className="flex justify-end">
              <div className="bg-orange-500 text-white text-sm rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[85%]">
                What were my best-selling dishes this week?
              </div>
            </div>

            <div className="flex justify-start">
              <div className="bg-white/10 text-zinc-200 text-sm rounded-2xl rounded-bl-sm px-4 py-2.5 max-w-[90%] leading-relaxed">
                Nyama Choma is your top seller with 45 orders (KES 22,500).
                Chicken Pilau follows with 38, then Beef Burger at 32.
                Your busiest hour is 7–8pm.
              </div>
            </div>

            <div className="flex justify-end">
              <div className="bg-orange-500 text-white text-sm rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[85%]">
                Anything running low?
              </div>
            </div>

            <div className="flex justify-start">
              <div className="bg-white/10 text-zinc-200 text-sm rounded-2xl rounded-bl-sm px-4 py-2.5 max-w-[90%] leading-relaxed">
                Yes — cooking oil is at 3 units (threshold 10) and beef is at 8kg.
                Worth restocking before the weekend.
              </div>
            </div>

            <p className="text-xs text-zinc-500 pt-2">
              Example conversation. Mezzani AI answers from your own live branch data.
            </p>
          </div>
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

// ─── Proof ─────────────────────────────────────────────────────────────────────

function Proof() {
  return (
    <section className="py-20 px-6 bg-white border-y border-zinc-100">
      <div className="max-w-3xl mx-auto text-center">
        <span className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live now
        </span>
        <h2 className="text-3xl font-bold text-zinc-900">
          Serving our first restaurant in Nairobi
        </h2>
        <p className="mt-4 text-zinc-500 leading-relaxed">
          Mezzani is built in Kenya, for Kenyan restaurants — and it&apos;s running in a
          real kitchen today, handling real orders. We&apos;re taking on a small number of
          restaurants next, and we onboard every one of them personally.
        </p>
        <p className="mt-6 text-sm text-zinc-400">
          That means you get our full attention — and real say in what we build next.
        </p>
      </div>
    </section>
  )
}

// ─── Pricing ───────────────────────────────────────────────────────────────────

function Pricing() {
  return (
    <section id="pricing" className="py-24 px-6 bg-[#F8FAFC]">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-zinc-900">Simple, transparent pricing</h2>
          <p className="mt-3 text-zinc-500">Every plan starts with a 14-day free trial. No card needed.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-2xl border p-6 relative flex flex-col bg-white ${
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

              <ul className="space-y-2.5 mb-6 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-zinc-600">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href={tier.name === "Enterprise" ? "/contact" : "/register"}
                className={`block text-center font-semibold py-3 rounded-xl transition-colors text-sm ${
                  tier.highlight
                    ? "bg-orange-500 hover:bg-orange-600 text-white"
                    : "bg-zinc-900 hover:bg-zinc-800 text-white"
                }`}
              >
                {tier.cta}
              </Link>
              <p className="text-xs text-zinc-400 text-center mt-2">{tier.ctaSub}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-zinc-500 mt-10">
          Not sure which plan fits?{" "}
          <Link href="/contact" className="text-orange-500 underline underline-offset-2 hover:text-orange-600 transition-colors">
            Talk to us
          </Link>
          {" "}— we&apos;ll help you pick.
        </p>
      </div>
    </section>
  )
}

// ─── Final CTA ─────────────────────────────────────────────────────────────────

function FinalCTA() {
  return (
    <section className="py-24 px-6 bg-[#0f172a]">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
          Try Mezzani free for 14 days
        </h2>
        <p className="mt-4 text-zinc-400 leading-relaxed">
          Set up your menu, print your QR codes and take your first order today.
          No card, no contract, no hardware to buy.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-4 rounded-2xl transition-all text-sm"
          >
            Start your free trial
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/contact"
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold px-8 py-4 rounded-2xl transition-all text-sm"
          >
            Talk to us first
          </Link>
        </div>
      </div>
    </section>
  )
}

// ─── Footer ────────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="bg-[#0f172a] border-t border-white/10 py-8 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <Logo variant="horizontal" tone="reversed" className="h-6" />
        <div className="flex items-center gap-6">
          <a href="#pricing" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">Pricing</a>
          <Link href="/contact" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">Contact</Link>
          <Link href="/login" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">Log in</Link>
        </div>
        <p className="text-xs text-zinc-600">© {new Date().getFullYear()} Mezzani · Built in Nairobi 🇰🇪</p>
      </div>
    </footer>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <main className="bg-white">
      <Navbar />
      <Hero />
      <Problem />
      <HowItWorks />
      <DashboardPreview />
      <QRCodesSection />
      <MezzaniAI />
      <Stats />
      <Proof />
      <Pricing />
      <FinalCTA />
      <Footer />
    </main>
  )
}