export interface Variant {
  color: string;
  image: string;
  video?: string;
}

export interface Specification {
  key: string;
  value: string;
}

export interface Product {
  id?: string;
  productName: string;
  description: string;
  category: string;
  price: number;
  oldPrice: number;
  offerPercentage: number;
  stock: number;
  imageUrls?: string[];
  videoUrls?: string[];
  featured: boolean;
  trending: boolean;
  createdAt?: string;
  badge?: string;
  colors?: string[];
  variants?: Variant[];
  moq?: number;
  advanceBooking?: string;
  specifications?: Specification[];
}

export interface CartItem extends Product {
  quantity: number;
  selectedColor?: string;
}
