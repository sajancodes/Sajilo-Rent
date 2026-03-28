import React from 'react';

const LegalSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-6">
    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">{title}</h3>
    <div className="space-y-3 text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
      {children}
    </div>
  </div>
);

const PrivacyPolicy = () => (
  <div className="prose dark:prose-invert">
    <p className="text-sm text-gray-500 dark:text-gray-400">Last updated: {new Date().toLocaleDateString()}</p>

    <LegalSection title="1. Introduction">
      <p>Sajilo Rent ("we", "our", "us") is committed to protecting your privacy. This PrivacyPolicy explains how we collect, use, disclose, and safeguard your information when you use our platform.</p>
    </LegalSection>

    <LegalSection title="2. Information We Collect">
      <p>We may collect personal information that you provide to us directly, such as:</p>
      <ul className="list-disc pl-5">
        <li><strong>Account Information:</strong> Your name, email address, password, and profile picture when you register for an account.</li>
        <li><strong>Listing Information:</strong> Details about the room you list, including address, price, photos, and contact information.</li>
        <li><strong>Communications:</strong> Any information you provide when you contact us or communicate with other users through our platform.</li>
      </ul>
      <p>We may also collect information automatically, such as your IP address, browser type, and usage data.</p>
    </LegalSection>

    <LegalSection title="3. How We Use Your Information">
      <p>We use the information we collect to:</p>
      <ul className="list-disc pl-5">
        <li>Provide, operate, and maintain our services.</li>
        <li>Improve, personalize, and expand our services.</li>
        <li>Communicate with you, including for customer service and to send you updates.</li>
        <li>Process your transactions and prevent fraudulent activity.</li>
        <li>Enforce our Terms of Service and other policies.</li>
      </ul>
    </LegalSection>

    <LegalSection title="4. Sharing Your Information">
      <p>We do not sell your personal information. We may share your information in the following situations:</p>
      <ul className="list-disc pl-5">
        <li><strong>With Other Users:</strong> Information in your public profile and listings will be visible to other users.</li>
        <li><strong>With Service Providers:</strong> We may share information with third-party vendors who perform services for us, such as cloud hosting and payment processing.</li>
        <li><strong>For Legal Reasons:</strong> We may disclose your information if required to do so by law or in response to valid requests by public authorities.</li>
      </ul>
    </LegalSection>
    
    <LegalSection title="5. Data Security">
        <p>We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.</p>
    </LegalSection>

    <LegalSection title="6. Your Rights">
      <p>You have the right to access, update, or delete your personal information at any time through your account settings or by contacting us directly.</p>
    </LegalSection>
    
    <LegalSection title="7. Changes to This Policy">
        <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page. You are advised to review this Privacy Policy periodically for any changes.</p>
    </LegalSection>
  </div>
);

export default PrivacyPolicy;