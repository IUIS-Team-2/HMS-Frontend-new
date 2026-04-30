/**
 * Icon system — backed by `lucide-react`.
 *
 * Two ways to use:
 *   1) Recommended (new code) — import named lucide icons directly:
 *        import { User, Bed, Receipt } from "lucide-react";
 *        <User size={16} strokeWidth={1.75} />
 *
 *   2) Back-compat — for the legacy `<Ico d={IC.foo} size sw />` call sites
 *      that exist throughout the codebase. We map `IC.<key>` to the
 *      corresponding lucide component below. The `d` prop is now a marker
 *      (a React component reference, not an SVG path) and `<Ico>` simply
 *      renders that component with the requested size/stroke.
 */

import {
  User,
  UserPlus,
  Users,
  Phone,
  FileText,
  ShieldCheck,
  Bed,
  Activity,
  Wallet,
  Receipt,
  Plus,
  Check,
  Trash2,
  ChevronDown,
  Printer,
  Lock,
  Stethoscope,
  Search,
  IdCard,
  X,
  History,
  MapPin,
  Building2,
  CalendarDays,
  Sun,
  Moon,
  Monitor,
  LogOut,
  Eye,
  EyeOff,
} from "lucide-react";

/**
 * Legacy IC mapping — string keys point at lucide components.
 * Keep keys in sync with previous shape so existing call sites work.
 */
export const IC = {
  cross:    X,
  person:   User,
  phone:    Phone,
  file:     FileText,
  shield:   ShieldCheck,
  bed:      Bed,
  pulse:    Activity,
  wallet:   Wallet,
  receipt:  Receipt,
  plus:     Plus,
  check:    Check,
  trash:    Trash2,
  dn:       ChevronDown,
  print:    Printer,
  lock:     Lock,
  doctor:   Stethoscope,
  search:   Search,
  newadm:   UserPlus,
  id:       IdCard,
  x:        X,
  history:  History,
  users:    Users,
  mapPin:   MapPin,
  dept:     Building2,
  calendar: CalendarDays,
  bill:     Receipt,
};

export const PAGE_ICONS = {
  person:  User,
  bed:     Bed,
  pulse:   Activity,
  receipt: Receipt,
};

/**
 * Backward-compatible icon renderer.
 *   <Ico d={IC.bed} size={16} sw={1.75} />
 * also accepts: `as={Bed}` for new call sites that prefer explicit refs.
 */
export function Ico({ d, as, size = 16, sw = 1.75, ...rest }) {
  const Cmp = as || d;
  if (!Cmp) return null;
  return <Cmp size={size} strokeWidth={sw} {...rest} />;
}

export {
  // Re-export the most common icons for direct use elsewhere.
  User,
  UserPlus,
  Users,
  Phone,
  FileText,
  ShieldCheck,
  Bed,
  Activity,
  Wallet,
  Receipt,
  Plus,
  Check,
  Trash2,
  ChevronDown,
  Printer,
  Lock,
  Stethoscope,
  Search,
  IdCard,
  X,
  History,
  MapPin,
  Building2,
  CalendarDays,
  Sun,
  Moon,
  Monitor,
  LogOut,
  Eye,
  EyeOff,
};
