export type Review = {
  _id: string;
  property: string | any;
  reviewer: string | any;
  rating: number;
  title: string;
  comment: string;
  isVerifiedStay: boolean;
  stayDate?: string;
  landlord: string | any;
  booking?: string | any;
  propertyRating: number;
  landlordRating: number;
  cleanliness: number;
  location: number;
  valueForMoney: number;
  response?: {
    comment: string;
    createdAt: string;
  };
  status: "pending" | "approved" | "rejected" | "flagged";
  rejectionReason?: string;
  images?: Array<{
    url: string;
    caption?: string;
  }>;
  createdAt?: Date;
};

export type ReviewCreateInput = {
  property: string;
  rating: number;
  title: string;
  comment: string;
  isVerifiedStay?: boolean;
  stayDate?: string;
  landlord: string;
  booking?: string;
  propertyRating: number;
  landlordRating: number;
  cleanliness: number;
  location: number;
  valueForMoney: number;
  images?: Array<{
    url: string;
    caption?: string;
  }>;
};

export type ReviewUpdateInput = {
  rating?: number;
  title?: string;
  comment?: string;
  status?: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  response?: {
    comment: string;
    createdAt: string;
  };
  images?: Array<{
    url: string;
    caption?: string;
  }>;
};

export type ReviewListResponse = {
  reviews: Review[];
  pagination: {
    pages: number;
    total: number;
    page: number;
    limit: number;
  };
  status: "success" | "error";
  message?: string;
};

export type ReviewResponse = {
  review: Review;
  status: "success" | "error";
  message?: string;
};
