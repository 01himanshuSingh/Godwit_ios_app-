/**
 * CRM masterData/hotelBrands/items — brand catalog for Preferred hotel.
 */

export type HotelBrand = {
  brandId: string;
  name: string;
  /** Two-letter (or so) chip label derived from name when CRM omits monogram. */
  monogram: string;
  isActive: boolean;
};

export type HotelBrandsPageCursor = import('firebase/firestore').QueryDocumentSnapshot | null;

export type HotelBrandsPage = {
  brands: HotelBrand[];
  nextCursor: HotelBrandsPageCursor;
  hasMore: boolean;
};
