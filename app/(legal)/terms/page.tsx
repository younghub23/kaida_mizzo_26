import type { Metadata } from 'next'
import { LegalDoc, type LegalSection } from '@/components/legal/legal-doc'

export const metadata: Metadata = {
  title: 'Terms of Service — Tala',
  description: 'The terms that govern your use of Tala.',
}

const DISCLAIMER =
  'This is a starting template, not legal advice. Have it reviewed by a qualified attorney and replace the placeholders (company name, contact email, governing law) before relying on it.'

const INTRO = [
  'These Terms of Service ("Terms") are a binding agreement between you and Tala ("Tala", "we", "us", or "our") and govern your access to and use of the Tala website, applications, and services (together, the "Service"). By creating an account or using the Service, you agree to these Terms. If you do not agree, do not use the Service.',
]

const SECTIONS: LegalSection[] = [
  {
    heading: '1. The Service',
    body: [
      'Tala is a marketing platform for small businesses and creators. It provides tools to schedule and publish social media posts, build and send email campaigns, generate marketing content with AI, and view analytics. Features available to you depend on your subscription plan.',
      'We may add, change, or remove features at any time. We may also set limits (for example, on connected channels, email contacts, or AI usage) based on your plan.',
    ],
  },
  {
    heading: '2. Eligibility and accounts',
    body: [
      'You must be at least 18 years old and able to form a binding contract to use the Service. If you use Tala on behalf of a business, you represent that you are authorized to bind that business to these Terms.',
      'You are responsible for your account, for keeping your login credentials secure, and for all activity under your account. Notify us immediately of any unauthorized use. The information you provide must be accurate and kept up to date.',
    ],
  },
  {
    heading: '3. Subscriptions, billing, and trials',
    body: [
      'Tala offers paid subscription plans (currently Starter, Growth, Pro, and Agency). Paid plans are billed in advance on a recurring basis through our payment processor, Stripe. By subscribing, you authorize us and Stripe to charge your payment method on each renewal until you cancel.',
      'New subscriptions may include a free trial (currently 7 days). If you do not cancel before the trial ends, your subscription converts to a paid plan and your payment method is charged.',
      'Subscriptions renew automatically for the same period unless you cancel before the renewal date. You can cancel or change your plan at any time from the Wallet & Subscriptions section of your profile or through the Stripe customer portal. Plan changes are prorated by Stripe where applicable.',
      'Except where required by law, payments are non-refundable and there are no refunds or credits for partial periods. We may change our prices; we will give reasonable notice, and changes take effect on your next billing cycle.',
      'If a payment fails, we may suspend or downgrade your access until the amount is paid.',
    ],
  },
  {
    heading: '4. Acceptable use',
    body: [
      'You agree not to use the Service to:',
      {
        list: [
          'send spam or any messages that violate anti-spam laws such as CAN-SPAM, CASL, or GDPR (you must have lawful consent to email the contacts you upload);',
          'post or distribute unlawful, infringing, deceptive, harassing, or harmful content;',
          'violate the terms or policies of any connected third-party platform (for example, Meta, Instagram, LinkedIn, TikTok, or Google);',
          'attempt to gain unauthorized access to the Service, other accounts, or our systems, or interfere with or disrupt the Service;',
          'reverse engineer, scrape, or resell the Service except as expressly permitted;',
          'use the Service to build a competing product.',
        ],
      },
      'You are solely responsible for the content you create, schedule, publish, or send, and for ensuring you have the rights and permissions to do so.',
    ],
  },
  {
    heading: '5. Your content',
    body: [
      'You retain ownership of the content, brand information, images, and contact lists you provide ("Your Content"). You grant Tala a worldwide, non-exclusive license to host, process, transmit, display, and otherwise use Your Content solely to operate and provide the Service to you, including publishing to the platforms you connect.',
      'You represent that you have all rights and consents necessary for Your Content and for contacting any individuals whose information you upload.',
    ],
  },
  {
    heading: '6. AI-generated content',
    body: [
      'Tala uses AI (provided by Anthropic’s Claude models) to help generate marketing content. AI output may be inaccurate, incomplete, or not unique to you. You are responsible for reviewing, editing, and approving any AI-generated content before you publish or send it. Tala makes no warranty that AI output is accurate, non-infringing, or fit for any purpose.',
    ],
  },
  {
    heading: '7. Third-party services and integrations',
    body: [
      'The Service integrates with third parties such as social platforms, Stripe, email delivery providers, and analytics providers. Your use of those integrations is also subject to the third party’s own terms and privacy practices, and we are not responsible for third-party services. If a third party changes or restricts its services, some Tala features may stop working.',
    ],
  },
  {
    heading: '8. Intellectual property',
    body: [
      'The Service, including its software, design, and trademarks, is owned by Tala and its licensors and is protected by intellectual property laws. Except for the rights expressly granted to you, we reserve all rights in the Service. You may not use our name or logo without our prior written permission.',
    ],
  },
  {
    heading: '9. Termination',
    body: [
      'You may stop using the Service and delete your account at any time from the Data & Privacy section of your profile. We may suspend or terminate your access if you violate these Terms, if required by law, or to protect the Service or other users.',
      'Upon termination, your right to use the Service ends. Sections that by their nature should survive termination (such as content licenses you granted for already-published posts, disclaimers, limitations of liability, and indemnification) will survive.',
    ],
  },
  {
    heading: '10. Disclaimers',
    body: [
      'The Service is provided "as is" and "as available" without warranties of any kind, whether express or implied, including warranties of merchantability, fitness for a particular purpose, and non-infringement. We do not warrant that the Service will be uninterrupted, error-free, or secure, or that it will produce any particular marketing result.',
    ],
  },
  {
    heading: '11. Limitation of liability',
    body: [
      'To the maximum extent permitted by law, Tala and its affiliates will not be liable for any indirect, incidental, special, consequential, or punitive damages, or for any loss of profits, revenue, data, or goodwill. Our total liability for any claim relating to the Service will not exceed the amount you paid us in the twelve (12) months before the event giving rise to the claim.',
    ],
  },
  {
    heading: '12. Indemnification',
    body: [
      'You agree to indemnify and hold harmless Tala from any claims, damages, liabilities, and expenses (including reasonable legal fees) arising out of your use of the Service, Your Content, or your violation of these Terms or applicable law.',
    ],
  },
  {
    heading: '13. Changes to these Terms',
    body: [
      'We may update these Terms from time to time. If we make material changes, we will provide reasonable notice (for example, by email or in the app). Your continued use of the Service after changes take effect means you accept the updated Terms.',
    ],
  },
  {
    heading: '14. Governing law',
    body: [
      'These Terms are governed by the laws of [your state/country], without regard to its conflict-of-laws rules. The courts located in [your jurisdiction] will have exclusive jurisdiction over any disputes, unless applicable law requires otherwise.',
    ],
  },
  {
    heading: '15. Contact',
    body: [
      'Questions about these Terms? Contact us at ycaproject.marketing@gmail.com.',
    ],
  },
]

export default function TermsPage() {
  return (
    <LegalDoc
      title="Terms of Service"
      lastUpdated="June 22, 2026"
      disclaimer={DISCLAIMER}
      intro={INTRO}
      sections={SECTIONS}
    />
  )
}
