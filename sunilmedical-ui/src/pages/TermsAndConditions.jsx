import StaticPageLayout, { Section } from "../components/StaticPageLayout";

export default function TermsAndConditions() {
  return <StaticPageLayout eyebrow="Legal information" title="Terms & Conditions"
    intro="These terms govern your access to and use of TheMakeInIndia.in. Please read them before using the website or placing an order.">
    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">Please have these terms reviewed by your legal adviser before publication. Complete the company registration, grievance officer and other statutory details where applicable.</div>
    <Section title="1. About the platform">
      <p>TheMakeInIndia.in is operated by JEDE MEDTECH INDIA PRIVATE LIMITED (“Company”, “we”, “us” or “our”). The website provides an online marketplace for discovering and purchasing medical equipment, healthcare products, consumables and disposables. Products may be offered by the Company or independent third-party sellers (“Sellers”).</p>
    </Section>
    <Section title="2. Acceptance and eligibility">
      <p>By accessing or using the website, creating an account or placing an order, you agree to these Terms & Conditions and the policies published on the website. If you do not agree, please do not use the website. You must be legally capable of entering into a binding contract under applicable law.</p>
    </Section>
    <Section title="3. Account registration and security">
      <ul className="list-disc space-y-2 pl-5"><li>Provide accurate, complete and current registration and delivery information.</li><li>Keep your login credentials confidential and notify us promptly of suspected unauthorised account use.</li><li>You are responsible for activity carried out through your account, subject to applicable law.</li><li>We may restrict or suspend accounts where we reasonably suspect fraud, misuse, unlawful activity or a breach of these terms.</li></ul>
    </Section>
    <Section title="4. Product information and availability">
      <p>We and participating Sellers endeavour to display accurate product descriptions, images, specifications, prices and availability. Product images are illustrative where stated. Availability, packaging, specifications and delivery estimates may change. If a material listing error or stock issue affects an order, we may contact you to correct, cancel or refund the affected order in accordance with applicable law.</p>
    </Section>
    <Section title="5. Prices, taxes and payments">
      <p>Prices and applicable taxes or charges will be displayed during checkout, where applicable. Orders are subject to successful payment authorisation or confirmation of the selected payment method. Payments may be processed by third-party payment service providers and are subject to their applicable terms. Do not share your card, UPI, banking or authentication credentials with anyone.</p>
    </Section>
    <Section title="6. Orders and acceptance">
      <p>Submitting an order is an offer to purchase the selected products. An order acknowledgement does not necessarily mean that the order has been accepted or dispatched. Order acceptance, processing and fulfilment are subject to stock availability, payment confirmation, verification and applicable Seller arrangements. We may cancel an order where permitted by law, including for stock unavailability, pricing or listing errors, suspected fraud or operational constraints. Any amount collected for a cancelled order will be handled under the Refund & Cancellation Policy.</p>
    </Section>
    <Section title="7. Marketplace sellers">
      <p>Where a product is listed by an independent Seller, that Seller may be responsible for product accuracy, stock, packaging, dispatch, applicable licences, warranties and fulfilment obligations as disclosed for the listing or order. The Company may facilitate marketplace transactions and customer support. Seller participation does not remove any rights or remedies available to consumers under applicable law.</p>
    </Section>
    <Section title="8. Shipping and delivery">
      <p>We currently intend to facilitate deliveries across India, subject to serviceability, product restrictions, Seller availability and courier coverage. Delivery dates are estimates unless expressly confirmed otherwise. Customers must provide a complete and accurate delivery address and be available to receive the shipment.</p>
    </Section>
    <Section title="9. Cancellation, returns and refunds">
      <p>Order cancellation requests may be made before order processing begins. Return requests are generally accepted within 7 days of delivery, subject to product eligibility, condition, hygiene and safety restrictions, and verification. Refunds for approved cases are generally processed within 5–7 business days after approval or receipt and inspection, as applicable. The detailed Refund & Cancellation Policy forms part of these terms.</p>
    </Section>
    <Section title="10. Acceptable use">
      <p>You must not misuse the website, interfere with its security or operation, submit false information, infringe intellectual property, upload malicious code, attempt unauthorised access, or use the platform for unlawful or fraudulent activity.</p>
    </Section>
    <Section title="11. Intellectual property">
      <p>Website content, branding, logos, design, text, graphics and software are owned by or licensed to the Company or relevant rights holders. You may use the website for personal or legitimate business purchasing purposes, but may not copy, reproduce, distribute or commercially exploit protected content without prior written permission, except as permitted by law.</p>
    </Section>
    <Section title="12. Third-party services and links">
      <p>The website may rely on payment gateways, logistics providers, communication services and other third parties. Their services may be governed by separate terms and privacy policies. We are not responsible for independent third-party websites or services beyond responsibilities imposed on us by applicable law.</p>
    </Section>
    <Section title="13. Disclaimer and limitation">
      <p>The website is provided subject to availability. To the extent permitted by law, we do not warrant uninterrupted or error-free access. Nothing in these terms excludes or limits liability, consumer rights or remedies that cannot lawfully be excluded or limited. Any limitation of liability is subject to applicable law.</p>
    </Section>
    <Section title="14. Privacy">
      <p>Use of personal information is described in our Privacy Policy. By using the website, you acknowledge that you have had an opportunity to read that policy.</p>
    </Section>
    <Section title="15. Changes to these terms">
      <p>We may update these terms from time to time. Updated terms will be published on this page with a revised “Last updated” date. Changes will apply prospectively, subject to applicable law.</p>
    </Section>
    <Section title="16. Governing law and jurisdiction">
      <p>These terms are governed by the laws of India. Subject to mandatory consumer protection laws and the jurisdiction of competent authorities, disputes shall be submitted to the competent courts having jurisdiction in Visakhapatnam, Andhra Pradesh.</p>
    </Section>
    <Section title="17. Contact">
      <p>For questions about these terms, contact JEDE MEDTECH INDIA PRIVATE LIMITED at <a className="font-semibold text-blue-700" href="mailto:aasraj2026@gmail.com">aasraj2026@gmail.com</a> or write to the address shown on our Contact Us page.</p>
    </Section>
  </StaticPageLayout>;
}
