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
  ArrowUpDown,
  Download,
  Filter,
  MoreHorizontal,
  Plus,
  Search,
  SlidersHorizontal,
  AlertCircle,
  Loader2,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchInventory, type InventoryItem, subscribeToNotifications, deleteInventoryItem } from "@/lib/fiware-service"
import { toast } from "sonner"
import type { OrionInventoryItem } from "@/lib/fiware-types"

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<string | null>(null)
  const [filterZone, setFilterZone] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    const loadInventory = async () => {
      try {
        setLoading(true)
        const data = await fetchInventory()
        setInventory(data)
        setError(null)
      } catch (err) {
        console.error("Error loading inventory:", err)
        setError("Failed to load inventory data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    loadInventory()

    // Subscribe to real-time updates
    let unsubscribeFunction: (() => void) | undefined

    const setupSubscription = async () => {
      try {
        const unsubscribe = await subscribeToNotifications("InventoryItem", (data: OrionInventoryItem[]) => {
          // Transform the data to match our InventoryItem interface
          const updatedInventory = data.map((entity) => {
            // Determine inventory status based on quantity and threshold
            let status: "In Stock" | "Low Stock" | "Out of Stock" = "In Stock"
            const quantity = entity.quantity?.value || 0
            const threshold = entity.threshold?.value || 50

            if (quantity === 0) {
              status = "Out of Stock"
            } else if (quantity < threshold) {
              status = "Low Stock"
            }

            return {
              id: entity.id,
              sku: entity.sku?.value || "Unknown",
              name: entity.name?.value || "Unknown Product",
              quantity,
              location: entity.location?.value || "Unknown",
              status,
              lastUpdated: new Date(entity.dateModified?.value || Date.now()).toLocaleString(),
            }
          })

          setInventory(updatedInventory)
        })

        unsubscribeFunction = unsubscribe
      } catch (error) {
        console.error("Error setting up subscription:", error)
      }
    }

    setupSubscription()

    // And update the cleanup function
    return () => {
      if (unsubscribeFunction) {
        unsubscribeFunction()
      }
    }
  }, [])

  const handleDeleteItem = async (id: string) => {
    try {
      setDeleting(id)
      await deleteInventoryItem(id)

      // Update local state
      setInventory((prev) => prev.filter((item) => item.id !== id))

      toast.success("The inventory item has been successfully deleted.", {
        description: "Item deleted",
      })
    } catch (err) {
      console.error("Error deleting item:", err)
      toast.error("Failed to delete the inventory item. Please try again.", {
        description: "Error",
      })
    } finally {
      setDeleting(null)
    }
  }

  // Filter and search inventory
  const filteredInventory = inventory.filter((item) => {
    // Apply search filter
    if (
      searchQuery &&
      !item.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !item.sku.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false
    }

    // Apply status filter
    if (filterStatus && item.status !== filterStatus) {
      return false
    }

    // Apply zone filter
    if (filterZone && !item.location.includes(filterZone)) {
      return false
    }

    return true
  })

  // Extract unique zones for filter dropdown
  const zones = Array.from(
    new Set(
      inventory.map((item) => {
        const zonePart = item.location.split(",")[0].trim()
        return zonePart
      }),
    ),
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "In Stock":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            In Stock
          </Badge>
        )
      case "Low Stock":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Low Stock
          </Badge>
        )
      case "Out of Stock":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Out of Stock
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="flex flex-col">
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <h1 className="text-lg font-semibold">Inventory Management</h1>
          <div className="ml-auto flex items-center space-x-4">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
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
                placeholder="Search products..."
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
                <DropdownMenuItem onClick={() => setFilterStatus("Low Stock")}>Low Stock</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("Out of Stock")}>Out of Stock</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("In Stock")}>In Stock</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Filter by Zone</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setFilterZone(null)}>All Zones</DropdownMenuItem>
                {zones.map((zone) => (
                  <DropdownMenuItem key={zone} onClick={() => setFilterZone(zone)}>
                    {zone}
                  </DropdownMenuItem>
                ))}
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

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Inventory Items</CardTitle>
            <CardDescription>
              Manage your warehouse inventory across all zones
              {filterStatus && ` • Filtered by: ${filterStatus}`}
              {filterZone && ` • Zone: ${filterZone}`}
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
                      <TableHead className="w-[100px]">SKU</TableHead>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Updated</TableHead>
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
                          <Skeleton className="h-5 w-[150px]" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-[50px]" />
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
                    <TableHead className="w-[100px]">SKU</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead>
                      <div className="flex items-center cursor-pointer">
                        Quantity
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {searchQuery || filterStatus || filterZone
                          ? "No items match your search criteria."
                          : "No inventory items found. Add products to see them here."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInventory.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.sku}</TableCell>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{item.location}</TableCell>
                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                        <TableCell>{item.lastUpdated}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                {deleting === item.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <MoreHorizontal className="h-4 w-4" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>View Details</DropdownMenuItem>
                              <DropdownMenuItem>Edit Item</DropdownMenuItem>
                              <DropdownMenuItem>Move Location</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleDeleteItem(item.id)}
                                disabled={deleting === item.id}
                              >
                                Delete Item
                              </DropdownMenuItem>
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
      </div>
    </div>
  )
}

