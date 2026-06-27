// ─── Auth ─────────────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'operator';

export interface AuthUser {
  id: number;
  username: string;
  role: UserRole;
}

export interface AuthState {
  token: string;
  user: AuthUser;
}

// ─── Tables ───────────────────────────────────────────────────────────────────

export type TableType = 'pool' | 'snooker' | 'ps5';
export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'PAUSED' | 'RESERVED';

export interface GamingTable {
  id: number;
  name: string;
  type: TableType;
  status: TableStatus;
  price_per_minute: string;
  price_per_hour: string;
  wiz_ip?: string | null;
  wiz_mac?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActiveTableSession {
  id: number;
  table_id: number;
  status: 'active' | 'paused' | 'reserved';
  booking_type: BookingType;
  start_time: string;
  scheduled_start?: string | null;
  booked_duration?: number | null;
  table_name: string;
  table_type: TableType;
  price_per_minute: string;
  customer_name?: string;
  customer_phone?: string;
  duration_min: number | null;
  session_amount: string | null;
  available_actions?: string[];
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

export type SessionStatus = 'active' | 'paused' | 'reserved' | 'ended' | 'cancelled';
export type BookingType = 'pay_as_you_go' | 'fixed_slot' | 'pre_booking' | 'frame_wise';
export type DiscountType = 'none' | 'percentage' | 'flat' | 'pass';
export type BillStatus = 'ACTIVE' | 'PAUSED' | 'CLOSED';

export interface Session {
  id: number;
  table_id: number;
  booking_id?: number | null;
  customer_pass_id?: number | null;
  start_time: string;
  end_time?: string;
  duration?: number;
  status: SessionStatus;
  booking_type?: BookingType;
  booked_duration?: number | null;
  discount_type?: DiscountType;
  discount_value?: string;
  discount_amount?: string;
  session_amount?: string;
  total_amount?: string;
  net_amount?: string;
  payment_method?: string;
  created_at: string;
  updated_at?: string;
  table_name?: string;
  table_type?: TableType;
  price_per_minute?: string;
  customer_name?: string;
  customer_phone?: string;
}

export interface StartSessionPayload {
  table_id: number;
  customer_name: string;
  customer_phone: string;
  booking_type?: BookingType;
  scheduled_start?: string | null;
  booked_duration?: number | null;
}

// ─── Frames ───────────────────────────────────────────────────────────────────

export interface SessionFrame {
  id: number;
  session_id: number;
  player_name: string;
  started_at: string;
  ended_at: string | null;
  duration_min: number | null;
  amount: string | null;
  created_at: string;
}

export interface StartSessionResponse {
  id: number;
  table_id: number;
  booking_type: BookingType;
  booked_duration: number | null;
  scheduled_start?: string | null;
  status: SessionStatus;
  start_time: string;
  created_at: string;
  customer_name: string;
  customer_phone: string;
}

export interface EndSessionResponse {
  id: number;
  table_id: number;
  start_time: string;
  end_time: string;
  duration: number;
  booking_type: BookingType;
  session_amount: string;
  total_amount: string;
  discount_type: DiscountType;
  discount_value: string;
  discount_amount: string;
  net_amount: string;
  payment_method?: string;
  cash_amount?: string;
  online_amount?: string;
  status: SessionStatus;
  updated_at: string;
}

export interface PauseResumeResponse {
  id: number;
  session_id: number;
  paused_at: string;
  resumed_at?: string;
}

export interface ActiveSession {
  id: number;
  table_id: number;
  start_time: string;
  status: SessionStatus;
  booking_type: BookingType;
  scheduled_start?: string | null;
  table_name: string;
  table_type: TableType;
  customer_name: string;
  customer_phone: string;
}

// ─── Inventory ────────────────────────────────────────────────────────────────

export interface InventoryItem {
  id: number;
  name: string;
  price: string;
  stock_quantity: number;
  created_at: string;
  updated_at: string;
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export interface Order {
  id: number;
  session_id: number;
  item_id: number;
  quantity: number;
  unit_price: string;
  subtotal: string;
  created_at: string;
  item_name?: string;
}

// ─── Billing ──────────────────────────────────────────────────────────────────

export interface PauseRecord {
  id: number;
  session_id: number;
  paused_at: string;
  resumed_at: string | null;
}

export interface Bill {
  session_id: number;
  customer_name?: string;
  customer_phone?: string;
  table_name: string;
  table_type: TableType;
  price_per_minute: string;
  booking_type: BookingType;
  start_time: string;
  end_time?: string;
  duration_min: number;
  session_amount: string;
  orders_total: string;
  total_amount: string;
  discount_type: DiscountType;
  discount_value: string;
  discount_amount: string;
  net_amount: string;
  status: BillStatus;
  pauses: PauseRecord[];
  orders: Order[];
  frames?: SessionFrame[];
}

// ─── Customers ────────────────────────────────────────────────────────────────

export interface Customer {
  id: number;
  name: string;
  phone: string;
  created_at: string;
}

export interface CustomerSession {
  id: number;
  table_id: number;
  start_time: string;
  end_time?: string;
  booking_type: BookingType;
  status: SessionStatus;
  net_amount?: string;
  table_name: string;
  table_type: TableType;
}

// ─── Passes ───────────────────────────────────────────────────────────────────

export interface Pass {
  id: number;
  name: string;
  total_minutes: number;
  price: string;
  is_active: boolean;
  created_at: string;
}

export interface CustomerPass {
  id: number;
  customer_id: number;
  pass_id: number;
  remaining_minutes: number;
  expires_at: string | null;
  purchased_at: string;
  pass_name: string;
  total_minutes: number;
}

// ─── Bookings ─────────────────────────────────────────────────────────────────

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Booking {
  id: number;
  customer_id: number;
  table_id: number;
  scheduled_start: string;
  booked_duration: number;
  status: BookingStatus;
  notes?: string;
  created_at: string;
  customer_name?: string;
  customer_phone?: string;
  table_name?: string;
  table_type?: TableType;
}

// ─── Discounts ────────────────────────────────────────────────────────────────

export type DiscountScope = 'session' | 'order' | 'all';

export interface Discount {
  id: number;
  name: string;
  code: string | null;
  discount_type: 'percentage' | 'flat';
  discount_value: string;
  scope: DiscountScope;
  applicable_table_types: TableType[] | null;
  is_active: boolean;
  valid_from: string | null;
  valid_until: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export interface ReportSummary {
  total_sessions: number;
  total_minutes: number;
  total_hours: number;
  total_revenue: string;
  table_revenue: string;
  orders_revenue: string;
  total_discounts: string;
  payg_count: number;
  fixed_count: number;
  prebook_count: number;
  cash_count: number;
  online_count: number;
  split_count?: number;
  cash_revenue: string;
  online_revenue: string;
}

// Report session row — different from regular Session (flat shape from report query)
export interface ReportSession {
  session_id: number;
  start_time: string;
  end_time?: string;
  duration_min: number;
  booking_type: BookingType;
  payment_method?: string;
  session_amount: string;
  total_amount: string;
  discount_type: DiscountType;
  discount_value: string;
  discount_amount: string;
  net_amount: string;
  table_name: string;
  table_type: TableType;
  customer_name?: string;
  customer_phone?: string;
}

export interface ReportTableBreakdown {
  table_name: string;
  table_type: TableType;
  sessions: number;
  total_minutes: number;
  total_hours: number;
  revenue: string;
}

export interface ReportTopItem {
  item_name: string;
  total_qty: number;
  total_revenue: string;
}

export interface WeeklyReport {
  week_start: string;
  week_end: string;
  summary: ReportSummary;
  table_breakdown: ReportTableBreakdown[];
  top_items: ReportTopItem[];
  sessions: ReportSession[];
}

export interface DailyReport {
  date: string;
  summary: ReportSummary;
  table_breakdown: ReportTableBreakdown[];
  top_items: ReportTopItem[];
  sessions: ReportSession[];
}

export interface MonthlyReport {
  month: string;
  from: string;
  to: string;
  summary: ReportSummary;
  table_breakdown: ReportTableBreakdown[];
  top_items: ReportTopItem[];
  sessions: ReportSession[];
}

export interface ReportData {
  period_label: string;
  summary: ReportSummary;
  table_breakdown: ReportTableBreakdown[];
  top_items: ReportTopItem[];
  sessions: ReportSession[];
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

// ─── API wrapper ──────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
}

// ─── Socket.IO events ─────────────────────────────────────────────────────────

export interface TableStatusChangedEvent {
  tableId: number;
  status: TableStatus;
}

export interface SessionStartedEvent {
  sessionId: number;
  tableId: number;
  tableName: string;
}

export interface SessionEndedEvent {
  sessionId: number;
  tableId: number;
  duration: number;
  netAmount: string;
}

export interface SessionPausedEvent {
  sessionId: number;
  tableId: number;
}

export interface SessionResumedEvent {
  sessionId: number;
  tableId: number;
}

export interface TablePreBookedEvent {
  tableId: number;
  tableName: string;
  sessionId: number;
  scheduledStart: string;
  customerName: string;
  customerPhone: string;
}

export interface TableBookingCancelledEvent {
  tableId: number;
  sessionId: number;
}

export interface SessionFixedSlotExpiredEvent {
  sessionId: number;
  tableId: number;
  tableName: string;
  tableType: string;
  netAmount: string;
  customerName: string | null;
}
