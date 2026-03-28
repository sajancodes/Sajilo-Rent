import React from 'react';

const LegalSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-6">
    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">{title}</h3>
    <div className="space-y-3 text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
      {children}
    </div>
  </div>
);

const TermsOfService = () => (
  <div className="prose dark:prose-invert">
    <p className="text-sm text-gray-500 dark:text-gray-400">Last updated: {new Date().toLocaleDateString()}</p>

    <LegalSection title="1. Introduction">
      <p>Welcome to Sajilo Rent ("we", "our", "us"). These Terms of Service govern your use of our website and services. By accessing or using our platform, you agree to be bound by these terms.</p>
    </LegalSection>

    <LegalSection title="2. User Accounts">
      <p>You must be at least 18 years old to create an account. You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account. You agree to provide accurate and complete information when creating your account.</p>
    </LegalSection>

    <LegalSection title="3. User Conduct and Content">
      <p>You are solely responsible for the content you post, including room listings, photos, and messages. You agree not to post content that is illegal, fraudulent, misleading, defamatory, or infringes on the rights of others.</p>
      <p>We reserve the right, but not the obligation, to review, edit, or remove any user-generated content that violates these terms without notice.</p>
    </LegalSection>

    <LegalSection title="4. Prohibited Activities">
      <p>You agree not to engage in any of the following prohibited activities:</p>
      <ul className="list-disc pl-5">
        <li>Using the service for any illegal purpose or in violation of any local, national, or international law.</li>
        <li>Harassing, threatening, or defrauding other users.</li>
        <li>Posting false or misleading information in listings.</li>
        <li>Scraping, collecting, or storing personal information about other users without their consent.</li>
      </ul>
    </LegalSection>
    
    <LegalSection title="5. Disclaimers">
        <p>Sajilo Rent is a platform that connects individuals. We do not own, manage, or inspect any of the properties listed on our site. We do not verify the identity of users or the accuracy of listings. All transactions are conducted at your own risk. We strongly advise users to perform due diligence and take necessary safety precautions before meeting or making payments.</p>
    </LegalSection>

    <LegalSection title="6. Limitation of Liability">
      <p>To the fullest extent permitted by applicable law, Sajilo Rent shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses, resulting from your use of our service.</p>
    </LegalSection>
    
    <LegalSection title="7. Changes to Terms">
        <p>We may modify these terms at any time. We will notify you of any changes by posting the new Terms of Service on this page. Your continued use of the service after any such change constitutes your acceptance of the new terms.</p>
    </LegalSection>
  </div>
);

export default TermsOfService;