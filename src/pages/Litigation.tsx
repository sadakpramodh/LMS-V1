import { useMemo, useRef, useState } from "react";
import {
  BellRing,
  Building2,
  Calendar,
  FileText,
  Filter,
  FolderSearch,
  Gavel,
  Layers,
  Search,
  Plus,
  ScanSearch,
  Scale,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import * as XLSX from "xlsx";
import {
  useLitigationCases,
  type LitigationCaseInsert,
} from "@/hooks/useLitigationCases";
import { usePermissions } from "@/hooks/usePermissions";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import StatCard from "@/components/StatCard";
import { Textarea } from "@/components/ui/textarea";

export default function Litigation() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { cases, loading, deleteCase, bulkInsertCases } = useLitigationCases();
  const { hasPermission } = usePermissions();

  const litigationStats = useMemo(() => {
    const total = cases.length;
    const financialExposure = cases.reduce((sum, item) => sum + (item.claim_amount ?? 0), 0);
    const interestExposure = cases.reduce((sum, item) => sum + (item.interest_amount ?? 0), 0);
    const highValue = cases.filter((item) => (item.claim_amount ?? 0) > 5_00_00_000).length;
    const withNextHearing = cases.filter((item) => Boolean(item.next_hearing_date)).length;
    const byCategory = cases.reduce<Record<string, number>>((acc, item) => {
      const category = (item.category ?? "Uncategorized").toLowerCase();
      acc[category] = (acc[category] ?? 0) + 1;
      return acc;
    }, {});

    return {
      total,
      financialExposure,
      interestExposure,
      highValue,
      withNextHearing,
      byCategory,
    };
  }, [cases]);

  const intakeChecklist = [
    {
      title: "Case Essentials",
      items: [
        "Category, Sub-category, Case Type",
        "Case Number, Year & Forum",
        "Company, Subsidiary, Unit / Region",
        "Opposing Parties & Authorized Signatory",
      ],
    },
    {
      title: "Matter Details",
      items: [
        "Facts, Issues, Prayers",
        "Legal Nature & Sub-nature",
        "KMP Involvement & Team",
        "Pleadings & Orders Upload",
      ],
    },
    {
      title: "Financial Capture",
      items: [
        "Claim Amount, Interest, Penalties",
        "Provision & Contingent Liability",
        "Exposure by Entity",
        "Linked Notices / Arbitrations",
      ],
    },
    {
      title: "Counsel & Law Firms",
      items: [
        "Company Counsel & Law Firm",
        "Opposite Party Counsel",
        "Engagement Letters & Fees",
        "Hearing Strategy Notes",
      ],
    },
  ];

  const lifecycleTimeline = [
    "Case filed",
    "Court accepted & assigned number",
    "First hearing",
    "Replies/Rejoinders filed",
    "Applications filed",
    "Orders uploaded",
    "Final hearing",
    "Judgment",
    "Appeal (if any)",
    "Closure",
  ];

  const discoveryCapabilities = [
    "Case number & year",
    "Court name / type / state / district / bench",
    "Case type & category",
    "CNR number",
    "Status & orders availability",
  ];

  const integrationHighlights = [
    "Crawler sync with High Courts, District Courts, Magistrate Courts, Arbitration portals, CMMS Courts",
    "Automatic fetch of next hearing, bench/judge, latest orders, status/stage",
    "GenAI generated case summaries, draft generation, clause suggestions",
    "Classification for category/sub-category & timeline auto-generation",
  ];

  // Sanitize Excel row to prevent formula injection
  const sanitizeValue = (value: unknown): unknown => {
    if (typeof value === "string") {
      // Strip leading formula characters (=, +, -, @)
      return value.replace(/^[=+\-@]/, "").trim();
    }
    return value;
  };

  const getColumnValue = (
    row: Record<string, unknown>,
    possibleNames: string[]
  ): unknown => {
    for (const name of possibleNames) {
      const entry = Object.entries(row).find(
        ([key]) => key.trim().toLowerCase() === name.trim().toLowerCase()
      );

      if (!entry) {
        continue;
      }

      const [, value] = entry;
      if (value !== undefined && value !== null && value !== "") {
        return value;
      }
    }

    return null;
  };

  const getStringValue = (value: unknown): string => {
    if (typeof value === "string") {
      return value;
    }
    if (value === null || value === undefined) {
      return "";
    }
    return String(value);
  };

  const toISODate = (year: number, month: number, day: number): string | null => {
    const isoDate = new Date(Date.UTC(year, month - 1, day));
    if (Number.isNaN(isoDate.getTime())) {
      return null;
    }
    return isoDate.toISOString().split("T")[0];
  };

  const parseDateValue = (value: unknown): string | null => {
    if (value === null || value === undefined || value === "") {
      return null;
    }

    if (value instanceof Date) {
      return toISODate(value.getFullYear(), value.getMonth() + 1, value.getDate());
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      const excelDate = XLSX.SSF?.parse_date_code?.(value);
      if (excelDate) {
        return toISODate(excelDate.y, excelDate.m, excelDate.d);
      }
    }

    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed === "") {
        return null;
      }

      const ddMmYyyyMatch = trimmed.match(/^([0-3]?\d)[-/](0?\d|1[0-2])[-/](\d{4})$/);
      if (ddMmYyyyMatch) {
        const [, dd, mm, yyyy] = ddMmYyyyMatch;
        const day = Number.parseInt(dd, 10);
        const month = Number.parseInt(mm, 10);
        const year = Number.parseInt(yyyy, 10);
        return toISODate(year, month, day);
      }

      const isoLike = new Date(trimmed);
      if (!Number.isNaN(isoLike.getTime())) {
        return toISODate(isoLike.getFullYear(), isoLike.getMonth() + 1, isoLike.getDate());
      }
    }

    return null;
  };

  const parseNumberValue = (value: unknown): number | null => {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string") {
      const parsed = parseFloat(value.replace(/[^0-9.-]/g, ""));
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!hasPermission("upload_excel_litigation")) {
      toast.error("You don't have permission to upload Excel files");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }
    
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB limit)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File too large. Maximum size allowed is 5MB.");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    try {
      const extension = file.name.toLowerCase();
      const allowedExtensions = [".xlsx", ".xls", ".csv"];

      if (!allowedExtensions.some((ending) => extension.endsWith(ending))) {
        toast.error("Unsupported file type. Please upload an Excel or CSV file.");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      const workbook = extension.endsWith(".csv")
        ? XLSX.read(await file.text(), { type: "string" })
        : XLSX.read(await file.arrayBuffer());

      // Look for Sheet1 specifically
      const sheetName = workbook.SheetNames.includes("Sheet1") ? "Sheet1" : workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
        defval: "",
      });

      console.log("Excel data parsed:", jsonData);
      console.log("First row sample:", jsonData[0]);

      if (jsonData.length === 0) {
        toast.error("No data found in the Excel file");
        return;
      }

      // Validate row count (1000 row limit)
      const MAX_ROWS = 1000;
      if (jsonData.length > MAX_ROWS) {
        toast.error(`Too many rows. Maximum ${MAX_ROWS} rows allowed. Found ${jsonData.length} rows.`);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      const casesData: LitigationCaseInsert[] = jsonData.map((row, index) => {
        const sanitizedRow: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(row)) {
          sanitizedRow[key] = sanitizeValue(value);
        }

        const srNoRaw =
          getColumnValue(sanitizedRow, ["Sr. No.", "Sr No", "SrNo", "Sr.No.", "Serial No"]) ?? index + 1;
        const srNo = parseNumberValue(srNoRaw) ?? index + 1;

        const caseData: LitigationCaseInsert = {
          sr_no: srNo,
          parties: getStringValue(
            getColumnValue(sanitizedRow, ["Parties", "Party", "parties"])
          )
            .substring(0, 500)
            .trim(),
          forum: getStringValue(
            getColumnValue(sanitizedRow, ["Forum", "forum", "Court"])
          )
            .substring(0, 200)
            .trim(),
          particular: getStringValue(
            getColumnValue(sanitizedRow, ["Particular", "particular", "Particulars", "Details"])
          )
            .substring(0, 1000)
            .trim() || null,
          start_date: null,
          last_hearing_date: null,
          next_hearing_date: null,
          amount_involved: null,
          treatment_resolution: getStringValue(
            getColumnValue(sanitizedRow, ["Treatment undertaken Resolution", "Treatment", "Resolution", "Treatment undertaken", "treatment_resolution"])
          )
            .substring(0, 2000)
            .trim() || null,
          remarks: getStringValue(
            getColumnValue(sanitizedRow, ["Remarks", "remarks", "Remark", "Notes"])
          )
            .substring(0, 2000)
            .trim() || null,
          status: "Active",
        };

        const startDate = parseDateValue(
          getColumnValue(sanitizedRow, ["Start Date", "StartDate", "start_date", "Date of Filing"])
        );
        if (startDate) {
          caseData.start_date = startDate;
        }

        const lastHearingDate = parseDateValue(
          getColumnValue(sanitizedRow, ["Last Date of Hearing", "Last Hearing Date", "LastHearingDate", "last_hearing_date", "Last Hearing"])
        );
        if (lastHearingDate) {
          caseData.last_hearing_date = lastHearingDate;
        }

        const nextDate = parseDateValue(
          getColumnValue(sanitizedRow, ["Next Date", "NextDate", "next_hearing_date", "Next Hearing Date", "Next Hearing"])
        );
        if (nextDate) {
          caseData.next_hearing_date = nextDate;
        }

        const amount = parseNumberValue(
          getColumnValue(sanitizedRow, ["Amount involved", "Amount Involved", "AmountInvolved", "amount_involved", "Amount"])
        );
        if (amount !== null) {
          const MAX_AMOUNT = 999_999_999_999; // 12 digits max
          if (amount >= 0 && amount <= MAX_AMOUNT) {
            caseData.amount_involved = amount;
          } else {
            console.warn(`Amount out of range for row ${index + 1}:`, amount);
          }
        }

        return caseData;
      });

      console.log("Processed cases data:", casesData);

      // Validate that at least parties and forum are provided
      const validCases = casesData.filter(
        (caseItem) => caseItem.parties !== "" && caseItem.forum !== ""
      );
      
      if (validCases.length === 0) {
        toast.error("No valid cases found. Please ensure 'Parties' and 'Forum' columns are present.");
        return;
      }

      if (validCases.length < casesData.length) {
        toast.warning(`${casesData.length - validCases.length} rows skipped due to missing required fields`);
      }

      await bulkInsertCases(validCases);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: unknown) {
      console.error("Error processing Excel file:", error);
      toast.error("Failed to process Excel file. Please check the format.");
    }
  };

  const handleDeleteCase = async (id: string) => {
    if (!hasPermission("delete_dispute")) {
      toast.error("You don't have permission to delete cases");
      return;
    }
    
    if (window.confirm("Are you sure you want to delete this case?")) {
      await deleteCase(id);
    }
  };

  const filteredCases = cases.filter((litigationCase) => {
    const matchesSearch =
      searchQuery === "" ||
      litigationCase.parties.toLowerCase().includes(searchQuery.toLowerCase()) ||
      litigationCase.forum.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || litigationCase.status.toLowerCase() === statusFilter.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Litigation Management</h1>
          <p className="mt-1 text-muted-foreground">
            Track court matters, monitor hearings and manage financial exposure across the portfolio
          </p>
        </div>
        <div className="flex gap-2">
          {hasPermission("upload_excel_litigation") && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                Import Litigation
              </Button>
            </>
          )}
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Litigation
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Matters"
          value={litigationStats.total}
          icon={Gavel}
          trend={{
            value: `${litigationStats.byCategory.civil ?? 0} Civil · ${litigationStats.byCategory.labour ?? 0} Labour`,
            isPositive: false,
          }}
          variant="default"
        />
        <StatCard
          title="Financial Exposure"
          value={new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
          }).format(litigationStats.financialExposure)}
          icon={Building2}
          trend={{ value: `${litigationStats.highValue} high value matters`, isPositive: false }}
          variant="warning"
        />
        <StatCard
          title="Interest & Penalties"
          value={new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
          }).format(litigationStats.interestExposure)}
          icon={Scale}
          trend={{ value: "Tracking accrued interest & penalty", isPositive: false }}
          variant="default"
        />
        <StatCard
          title="Upcoming Hearings"
          value={litigationStats.withNextHearing}
          icon={Calendar}
          trend={{ value: "Synced to calendar & alerts", isPositive: true }}
          variant="success"
        />
      </div>

      <Card className="shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Case Intake Checklist
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {intakeChecklist.map((section) => (
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
              Litigation Lifecycle & Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {lifecycleTimeline.map((stage, index) => (
              <div key={stage} className="flex items-start gap-3 rounded-md border border-border p-3 text-sm">
                <span className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {index + 1}
                </span>
                <div>
                  <p className="font-medium text-foreground">{stage}</p>
                  <p className="text-xs text-muted-foreground">
                    {index === 0 && "Log pleadings and attach filings"}
                    {index === 1 && "Capture CNR / diary numbers via crawler"}
                    {index === 2 && "Auto-create hearing entry & calendar invite"}
                    {index === 3 && "Track reply / rejoinder filings"}
                    {index === 4 && "Monitor interim applications & tasks"}
                    {index === 5 && "Upload orders with OCR summaries"}
                    {index === 6 && "Readiness tracker for final arguments"}
                    {index === 7 && "Capture judgment & impact"}
                    {index === 8 && "Escalate for appeal decisions"}
                    {index === 9 && "Close matter with audit log"}
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
              Calendar & Task Sync
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="rounded-md border border-border p-3">
              Hearing calendar shows bench, judge, location, last hearing status and upcoming tasks.
            </div>
            <div className="rounded-md border border-border p-3">
              Notice calendar highlights received dates, reply due, category and risk for monitoring.
            </div>
            <div className="rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
              Filter calendars by company, subsidiary, unit, category, risk, court and period (month/year).
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderSearch className="h-5 w-5" />
              Discovery (Case-wise Search)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Search by identifiers or perform a federated search across orders and pleadings. Missing data is clearly highlighted for follow-up.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <Input placeholder="Case Number" />
              <Input placeholder="Case Year" />
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Court Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High Court</SelectItem>
                  <SelectItem value="district">District Court</SelectItem>
                  <SelectItem value="magistrate">Magistrate Court</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="State" />
              <Input placeholder="District" />
              <Input placeholder="Bench" />
              <Input placeholder="Case Type" />
              <Input placeholder="CNR Number" />
            </div>
            <Textarea placeholder="Free text search – parties, facts, orders" />
            <Button className="gap-2">
              <ScanSearch className="h-4 w-4" />
              Run Discovery
            </Button>
            <ul className="space-y-2 text-xs text-muted-foreground">
              {discoveryCapabilities.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Bulk Import & Validation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="rounded-md border border-border p-3">
              Download templates, populate litigation data and upload Excel for validation. Invalid data, duplicates and pre-existing cases are flagged.
            </div>
            <div className="rounded-md border border-border p-3">
              Applies to both litigation and notice imports with staged review before final commit.
            </div>
            <div className="rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
              Final import preserves original files and writes audit logs for compliance.
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Integrations & Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {integrationHighlights.map((item) => (
            <div key={item} className="rounded-lg border border-border p-4 text-xs text-muted-foreground">
              {item}
            </div>
          ))}
        </CardContent>
      </Card>

      {hasPermission("upload_excel_litigation") && (
        <Alert className="shadow-[var(--shadow-card)] border-dashed">
          <Upload className="h-4 w-4" />
          <AlertTitle>Bulk upload tips</AlertTitle>
          <AlertDescription>
            Upload Excel (<code>.xls</code>, <code>.xlsx</code>) or CSV files. Dates should use the <strong>dd-mm-yyyy</strong>
            format. Amount columns may include currency symbols—only numeric values are processed.
          </AlertDescription>
        </Alert>
      )}

      <Card className="shadow-[var(--shadow-card)]">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>All Cases</CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search cases..."
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
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sr. No.</TableHead>
                  <TableHead>Parties</TableHead>
                  <TableHead>Forum</TableHead>
                  <TableHead>Particular</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Last Hearing</TableHead>
                  <TableHead>Next Hearing</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Treatment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                      Loading cases...
                    </TableCell>
                  </TableRow>
                ) : filteredCases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                      No litigation cases found. Upload an Excel file to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCases.map((litigationCase) => (
                    <TableRow key={litigationCase.id} className="transition-colors hover:bg-muted/50">
                      <TableCell className="font-medium">{litigationCase.sr_no || "-"}</TableCell>
                      <TableCell>{litigationCase.parties}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{litigationCase.forum}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{litigationCase.particular || "-"}</TableCell>
                      <TableCell>
                        {litigationCase.start_date ? (
                          <span className="text-sm">
                            {new Date(litigationCase.start_date).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {litigationCase.last_hearing_date ? (
                          <span className="text-sm">
                            {new Date(litigationCase.last_hearing_date).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {litigationCase.next_hearing_date ? (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">
                              {new Date(litigationCase.next_hearing_date).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {litigationCase.amount_involved ? `₹${Number(litigationCase.amount_involved).toFixed(2)}` : "-"}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {litigationCase.treatment_resolution || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={litigationCase.status.toLowerCase() === "active" ? "active" : "closed"}>
                          {litigationCase.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {hasPermission("delete_dispute") && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteCase(litigationCase.id)}
                              className="gap-1 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                              Delete
                            </Button>
                          )}
                          <Button variant="outline" size="sm" className="gap-1">
                            <FileText className="h-3 w-3" />
                            Documents
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="text-sm">By Forum</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">High Court</span>
              <span className="font-semibold text-foreground">8</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">District Court</span>
              <span className="font-semibold text-foreground">6</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Arbitration</span>
              <span className="font-semibold text-foreground">5</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Labour Court</span>
              <span className="font-semibold text-foreground">4</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="text-sm">By Stage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Filing</span>
              <span className="font-semibold text-foreground">3</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Replies</span>
              <span className="font-semibold text-foreground">5</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Hearing</span>
              <span className="font-semibold text-warning">8</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Judgment</span>
              <span className="font-semibold text-success">7</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="text-sm">Risk Assessment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">High Risk</span>
              <span className="font-semibold text-destructive">5</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Medium Risk</span>
              <span className="font-semibold text-warning">10</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Low Risk</span>
              <span className="font-semibold text-success">8</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Closed</span>
              <span className="font-semibold text-muted-foreground">15</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
