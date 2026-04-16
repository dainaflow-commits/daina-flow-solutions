import {
  BarChart3, Workflow, MessageCircle, Bot, Table2, Blocks, FileText,
  GitBranch, MailCheck, Globe, Sparkles, CheckCircle2, Clock, Heart,
  TrendingUp, Briefcase, Lightbulb, Database, Cog, Users, type LucideIcon,
} from "lucide-react";

const map: Record<string, LucideIcon> = {
  "bar-chart-3": BarChart3,
  workflow: Workflow,
  "message-circle": MessageCircle,
  bot: Bot,
  "table-2": Table2,
  blocks: Blocks,
  "file-text": FileText,
  "git-branch": GitBranch,
  "mail-check": MailCheck,
  globe: Globe,
  sparkles: Sparkles,
  "check-circle-2": CheckCircle2,
  clock: Clock,
  heart: Heart,
  "trending-up": TrendingUp,
  briefcase: Briefcase,
  lightbulb: Lightbulb,
  database: Database,
  cog: Cog,
  users: Users,
};

export function getIcon(name: string | null | undefined): LucideIcon {
  if (!name) return Sparkles;
  return map[name] ?? Sparkles;
}

export const ICON_OPTIONS = Object.keys(map);
