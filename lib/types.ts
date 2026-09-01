export type Material = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  category: string;
  subject: string;
  grade: string;
  materialType: string;
  fileFormat: string;
  pagesCount: number | null;
  coverImage: string;
  images: string[];
  imageAlt: string;
  imageAspectRatio: string;
  ogImage: string;
  tags: string[];
  isFree: boolean;
  isFeatured: boolean;
  isNew: boolean;
  isPopular: boolean;
  vseosvitaUrl: string;
  telegramUrl: string;
  createdAt: string;
  price: string;
  views: number;
  downloads: number;
  imageSource: "vseosvita" | "provided" | "fallback";
  imageSourceUrl: string;
  previewStatus: "local" | "remote" | "fallback";
  needsReview: boolean;
};

export type MaterialSummary = Pick<
  Material,
  | "id"
  | "slug"
  | "title"
  | "shortDescription"
  | "category"
  | "subject"
  | "grade"
  | "materialType"
  | "fileFormat"
  | "pagesCount"
  | "coverImage"
  | "imageAlt"
  | "isFree"
  | "isFeatured"
  | "isNew"
  | "isPopular"
  | "vseosvitaUrl"
  | "telegramUrl"
  | "createdAt"
  | "price"
  | "views"
  | "previewStatus"
>;
