import type { Metadata } from "next"
import Link from "next/link"
import { LegalLayout, Section, List } from "@/components/legal/legal-layout"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Mezzani collects, uses and protects information.",
}

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      updated="8 October 2026"
      intro="This policy explains what information Mezzani collects, why we collect it, who we share it with and the choices you have. We have tried to write it in plain language."
    >
      <Section n={1} title="Who we are">
        <p>
          Mezzani is a restaurant management and QR ordering platform operated by ELS Software Solutions
          (&ldquo;Mezzani&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;), based in Kenya. You can reach us through our{" "}
          <Link href="/contact" className="font-medium text-brand-ink underline-offset-4 hover:underline">contact page</Link>.
        </p>
      </Section>

      <Section n={2} title="Our role: controller and processor">
        <p>
          For information about restaurant owners and their staff (accounts, sign-in, billing), we decide how the
          information is used, so we are the <strong className="font-semibold text-charcoal">data controller</strong>.
        </p>
        <p>
          For information about a restaurant&apos;s guests and orders that is entered through that restaurant&apos;s
          QR menu or by its staff, the restaurant decides how it is used and we process it on the restaurant&apos;s
          behalf. In that case the restaurant is the controller and we are the{" "}
          <strong className="font-semibold text-charcoal">data processor</strong>.
        </p>
      </Section>

      <Section n={3} title="Information we collect">
        <List>
          <li><strong className="font-semibold text-charcoal">Account details:</strong> restaurant name, your email address and a password. Passwords are stored in hashed form, not as plain text.</li>
          <li><strong className="font-semibold text-charcoal">Staff accounts:</strong> the name, email address and role (for example waiter, kitchen or cashier) of people you add.</li>
          <li><strong className="font-semibold text-charcoal">Restaurant data:</strong> branches, tables, menu items, stock levels, orders, order status and sales figures.</li>
          <li><strong className="font-semibold text-charcoal">Payment records:</strong> for each bill, the method used (cash, M-Pesa or card), the amount, the status and any M-Pesa receipt reference your cashier records. We never see or store card numbers or M-Pesa PINs.</li>
          <li><strong className="font-semibold text-charcoal">Guest ordering:</strong> what a guest orders and which table it is for. Guests do not need to create an account or install an app.</li>
          <li><strong className="font-semibold text-charcoal">Mezzani AI:</strong> the questions you type and the branch data needed to answer them.</li>
          <li><strong className="font-semibold text-charcoal">Technical data:</strong> IP address, browser and device type and basic usage logs, which we use to keep the service secure and working.</li>
          <li><strong className="font-semibold text-charcoal">Messages:</strong> anything you send us through the contact form or by email.</li>
        </List>
      </Section>

      <Section n={4} title="How we use information">
        <List>
          <li>To provide, maintain and secure Mezzani, including showing orders to your kitchen in real time.</li>
          <li>To create and manage your account, your free trial and your subscription.</li>
          <li>To send service messages such as password resets and billing notices.</li>
          <li>To answer support requests and to fix problems.</li>
          <li>To understand how the product is used so we can improve it.</li>
          <li>To meet our legal obligations and to prevent fraud and abuse.</li>
        </List>
        <p>We do not sell personal information, and we do not show third-party advertising.</p>
      </Section>

      <Section n={5} title="Payments">
        <p>
          Mezzani does not hold, process or move the money your guests pay for their meals. Your cashier records how a
          bill was settled; the money itself goes directly between your guest and your business.
        </p>
        <p>
          Your Mezzani subscription fee is collected by our payment provider, Paystack. We receive confirmation that a
          payment succeeded, but not your full card details.
        </p>
      </Section>

      <Section n={6} title="Who we share information with">
        <p>
          We use trusted service providers to run Mezzani. They may only use information to provide their service to us:
        </p>
        <List>
          <li>Hosting and infrastructure (Vercel) and database hosting (Supabase)</li>
          <li>Transactional email (Resend)</li>
          <li>Subscription billing (Paystack)</li>
          <li>AI responses for Mezzani AI (Groq)</li>
        </List>
        <p>
          We may also disclose information if the law requires it, or to protect the rights, safety and security of our
          users and of Mezzani. If Mezzani is ever involved in a merger or sale, we will make sure your information
          stays protected and tell you about any change.
        </p>
      </Section>

      <Section n={7} title="Where information is processed">
        <p>
          Some of our providers process information on servers outside Kenya. When this happens we take steps to make
          sure the information remains protected in line with the Kenya Data Protection Act, 2019.
        </p>
      </Section>

      <Section n={8} title="How long we keep information">
        <p>
          We keep account and restaurant data for as long as your account is active. When an account is closed we delete
          or anonymise its data within a reasonable time, except where we must keep records for legal, tax or security
          reasons.
        </p>
      </Section>

      <Section n={9} title="Security">
        <p>
          Data is encrypted in transit using HTTPS. Each restaurant&apos;s data is kept separate from every other
          restaurant&apos;s, and access is limited by role. No system is perfectly secure, so please use a strong,
          unique password and tell us straight away if you think your account has been accessed without permission.
        </p>
      </Section>

      <Section n={10} title="Cookies and similar technologies">
        <p>
          We use essential cookies and similar browser storage to keep you signed in and to make the service work. We do
          not use advertising cookies.
        </p>
      </Section>

      <Section n={11} title="Your rights">
        <p>Under the Kenya Data Protection Act, 2019 you can ask us to:</p>
        <List>
          <li>tell you what personal data we hold about you and give you a copy,</li>
          <li>correct information that is wrong or out of date,</li>
          <li>delete your information, where we have no legal reason to keep it,</li>
          <li>stop or limit how we use your information, and</li>
          <li>give you your data in a commonly used format.</li>
        </List>
        <p>
          If you are a guest of a restaurant, please contact that restaurant first, as it controls your order
          information. We will help the restaurant respond. You also have the right to complain to the Office of the
          Data Protection Commissioner of Kenya.
        </p>
      </Section>

      <Section n={12} title="Children">
        <p>Mezzani is built for businesses and is not directed at anyone under 18.</p>
      </Section>

      <Section n={13} title="Changes to this policy">
        <p>
          We may update this policy as Mezzani changes. When we make a significant change we will update the date at the
          top and notify account owners by email or in the product.
        </p>
      </Section>
    </LegalLayout>
  )
}
