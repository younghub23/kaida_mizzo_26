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
      'You must be at least 16 years old to use the Service. If you are at least 16 but under the age of majority where you live, you may use the Service only with the involvement and consent of a parent or legal guardian who agrees to these Terms on your behalf. If you use Tala on behalf of a business, you represent that you are authorized to bind that business to these Terms.',
      'You are responsible for your account, for keeping your login credentials secure, and for all activity under your account. Notify us immediately of any unauthorized use. The information you provide must be accurate and kept up to date.',
    ],
  },
  {
    heading: '3. Payment and subscription terms',
    body: [
      'Tala offers paid subscription plans (currently Starter, Growth, Pro, and Agency). Paid plans are billed in advance on a recurring basis through our payment processor, Stripe. By subscribing, you authorize us and Stripe to charge your payment method on each renewal until you cancel.',
      'New subscriptions may include a free trial (currently 7 days). If you do not cancel before the trial ends, your subscription converts to a paid plan and your payment method is charged.',
      'Subscriptions renew automatically for the same period unless you cancel before the renewal date. You can cancel or change your plan at any time from the Wallet & Subscriptions section of your profile or through the Stripe customer portal. Plan changes are prorated by Stripe where applicable.',
      'Except where required by law, payments are non-refundable and there are no refunds or credits for partial periods. We may change our prices; we will give reasonable notice, and changes take effect on your next billing cycle.',
      'If a payment fails, we may suspend or downgrade your access until the amount is paid.',
    ],
  },
  {
    heading: '4. Acceptable use and user conduct',
    body: [
      'You agree not to use the Service to:',
      {
        list: [
          'harass, threaten, abuse, defame, or harm any other person, or engage in hateful or discriminatory conduct;',
          'send spam or any messages that violate anti-spam laws such as CAN-SPAM, CASL, or GDPR (you must have lawful consent to email the contacts you upload);',
          'post or distribute unlawful, infringing, deceptive, harassing, or otherwise harmful content;',
          'violate the terms or policies of any connected third-party platform (for example, Meta, Instagram, LinkedIn, TikTok, or Google);',
          'hack, attempt to gain unauthorized access to the Service, other accounts, or our systems, or interfere with, overload, or disrupt the Service;',
          'scrape, crawl, reverse engineer, or resell the Service except as expressly permitted;',
          'use the Service for any illegal purpose or to build a competing product.',
        ],
      },
      'You are solely responsible for the content you create, schedule, publish, or send, and for ensuring you have the rights and permissions to do so. We may investigate and take action, including removing content or suspending accounts, for conduct that we reasonably believe violates these Terms or the law.',
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
    heading: '8. Intellectual property rights',
    body: [
      'The Service, including its software, source code, design, look and feel, logos, and other trademarks, is owned by Tala and its licensors and is protected by intellectual property laws. Except for the rights expressly granted to you in these Terms, we reserve all rights in and to the Service, and nothing in these Terms transfers any ownership to you. You may not copy, modify, distribute, or create derivative works from the Service, and you may not use our name or logo without our prior written permission.',
      'As between you and Tala, you keep all rights you already have in Your Content as described in Section 5 — these Terms do not give us ownership of it.',
    ],
  },
  {
    heading: '9. Privacy policy',
    body: [
      'Your use of the Service is also governed by our Privacy Policy, which explains what personal information we collect, how we use and share it, and the choices and rights you have. Please review it at /privacy. By using the Service, you acknowledge that we collect and process information as described in the Privacy Policy, which is incorporated into these Terms by reference.',
    ],
  },
  {
    heading: '10. Account termination',
    body: [
      'You may stop using the Service and delete your account at any time from the Data & Privacy section of your profile. We may suspend or terminate your access, with or without notice, if you violate these Terms, if you misuse the Service or create risk or legal exposure for us, if required by law, or to protect the Service or other users.',
      'Upon termination, your right to use the Service ends and we may delete your account and data in line with our Privacy Policy. Sections that by their nature should survive termination (such as content licenses you granted for already-published posts, intellectual property, disclaimers, limitations of liability, indemnification, and dispute resolution) will survive.',
    ],
  },
  {
    heading: '11. Disclaimers',
    body: [
      'The Service is provided "as is" and "as available" without warranties of any kind, whether express or implied, including warranties of merchantability, fitness for a particular purpose, and non-infringement. We do not warrant that the Service will be uninterrupted, error-free, or secure, that any defects will be corrected, or that the Service will produce any particular marketing result. You use the Service at your own risk.',
    ],
  },
  {
    heading: '12. Limitation of liability',
    body: [
      'To the maximum extent permitted by law, Tala and its affiliates will not be liable for any indirect, incidental, special, consequential, or punitive damages, or for any loss of profits, revenue, data, goodwill, or business, or for any service interruptions or loss or corruption of data, even if we have been advised of the possibility of such damages. Our total liability for any claim relating to the Service will not exceed the amount you paid us in the twelve (12) months before the event giving rise to the claim.',
    ],
  },
  {
    heading: '13. Indemnification',
    body: [
      'You agree to indemnify and hold harmless Tala from any claims, damages, liabilities, and expenses (including reasonable legal fees) arising out of your use of the Service, Your Content, or your violation of these Terms or applicable law.',
    ],
  },
  {
    heading: '14. Changes to these Terms',
    body: [
      'We may update these Terms from time to time. If we make material changes, we will provide reasonable notice (for example, by email or in the app). Your continued use of the Service after changes take effect means you accept the updated Terms.',
    ],
  },
  {
    heading: '15. Dispute resolution and governing law',
    body: [
      'These Terms, and any dispute arising out of or relating to them or the Service, are governed by the laws of [your state/country], without regard to its conflict-of-laws rules.',
      'Informal resolution first. Before filing a claim, you agree to try to resolve the dispute informally by contacting us at support@tala.com. We will try to resolve it with you in good faith. If we cannot resolve a dispute within 30 days, either party may pursue the dispute as described below.',
      'Binding arbitration. Except as set out below, you and Tala agree that any dispute will be resolved by final and binding individual arbitration administered under the rules of [arbitration body] in [arbitration location], rather than in court. The arbitrator decides the dispute and may award the same relief a court could on an individual basis.',
      'Exceptions and small claims. Either party may bring an individual claim in small claims court if it qualifies, and either party may seek injunctive relief in court to protect its intellectual property or stop unauthorized use of the Service.',
      'Class action waiver. To the extent permitted by law, disputes will be brought only in an individual capacity, and not as a plaintiff or class member in any class, collective, or representative proceeding.',
      'Where binding arbitration is not permitted by applicable law, the courts located in [your jurisdiction] will have exclusive jurisdiction over disputes, and nothing in this section limits any rights you have that cannot be waived under the law that applies to you.',
    ],
  },
  {
    heading: '16. Contact',
    body: [
      'Questions about these Terms? Contact us at support@tala.com.',
    ],
  },
]

export default function TermsPage() {
  return (
    <LegalDoc
      title="Terms of Service"
      lastUpdated="June 30, 2026"
      disclaimer={DISCLAIMER}
      intro={INTRO}
      sections={SECTIONS}
    />
  )
}
