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
  CreditCard,
  Download,
  Filter,
  Loader2,
  MoreHorizontal,
  PackageCheck,
  Plus,
  Search,
  SlidersHorizontal,
  Tag,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { fetchOrders, type Order, type OrderItem, subscribeToNotifications, updateOrder } from "@/lib/fiware-service"
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
import { toast } from "sonner"

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true)
        const data = await fetchOrders()
        setOrders(data)
        setError(null)
      } catch (err) {
        console.error("Error loading orders:", err)
        setError("Failed to load order data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    loadOrders()

    // Subscribe to real-time updates
    const unsubscribe = subscribeToNotifications("Order", (data) => {
      // Transform the data to match our Order interface
      const updatedOrders = data.map((entity: any) => {
        // Parse items from JSON string if needed
        let items: OrderItem[] = []
        try {
          if (entity.items?.value) {
            if (typeof entity.items.value === "string") {
              items = JSON.parse(entity.items.value)
            } else if (Array.isArray(entity.items.value)) {
              items = entity.items.value
            }
          }
        } catch (e) {
          console.error("Error parsing order items:", e)
        }

        return {
          id: entity.id,
          orderId: entity.orderId?.value || entity.id,
          customer: entity.customer?.value || "Unknown",
          status: entity.status?.value || "New",
          items,
          totalAmount: entity.totalAmount?.value || 0,
          paymentStatus: entity.paymentStatus?.value || "Pending",
          orderDate: entity.orderDate?.value || new Date().toISOString(),
          shipByDate: entity.shipByDate?.value || new Date().toISOString(),
          priority: entity.priority?.value || "Normal",
          notes: entity.notes?.value || "",
        }
      })

      setOrders(updatedOrders)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const handleUpdateStatus = async (
    id: string,
    newStatus: "New" | "Processing" | "Shipped" | "Delivered" | "Cancelled",
  ) => {
    try {
      setUpdating(id)
      await updateOrder(id, { status: newStatus })

      // Update local state
      setOrders((prev) => prev.map((order) => (order.id === id ? { ...order, status: newStatus } : order)))

      toast.success(`Order status has been updated to ${newStatus}.`, {
        description: "Status updated",
      })
    } catch (err) {
      console.error("Error updating order status:", err)
      toast.error("Failed to update order status. Please try again.", {
        description: "Error",
      })
    } finally {
      setUpdating(null)
    }
  }

  const handleUpdatePayment = async (id: string, newStatus: "Pending" | "Paid" | "Refunded") => {
    try {
      setUpdating(id)
      await updateOrder(id, { paymentStatus: newStatus })

      // Update local state
      setOrders((prev) => prev.map((order) => (order.id === id ? { ...order, paymentStatus: newStatus } : order)))

      toast.success(`Payment status has been updated to ${newStatus}.`, {
        description: "Payment status updated",
      })
    } catch (err) {
      console.error("Error updating payment status:", err)
      toast.error("Failed to update payment status. Please try again.", {
        description: "Error",
      })
    } finally {
      setUpdating(null)
    }
  }

  // Filter and search orders
  const filteredOrders = orders.filter((order) => {
    // Apply search filter
    if (
      searchQuery &&
      !order.orderId.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !order.customer.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false
    }

    // Apply status filter
    if (filterStatus && order.status !== filterStatus) {
      return false
    }

    return true
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "New":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            New
          </Badge>
        )
      case "Processing":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Processing
          </Badge>
        )
      case "Shipped":
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            Shipped
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

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Pending
          </Badge>
        )
      case "Paid":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Paid
          </Badge>
        )
      case "Refunded":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Refunded
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "Low":
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            Low
          </Badge>
        )
      case "Normal":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Normal
          </Badge>
        )
      case "High":
        return (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
            High
          </Badge>
        )
      case "Urgent":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Urgent
          </Badge>
        )
      default:
        return <Badge variant="outline">{priority}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM d, yyyy")
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order)
    setShowDetails(true)
  }

  return (
    <div className="flex flex-col">
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <h1 className="text-lg font-semibold">Order Management</h1>
          <div className="ml-auto flex items-center space-x-4">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Order
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
                placeholder="Search orders..."
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
                <DropdownMenuItem onClick={() => setFilterStatus("New")}>New</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("Processing")}>Processing</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("Shipped")}>Shipped</DropdownMenuItem>
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
            <TabsTrigger value="all">All Orders</TabsTrigger>
            <TabsTrigger value="new">New</TabsTrigger>
            <TabsTrigger value="processing">Processing</TabsTrigger>
            <TabsTrigger value="shipped">Shipped</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Orders</CardTitle>
                <CardDescription>
                  Manage all customer orders
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
                          <TableHead className="w-[100px]">Order ID</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Payment</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Date</TableHead>
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
                              <Skeleton className="h-5 w-[80px]" />
                            </TableCell>
                            <TableCell>
                              <Skeleton className="h-5 w-[80px]" />
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
                        <TableHead className="w-[120px]">Order ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>
                          <div className="flex items-center cursor-pointer">
                            Total
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </div>
                        </TableHead>
                        <TableHead>
                          <div className="flex items-center cursor-pointer">
                            Date
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </div>
                        </TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            {searchQuery || filterStatus
                              ? "No orders match your search criteria."
                              : "No orders found. Create an order to see it here."}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredOrders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">{order.orderId}</TableCell>
                            <TableCell>{order.customer}</TableCell>
                            <TableCell>{getStatusBadge(order.status)}</TableCell>
                            <TableCell>{getPaymentStatusBadge(order.paymentStatus)}</TableCell>
                            <TableCell>{formatCurrency(order.totalAmount)}</TableCell>
                            <TableCell>{formatDate(order.orderDate)}</TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    {updating === order.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <MoreHorizontal className="h-4 w-4" />
                                    )}
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openOrderDetails(order)}>
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>Edit Order</DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                                  {order.status !== "New" && (
                                    <DropdownMenuItem
                                      onClick={() => handleUpdateStatus(order.id, "New")}
                                      disabled={updating === order.id}
                                    >
                                      Mark as New
                                    </DropdownMenuItem>
                                  )}
                                  {order.status !== "Processing" && (
                                    <DropdownMenuItem
                                      onClick={() => handleUpdateStatus(order.id, "Processing")}
                                      disabled={updating === order.id}
                                    >
                                      Mark as Processing
                                    </DropdownMenuItem>
                                  )}
                                  {order.status !== "Shipped" && (
                                    <DropdownMenuItem
                                      onClick={() => handleUpdateStatus(order.id, "Shipped")}
                                      disabled={updating === order.id}
                                    >
                                      Mark as Shipped
                                    </DropdownMenuItem>
                                  )}
                                  {order.status !== "Delivered" && (
                                    <DropdownMenuItem
                                      onClick={() => handleUpdateStatus(order.id, "Delivered")}
                                      disabled={updating === order.id}
                                    >
                                      Mark as Delivered
                                    </DropdownMenuItem>
                                  )}
                                  {order.status !== "Cancelled" && (
                                    <DropdownMenuItem
                                      onClick={() => handleUpdateStatus(order.id, "Cancelled")}
                                      disabled={updating === order.id}
                                      className="text-red-600"
                                    >
                                      Cancel Order
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuLabel>Payment</DropdownMenuLabel>
                                  {order.paymentStatus !== "Paid" && (
                                    <DropdownMenuItem
                                      onClick={() => handleUpdatePayment(order.id, "Paid")}
                                      disabled={updating === order.id}
                                    >
                                      Mark as Paid
                                    </DropdownMenuItem>
                                  )}
                                  {order.paymentStatus !== "Refunded" && order.paymentStatus === "Paid" && (
                                    <DropdownMenuItem
                                      onClick={() => handleUpdatePayment(order.id, "Refunded")}
                                      disabled={updating === order.id}
                                    >
                                      Mark as Refunded
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

          <TabsContent value="new" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>New Orders</CardTitle>
                <CardDescription>Orders that need to be processed</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Priority</TableHead>
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
                            <Skeleton className="h-5 w-[80px]" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-[80px]" />
                          </TableCell>
                          <TableCell className="text-right">
                            <Skeleton className="h-8 w-8 rounded-full ml-auto" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : orders.filter((o) => o.status === "New").length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No new orders found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      orders
                        .filter((o) => o.status === "New")
                        .map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">{order.orderId}</TableCell>
                            <TableCell>{order.customer}</TableCell>
                            <TableCell>{order.items.length} items</TableCell>
                            <TableCell>{formatCurrency(order.totalAmount)}</TableCell>
                            <TableCell>{getPriorityBadge(order.priority)}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateStatus(order.id, "Processing")}
                                disabled={updating === order.id}
                              >
                                <Tag className="mr-2 h-4 w-4" />
                                {updating === order.id ? "Updating..." : "Process"}
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

          <TabsContent value="processing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Processing Orders</CardTitle>
                <CardDescription>Orders that are being prepared for shipping</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Ship By</TableHead>
                      <TableHead>Priority</TableHead>
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
                            <Skeleton className="h-5 w-[80px]" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-[100px]" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-[80px]" />
                          </TableCell>
                          <TableCell className="text-right">
                            <Skeleton className="h-8 w-8 rounded-full ml-auto" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : orders.filter((o) => o.status === "Processing").length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No orders in processing.
                        </TableCell>
                      </TableRow>
                    ) : (
                      orders
                        .filter((o) => o.status === "Processing")
                        .map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">{order.orderId}</TableCell>
                            <TableCell>{order.customer}</TableCell>
                            <TableCell>{getPaymentStatusBadge(order.paymentStatus)}</TableCell>
                            <TableCell>{formatDate(order.shipByDate)}</TableCell>
                            <TableCell>{getPriorityBadge(order.priority)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                {order.paymentStatus !== "Paid" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleUpdatePayment(order.id, "Paid")}
                                    disabled={updating === order.id}
                                  >
                                    <CreditCard className="mr-2 h-4 w-4" />
                                    {updating === order.id ? "Updating..." : "Mark Paid"}
                                  </Button>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUpdateStatus(order.id, "Shipped")}
                                  disabled={updating === order.id}
                                >
                                  <PackageCheck className="mr-2 h-4 w-4" />
                                  {updating === order.id ? "Updating..." : "Mark Shipped"}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shipped" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Shipped Orders</CardTitle>
                <CardDescription>Orders that have been shipped and are in transit</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Ship Date</TableHead>
                      <TableHead>Total</TableHead>
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
                            <Skeleton className="h-5 w-[80px]" />
                          </TableCell>
                          <TableCell className="text-right">
                            <Skeleton className="h-8 w-8 rounded-full ml-auto" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : orders.filter((o) => o.status === "Shipped").length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No shipped orders found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      orders
                        .filter((o) => o.status === "Shipped")
                        .map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">{order.orderId}</TableCell>
                            <TableCell>{order.customer}</TableCell>
                            <TableCell>{formatDate(order.orderDate)}</TableCell>
                            <TableCell>{formatCurrency(order.totalAmount)}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateStatus(order.id, "Delivered")}
                                disabled={updating === order.id}
                              >
                                <PackageCheck className="mr-2 h-4 w-4" />
                                {updating === order.id ? "Updating..." : "Mark Delivered"}
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

      {/* Order Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>Detailed information about this order</DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Order ID</Label>
                  <div className="font-medium">{selectedOrder.orderId}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div>{getStatusBadge(selectedOrder.status)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Customer</Label>
                  <div className="font-medium">{selectedOrder.customer}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Payment Status</Label>
                  <div>{getPaymentStatusBadge(selectedOrder.paymentStatus)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Order Date</Label>
                  <div className="font-medium">{formatDate(selectedOrder.orderDate)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Ship By Date</Label>
                  <div className="font-medium">{formatDate(selectedOrder.shipByDate)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Total Amount</Label>
                  <div className="font-medium">{formatCurrency(selectedOrder.totalAmount)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Priority</Label>
                  <div>{getPriorityBadge(selectedOrder.priority)}</div>
                </div>
              </div>

              {selectedOrder.notes && (
                <div>
                  <Label className="text-muted-foreground mb-2 block">Notes</Label>
                  <div className="rounded-md border p-3 text-sm">{selectedOrder.notes}</div>
                </div>
              )}

              <div>
                <Label className="text-muted-foreground mb-2 block">Order Items</Label>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOrder.items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                          No items in this order
                        </TableCell>
                      </TableRow>
                    ) : (
                      selectedOrder.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.sku}</TableCell>
                          <TableCell>{item.productName}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.price * item.quantity)}</TableCell>
                        </TableRow>
                      ))
                    )}
                    <TableRow>
                      <TableCell colSpan={4} className="text-right font-medium">
                        Total
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(selectedOrder.totalAmount)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDetails(false)}>
                  Close
                </Button>
                {selectedOrder.status === "New" && (
                  <Button
                    onClick={() => {
                      handleUpdateStatus(selectedOrder.id, "Processing")
                      setShowDetails(false)
                    }}
                    disabled={updating === selectedOrder.id}
                  >
                    <Tag className="mr-2 h-4 w-4" />
                    Process Order
                  </Button>
                )}
                {selectedOrder.status === "Processing" && (
                  <Button
                    onClick={() => {
                      handleUpdateStatus(selectedOrder.id, "Shipped")
                      setShowDetails(false)
                    }}
                    disabled={updating === selectedOrder.id}
                  >
                    <PackageCheck className="mr-2 h-4 w-4" />
                    Mark as Shipped
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

