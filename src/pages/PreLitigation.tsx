import { useState } from "react";
import {
  AlertTriangle,
  BellRing,
  Briefcase,
  ClipboardList,
  Clock,
  FileText,
  Filter,
  Layers,
  Search,
  ShieldCheck,
  Trash2,
  TrendingUp,
  Upload,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StatCard from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import NewDisputeDialog from "@/components/NewDisputeDialog";
import { useDisputes } from "@/hooks/useDisputes";
import { usePermissions } from "@/hooks/usePermissions";
import { format } from "date-fns";
import { toast } from "sonner";

const STATUS_OPTIONS = [
  {
    value: "Pending",
    label: "Pending",
    indicator: "bg-amber-500",
    textClass: "text-amber-700",
  },
  {
    value: "Under Review",
    label: "Under Review",
    indicator: "bg-blue-500",
    textClass: "text-blue-700",
  },
  {
    value: "Response Sent",
    label: "Response Sent",
    indicator: "bg-emerald-500",
    textClass: "text-emerald-700",
  },
  {
    value: "Closed",
    label: "Closed",
    indicator: "bg-muted-foreground/70",
    textClass: "text-muted-foreground",
  },
] as const;

const STATUS_LOOKUP = STATUS_OPTIONS.reduce<Record<string, (typeof STATUS_OPTIONS)[number]>>(
  (acc, option) => {
    acc[option.value] = option;
    return acc;
  },
  {}
);

const getStatusMeta = (status: string) =>
  STATUS_LOOKUP[status] ?? {
    value: status,
    label: status,
    indicator: "bg-muted-foreground/40",
    textClass: "text-foreground",
  };

export default function PreLitigation() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { disputes, loading, deleteDispute, updateDisputeStatus } = useDisputes();
  const { hasPermission } = usePermissions();

  const summary = {
    total: disputes.length,
    open: disputes.filter((dispute) => dispute.status !== "Closed").length,
    closed: disputes.filter((dispute) => dispute.status === "Closed").length,
    upcomingReplies: disputes.filter((dispute) => {
      if (!dispute.reply_due_date) return false;
      const dueDate = new Date(dispute.reply_due_date);
      const today = new Date();
      const diff = (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 7;
    }).length,
  };

  const intakeBlueprint = [
    {
      title: "Parties & Ownership",
      items: [
        "Company, Subsidiary, Unit",
        "Opposite Party & Subsidiaries",
        "Department & Reporting Manager",
        "Assigned Legal Officer",
      ],
    },
    {
      title: "Notice Intelligence",
      items: [
        "Category & Sub-category",
        "Notice & Receipt Dates",
        "Last Date for Reply",
        "Relief Sought & Relevant Law",
      ],
    },
    {
      title: "Risk & Financials",
      items: [
        "Risk Rating & Comments",
        "Amount Involved",
        "Provision & Contingent Liability",
        "Team Responsibility",
      ],
    },
    {
      title: "Law Firm Mapping",
      items: [
        "Company's Law Firm",
        "Opposite Party Firm",
        "Negotiation / Escalation Notes",
        "Document Checklist",
      ],
    },
  ];

  const lifecycleStages = [
    "Notice Received",
    "Reply Drafted",
    "Reply Sent",
    "Counter-Reply Received",
    "Negotiations / Internal Discussions",
    "Escalation",
    "Closed or Converted to Litigation",
  ];

  const alertMatrix = [
    { title: "Notice Logged", detail: "Instant alert to assigned officer & manager" },
    { title: "Reply Due T-7/T-3/T-1", detail: "Automated reminders with escalation path" },
    { title: "Reply Overdue", detail: "Red flag on dashboard & mail to legal manager" },
    { title: "Escalation", detail: "Escalate to reporting manager & CXO" },
  ];

  const searchFilters = [
    "Company / Subsidiary / Unit",
    "Category & Sub-category",
    "Risk & Status",
    "State & City",
    "Free-text across parties, references, facts",
  ];

  const responsibilityMatrix = [
    { role: "Legal Executive", duties: "Capture notice, draft reply, upload documents" },
    { role: "Legal Manager", duties: "Review drafts, approve responses, track negotiations" },
    { role: "Business User", duties: "Provide initial facts, review response for accuracy" },
    { role: "Finance User", duties: "Validate exposure, update provisions" },
  ];

  const filteredDisputes = disputes.filter((dispute) => {
    const matchesSearch =
      dispute.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dispute.dispute_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dispute.responsible_user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dispute.notice_from.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || dispute.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    totalValue: disputes.reduce((sum, d) => sum + d.value, 0),
    byType: disputes.reduce((acc, d) => {
      acc[d.dispute_type] = (acc[d.dispute_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byStatus: disputes.reduce((acc, d) => {
      acc[d.status] = (acc[d.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading disputes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pre-Litigation Disputes</h1>
          <p className="mt-1 text-muted-foreground">Manage disputes before court filing</p>
        </div>
        {hasPermission("add_dispute") && <NewDisputeDialog />}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Open Notices"
          value={summary.open}
          icon={ClipboardList}
          trend={{ value: `${summary.upcomingReplies} replies due in 7 days`, isPositive: false }}
          variant="warning"
        />
        <StatCard
          title="Closed Notices"
          value={summary.closed}
          icon={ShieldCheck}
          trend={{ value: `${summary.total} total logged`, isPositive: true }}
          variant="success"
        />
        <StatCard
          title="Financial Exposure"
          value={`₹${stats.totalValue.toFixed(1)} Cr`}
          icon={TrendingUp}
          trend={{ value: "Includes provisions & contingencies", isPositive: true }}
          variant="default"
        />
        <StatCard
          title="High Risk Notices"
          value={stats.byStatus["Pending"] ?? 0}
          icon={AlertTriangle}
          trend={{ value: "Monitor for escalation", isPositive: false }}
          variant="destructive"
        />
      </div>

      <Card className="shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Notice Intake Blueprint
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {intakeBlueprint.map((section) => (
            <div key={section.title} className="rounded-lg border border-border p-4">
              <p className="text-sm font-semibold text-foreground">{section.title}</p>
              <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                {section.items.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Notice Lifecycle & Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {lifecycleStages.map((stage, index) => (
              <div key={stage} className="flex items-start gap-3 rounded-md border border-border p-3 text-sm">
                <span className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {index + 1}
                </span>
                <div>
                  <p className="font-medium text-foreground">{stage}</p>
                  <p className="text-xs text-muted-foreground">
                    {index === 0 && "Intake through portal with audit trails"}
                    {index === 1 && "Drafting assisted by templates & GenAI"}
                    {index === 2 && "Reply dispatch logged with evidence"}
                    {index === 3 && "Capture counter positions & attach documents"}
                    {index === 4 && "Internal meetings & negotiation outcomes"}
                    {index === 5 && "Escalate to management with risk commentary"}
                    {index === 6 && "Close the matter or convert into litigation case"}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BellRing className="h-5 w-5" />
              Alerts & Escalations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alertMatrix.map((item) => (
              <div key={item.title} className="rounded-md border border-border p-3 text-sm">
                <p className="font-medium text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.detail}</p>
              </div>
            ))}
            <div className="rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
              Escalations auto-update dashboards, calendars and send notifications to role-based recipients.
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search & Discovery
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Combine filters and free-text search to instantly surface historical notices, precedents and risk learnings.
            </p>
            <ul className="space-y-2 text-xs text-muted-foreground">
              {searchFilters.map((filter) => (
                <li key={filter} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>{filter}</span>
                </li>
              ))}
            </ul>
            <div className="rounded-md border border-dashed border-primary/40 p-3 text-xs text-primary">
              Tip: Use Discovery Search for cross-matter research and case conversion readiness.
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Responsibility & Financial Tracking
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {responsibilityMatrix.map((item) => (
              <div key={item.role} className="rounded-md border border-border p-3 text-sm">
                <p className="font-medium text-foreground">{item.role}</p>
                <p className="text-xs text-muted-foreground">{item.duties}</p>
              </div>
            ))}
            <div className="rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
              Financial sections capture amount involved, provisioning status, contingent liabilities and link to finance reviews.
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-[var(--shadow-card)]">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>All Disputes</CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search disputes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full sm:w-[250px]"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Under Review">Under Review</SelectItem>
                  <SelectItem value="Response Sent">Response Sent</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredDisputes.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No disputes found</h3>
              <p className="text-muted-foreground mt-2">
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "Create your first dispute to get started"}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Notice From</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Reply Due</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDisputes.map((dispute) => {
                    const statusMeta = getStatusMeta(dispute.status);

                    return (
                      <TableRow key={dispute.id} className="transition-colors hover:bg-muted/50">
                        <TableCell className="font-medium">{dispute.company}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{dispute.dispute_type}</Badge>
                        </TableCell>
                        <TableCell>{dispute.notice_from}</TableCell>
                        <TableCell className="font-semibold">₹{dispute.value}Cr</TableCell>
                        <TableCell>
                          {format(new Date(dispute.reply_due_date), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={dispute.status}
                            onValueChange={(value) => updateDisputeStatus(dispute.id, value)}
                          >
                            <SelectTrigger className="w-[160px] justify-between bg-muted/40 border-border/60">
                              <div className="flex items-center gap-2">
                                <span className={`h-2.5 w-2.5 rounded-full ${statusMeta.indicator}`} />
                                <span className={`text-sm font-medium ${statusMeta.textClass}`}>
                                  {statusMeta.label}
                                </span>
                              </div>
                              <SelectValue className="sr-only" />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  <div className="flex items-center gap-2">
                                    <span className={`h-2.5 w-2.5 rounded-full ${option.indicator}`} />
                                    <span className="text-sm font-medium text-foreground">
                                      {option.label}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {dispute.responsible_user}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {hasPermission("delete_dispute") && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Dispute</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this dispute? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteDispute(dispute.id)}>
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
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

      <div className="grid gap-6 md:grid-cols-3">
        <StatCard
          title="Total Disputes"
          value={disputes.length.toString()}
          icon={Clock}
          trend={stats.byStatus["Pending"] ? {
            value: `${stats.byStatus["Pending"]} pending action`,
            isPositive: false
          } : undefined}
        />
        <StatCard
          title="By Type"
          value={Object.keys(stats.byType).length.toString()}
          icon={FileText}
        />
        <StatCard
          title="Total Value"
          value={`₹${stats.totalValue.toFixed(2)} Cr`}
          icon={TrendingUp}
          variant="success"
        />
      </div>
    </div>
  );
}
