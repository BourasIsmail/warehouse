"use client"

import { CardFooter } from "@/components/ui/card"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  AlertCircle,
  BarChart3,
  Calendar,
  Download,
  FileText,
  Loader2,
  MoreHorizontal,
  Plus,
  RefreshCcw,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { fetchReports, type Report, subscribeToNotifications } from "@/lib/fiware-service"
// Replace the import for useToast
import { toast } from "sonner"
import { format } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

export default function AnalyticsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [runningReport, setRunningReport] = useState<string | null>(null)
  // Remove this line:
  // const { toast } = useToast()

  useEffect(() => {
    const loadReports = async () => {
      try {
        setLoading(true)
        const data = await fetchReports()
        setReports(data)
        setError(null)
      } catch (err) {
        console.error("Error loading reports:", err)
        setError("Failed to load report data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    loadReports()

    // Subscribe to real-time updates
    const unsubscribe = subscribeToNotifications("Report", (data) => {
      // Transform the data to match our Report interface
      const updatedReports = data.map((entity: any) => ({
        id: entity.id,
        name: entity.name?.value || "Unnamed Report",
        description: entity.description?.value || "",
        type: entity.reportType?.value || "Custom",
        createdBy: entity.createdBy?.value || "System",
        createdAt: entity.dateCreated?.value || new Date().toISOString(),
        lastRun: entity.lastRun?.value || null,
        schedule: entity.schedule?.value || "On Demand",
        format: entity.format?.value || "PDF",
        url: entity.url?.value || "#",
      }))

      setReports(updatedReports)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  // Update the handleRunReport function:
  const handleRunReport = async (id: string) => {
    try {
      setRunningReport(id)

      // Simulate running a report
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Update local state to show the report was run
      setReports((prev) =>
        prev.map((report) => (report.id === id ? { ...report, lastRun: new Date().toISOString() } : report)),
      )

      toast.success("The report has been successfully generated.", {
        description: "Report generated",
      })
    } catch (err) {
      console.error("Error running report:", err)
      toast.error("Failed to generate the report. Please try again.", {
        description: "Error",
      })
    } finally {
      setRunningReport(null)
    }
  }

  const getReportTypeBadge = (type: string) => {
    switch (type) {
      case "Inventory":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Inventory
          </Badge>
        )
      case "Orders":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Orders
          </Badge>
        )
      case "Shipments":
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            Shipments
          </Badge>
        )
      case "Performance":
        return (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
            Performance
          </Badge>
        )
      case "Custom":
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            Custom
          </Badge>
        )
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  const getScheduleBadge = (schedule: string) => {
    switch (schedule) {
      case "Daily":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Daily
          </Badge>
        )
      case "Weekly":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Weekly
          </Badge>
        )
      case "Monthly":
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            Monthly
          </Badge>
        )
      case "On Demand":
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            On Demand
          </Badge>
        )
      default:
        return <Badge variant="outline">{schedule}</Badge>
    }
  }

  const getFormatBadge = (format: string) => {
    switch (format) {
      case "PDF":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            PDF
          </Badge>
        )
      case "CSV":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            CSV
          </Badge>
        )
      case "Excel":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Excel
          </Badge>
        )
      case "Dashboard":
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            Dashboard
          </Badge>
        )
      default:
        return <Badge variant="outline">{format}</Badge>
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never"
    return format(new Date(dateString), "MMM d, yyyy h:mm a")
  }

  const getReportIcon = (type: string) => {
    switch (type) {
      case "Inventory":
        return <BarChart3 className="h-4 w-4" />
      case "Orders":
        return <FileText className="h-4 w-4" />
      case "Shipments":
        return <FileText className="h-4 w-4" />
      case "Performance":
        return <BarChart3 className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  return (
    <div className="flex flex-col">
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <h1 className="text-lg font-semibold">Analytics & Reports</h1>
          <div className="ml-auto flex items-center space-x-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Report
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Report</DialogTitle>
                  <DialogDescription>Configure a new report for your warehouse data</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Report Name</Label>
                    <Input id="name" placeholder="Enter report name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Report Type</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select report type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inventory">Inventory</SelectItem>
                        <SelectItem value="orders">Orders</SelectItem>
                        <SelectItem value="shipments">Shipments</SelectItem>
                        <SelectItem value="performance">Performance</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" placeholder="Enter report description" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="schedule">Schedule</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select schedule" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="ondemand">On Demand</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="format">Format</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pdf">PDF</SelectItem>
                          <SelectItem value="csv">CSV</SelectItem>
                          <SelectItem value="excel">Excel</SelectItem>
                          <SelectItem value="dashboard">Dashboard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline">Cancel</Button>
                  <Button>Create Report</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <Tabs defaultValue="reports" className="space-y-4">
          <TabsList>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="dashboards">Dashboards</TabsTrigger>
            <TabsTrigger value="knowage">Knowage Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Available Reports</CardTitle>
                <CardDescription>Run and manage warehouse reports</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-8 w-[250px]" />
                      <Skeleton className="h-8 w-[100px]" />
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[250px]">Report Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Schedule</TableHead>
                          <TableHead>Format</TableHead>
                          <TableHead>Last Run</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Array.from({ length: 5 }).map((_, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Skeleton className="h-5 w-[200px]" />
                            </TableCell>
                            <TableCell>
                              <Skeleton className="h-5 w-[80px]" />
                            </TableCell>
                            <TableCell>
                              <Skeleton className="h-5 w-[80px]" />
                            </TableCell>
                            <TableCell>
                              <Skeleton className="h-5 w-[80px]" />
                            </TableCell>
                            <TableCell>
                              <Skeleton className="h-5 w-[120px]" />
                            </TableCell>
                            <TableCell className="text-right">
                              <Skeleton className="h-8 w-8 rounded-full ml-auto" />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : error ? (
                  <div className="p-4 border border-red-200 rounded-md bg-red-50 text-red-700">
                    <p className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      {error}
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[250px]">Report Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Schedule</TableHead>
                        <TableHead>Format</TableHead>
                        <TableHead>Last Run</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reports.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No reports found. Create a report to see it here.
                          </TableCell>
                        </TableRow>
                      ) : (
                        reports.map((report) => (
                          <TableRow key={report.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {getReportIcon(report.type)}
                                {report.name}
                              </div>
                            </TableCell>
                            <TableCell>{getReportTypeBadge(report.type)}</TableCell>
                            <TableCell>{getScheduleBadge(report.schedule)}</TableCell>
                            <TableCell>{getFormatBadge(report.format)}</TableCell>
                            <TableCell>{formatDate(report.lastRun)}</TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    {runningReport === report.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <MoreHorizontal className="h-4 w-4" />
                                    )}
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => handleRunReport(report.id)}
                                    disabled={runningReport === report.id}
                                  >
                                    <RefreshCcw className="mr-2 h-4 w-4" />
                                    Run Report
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Calendar className="mr-2 h-4 w-4" />
                                    Schedule
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Download className="mr-2 h-4 w-4" />
                                    Download
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem>Edit Report</DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600">Delete Report</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dashboards" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>WireCloud Dashboards</CardTitle>
                <CardDescription>Interactive dashboards powered by FIWARE WireCloud</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md">Inventory Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <p className="text-sm text-muted-foreground">Real-time inventory levels and stock alerts</p>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full">
                        Open Dashboard
                      </Button>
                    </CardFooter>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md">Order Analytics</CardTitle>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <p className="text-sm text-muted-foreground">
                        Order trends, fulfillment rates, and customer insights
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full">
                        Open Dashboard
                      </Button>
                    </CardFooter>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md">Warehouse Performance</CardTitle>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <p className="text-sm text-muted-foreground">
                        Efficiency metrics, space utilization, and sensor data
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full">
                        Open Dashboard
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="knowage" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Knowage Analytics</CardTitle>
                <CardDescription>Advanced business intelligence and analytics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center p-8 text-center">
                  <div className="space-y-4">
                    <BarChart3 className="mx-auto h-16 w-16 text-muted-foreground" />
                    <h3 className="text-lg font-medium">Advanced Analytics with Knowage</h3>
                    <p className="text-muted-foreground">
                      Connect to the Knowage Analytics platform for advanced business intelligence, data visualization,
                      and predictive analytics.
                    </p>
                    <Button>Open Knowage Analytics</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

