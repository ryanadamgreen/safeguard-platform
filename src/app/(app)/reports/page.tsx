"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { FileText, Download, Filter, Loader2 } from "lucide-react";
import { useHome } from "@/contexts/home-context";
import { useAuth } from "@/contexts/auth-context";
import { getReportsByHome, getChildrenByHome } from "@/lib/queries";
import {
  SAFEGUARDING_CATEGORY_LABELS,
  type SafeguardingCategory,
} from "@/types";
import { format } from "date-fns";

const categoryOptions: { value: string; label: string }[] = [
  { value: "all", label: "All Categories" },
  ...Object.entries(SAFEGUARDING_CATEGORY_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
];

export default function ReportsPage() {
  const { selectedHome, loading: homeLoading } = useHome();
  const { loading: authLoading } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterChild, setFilterChild] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  useEffect(() => {
    if (authLoading || homeLoading || !selectedHome) return;

    async function load() {
      setLoading(true);
      try {
        const [r, c] = await Promise.all([
          getReportsByHome(selectedHome!.id),
          getChildrenByHome(selectedHome!.id),
        ]);
        setReports(r);
        setChildren(c);
      } catch (err) {
        console.error("Failed to load reports:", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [selectedHome, authLoading, homeLoading]);

  if (authLoading || homeLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const filteredReports = reports.filter((r: any) => {
    if (filterChild !== "all" && r.child_id !== filterChild) return false;
    if (filterCategory !== "all" && r.category !== filterCategory) return false;
    return true;
  });

  const getCategoryColor = (category: SafeguardingCategory) => {
    const colors: Record<SafeguardingCategory, string> = {
      adult_content: "bg-red-100 text-red-800",
      gambling: "bg-orange-100 text-orange-800",
      violence: "bg-red-100 text-red-800",
      drugs: "bg-purple-100 text-purple-800",
      self_harm: "bg-pink-100 text-pink-800",
      proxy_vpn: "bg-yellow-100 text-yellow-800",
    };
    return colors[category];
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between md:flex-row flex-col md:items-center items-start gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-sm text-gray-500">
            Safeguarding events for {selectedHome?.name}
          </p>
        </div>
        <Button className="gap-2 md:w-auto w-full">
          <Download className="h-4 w-4" />
          Download PDF
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          {/* Desktop: single row */}
          <div className="hidden md:flex items-center gap-4">
            <Filter className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <Select
              value={filterChild}
              onValueChange={(v) => setFilterChild(v ?? "all")}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Children" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Children</SelectItem>
                {children.map((child: any) => (
                  <SelectItem key={child.id} value={child.id}>
                    {child.initials}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filterCategory}
              onValueChange={(v) => setFilterCategory(v ?? "all")}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(filterChild !== "all" || filterCategory !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterChild("all");
                  setFilterCategory("all");
                }}
              >
                Clear filters
              </Button>
            )}
          </div>

          {/* Mobile: stacked */}
          <div className="flex md:hidden flex-col gap-2">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-600">Filters</span>
            </div>
            <Select
              value={filterChild}
              onValueChange={(v) => setFilterChild(v ?? "all")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Children" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Children</SelectItem>
                {children.map((child: any) => (
                  <SelectItem key={child.id} value={child.id}>
                    {child.initials}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filterCategory}
              onValueChange={(v) => setFilterCategory(v ?? "all")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(filterChild !== "all" || filterCategory !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                className="self-start"
                onClick={() => {
                  setFilterChild("all");
                  setFilterCategory("all");
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reports — Desktop table */}
      <Card className="hidden md:block">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-5 w-5 text-blue-600" />
            Safeguarding Events
            <Badge variant="secondary" className="ml-1">
              {filteredReports.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Child</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.map((report: any) => (
                <TableRow key={report.id}>
                  <TableCell>
                    <span className="font-semibold">
                      {report.child_initials}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">
                    {report.device_name}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`text-xs ${getCategoryColor(report.category)}`}
                    >
                      {SAFEGUARDING_CATEGORY_LABELS[report.category as SafeguardingCategory]}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm text-gray-500">
                    {report.domain}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        report.action === "blocked"
                          ? "destructive"
                          : "secondary"
                      }
                      className="text-xs"
                    >
                      {report.action === "blocked" ? "Blocked" : "Allowed"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {format(
                      new Date(report.timestamp),
                      "dd MMM yyyy HH:mm"
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filteredReports.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-8 text-center text-gray-400"
                  >
                    No reports match the current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Reports — Mobile card list */}
      <div className="md:hidden space-y-2">
        <div className="flex items-center gap-2 px-1">
          <FileText className="h-5 w-5 text-blue-600" />
          <span className="text-sm font-semibold text-gray-700">
            Safeguarding Events
          </span>
          <Badge variant="secondary" className="ml-1">
            {filteredReports.length}
          </Badge>
        </div>

        {filteredReports.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-gray-400">
              No reports match the current filters.
            </CardContent>
          </Card>
        ) : (
          filteredReports.map((report: any) => (
            <Card key={report.id} className="overflow-hidden">
              <CardContent className="px-4 py-3 space-y-1.5">
                {/* Row 1: initials + category + action + time */}
                <div className="flex items-center gap-2">
                  {/* Child initials circle */}
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                    {report.child_initials}
                  </div>

                  {/* Category badge */}
                  <Badge
                    className={`text-[10px] px-1.5 ${getCategoryColor(report.category)}`}
                  >
                    {SAFEGUARDING_CATEGORY_LABELS[report.category as SafeguardingCategory]}
                  </Badge>

                  {/* Action badge */}
                  <Badge
                    variant={
                      report.action === "blocked" ? "destructive" : "secondary"
                    }
                    className="text-[10px] px-1.5"
                  >
                    {report.action === "blocked" ? "Blocked" : "Allowed"}
                  </Badge>

                  {/* Time — push to right */}
                  <span className="ml-auto text-[10px] text-gray-400 flex-shrink-0">
                    {format(new Date(report.timestamp), "dd MMM HH:mm")}
                  </span>
                </div>

                {/* Row 2: device name */}
                <p className="text-xs text-gray-500">{report.device_name}</p>

                {/* Row 3: domain */}
                <p className="truncate font-mono text-[11px] text-gray-400">
                  {report.domain}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
