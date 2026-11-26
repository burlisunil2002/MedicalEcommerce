import StaticPageLayout, { Section } from "../components/StaticPageLayout";

export default function PrivacyPolicy() {
  return <StaticPageLayout eyebrow="Your information matters" title="Privacy Policy"
    intro="This policy explains how JEDE MEDTECH INDIA PRIVATE LIMITED handles information when you use TheMakeInIndia.in.">
    <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-900">This is a draft policy based on the website details shared so far. Confirm your actual analytics, advertising, hosting, payment, email and logistics providers before publishing.</div>
    <Section title="1. Who we are">
      <p>TheMakeInIndia.in is operated by JEDE MEDTECH INDIA PRIVATE LIMITED (“Company”, “we”, “us” or “our”). For privacy questions, contact <a className="font-semibold text-blue-700" href="mailto:aasraj2026@gmail.com">aasraj2026@gmail.com</a>.</p>
    </Section>
    <Section title="2. Information we may collect">
      <ul className="list-disc space-y-2 pl-5"><li>Identity and contact details such as name, email address, phone number and billing or delivery address.</li><li>Account details and information you submit through registration, profile, KYC or seller onboarding forms.</li><li>Order details, products purchased, transaction references, delivery and customer-support history.</li><li>Device, browser, IP address, log and usage information, subject to the tools and settings used on the website.</li><li>Messages, reviews, feedback and other information you choose to provide.</li></ul>
    </Section>
    <Section title="3. How we use information">
      <p>We may use information to create and manage accounts, process orders and payments, coordinate deliveries, provide customer support, manage seller relationships, prevent fraud, maintain website security, improve services, meet legal obligations and send service-related communications. Marketing communications will be handled in accordance with applicable consent and opt-out requirements.</p>
    </Section>
    <Section title="4. Payments">
      <p>Payments may be handled by third-party payment gateways. We may receive transaction status, payment reference and limited payment-related information needed to reconcile orders. We do not intend to store full card numbers, CVV values, UPI PINs or banking passwords on our website servers.</p>
    </Section>
    <Section title="5. When information may be shared">
      <p>Information may be shared, as necessary and subject to appropriate safeguards, with participating Sellers for order fulfilment, payment processors, courier and logistics partners, hosting and technology providers, customer-support providers, professional advisers, regulators or law-enforcement authorities where legally required. We do not state that these parties may use information for unrelated purposes.</p>
    </Section>
    <Section title="6. Cookies and similar technologies">
      <p>The website may use cookies or similar technologies for essential functions such as login sessions, cart continuity, preferences, security and analytics. You can control cookies through your browser settings. Disabling certain cookies may affect website functionality. Add details of any analytics or advertising tools actually enabled before publication.</p>
    </Section>
    <Section title="7. Data retention">
      <p>We retain personal information for as long as reasonably necessary for the purposes described in this policy, including order fulfilment, account administration, dispute handling, security, accounting and legal compliance. Retention periods may vary depending on the type of information and applicable law.</p>
    </Section>
    <Section title="8. Data security">
      <p>We use reasonable technical and organisational measures intended to protect information against unauthorised access, loss, misuse or alteration. No internet transmission or storage system can be guaranteed completely secure. Please protect your account credentials and contact us if you suspect unauthorised activity.</p>
    </Section>
    <Section title="9. Your choices and rights">
      <p>Subject to applicable law, you may request access to, correction or updating of personal information, withdraw consent where processing is based on consent, or raise a grievance. We may need to verify your identity before acting on a request and may retain certain records where legally required.</p>
    </Section>
    <Section title="10. Children">
      <p>The website is not intended to be used by children in a manner prohibited by applicable law. If you believe a child has provided personal information inappropriately, contact us so that we can review the matter.</p>
    </Section>
    <Section title="11. Third-party websites">
      <p>Links to third-party websites or services are provided for convenience. Their privacy practices are governed by their own policies. Please review those policies before sharing information with them.</p>
    </Section>
    <Section title="12. Changes to this policy">
      <p>We may revise this policy to reflect changes in our practices, technology or legal requirements. The updated version will be posted on this page with a revised date.</p>
    </Section>
    <Section title="13. Contact and grievances">
      <p>For privacy requests or grievances, email <a className="font-semibold text-blue-700" href="mailto:aasraj2026@gmail.com">aasraj2026@gmail.com</a> with the subject “Privacy Request”. Add the designated Grievance Officer’s name, contact details and response timeline here if required under the laws applicable to your business.</p>
    </Section>
  </StaticPageLayout>;
}
