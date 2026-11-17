/**
 * Shared Active Trip detail type scale (hotel = source of truth).
 * Air / other service bodies should use these sizes for matching sections.
 */
import { fontFamily } from '@/ui/tokens/typography';

export const activeTripType = {
  /** HOTEL / AIR badge */
  serviceBadge: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 10,
    letterSpacing: 1.1,
  },
  /** Hero title — hotel name / flight title */
  heroTitle: {
    fontFamily: fontFamily.cormorant.regular,
    fontSize: 28,
    lineHeight: 34,
  },
  /** Hero subtitle */
  heroSubtitle: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  /** Confirmed / Paid in full */
  chipSemibold: {
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 12,
  },
  /** Confirmation … */
  chipMedium: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 11,
  },
  /** CHECK-IN / DEPARTS labels */
  summaryLabel: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 11,
    letterSpacing: 1,
  },
  /** Summary values */
  summaryValue: {
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 14,
    lineHeight: 20,
  },
  /** DETAILS / SPECIAL REQUESTS / … headings */
  sectionHeading: {
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 11,
    letterSpacing: 1.4,
  },
  /** Field labels */
  detailLabel: {
    fontFamily: fontFamily.manrope.medium,
    fontSize: 11,
    letterSpacing: 1.1,
  },
  /** Field values */
  detailValue: {
    fontSize: 14,
    lineHeight: 21,
  },
  detailValueMedium: {
    fontFamily: fontFamily.manrope.medium,
  },
  detailValueRegular: {
    fontFamily: fontFamily.manrope.regular,
  },
  /** Message card eyebrow */
  messageEyebrow: {
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 11,
    letterSpacing: 1.4,
  },
  /** Private Concierge Desk */
  messageDeskTitle: {
    fontFamily: fontFamily.cormorant.medium,
    fontSize: 20,
    lineHeight: 26,
  },
  /** Message CTA label */
  messageCta: {
    fontFamily: fontFamily.manrope.semibold,
    fontSize: 13,
    lineHeight: 16,
  },
  /** Body copy in special requests / cancellation / benefits */
  sectionBody: {
    fontFamily: fontFamily.manrope.regular,
    fontSize: 14,
    lineHeight: 22,
  },
} as const;
