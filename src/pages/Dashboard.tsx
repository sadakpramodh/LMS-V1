import {
  AlertCircle,
  Building2,
  CalendarClock,
  CalendarDays,
  ClipboardList,
  FileText,
  FolderSearch,
  Gauge,
  Gavel,
  Layers3,
  ListChecks,
  Filter,
  Sparkles,
  Upload,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import { addDays, format, parseISO } from "date-fns";
import "react-day-picker/dist/style.css";
import StatCard from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

export default function Dashboard() {
  const [filters, setFilters] = useState({
    company: "all",
    subsidiary: "all",
    unit: "all",
    department: "all",
    type: "all",
    period: "fy25",
  });

  const noticeSummary = {
    total: 186,
    open: 48,
    closed: 112,
    upcomingReplies: 26,
  };

  const litigationSummary = {
    total: 92,
    civil: 32,
    criminal: 12,
    labour: 25,
    regulatory: 23,
  };

  const riskDistribution = [
    { level: "High", percentage: 28, matters: 18, exposure: "₹1,250 Cr" },
    { level: "Medium", percentage: 44, matters: 41, exposure: "₹890 Cr" },
    { level: "Low", percentage: 28, matters: 33, exposure: "₹320 Cr" },
  ];

  const highValueMatters = [
    {
      id: 1,
      name: "International Arbitration – EPC Contract",
      value: 285,
      stage: "Hearings Scheduled",
      owner: "Global Projects",
    },
    {
      id: 2,
      name: "Regulatory Investigation – Energy Pricing",
      value: 162,
      stage: "Replies Filed",
      owner: "Compliance",
    },
    {
      id: 3,
      name: "Class Action – Consumer Claims",
      value: 118,
      stage: "Discovery",
      owner: "Retail Business",
    },
  ];

  const alerts = {
    replyDeadlines: [
      {
        id: 1,
        title: "Vendor Notice – Payment Delay",
        dueDate: "2025-02-06",
        owner: "Legal Executive",
      },
      {
        id: 2,
        title: "Environmental Compliance Notice",
        dueDate: "2025-02-08",
        owner: "Sustainability Team",
      },
    ],
    hearings: [
      {
        id: 3,
        title: "Writ Petition – Land Acquisition",
        date: "2025-02-04",
        forum: "High Court (Bench 3)",
      },
      {
        id: 4,
        title: "Labour Appeal – Shift Allowances",
        date: "2025-02-05",
        forum: "Industrial Tribunal",
      },
    ],
    orders: [
      {
        id: 5,
        title: "Tax Assessment Challenge",
        uploadedOn: "2025-02-02",
        owner: "Finance User",
      },
    ],
  };

  const amountByCompany = useMemo(
    () => [
      {
        company: "Welspun Corp",
        amount: "₹780 Cr",
        subsidiaries: [
          { name: "Welspun Pipes", amount: "₹420 Cr" },
          { name: "Welspun Logistics", amount: "₹210 Cr" },
        ],
      },
      {
        company: "Welspun Energy",
        amount: "₹540 Cr",
        subsidiaries: [
          { name: "Solar Holdings", amount: "₹220 Cr" },
          { name: "Green Energy JV", amount: "₹185 Cr" },
        ],
      },
      {
        company: "Welspun Retail",
        amount: "₹360 Cr",
        subsidiaries: [
          { name: "Welspun Lifestyle", amount: "₹140 Cr" },
          { name: "Retail Stores", amount: "₹95 Cr" },
        ],
      },
    ],
    []
  );

  const upcomingHearings = [
    { id: 1, caseNumber: "WP/2024/14113", title: "Sahara vs Welspun Corp", date: "2025-10-25", forum: "High Court" },
    { id: 2, caseNumber: "ARB/2024/5678", title: "Contract Dispute - Vendor Agreement", date: "2025-10-27", forum: "Arbitration" },
    { id: 3, caseNumber: "CIV/2024/9012", title: "Property Dispute", date: "2025-10-28", forum: "District Court" },
  ];

  const quickLinks = [
    { label: "Add Notice", description: "Capture new pre-litigation matters", to: "/pre-litigation", icon: ClipboardList },
    { label: "Add Litigation", description: "Register new court cases", to: "/litigation", icon: Gavel },
    { label: "Import Litigation", description: "Bulk upload case portfolio", to: "/litigation", icon: Upload },
    { label: "Discovery Search", description: "Run case-wise intelligence", to: "/litigation", icon: FolderSearch },
  ];

  const filterOptions = {
    companies: [
      { value: "all", label: "All Companies" },
      { value: "welspun-corp", label: "Welspun Corp" },
      { value: "welspun-energy", label: "Welspun Energy" },
      { value: "welspun-retail", label: "Welspun Retail" },
    ],
    subsidiaries: [
      { value: "all", label: "All Subsidiaries" },
      { value: "pipes", label: "Welspun Pipes" },
      { value: "logistics", label: "Welspun Logistics" },
      { value: "solar", label: "Solar Holdings" },
    ],
    units: [
      { value: "all", label: "All Units" },
      { value: "mumbai", label: "Mumbai" },
      { value: "anjar", label: "Anjar" },
      { value: "dahej", label: "Dahej" },
    ],
    departments: [
      { value: "all", label: "All Departments" },
      { value: "legal", label: "Legal" },
      { value: "finance", label: "Finance" },
      { value: "operations", label: "Operations" },
      { value: "compliance", label: "Compliance" },
    ],
    types: [
      { value: "all", label: "All Matters" },
      { value: "notice", label: "Notice" },
      { value: "litigation", label: "Litigation" },
      { value: "arbitration", label: "Arbitration" },
    ],
    periods: [
      { value: "fy25", label: "FY 2024-25" },
      { value: "fy24", label: "FY 2023-24" },
      { value: "fy23", label: "FY 2022-23" },
    ],
  } as const;

  const calendarEvents = [
    {
      id: "CAL-001",
      title: "Appeal Hearing – Industrial Tribunal",
      date: addDays(new Date(), 1).toISOString(),
      type: "hearing" as const,
      venue: "Industrial Tribunal, Mumbai",
      owner: "Labour Team",
    },
    {
      id: "CAL-002",
      title: "Case Management – EPC Contract",
      date: addDays(new Date(), 3).toISOString(),
      type: "hearing" as const,
      venue: "High Court – Bench 2",
      owner: "Projects Legal",
    },
    {
      id: "CAL-003",
      title: "Reply Due – Vendor Notice",
      date: addDays(new Date(), 4).toISOString(),
      type: "dispute" as const,
      venue: "Drafting Room",
      owner: "Commercial Legal",
    },
    {
      id: "CAL-004",
      title: "Arbitration Filing Deadline",
      date: addDays(new Date(), 6).toISOString(),
      type: "dispute" as const,
      venue: "SIAC e-Portal",
      owner: "External Counsel",
    },
    {
      id: "CAL-005",
      title: "Dispute Review – Retail Claims",
      date: addDays(new Date(), 8).toISOString(),
      type: "dispute" as const,
      venue: "VC – Litigation Room",
      owner: "Retail Legal",
    },
  ];

  const upcomingCalendarEvents = useMemo(
    () =>
      [...calendarEvents]
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 4),
    [calendarEvents]
  );

  const calendarMonth = useMemo(
    () => (calendarEvents.length ? parseISO(calendarEvents[0].date) : new Date()),
    [calendarEvents]
  );

  const reports = [
    {
      title: "Notice Intelligence",
      items: ["By category & risk", "Upcoming replies", "High-value notices"],
    },
    {
      title: "Litigation Portfolio",
      items: ["Financial exposure", "Stage-wise pipeline", "Matters by law firm"],
    },
    {
      title: "Trends & Insights",
      items: ["Month-wise notices", "Court trends", "Opposite party analysis"],
    },
  ];

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Overview of all litigation and dispute matters</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Notices"
          value={`${noticeSummary.total}`}
          icon={FileText}
          trend={{ value: `${noticeSummary.open} open / ${noticeSummary.upcomingReplies} replies due`, isPositive: false }}
          variant="default"
        />
        <StatCard
          title="Litigation Cases"
          value={`${litigationSummary.total}`}
          icon={Gavel}
          trend={{ value: `Civil ${litigationSummary.civil} · Labour ${litigationSummary.labour}`, isPositive: false }}
          variant="warning"
        />
        <StatCard
          title="Overdue Matters"
          value="8"
          icon={AlertCircle}
          trend={{ value: "Reply & hearing alerts triggered", isPositive: false }}
          variant="destructive"
        />
        <StatCard
          title="Portfolio Value"
          value="₹5,840 Cr"
          icon={TrendingUp}
          trend={{ value: "₹1,650 Cr active litigation", isPositive: true }}
          variant="success"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers3 className="h-5 w-5 text-primary" />
              Risk Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {riskDistribution.map((risk) => (
              <div key={risk.level} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{risk.level} Risk</span>
                  <span className="text-muted-foreground">{risk.exposure}</span>
                </div>
                <Progress value={risk.percentage} aria-label={`${risk.level} risk distribution`} />
                <p className="text-xs text-muted-foreground">{risk.matters} matters · {risk.percentage}% of portfolio</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Amount Involved by Entity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {amountByCompany.map((entry) => (
              <div key={entry.company} className="rounded-lg border border-border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{entry.company}</p>
                    <p className="text-xs text-muted-foreground">Consolidated exposure</p>
                  </div>
                  <Badge variant="outline">{entry.amount}</Badge>
                </div>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {entry.subsidiaries.map((subsidiary) => (
                    <div key={subsidiary.name} className="rounded-md bg-muted/40 p-2 text-xs">
                      <p className="font-medium text-foreground">{subsidiary.name}</p>
                      <p className="text-muted-foreground">{subsidiary.amount}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden shadow-[var(--shadow-card)]">
        <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent pb-4">
          <CardTitle className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <span className="flex items-center gap-2 text-lg sm:text-xl">
              <CalendarDays className="h-5 w-5 text-primary" />
              Litigation Calendar
            </span>
            <p className="text-xs text-muted-foreground">
              Upcoming hearings, replies, and dispute milestones across entities
            </p>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-xl bg-white/70 p-3 shadow-sm ring-1 ring-border backdrop-blur-md transition duration-500 ease-out hover:-translate-y-1 hover:shadow-md dark:bg-card/80">
            <DayPicker
              mode="single"
              defaultMonth={calendarMonth}
              weekStartsOn={1}
              showOutsideDays
              modifiers={{
                hearings: calendarEvents.filter((event) => event.type === "hearing").map((event) => parseISO(event.date)),
                disputes: calendarEvents.filter((event) => event.type === "dispute").map((event) => parseISO(event.date)),
              }}
              modifiersClassNames={{
                hearings: "rdp-day-hearing",
                disputes: "rdp-day-dispute",
              }}
              className="w-full animate-in fade-in duration-700"
              captionLayout="dropdown-buttons"
              fromYear={2024}
              toYear={2026}
            />
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">
                <span className="h-2 w-2 rounded-full bg-primary" /> Hearings
              </span>
              <span className="flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-700 dark:bg-amber-500/20 dark:text-amber-200">
                <span className="h-2 w-2 rounded-full bg-amber-500" /> Replies & Disputes
              </span>
              <span className="flex items-center gap-2 rounded-full bg-muted px-3 py-1">
                <span className="h-2 w-2 rounded-full bg-muted-foreground/60" /> Tap a date to inspect due items
              </span>
            </div>
          </div>

          <div className="space-y-3 lg:space-y-4">
            {upcomingCalendarEvents.map((event) => (
              <div
                key={event.id}
                className="group flex flex-col gap-2 rounded-xl border border-border bg-gradient-to-r from-muted/60 via-background to-background p-4 transition-all duration-500 ease-out hover:-translate-y-1 hover:border-primary/60 hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground sm:text-base">
                      {event.title}
                    </p>
                    <p className="text-xs font-medium text-primary">
                      {format(parseISO(event.date), "EEEE, d LLL yyyy")}
                    </p>
                  </div>
                  <Badge variant="outline" className="border-primary/30 bg-primary/5 text-xs capitalize text-primary">
                    {event.type === "hearing" ? "Hearing" : "Dispute"}
                  </Badge>
                </div>
                <div className="flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                  <span className="flex items-center gap-2 rounded-md bg-secondary px-2 py-1 text-foreground">
                    <CalendarClock className="h-4 w-4 text-primary" />
                    {event.venue}
                  </span>
                  <span className="flex items-center gap-2 rounded-md bg-secondary px-2 py-1 text-foreground">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Owner: {event.owner}
                  </span>
                  <span className="flex items-center gap-2 rounded-md bg-secondary px-2 py-1 text-foreground">
                    <Gauge className="h-4 w-4 text-primary" />
                    Due in {Math.max(1, Math.ceil((parseISO(event.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} days
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gavel className="h-5 w-5 text-primary" />
              Upcoming Hearings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingHearings.map((hearing) => (
                <div
                  key={hearing.id}
                  className="flex flex-col gap-3 rounded-lg border border-border p-4 transition-all duration-300 hover:border-primary/50 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1 text-left sm:min-w-0">
                    <p className="text-sm font-medium text-foreground sm:truncate">{hearing.title}</p>
                    <p className="text-xs text-muted-foreground">{hearing.caseNumber}</p>
                    <Badge variant="outline" className="mt-2 w-fit sm:w-auto">
                      {hearing.forum}
                    </Badge>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-sm font-semibold text-foreground">
                      {new Date(hearing.date).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {Math.ceil((new Date(hearing.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Link to="/litigation">
              <Button variant="ghost" className="mt-4 w-full">
                View All Cases
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="h-5 w-5 text-primary" />
              High-Value Matters (&gt; ₹50 Cr)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {highValueMatters.map((matter) => (
                <div
                  key={matter.id}
                  className="flex items-start justify-between rounded-lg border border-border p-4 transition-all duration-300 hover:border-primary/50 hover:shadow-sm"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">{matter.name}</p>
                    <p className="text-xs text-muted-foreground">Owned by {matter.owner}</p>
                    <Badge variant="outline" className="mt-2">
                      {matter.stage}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-foreground">₹{matter.value} Cr</p>
                  </div>
                </div>
              ))}
            </div>
            <Link to="/pre-litigation">
              <Button variant="ghost" className="mt-4 w-full">
                View All Disputes
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-primary" />
              Alerts & Critical Timelines
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-foreground">Reply Deadlines (T-7/T-3/T-1)</h4>
              <div className="mt-3 space-y-2">
                {alerts.replyDeadlines.map((alert) => (
                  <div key={alert.id} className="rounded-md border border-border p-3 text-sm">
                    <p className="font-medium text-foreground">{alert.title}</p>
                    <p className="text-xs text-muted-foreground">Due {new Date(alert.dueDate).toLocaleDateString("en-IN")}</p>
                    <p className="text-xs text-muted-foreground">Owner: {alert.owner}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">Hearings Today / Tomorrow</h4>
              <div className="mt-3 space-y-2">
                {alerts.hearings.map((hearing) => (
                  <div key={hearing.id} className="rounded-md border border-border p-3 text-sm">
                    <p className="font-medium text-foreground">{hearing.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(hearing.date).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                      })}
                      {" · "}
                      {hearing.forum}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">Orders Uploaded</h4>
              <div className="mt-3 space-y-2">
                {alerts.orders.map((order) => (
                  <div key={order.id} className="rounded-md border border-border p-3 text-sm">
                    <p className="font-medium text-foreground">{order.title}</p>
                    <p className="text-xs text-muted-foreground">Uploaded on {new Date(order.uploadedOn).toLocaleDateString("en-IN")}</p>
                    <p className="text-xs text-muted-foreground">Owner: {order.owner}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-primary" />
              Quick Links & Workflows
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {quickLinks.map((link) => (
              <Link key={link.label} to={link.to} className="group">
                <div className="flex flex-col gap-3 rounded-lg border border-border p-4 transition-colors group-hover:border-primary/60 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className="flex items-center gap-2 text-sm font-semibold text-foreground sm:flex-wrap">
                      <link.icon className="h-4 w-4 text-primary" />
                      {link.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {link.description}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" className="w-full sm:w-auto">
                    Open
                  </Button>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            Portfolio Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Select value={filters.company} onValueChange={(value) => handleFilterChange("company", value)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Company" />
            </SelectTrigger>
            <SelectContent>
              {filterOptions.companies.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filters.subsidiary} onValueChange={(value) => handleFilterChange("subsidiary", value)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Subsidiary" />
            </SelectTrigger>
            <SelectContent>
              {filterOptions.subsidiaries.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filters.unit} onValueChange={(value) => handleFilterChange("unit", value)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Unit" />
            </SelectTrigger>
            <SelectContent>
              {filterOptions.units.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filters.department} onValueChange={(value) => handleFilterChange("department", value)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              {filterOptions.departments.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filters.type} onValueChange={(value) => handleFilterChange("type", value)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Matter Type" />
            </SelectTrigger>
            <SelectContent>
              {filterOptions.types.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filters.period} onValueChange={(value) => handleFilterChange("period", value)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              {filterOptions.periods.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Reports & Trend Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {reports.map((report) => (
              <div key={report.title} className="rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Sparkles className="h-4 w-4 text-primary" />
                  {report.title}
                </div>
                <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                  {report.items.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
