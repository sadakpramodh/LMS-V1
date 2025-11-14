import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import {
  Calendar,
  Filter,
  Search,
  Sparkles,
  Swords,
  Target,
  TrendingUp,
  Clock,
  FileText,
  ArrowUpRight,
} from "lucide-react";
import StatCard from "@/components/StatCard";
import { useLitigationCases } from "@/hooks/useLitigationCases";
import { usePermissions } from "@/hooks/usePermissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const STATUS_FILTERS = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "closed", label: "Closed" },
];

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  pending: "bg-amber-100 text-amber-700 border border-amber-200",
  closed: "bg-slate-100 text-slate-700 border border-slate-200",
  default: "bg-muted text-foreground",
};

const formatDate = (value: string | null) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return format(parsed, "dd MMM yyyy");
};

const formatCurrency = (value: number | null) => {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
};

export default function Arbitration() {
  const { cases, loading } = useLitigationCases();
  const { hasPermission } = usePermissions();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const arbitrations = useMemo(
    () =>
      cases.filter((litigationCase) => {
        const forum = litigationCase.forum?.toLowerCase() ?? "";
        const particular = litigationCase.particular?.toLowerCase() ?? "";
        return forum.includes("arbitration") || particular.includes("arbitration");
      }),
    [cases]
  );

  const stats = useMemo(() => {
    const total = arbitrations.length;
    const active = arbitrations.filter(
      (item) => (item.status ?? "").toLowerCase() !== "closed"
    ).length;
    const closed = arbitrations.filter(
      (item) => (item.status ?? "").toLowerCase() === "closed"
    ).length;
    const upcomingHearings = arbitrations.filter((item) => {
      if (!item.next_hearing_date) return false;
      const nextDate = new Date(item.next_hearing_date);
      if (Number.isNaN(nextDate.getTime())) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return nextDate >= today;
    }).length;
    const totalExposure = arbitrations.reduce(
      (sum, item) => sum + (item.amount_involved ?? 0),
      0
    );

    const closureRate = total === 0 ? 0 : Math.round((closed / total) * 100);
    const activeRate = total === 0 ? 0 : Math.round((active / total) * 100);

    return {
      total,
      active,
      closed,
      upcomingHearings,
      totalExposure,
      closureRate,
      activeRate,
    };
  }, [arbitrations]);

  const filteredArbitrations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return arbitrations.filter((item) => {
      const fields = [
        item.parties ?? "",
        item.forum ?? "",
        item.particular ?? "",
        item.treatment_resolution ?? "",
      ];
      const matchesSearch =
        query === "" || fields.some((field) => field.toLowerCase().includes(query));
      const normalizedStatus = (item.status ?? "").toLowerCase();
      const matchesStatus =
        statusFilter === "all" || normalizedStatus === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [arbitrations, searchQuery, statusFilter]);

  const upcomingHearings = useMemo(() => {
    return [...arbitrations]
      .filter((item) => item.next_hearing_date)
      .map((item) => ({
        ...item,
        nextDate: item.next_hearing_date ? new Date(item.next_hearing_date) : null,
      }))
      .filter((item) => item.nextDate && !Number.isNaN(item.nextDate.getTime()))
      .sort((a, b) => (a.nextDate?.getTime() ?? 0) - (b.nextDate?.getTime() ?? 0))
      .slice(0, 5);
  }, [arbitrations]);

  const statusBreakdown = useMemo(() => {
    return arbitrations.reduce<Record<string, number>>((acc, item) => {
      const key = (item.status ?? "Unassigned").toLowerCase();
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
  }, [arbitrations]);

  const strategicFocus = [
    {
      title: "Evidence Compilation",
      description:
        "Consolidate pleadings, affidavits, and witness lists for the next tribunal sitting.",
      icon: FileText,
    },
    {
      title: "Settlement Outlook",
      description:
        "Track negotiation windows and management approvals for high-value disputes.",
      icon: Target,
    },
    {
      title: "Hearing Preparation",
      description:
        "Align counsel briefs, expert opinions, and document bundles ahead of hearings.",
      icon: Calendar,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading arbitration portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <Swords className="h-4 w-4" />
            Arbitration Control Tower
          </div>
          <h1 className="mt-2 text-3xl font-bold text-foreground">Arbitration Dashboard</h1>
          <p className="mt-1 max-w-2xl text-muted-foreground">
            Monitor institutional and ad-hoc arbitrations, track tribunal calendars, and surface
            strategic actions without leaving the LMS.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" className="gap-2" asChild>
            <Link to="/litigation">
              <ArrowUpRight className="h-4 w-4" />
              View Full Case Register
            </Link>
          </Button>
          {hasPermission("upload_excel_litigation") && (
            <Button className="gap-2" asChild>
              <Link to="/litigation">
                <Sparkles className="h-4 w-4" />
                Log New Arbitration
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Arbitrations"
          value={stats.total}
          icon={Swords}
          trend={{ value: `${stats.activeRate}% active`, isPositive: false }}
        />
        <StatCard
          title="Upcoming Hearings"
          value={stats.upcomingHearings}
          icon={Calendar}
          trend={{ value: "Tracked via tribunal sync", isPositive: true }}
        />
        <StatCard
          title="Exposure Managed"
          value={formatCurrency(stats.totalExposure)}
          icon={TrendingUp}
          trend={{ value: `${stats.closureRate}% closure rate`, isPositive: true }}
        />
        <StatCard
          title="Matters Closed"
          value={stats.closed}
          icon={Target}
          trend={{
            value: stats.total === 0 ? "No closures yet" : `${stats.closed}/${stats.total} completed`,
            isPositive: true,
          }}
          variant="success"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="shadow-[var(--shadow-card)] lg:col-span-2">
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Arbitration Portfolio</CardTitle>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by parties, forum, or treatment..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="pl-9 w-full sm:w-[260px]"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[160px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_FILTERS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredArbitrations.length === 0 ? (
              <div className="py-12 text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No arbitration matters found</h3>
                <p className="mt-2 text-muted-foreground">
                  {searchQuery || statusFilter !== "all"
                    ? "Try adjusting your filters to see more matters."
                    : "Arbitration cases will appear here as soon as they are logged in the litigation register."}
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Parties</TableHead>
                      <TableHead>Forum</TableHead>
                      <TableHead>Stage</TableHead>
                      <TableHead>Next Hearing</TableHead>
                      <TableHead>Exposure</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredArbitrations.map((item) => {
                      const statusKey = (item.status ?? "").toLowerCase();
                      const badgeClass = STATUS_STYLES[statusKey] ?? STATUS_STYLES.default;
                      return (
                        <TableRow key={item.id} className="transition-colors hover:bg-muted/50">
                          <TableCell>
                            <div className="font-semibold text-foreground">{item.parties}</div>
                            <p className="text-sm text-muted-foreground">
                              {item.particular ?? "Tribunal constitution in progress"}
                            </p>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">{item.forum}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {item.treatment_resolution ?? "Pending strategy"}
                            </Badge>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {formatDate(item.next_hearing_date)}
                          </TableCell>
                          <TableCell>{formatCurrency(item.amount_involved)}</TableCell>
                          <TableCell className="text-right">
                            <Badge className={cn("capitalize", badgeClass)}>{item.status ?? "—"}</Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle>Lifecycle Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Active matters</span>
                <span className="font-semibold text-foreground">{stats.active}</span>
              </div>
              <Progress value={stats.activeRate} className="mt-2" />
            </div>
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Closure rate</span>
                <span className="font-semibold text-foreground">{stats.closureRate}%</span>
              </div>
              <Progress value={stats.closureRate} className="mt-2" />
            </div>
            <div className="rounded-lg border border-dashed p-4">
              <div className="flex items-start gap-3">
                <Clock className="mt-1 h-5 w-5 text-primary" />
                <div>
                  <h4 className="font-semibold text-foreground">Tribunal Timelines</h4>
                  <p className="text-sm text-muted-foreground">
                    Hearings, filings, and award milestones feed the arbitration calendar automatically via
                    crawler sync.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {Object.entries(statusBreakdown).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between text-sm">
                  <span className="capitalize text-muted-foreground">{status}</span>
                  <Badge variant="secondary" className="px-2 py-0 text-xs">
                    {count} matter{count === 1 ? "" : "s"}
                  </Badge>
                </div>
              ))}
              {arbitrations.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Log arbitration cases to see live status analytics.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle>Upcoming Hearings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingHearings.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Hearing schedules will surface here automatically once tribunal dates are captured.
              </p>
            ) : (
              upcomingHearings.map((hearing) => (
                <div
                  key={`${hearing.id}-${hearing.next_hearing_date}`}
                  className="flex items-start justify-between rounded-lg border p-4"
                >
                  <div>
                    <h4 className="font-semibold text-foreground">{hearing.parties}</h4>
                    <p className="text-sm text-muted-foreground">
                      {hearing.forum} • {formatDate(hearing.last_hearing_date)} last heard
                    </p>
                  </div>
                  <Badge variant="outline" className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(hearing.next_hearing_date)}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle>Strategic Focus Areas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {strategicFocus.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex items-start gap-3 rounded-lg bg-muted/40 p-4">
                  <div className="rounded-md bg-primary/10 p-2">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-foreground">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              );
            })}
            <div className="rounded-lg border border-dashed p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-1 h-5 w-5 text-primary" />
                <div>
                  <h4 className="font-semibold text-foreground">AI Assist Ready</h4>
                  <p className="text-sm text-muted-foreground">
                    Summaries, draft statements of claim, and counter-arguments can be generated directly
                    from the arbitration workspace using the GenAI assistant.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
