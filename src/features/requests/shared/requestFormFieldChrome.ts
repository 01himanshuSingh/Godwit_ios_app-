/**
 * Shared label / input / count metrics for New request active screens.
 * Canonical sizes come from Hotel Stay tab — keep every service wizard +
 * Travellers / Notes / Review tabs on the same responsive scale.
 */
export function requestFormFieldChrome(width: number) {
  if (width < 360) {
    return {
      labelSize: 11,
      labelLetter: 1.0,
      labelMarginBottom: 6,
      helperSize: 12,
      helperLineHeight: 16,
      helperMarginTop: 5,
      /** Hotel Stay input row */
      inputHeight: 42,
      inputSize: 15,
      inputLineHeight: 20,
      inputPadH: 12,
      inputPadV: 10,
      inputRadius: 10,
      scheduleMinHeight: 50,
      textareaMinHeight: 90,
      /** Hotel Stay count stepper (rooms) */
      countButton: 30,
      countIcon: 15,
      countValueSize: 13,
      countValueMinWidth: 18,
      countGap: 5,
      countPad: 3,
      ageChip: 34,
      iconSize: 18,
    };
  }
  if (width < 768) {
    return {
      labelSize: 11,
      labelLetter: 1.1,
      labelMarginBottom: 6,
      helperSize: 12,
      helperLineHeight: 16,
      helperMarginTop: 6,
      inputHeight: 44,
      inputSize: 15,
      inputLineHeight: 20,
      inputPadH: 12,
      inputPadV: 10,
      inputRadius: 10,
      scheduleMinHeight: 54,
      textareaMinHeight: 96,
      countButton: 32,
      countIcon: 16,
      countValueSize: 14,
      countValueMinWidth: 20,
      countGap: 6,
      countPad: 3,
      ageChip: 36,
      iconSize: 18,
    };
  }
  return {
    labelSize: 12,
    labelLetter: 1.2,
    labelMarginBottom: 8,
    helperSize: 13,
    helperLineHeight: 18,
    helperMarginTop: 6,
    inputHeight: 46,
    inputSize: 16,
    inputLineHeight: 22,
    inputPadH: 14,
    inputPadV: 12,
    inputRadius: 12,
    scheduleMinHeight: 56,
    textareaMinHeight: 110,
    countButton: 34,
    countIcon: 17,
    countValueSize: 15,
    countValueMinWidth: 22,
    countGap: 6,
    countPad: 4,
    ageChip: 38,
    iconSize: 20,
  };
}
