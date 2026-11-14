/** API Response & Data Types mirroring Laravel API Resources */

export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}

export interface User {
  id: number;
  name: string;
  email: string | null;
  phone_number: string | null;
  phone?: string | null;
  is_admin: boolean;
  plan: string;
  is_pro: boolean;
  is_legend: boolean;
  has_password?: boolean;
  password_login_enabled?: boolean;
  store_id: number | null;
  store?: Store | null;
}

export interface Store {
  id: number;
  user_id: number;
  store_name: string;
  username: string;
  whatsapp_phone: string | null;
  currency_code: string;
  country_code: string;
  payment_provider: string;
  logo_path?: string | null;
  /** Resolved image URL for the logo */
  logo_url?: string | null;
  banner_path?: string | null;
  store_color?: string | null;
  category_label?: string | null;
  is_active: boolean;
  custom_domain?: string | null;
  // Aliases & Extended Properties
  name?: string;
  slug?: string;
  primary_color?: string | null;
  store_bio?: string | null;
  location?: string | null;
  city?: string | null;
  category?: string | null;
  products_count?: number;
}

export interface ProductVariant {
  id?: string;
  product_id?: string;
  size?: string | null;
  color?: string | null;
  price?: number | string | null;
  inventory_quantity: number;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
}

export interface Product {
  id: number | string;
  store_id?: number;
  name: string;
  slug?: string;
  price_kobo: number; // Price in kobo (integer)
  compare_at_price_kobo?: number | null; // Price in kobo (integer)
  description?: string | null;
  /** Category name (admin-managed list); send category_id to change it. */
  category?: string | null;
  category_id?: string | null;
  color?: string | null;
  stock_count: number;
  status: 'live' | 'preorder' | 'hidden';
  is_featured?: boolean;
  images?: string[];
  image_url?: string | null;
  thumbnail_url?: string | null;
  sizes?: string[];
  colors?: string[];
  variants?: ProductVariant[];
  deleted_at?: string | null;
  // Aliases & Extended Properties
  price?: number; // Price in Naira
  primary_color?: string | null;
  store?: Store | null;
}

export type OrderStatus = 'paid' | 'packed' | 'shipped' | 'delivered' | 'refunded' | 'cancelled';

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price_kobo: number;
  total_kobo: number;
  selected_size?: string | null;
  selected_color?: string | null;
  image_url?: string | null;
  // Aliases & Extended Properties
  product?: Product | null;
  price?: number;
}

export interface Order {
  id: number | string;
  order_number: string;
  store_id: number;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  shipping_address?: any;
  delivery_address?: string | null;
  merchant_net_amount?: number | string | null;
  delivery_milestone?: string | null;
  city?: string | null;
  state?: string | null;
  items_summary?: string;
  total_kobo: number;
  subtotal_kobo?: number;
  delivery_fee_kobo?: number;
  status: OrderStatus;
  payment_method: 'Card' | 'Transfer' | 'USSD';
  payment_status?: string;
  paid_at?: string | null;
  packed_at?: string | null;
  shipped_at?: string | null;
  delivered_at?: string | null;
  courier_name?: string | null;
  tracking_number?: string | null;
  items?: OrderItem[];
  created_at: string;
  // Aliases & Extended Properties
  order_status?: string;
  total_amount?: number;
  store?: Store | null;
}

export interface WalletBalance {
  available_balance_kobo: number;
  pending_balance_kobo: number;
  total_earned_kobo: number;
  currency: string;
  bank_name?: string | null;
  account_number?: string | null;
  account_name?: string | null;
  balance?: number;
}

export interface PayoutRecord {
  id: number | string;
  amount_kobo: number;
  status: 'paid' | 'processing' | 'failed';
  date: string;
  orders_count: number;
  bank_name: string;
  account_number: string;
}

export interface Bank {
  code: string;
  name: string;
}

export interface Country {
  code: string;
  name: string;
  default_currency: string;
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag?: string;
  default_country?: string;
}

export interface Address {
  id: number;
  label: string;
  street: string;
  area?: string;
  state: string;
  phone?: string;
  landmark?: string | null;
  is_default: boolean;
  // Aliases & Extended Properties
  recipient_name?: string;
  city?: string;
  phone_number?: string;
}

export interface SavedCard {
  id: number;
  brand: string;
  last4: string;
  exp_month: number | string;
  exp_year: number | string;
  is_default: boolean;
  provider_token?: string;
}

export interface Review {
  id: number;
  store_id: number;
  product_id?: number | null;
  product_name?: string | null;
  customer_name: string;
  rating: number; // 1 to 5
  comment: string;
  created_at: string;
  reply?: string | null;
  reply_at?: string | null;
  // Aliases & Extended Properties
  store?: Store | null;
  product?: Product | null;
  seller_reply?: string | null;
  buyer_name?: string | null;
}

export interface NotificationPreferences {
  whatsapp_order_updates: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  new_drops: boolean;
  price_drops: boolean;
  // Aliases & Extended Properties
  order_whatsapp?: boolean;
  order_email?: boolean;
}

export interface AiProductDraftResult {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  title?: string;
  suggested_price_kobo?: number;
  price_min_kobo?: number;
  price_max_kobo?: number;
  category?: string;
  category_id?: string | null;
  description?: string;
  colors?: string[];
  tags?: string[];
}
