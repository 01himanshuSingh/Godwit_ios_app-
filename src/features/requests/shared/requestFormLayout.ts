/**
 * Card + section spacing for New request active service forms.
 */
export function requestFormLayoutForWidth(width: number) {
  if (width < 360) {
    return {
      cardPadH: 14,
      cardPadV: 16,
      cardRadius: 14,
      cardGap: 16,
      sectionGap: 14,
      shadowOpacity: 0.04,
      shadowRadius: 8,
    };
  }
  if (width < 768) {
    return {
      cardPadH: 16,
      cardPadV: 18,
      cardRadius: 16,
      cardGap: 18,
      sectionGap: 16,
      shadowOpacity: 0.05,
      shadowRadius: 10,
    };
  }
  return {
    cardPadH: 20,
    cardPadV: 20,
    cardRadius: 16,
    cardGap: 20,
    sectionGap: 18,
    shadowOpacity: 0.05,
    shadowRadius: 12,
  };
}
