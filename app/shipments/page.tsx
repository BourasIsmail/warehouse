"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  AlertCircle,
  ArrowUpDown,
  Download,
  Filter,
  Loader2,
  MoreHorizontal,
  PackageCheck,
  PackageOpen,
  Plus,
  Search,
  SlidersHorizontal,
  Truck,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  fetchShipments,
  type Shipment,
  type ShipmentItem,
  subscribeToNotifications,
  updateShipment,
} from "@/lib/fiware-service"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    const loadShipments = async () => {
      try {
        setLoading(true)
        const data = await fetchShipments()
        setShipments(data)
        setError(null)
      } catch (err) {
        console.error("Error loading shipments:", err)
        setError("Failed to load shipment data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    loadShipments()

    // Subscribe to real-time updates
    const unsubscribe = subscribeToNotifications("Shipment", (data) => {
      // Transform the data to match our Shipment interface
      const updatedShipments = data.map((entity: any) => {
        // Parse items from JSON string if needed
        let items: ShipmentItem[] = []
        try {
          if (entity.items?.value) {
            if (typeof entity.items.value === "string") {
              items = JSON.parse(entity.items.value)
            } else if (Array.isArray(entity.items.value)) {
              items = entity.items.value
            }
          }
        } catch (e) {
          console.error("Error parsing shipment items:", e)
        }

        return {
          id: entity.id,
          shipmentId: entity.shipmentId?.value || entity.id,
          status: entity.status?.value || "Pending",
          origin: entity.origin?.value || "Unknown",
          destination: entity.destination?.value || "Unknown",
          carrier: entity.carrier?.value || "Unknown",
          trackingNumber: entity.trackingNumber?.value || "N/A",
          items,
          scheduledDate: entity.scheduledDate?.value || new Date().toISOString(),
          actualDate: entity.actualDate?.value || null,
          createdAt: entity.dateCreated?.value || new Date().toISOString(),
          updatedAt: entity.dateModified?.value || new Date().toISOString(),
        }
      })

      setShipments(updatedShipments)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const handleUpdateStatus = async (id: string, newStatus: "Pending" | "In Transit" | "Delivered" | "Cancelled") => {
    try {
      setUpdating(id)
      await updateShipment(id, { status: newStatus })

      // Update local state
      setShipments((prev) =>
        prev.map((shipment) => (shipment.id === id ? { ...shipment, status: newStatus } : shipment)),
      )

      toast.success(`Shipment status has been updated to ${newStatus}.`, {
        description: "Status updated",
      })
    } catch (err) {
      console.error("Error updating shipment status:", err)
      toast.error("Failed to update shipment status. Please try again.", {
        description: "Error",
      })
    } finally {
      setUpdating(null)
    }
  }

  // Filter and search shipments
  const filteredShipments = shipments.filter((shipment) => {
    // Apply search filter
    if (
      searchQuery &&
      !shipment.shipmentId.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !shipment.destination.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !shipment.carrier.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false
    }

    // Apply status filter
    if (filterStatus && shipment.status !== filterStatus) {
      return false
    }

    return true
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Pending
          </Badge>
        )
      case "In Transit":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            In Transit
          </Badge>
        )
      case "Delivered":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Delivered
          </Badge>
        )
      case "Cancelled":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Cancelled
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    return format(new Date(dateString), "MMM d, yyyy")
  }

  const openShipmentDetails = (shipment: Shipment) => {
    setSelectedShipment(shipment)
    setShowDetails(true)
  }

  return (
    <div className="flex flex-col">
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <h1 className="text-lg font-semibold">Shipment Management</h1>
          <div className="ml-auto flex items-center space-x-4">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Shipment
            </Button>
          </div>
        </div>
      </div>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search shipments..."
                className="w-full bg-background pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setFilterStatus(null)}>All Statuses</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("Pending")}>Pending</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("In Transit")}>In Transit</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("Delivered")}>Delivered</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("Cancelled")}>Cancelled</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="sm" className="h-9">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Advanced
            </Button>
          </div>
          <Button variant="outline" size="sm" className="h-9">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Shipments</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="transit">In Transit</TabsTrigger>
            <TabsTrigger value="delivered">Delivered</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Shipments</CardTitle>
                <CardDescription>
                  Manage all outgoing and incoming shipments
                  {filterStatus && ` • Filtered by: ${filterStatus}`}
                </CardDescription>
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
                          <TableHead className="w-[100px]">Shipment ID</TableHead>
                          <TableHead>Origin</TableHead>
                          <TableHead>Destination</TableHead>
                          <TableHead>Carrier</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Scheduled Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Array.from({ length: 5 }).map((_, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Skeleton className="h-5 w-[80px]" />
                            </TableCell>
                            <TableCell>
                              <Skeleton className="h-5 w-[120px]" />
                            </TableCell>
                            <TableCell>
                              <Skeleton className="h-5 w-[120px]" />
                            </TableCell>
                            <TableCell>
                              <Skeleton className="h-5 w-[100px]" />
                            </TableCell>
                            <TableCell>
                              <Skeleton className="h-5 w-[80px]" />
                            </TableCell>
                            <TableCell>
                              <Skeleton className="h-5 w-[100px]" />
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
                        <TableHead className="w-[120px]">Shipment ID</TableHead>
                        <TableHead>Origin</TableHead>
                        <TableHead>Destination</TableHead>
                        <TableHead>Carrier</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>
                          <div className="flex items-center cursor-pointer">
                            Scheduled Date
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </div>
                        </TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredShipments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            {searchQuery || filterStatus
                              ? "No shipments match your search criteria."
                              : "No shipments found. Create a shipment to see it here."}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredShipments.map((shipment) => (
                          <TableRow key={shipment.id}>
                            <TableCell className="font-medium">{shipment.shipmentId}</TableCell>
                            <TableCell>{shipment.origin}</TableCell>
                            <TableCell>{shipment.destination}</TableCell>
                            <TableCell>{shipment.carrier}</TableCell>
                            <TableCell>{getStatusBadge(shipment.status)}</TableCell>
                            <TableCell>{formatDate(shipment.scheduledDate)}</TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    {updating === shipment.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <MoreHorizontal className="h-4 w-4" />
                                    )}
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openShipmentDetails(shipment)}>
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>Edit Shipment</DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                                  {shipment.status !== "Pending" && (
                                    <DropdownMenuItem
                                      onClick={() => handleUpdateStatus(shipment.id, "Pending")}
                                      disabled={updating === shipment.id}
                                    >
                                      Mark as Pending
                                    </DropdownMenuItem>
                                  )}
                                  {shipment.status !== "In Transit" && (
                                    <DropdownMenuItem
                                      onClick={() => handleUpdateStatus(shipment.id, "In Transit")}
                                      disabled={updating === shipment.id}
                                    >
                                      Mark as In Transit
                                    </DropdownMenuItem>
                                  )}
                                  {shipment.status !== "Delivered" && (
                                    <DropdownMenuItem
                                      onClick={() => handleUpdateStatus(shipment.id, "Delivered")}
                                      disabled={updating === shipment.id}
                                    >
                                      Mark as Delivered
                                    </DropdownMenuItem>
                                  )}
                                  {shipment.status !== "Cancelled" && (
                                    <DropdownMenuItem
                                      onClick={() => handleUpdateStatus(shipment.id, "Cancelled")}
                                      disabled={updating === shipment.id}
                                      className="text-red-600"
                                    >
                                      Cancel Shipment
                                    </DropdownMenuItem>
                                  )}
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

          <TabsContent value="pending" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pending Shipments</CardTitle>
                <CardDescription>Shipments that are ready to be dispatched</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">Shipment ID</TableHead>
                      <TableHead>Destination</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Scheduled Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 3 }).map((_, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Skeleton className="h-5 w-[80px]" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-[120px]" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-[50px]" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-[100px]" />
                          </TableCell>
                          <TableCell className="text-right">
                            <Skeleton className="h-8 w-8 rounded-full ml-auto" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : shipments.filter((s) => s.status === "Pending").length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No pending shipments found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      shipments
                        .filter((s) => s.status === "Pending")
                        .map((shipment) => (
                          <TableRow key={shipment.id}>
                            <TableCell className="font-medium">{shipment.shipmentId}</TableCell>
                            <TableCell>{shipment.destination}</TableCell>
                            <TableCell>{shipment.items.length} items</TableCell>
                            <TableCell>{formatDate(shipment.scheduledDate)}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateStatus(shipment.id, "In Transit")}
                                disabled={updating === shipment.id}
                              >
                                <Truck className="mr-2 h-4 w-4" />
                                {updating === shipment.id ? "Updating..." : "Mark Shipped"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transit" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>In Transit Shipments</CardTitle>
                <CardDescription>Shipments that are currently in transit</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">Shipment ID</TableHead>
                      <TableHead>Destination</TableHead>
                      <TableHead>Carrier</TableHead>
                      <TableHead>Tracking</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 3 }).map((_, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Skeleton className="h-5 w-[80px]" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-[120px]" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-[100px]" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-[120px]" />
                          </TableCell>
                          <TableCell className="text-right">
                            <Skeleton className="h-8 w-8 rounded-full ml-auto" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : shipments.filter((s) => s.status === "In Transit").length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No shipments in transit.
                        </TableCell>
                      </TableRow>
                    ) : (
                      shipments
                        .filter((s) => s.status === "In Transit")
                        .map((shipment) => (
                          <TableRow key={shipment.id}>
                            <TableCell className="font-medium">{shipment.shipmentId}</TableCell>
                            <TableCell>{shipment.destination}</TableCell>
                            <TableCell>{shipment.carrier}</TableCell>
                            <TableCell>{shipment.trackingNumber}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateStatus(shipment.id, "Delivered")}
                                disabled={updating === shipment.id}
                              >
                                <PackageCheck className="mr-2 h-4 w-4" />
                                {updating === shipment.id ? "Updating..." : "Mark Delivered"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="delivered" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Delivered Shipments</CardTitle>
                <CardDescription>Shipments that have been successfully delivered</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">Shipment ID</TableHead>
                      <TableHead>Destination</TableHead>
                      <TableHead>Delivery Date</TableHead>
                      <TableHead>Carrier</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 3 }).map((_, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Skeleton className="h-5 w-[80px]" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-[120px]" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-[100px]" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-[100px]" />
                          </TableCell>
                          <TableCell className="text-right">
                            <Skeleton className="h-8 w-8 rounded-full ml-auto" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : shipments.filter((s) => s.status === "Delivered").length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No delivered shipments found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      shipments
                        .filter((s) => s.status === "Delivered")
                        .map((shipment) => (
                          <TableRow key={shipment.id}>
                            <TableCell className="font-medium">{shipment.shipmentId}</TableCell>
                            <TableCell>{shipment.destination}</TableCell>
                            <TableCell>{formatDate(shipment.actualDate)}</TableCell>
                            <TableCell>{shipment.carrier}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" onClick={() => openShipmentDetails(shipment)}>
                                <PackageOpen className="mr-2 h-4 w-4" />
                                View Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Shipment Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Shipment Details</DialogTitle>
            <DialogDescription>Detailed information about this shipment</DialogDescription>
          </DialogHeader>

          {selectedShipment && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Shipment ID</Label>
                  <div className="font-medium">{selectedShipment.shipmentId}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div>{getStatusBadge(selectedShipment.status)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Origin</Label>
                  <div className="font-medium">{selectedShipment.origin}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Destination</Label>
                  <div className="font-medium">{selectedShipment.destination}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Carrier</Label>
                  <div className="font-medium">{selectedShipment.carrier}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Tracking Number</Label>
                  <div className="font-medium">{selectedShipment.trackingNumber}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Scheduled Date</Label>
                  <div className="font-medium">{formatDate(selectedShipment.scheduledDate)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Actual Delivery Date</Label>
                  <div className="font-medium">{formatDate(selectedShipment.actualDate)}</div>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground mb-2 block">Items in Shipment</Label>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedShipment.items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                          No items in this shipment
                        </TableCell>
                      </TableRow>
                    ) : (
                      selectedShipment.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.sku}</TableCell>
                          <TableCell>{item.productName}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDetails(false)}>
                  Close
                </Button>
                {selectedShipment.status !== "Delivered" && selectedShipment.status !== "Cancelled" && (
                  <Button
                    onClick={() => {
                      handleUpdateStatus(selectedShipment.id, "Delivered")
                      setShowDetails(false)
                    }}
                    disabled={updating === selectedShipment.id}
                  >
                    <PackageCheck className="mr-2 h-4 w-4" />
                    Mark as Delivered
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

