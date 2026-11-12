/**
 * Shared label / input metrics for New request active service forms.
 * Keep RequestFormField, Places, Date, OptionSelect in sync.
 */
export function requestFormFieldChrome(width: number) {
  if (width < 360) {
    return {
      labelSize: 11,
      labelLetter: 1.0,
      labelMarginBottom: 7,
      helperSize: 12,
      helperLineHeight: 16,
      helperMarginTop: 5,
      inputHeight: 46,
      inputSize: 15,
      inputLineHeight: 20,
      inputPadH: 14,
      inputPadV: 10,
      inputRadius: 10,
      iconSize: 18,
    };
  }
  if (width < 768) {
    return {
      labelSize: 11,
      labelLetter: 1.1,
      labelMarginBottom: 8,
      helperSize: 12,
      helperLineHeight: 16,
      helperMarginTop: 6,
      inputHeight: 48,
      inputSize: 16,
      inputLineHeight: 22,
      inputPadH: 16,
      inputPadV: 10,
      inputRadius: 10,
      iconSize: 20,
    };
  }
  return {
    labelSize: 12,
    labelLetter: 1.2,
    labelMarginBottom: 8,
    helperSize: 13,
    helperLineHeight: 18,
    helperMarginTop: 6,
    inputHeight: 50,
    inputSize: 16,
    inputLineHeight: 22,
    inputPadH: 16,
    inputPadV: 12,
    inputRadius: 12,
    iconSize: 20,
  };
}
