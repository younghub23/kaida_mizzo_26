import type { Metadata } from 'next'
import { LegalDoc, type LegalSection } from '@/components/legal/legal-doc'

export const metadata: Metadata = {
  title: 'Privacy Policy — Tala',
  description: 'How Tala collects, uses, and protects your information.',
}

const DISCLAIMER =
  'This is a starting template, not legal advice. Have it reviewed by a qualified attorney and confirm the subprocessor list, contact details, and legal bases match your actual setup before relying on it.'

const INTRO = [
  'This Privacy Policy explains how Tala ("Tala", "we", "us", or "our") collects, uses, shares, and protects your information when you use our website and services (the "Service"). By using Tala, you agree to this Policy.',
]

const SECTIONS: LegalSection[] = [
  {
    heading: '1. Information we collect',
    body: [
      'We collect the following categories of information:',
      {
        list: [
          'Account information: your name or business name, email address, password (stored hashed by our auth provider), and, if you sign in with Google, basic Google profile details.',
          'Brand profile: details you provide about your business — industry, brand type, logo, tagline, description, audience demographics, brand voice, goals, and similar information.',
          'Payment information: handled by our payment processor, Stripe. We do not store full card numbers; we store limited billing details and a Stripe customer identifier.',
          'Connected accounts: when you connect a social or analytics account (for example Meta, Instagram, LinkedIn, TikTok, or Google), we store access tokens and basic account details needed to publish and read data on your behalf.',
          'Content and contacts: posts, campaigns, images, and any email contact lists you upload or create in Tala.',
          'Usage and device data: log data, IP address, browser type, and how you interact with the Service.',
        ],
      },
    ],
  },
  {
    heading: '2. How we use your information',
    body: [
      'We use your information to:',
      {
        list: [
          'provide, operate, and improve the Service;',
          'publish and schedule content to the platforms you connect;',
          'generate AI marketing content tailored to your brand;',
          'process payments and manage your subscription;',
          'communicate with you about your account, security, and updates;',
          'provide analytics and support;',
          'detect, prevent, and address fraud, abuse, and security issues; and',
          'comply with legal obligations.',
        ],
      },
    ],
  },
  {
    heading: '3. AI processing',
    body: [
      'When you use AI features, we send relevant information — such as your prompt and your brand profile — to our AI provider, Anthropic, to generate output. We send brand context to the AI only on plans where AI is available. We do not sell your data, and our AI provider does not use your inputs or outputs to train its models under our agreement. Please review and edit AI output before publishing it.',
    ],
  },
  {
    heading: '4. How we share your information',
    body: [
      'We do not sell your personal information. We share it only with service providers ("subprocessors") that help us run Tala, and only as needed to provide the Service:',
      {
        list: [
          'Supabase — database, authentication, and file storage;',
          'Cloudflare — hosting and content delivery;',
          'Stripe — payment processing and subscription billing;',
          'Anthropic — AI content generation;',
          'Resend — transactional and campaign email delivery;',
          'Social and analytics platforms you connect (Meta, Instagram, LinkedIn, TikTok, Google) — to publish content and retrieve data you authorize.',
        ],
      },
      'We may also disclose information to comply with the law, enforce our agreements, protect rights and safety, or in connection with a merger, acquisition, or sale of assets.',
    ],
  },
  {
    heading: '5. Data retention',
    body: [
      'We keep your information for as long as your account is active or as needed to provide the Service. We may retain certain information longer where required for legal, tax, accounting, or security purposes. When you delete your account, we delete or anonymize your personal information, except where retention is required by law.',
    ],
  },
  {
    heading: '6. Your rights and choices',
    body: [
      'Depending on where you live, you may have rights to access, correct, export, or delete your personal information, to object to or restrict certain processing, and to withdraw consent. Tala provides self-service tools in the Data & Privacy section of your profile to export your data and to permanently delete your account.',
      'To exercise other rights, contact us at privacy@tala.com. We will respond as required by applicable law (such as GDPR or CCPA/CPRA). You may also disconnect any linked account at any time from Linked Accounts in your profile.',
    ],
  },
  {
    heading: '7. Security',
    body: [
      'We use reasonable technical and organizational measures to protect your information, including encryption in transit and access controls. No method of transmission or storage is completely secure, so we cannot guarantee absolute security. Please keep your password confidential and use the security tools in your account.',
    ],
  },
  {
    heading: '8. Cookies',
    body: [
      'We use cookies and similar technologies that are necessary to sign you in and operate the Service, and to understand usage so we can improve it. You can control cookies through your browser settings, though some features may not work without them.',
    ],
  },
  {
    heading: '9. International data transfers',
    body: [
      'We and our subprocessors may process your information in countries other than where you live, including the United States. Where required, we use appropriate safeguards for such transfers.',
    ],
  },
  {
    heading: '10. Children’s privacy',
    body: [
      'Tala is not intended for anyone under 18, and we do not knowingly collect personal information from children. If you believe a child has provided us information, contact us and we will delete it.',
    ],
  },
  {
    heading: '11. Changes to this Policy',
    body: [
      'We may update this Policy from time to time. If we make material changes, we will provide reasonable notice (for example, by email or in the app). The "Last updated" date above shows when this Policy was last revised.',
    ],
  },
  {
    heading: '12. Contact',
    body: [
      'Questions about this Policy or your data? Contact us at privacy@tala.com.',
    ],
  },
]

export default function PrivacyPage() {
  return (
    <LegalDoc
      title="Privacy Policy"
      lastUpdated="June 22, 2026"
      disclaimer={DISCLAIMER}
      intro={INTRO}
      sections={SECTIONS}
    />
  )
}
