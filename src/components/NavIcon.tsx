import { Activity, Box, CreditCard, Cpu, Folder, LayoutGrid, Lock, Users, type LucideIcon } from "lucide-react";

/**
 * Sidebar icons from Lucide (ISC licence), drawn with the same 1.8 stroke as the notification bell.
 * Each icon is imported by name, so only these ship in the build.
 */
const ICONS: Record<string, LucideIcon> = {
  overview: LayoutGrid,
  projects: Folder,
  builds: Box,
  membership: CreditCard,
  secrets: Lock,
  boards: Cpu,
  users: Users,
  activity: Activity,
};

export type NavIconName = keyof typeof ICONS;

export function NavIcon({ name }: { name: NavIconName }) {
  const Icon = ICONS[name];
  return <Icon className="side-icon" size={18} strokeWidth={1.8} aria-hidden="true" />;
}
