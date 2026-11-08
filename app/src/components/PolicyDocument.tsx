import type { ReactNode } from 'react';

interface PolicyDocumentProps {
  type: 'terms' | 'privacy';
}

const headingClass = 'text-[16px] font-semibold text-[#111827] dark:text-[#f3eddf]';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return <section className="space-y-2"><h3 className={headingClass}>{title}</h3><div className="space-y-2">{children}</div></section>;
}

export function PolicyDocument({ type }: PolicyDocumentProps) {
  const isTerms = type === 'terms';
  return (
    <div className="space-y-5 text-sm leading-7 text-[#374151] dark:text-[#e0d9c8]">
      <p className="text-xs font-medium text-slate-500 dark:text-[#bcb39d]">Last updated: November 8, 2026</p>
      {isTerms ? (
        <>
          <p>These Terms and Conditions explain the rules for accessing PRV AI, including its chat, search, image, account, and customization features. By using PRV AI, you agree to these terms. If you do not agree, do not use the service.</p>
          <Section title="1. Eligibility and accounts"><p>You must be at least 13 years old to use PRV AI. You are responsible for activity conducted through your account and for keeping your sign-in credentials secure. Provide accurate account information and notify us if you believe your account has been accessed without permission.</p></Section>
          <Section title="2. Acceptable use"><p>Do not use PRV AI to violate laws or another person’s rights, interfere with the service, attempt unauthorized access, distribute malware, abuse other users, or generate or facilitate harmful or unlawful activity. Do not evade usage limits, invite-code controls, or security checks.</p></Section>
          <Section title="3. AI output and important decisions"><p>AI-generated responses, search summaries, and images can be inaccurate, incomplete, outdated, biased, or unsuitable for your situation. Review outputs before relying on or sharing them. PRV AI is not a substitute for professional medical, legal, financial, safety, or other high-stakes advice.</p></Section>
          <Section title="4. Your content and generated content"><p>You retain rights you already hold in the content you submit. Subject to applicable law and third-party rights, you may use the outputs you receive. Outputs may not be unique, and other users may receive similar results. You are responsible for ensuring that your inputs and use of outputs are lawful and do not infringe others’ rights.</p></Section>
          <Section title="5. Service availability and access"><p>PRV AI is provided on an “as available” basis. Features, access, usage allowances, invite requirements, and availability may change. Paid tiers are currently accessed through valid invite codes; an invite does not guarantee that every feature will remain available indefinitely.</p></Section>
          <Section title="6. Storage and deletion"><p>Signed-in text chat history is associated with your account and can be deleted from the interface. Guest and incognito conversations are not saved as account chat history. Deletion may not immediately remove copies held temporarily in backups, security logs, or systems operated by service providers.</p></Section>
          <Section title="7. Suspension and termination"><p>We may restrict or suspend access when needed to protect users, investigate suspected abuse, comply with law, or address a material breach of these terms. You may stop using PRV AI at any time. Contact us to request account assistance.</p></Section>
          <Section title="8. Disclaimers and liability"><p>To the extent permitted by applicable law, PRV AI is provided without guarantees that it will be uninterrupted, error-free, secure, or suitable for a particular purpose. Nothing in these terms excludes rights or liabilities that cannot lawfully be excluded. To the extent permitted by law, we are not responsible for indirect or consequential losses arising from use of the service.</p></Section>
          <Section title="9. Governing law and updates"><p>These terms are intended to be interpreted consistently with applicable laws, including the laws of Nepal where applicable. We may revise them as the service or legal requirements change. Continued use after a revised version takes effect means you accept the updated terms, unless applicable law requires another process.</p></Section>
          <Section title="10. Contact"><p>Questions about these terms can be sent to <strong>yourprvdeveloper@proton.me</strong>.</p></Section>
        </>
      ) : (
        <>
          <p>This Privacy Policy describes the information PRV AI processes, why it is processed, and the choices available to you. PRV AI does not sell personal information or use conversation content to serve targeted advertisements.</p>
          <Section title="1. Information we process"><ul className="list-disc space-y-1 pl-5"><li><strong>Account data:</strong> email address and authentication identifiers when you sign in.</li><li><strong>Prompts and content:</strong> messages, conversation context, attachments, image prompts, and search queries you submit. These are sent to automated service providers when needed to answer your request.</li><li><strong>Account activity:</strong> saved text chat history, published Custom PRVs, tier entitlement, invite redemption, and usage counters needed to enforce daily and lifetime allowances.</li><li><strong>Technical and security data:</strong> request metadata, approximate network identifiers, and security challenge information used to prevent abuse, rate-limit requests, and maintain the service.</li></ul></Section>
          <Section title="2. How information is used"><p>We use this information to authenticate accounts, provide responses and other features, save requested chat history, enforce usage limits, prevent abuse, troubleshoot errors, and operate and improve PRV AI. We do not intentionally ask you to provide sensitive personal information. Avoid submitting passwords, payment card details, government identifiers, or confidential information.</p></Section>
          <Section title="3. Automated processing and service providers"><p>Prompts, attachments, search queries, and image requests may be processed by third-party AI, search, security, hosting, authentication, and database providers that support PRV AI. Those providers process information to deliver or secure the requested service under their own terms and policies. PRV AI does not routinely have staff read individual conversations.</p></Section>
          <Section title="4. Storage and retention"><p>Signed-in text chat history is stored with your account until you delete it or the account is removed. Guest and incognito chat history is not saved to your account. Usage counters and security records may be retained as needed to enforce allowances, protect the service, troubleshoot issues, and meet legal obligations. We do not promise a fixed deletion period for operational records.</p><p>Attachments and generated image data may be processed to fulfill a request. They are not included in the signed-in text chat history saved by PRV AI’s chat-history feature.</p></Section>
          <Section title="5. Security"><p>We use access controls and transport security intended to protect information. No internet transmission or storage system can be guaranteed completely secure. You are responsible for protecting your account and choosing what information to submit.</p></Section>
          <Section title="6. Your choices and requests"><p>You can delete saved chats from the interface and stop using PRV AI at any time. For account, access, correction, or deletion requests, contact <strong>yourprvdeveloper@proton.me</strong>. We may need to verify your identity and may retain limited information where required for security, legal, or operational reasons.</p></Section>
          <Section title="7. Cookies and local storage"><p>PRV AI uses browser storage for authentication sessions, preferences, and core functionality. Your browser controls can clear local storage, but doing so may sign you out or reset preferences.</p></Section>
          <Section title="8. Children"><p>PRV AI is intended for people aged 13 or older. We do not knowingly collect personal information from children under 13. If you believe a child has provided information, contact us so we can review the request.</p></Section>
          <Section title="9. Policy changes"><p>We may update this policy as the service or applicable requirements change. We will update the date above and may display an in-product notice for material changes.</p></Section>
          <Section title="10. Contact"><p>For privacy questions or requests, contact <strong>yourprvdeveloper@proton.me</strong>.</p></Section>
        </>
      )}
    </div>
  );
}
