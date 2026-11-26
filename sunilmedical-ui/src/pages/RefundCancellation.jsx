import StaticPageLayout, { Section } from "../components/StaticPageLayout";

export default function RefundCancellation() {
  return <StaticPageLayout eyebrow="Orders, returns and refunds" title="Refund & Cancellation Policy"
    intro="Our policy explains when an order may be cancelled, when a return can be requested and how approved refunds are processed.">
    <div className="mb-6 grid gap-3 sm:grid-cols-3">
      <div className="rounded-xl bg-blue-50 p-4"><p className="text-xs font-semibold uppercase text-blue-700">Cancellation</p><p className="mt-1 font-bold text-slate-900">Before processing</p></div>
      <div className="rounded-xl bg-cyan-50 p-4"><p className="text-xs font-semibold uppercase text-cyan-700">Return window</p><p className="mt-1 font-bold text-slate-900">7 days from delivery</p></div>
      <div className="rounded-xl bg-emerald-50 p-4"><p className="text-xs font-semibold uppercase text-emerald-700">Refund timeline</p><p className="mt-1 font-bold text-slate-900">5–7 business days*</p></div>
    </div>
    <p className="mb-6 text-xs leading-5 text-slate-500">*For approved refunds, after the applicable approval, receipt or inspection step. Actual credit time may also depend on the payment provider or bank.</p>
    <Section title="1. Order cancellation">
      <p>You may request cancellation before order processing begins. Once processing, packing, dispatch or handover to a logistics partner has started, cancellation may no longer be possible. Contact customer support as soon as possible with your order number and cancellation request.</p>
      <p>Cancellation requests are not confirmed until you receive an acknowledgement from us. If an order cannot be cancelled, you may be able to raise a return request after delivery, subject to the eligibility rules below.</p>
    </Section>
    <Section title="2. Return request window">
      <p>Eligible products may be considered for return within 7 days from the date of delivery. Contact us within this period and provide your order number, reason for return and clear photographs or supporting information where relevant. Submitting a request does not automatically mean that the return is approved.</p>
    </Section>
    <Section title="3. Eligible return reasons">
      <ul className="list-disc space-y-2 pl-5"><li>Product received damaged or defective.</li><li>Wrong product or incorrect quantity received.</li><li>Product materially different from the listing description, subject to verification.</li><li>Any other return ground required under applicable law.</li></ul>
    </Section>
    <Section title="4. Product condition and non-returnable items">
      <p>For health, hygiene and safety reasons, opened, used, installed, tampered, sterile or sealed medical products may not be eligible for return unless they are defective, damaged, incorrect or a return is otherwise required by law. Products specifically marked non-returnable at the time of purchase may be excluded to the extent permitted by law. This policy does not restrict statutory consumer rights.</p>
      <p>Where a return is accepted, the product should generally be kept in its original packaging with accessories, labels, manuals and invoice, unless the product defect or damage prevents this.</p>
    </Section>
    <Section title="5. How to request a return or cancellation">
      <ol className="list-decimal space-y-2 pl-5"><li>Email <a className="font-semibold text-blue-700" href="mailto:aasraj2026@gmail.com">aasraj2026@gmail.com</a>.</li><li>Include your order number, registered phone/email and request type.</li><li>Describe the issue and attach photos or other supporting details, if applicable.</li><li>Wait for return instructions and approval before sending any product back.</li></ol>
    </Section>
    <Section title="6. Inspection and approval">
      <p>Returned products may be inspected by the Company or the relevant Seller. We may request additional information to assess the issue. If a request is rejected, we will communicate the reason, subject to applicable law. Do not ship products to an address unless return instructions have been provided.</p>
    </Section>
    <Section title="7. Refund processing">
      <p>Approved refunds are generally initiated within 5–7 business days after approval and completion of any required return receipt or inspection. Refunds are normally made to the original payment method where supported. The time taken for the amount to appear in your account may depend on your bank, card issuer, UPI provider or payment gateway.</p>
    </Section>
    <Section title="8. Shipping charges">
      <p>Where a return is due to a verified damaged, defective, incorrect or otherwise qualifying product issue, return-shipping arrangements will be communicated by support in accordance with applicable law. For other approved returns, any applicable shipping or handling deductions will be disclosed before the return is completed and will be subject to applicable law.</p>
    </Section>
    <Section title="9. Partial orders and marketplace sellers">
      <p>Orders containing products from multiple Sellers may be delivered in separate shipments. A cancellation, return or refund may apply to an individual product or shipment rather than the entire order. The relevant Seller may participate in verification and fulfilment, while customer requests can be raised through our support email.</p>
    </Section>
    <Section title="10. Order cancelled by us or the Seller">
      <p>If an order is cancelled by us or a Seller after payment has been collected, the amount paid for the cancelled item will be refunded in accordance with applicable law and payment-provider processes.</p>
    </Section>
    <Section title="11. Contact us">
      <p>For cancellation, return or refund assistance, email <a className="font-semibold text-blue-700" href="mailto:aasraj2026@gmail.com">aasraj2026@gmail.com</a>. Please mention “Cancellation”, “Return” or “Refund” and your order number in the subject line.</p>
    </Section>
  </StaticPageLayout>;
}
