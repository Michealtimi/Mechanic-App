export interface MechanicProfileResponseDto {
  id: string;
  email: string;
  shopName?: string | null; // Remember the fix for nullability!
  location?: string | null;
  skills?: string | null;
  profilePictureUrl?: string | null;
  bio?: string | null;
  experienceYears?: number | null;
  certificationUrls?: string[] | null;
  createdAt: Date;
  updatedAt: Date;
}