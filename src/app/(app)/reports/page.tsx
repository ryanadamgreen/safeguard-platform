"use client";

import { useState } from "react";
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
import { FileText, Download, Filter } from "lucide-react";
import { reports, children } from "@/lib/mock-data";
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
  const homeId = "home-1";
  const [filterChild, setFilterChild] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  const homeChildren = children.filter((c) => c.home_id === homeId);
  const homeReports = reports.filter((r) => r.home_id === homeId);

  const filteredReports = homeReports.filter((r) => {
    if (filterChild !== "all" && r.child_id !== filterChild) return false;
    if (filterCategory !== "all" && r.category !== filterCategory) return false;
    return true;
  });

  const sortedReports = [...filteredReports].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-sm text-gray-500">
            Safeguarding events for Meadow House
          </p>
        </div>
        <Button className="gap-2">
          <Download className="h-4 w-4" />
          Download PDF
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex items-center gap-4 py-4">
          <Filter className="h-4 w-4 text-gray-400" />
          <Select value={filterChild} onValueChange={(v) => setFilterChild(v ?? "all")}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Children" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Children</SelectItem>
              {homeChildren.map((child) => (
                <SelectItem key={child.id} value={child.id}>
                  {child.initials}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v ?? "all")}>
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
        </CardContent>
      </Card>

      {/* Reports table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-5 w-5 text-blue-600" />
            Safeguarding Events
            <Badge variant="secondary" className="ml-1">
              {sortedReports.length}
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
              {sortedReports.map((report) => (
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
                      {SAFEGUARDING_CATEGORY_LABELS[report.category]}
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
              {sortedReports.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-gray-400">
                    No reports match the current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
