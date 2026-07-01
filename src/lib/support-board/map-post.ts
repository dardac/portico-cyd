import {
  SUPPORT_CATEGORY_LABELS,
  SUPPORT_POST_STATUS_LABELS,
  SUPPORT_POST_TYPE_LABELS,
  type SupportCategory,
  type SupportPostStatus,
  type SupportPostType,
} from "@/lib/support-board/constants";
import type { AppSession } from "@/lib/auth/session";
import { isStaffSession } from "@/lib/auth/roles";

export type SupportPostRow = {
  id: string;
  post_type: SupportPostType;
  category: SupportCategory;
  apartment_code: string;
  description: string;
  contact_name: string;
  contact_phone: string;
  status: SupportPostStatus;
  created_by_apartment_id: string | null;
  created_by_admin_id: string | null;
  created_at: string;
  attended_at: string | null;
  closed_at: string | null;
};

export type SupportPostDto = {
  id: string;
  postType: SupportPostType;
  postTypeLabel: string;
  category: SupportCategory;
  categoryLabel: string;
  apartmentCode: string;
  description: string;
  contactName: string;
  contactPhone: string;
  status: SupportPostStatus;
  statusLabel: string;
  isOpen: boolean;
  isAttended: boolean;
  isClosed: boolean;
  isOwnPost: boolean;
  createdAt: string;
  attendedAt: string | null;
  closedAt: string | null;
};

export const SUPPORT_POST_SELECT =
  "id, post_type, category, apartment_code, description, contact_name, contact_phone, status, created_by_apartment_id, created_by_admin_id, created_at, attended_at, closed_at";

function isPostOwnedBySession(
  row: Pick<
    SupportPostRow,
    "created_by_apartment_id" | "created_by_admin_id"
  >,
  session: AppSession,
): boolean {
  if (session.type === "resident") {
    return row.created_by_apartment_id === session.apartmentId;
  }

  if (isStaffSession(session)) {
    return row.created_by_admin_id === session.adminId;
  }

  return false;
}

export function mapSupportPost(
  row: SupportPostRow,
  session: AppSession,
): SupportPostDto {
  return {
    id: row.id,
    postType: row.post_type,
    postTypeLabel: SUPPORT_POST_TYPE_LABELS[row.post_type],
    category: row.category,
    categoryLabel: SUPPORT_CATEGORY_LABELS[row.category],
    apartmentCode: row.apartment_code,
    description: row.description,
    contactName: row.contact_name,
    contactPhone: row.contact_phone,
    status: row.status,
    statusLabel: SUPPORT_POST_STATUS_LABELS[row.status],
    isOpen: row.status === "open",
    isAttended: row.status === "attended",
    isClosed: row.status === "closed",
    isOwnPost: isPostOwnedBySession(row, session),
    createdAt: row.created_at,
    attendedAt: row.attended_at,
    closedAt: row.closed_at,
  };
}
