import type { Metadata } from "next"
import Link from "next/link"
import { LegalLayout, Section, List } from "@/components/legal/legal-layout"

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that apply when you use Mezzani.",
}

const b = "font-semibold text-charcoal"

export default function TermsPage() {
  return (
    <LegalLayout
      title="Terms of Service"
      updated="8 October 2026"
      intro="These terms are the agreement between you and Mezzani. By creating an account or using the service you agree to them, so please read them. If you are signing up for a business, you confirm you have the authority to accept these terms on its behalf."
    >
      <Section n={1} title="The service">
        <p>
          Mezzani is a restaurant management platform operated by ELS Software Solutions (&ldquo;Mezzani&rdquo;,
          &ldquo;we&rdquo;, &ldquo;us&rdquo;). It includes QR ordering, a kitchen display, menu, table and staff
          management, sales analytics and, on eligible plans, Mezzani AI. Features depend on your plan.
        </p>
      </Section>

      <Section n={2} title="Accounts">
        <List>
          <li>You must be at least 18 and provide accurate information when you register.</li>
          <li>You are responsible for activity under your account, including the staff you add, and for keeping passwords confidential.</li>
          <li>Tell us promptly if you suspect unauthorised access.</li>
        </List>
      </Section>

      <Section n={3} title="Free trial, plans and billing">
        <List>
          <li>New accounts start with a 14-day free trial. No card is needed to start.</li>
          <li>After the trial you need a paid plan to keep using the service. Current plans and prices, in Kenyan shillings, are shown on our <Link href="/#pricing" className="font-medium text-brand-ink underline-offset-4 hover:underline">pricing section</Link>.</li>
          <li>Subscriptions are billed through our payment provider, Paystack. You authorise us to charge the plan you choose until you cancel.</li>
          <li>You can cancel at any time. Your access continues until the end of the period you have paid for.</li>
          <li>We will give you reasonable notice before changing prices. Fees already paid are not refunded unless we agree in writing or the law requires it.</li>
        </List>
      </Section>

      <Section n={4} title="Payments between you and your guests">
        <p>
          Mezzani is <strong className={b}>not a payment processor, bank or money-transfer service</strong>. We do not
          hold, process, settle or move the money your guests pay you. Your cashier records how a bill was settled (cash,
          M-Pesa or card) and confirms it in Mezzani; the payment itself happens directly between your guest and your
          business.
        </p>
        <p>
          You are responsible for collecting payments, reconciling your cash, M-Pesa and card takings, issuing any
          receipts the law requires and meeting your own tax obligations. Mezzani&apos;s records are a tool to help you
          do this, not a replacement for your own accounts.
        </p>
      </Section>

      <Section n={5} title="Your data">
        <List>
          <li>You own the information you put into Mezzani, including your menu, orders and sales data. You give us permission to host and process it so we can provide the service.</li>
          <li>You are responsible for making sure you have the right to use any personal information you enter, and for complying with the Kenya Data Protection Act, 2019 as it applies to your guests and staff.</li>
          <li>How we handle personal information is described in our <Link href="/privacy" className="font-medium text-brand-ink underline-offset-4 hover:underline">Privacy Policy</Link>.</li>
        </List>
      </Section>

      <Section n={6} title="Acceptable use">
        <p>You agree not to:</p>
        <List>
          <li>break the law or use Mezzani for anything unlawful or fraudulent,</li>
          <li>try to access other restaurants&apos; data or probe, disrupt or overload the service,</li>
          <li>reverse engineer the software or resell access without our written agreement, or</li>
          <li>upload malicious code or content that infringes other people&apos;s rights.</li>
        </List>
      </Section>

      <Section n={7} title="Mezzani AI">
        <p>
          Mezzani AI answers questions using your restaurant&apos;s data. Answers are generated automatically, can be
          incomplete or wrong, and are for information only. Check important figures against your own records before
          you rely on them for decisions about stock, staffing or money.
        </p>
      </Section>

      <Section n={8} title="Availability and changes">
        <p>
          We work to keep Mezzani reliable, but we do not promise it will be uninterrupted or error-free, and we do not
          offer a guaranteed uptime unless we agree one with you in writing. We may improve, change or retire features,
          and will try to give notice of changes that significantly affect you.
        </p>
      </Section>

      <Section n={9} title="Our property">
        <p>
          The Mezzani software, name, logo and design belong to us. These terms give you the right to use the service
          while you have an account; they do not transfer any ownership.
        </p>
      </Section>

      <Section n={10} title="Suspension and ending the agreement">
        <p>
          You can stop using Mezzani and close your account at any time. We may suspend or end your access if you
          materially breach these terms, do not pay, or use the service in a way that puts others at risk. If you need
          your data after closing, contact us and we will help you export it.
        </p>
      </Section>

      <Section n={11} title="Disclaimers and liability">
        <p>
          The service is provided &ldquo;as is&rdquo;. To the fullest extent the law allows, we are not liable for
          indirect or consequential losses, such as lost profit or lost business, and our total liability for any claim
          is limited to the fees you paid us in the 12 months before the claim arose. Nothing in these terms excludes
          liability that cannot be excluded by law.
        </p>
      </Section>

      <Section n={12} title="Governing law">
        <p>
          These terms are governed by the laws of Kenya, and the courts of Kenya have jurisdiction over any dispute,
          unless the law of your country requires otherwise.
        </p>
      </Section>

      <Section n={13} title="Changes to these terms">
        <p>
          We may update these terms. If a change is significant we will tell account owners by email or in the product
          before it takes effect. Continuing to use Mezzani after that means you accept the updated terms.
        </p>
      </Section>
    </LegalLayout>
  )
}
