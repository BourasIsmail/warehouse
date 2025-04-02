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
  Filter,
  Key,
  Loader2,
  LockIcon,
  MoreHorizontal,
  Search,
  ShieldCheck,
  UnlockIcon,
  UserCog,
  UserPlus,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchUsers, type User, subscribeToNotifications } from "@/lib/fiware-service"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { OrionUser } from "@/lib/fiware-types"

// Replace the import for useToast
import { toast } from "sonner"

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterRole, setFilterRole] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string | null>(null)
  const [updatingUser, setUpdatingUser] = useState<string | null>(null)

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true)
        const data = await fetchUsers()
        setUsers(data)
        setError(null)
      } catch (err) {
        console.error("Error loading users:", err)
        setError("Failed to load user data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    loadUsers()

    // Subscribe to real-time updates
    let unsubscribeFunction: (() => void) | undefined

    const setupSubscription = async () => {
      try {
        const unsubscribe = await subscribeToNotifications("User", (data: OrionUser[]) => {
          // Transform the data to match our User interface
          const updatedUsers = data.map((entity) => {
            // Extract role and validate it's one of the allowed values
            const roleValue = entity.role?.value || "Viewer"
            const validRole =
              roleValue === "Admin" || roleValue === "Manager" || roleValue === "Operator" || roleValue === "Viewer"
                ? (roleValue as "Admin" | "Manager" | "Operator" | "Viewer")
                : "Viewer"

            // Extract status and validate it's one of the allowed values
            const statusValue = entity.status?.value || "Active"
            const validStatus =
              statusValue === "Active" || statusValue === "Inactive" || statusValue === "Locked"
                ? (statusValue as "Active" | "Inactive" | "Locked")
                : "Active"

            return {
              id: entity.id,
              username: entity.username?.value || "user",
              email: entity.email?.value || "user@example.com",
              firstName: entity.firstName?.value || "Unknown",
              lastName: entity.lastName?.value || "User",
              role: validRole,
              department: entity.department?.value || "General",
              lastLogin: entity.lastLogin?.value || null,
              status: validStatus,
              createdAt: entity.dateCreated?.value || new Date().toISOString(),
            }
          })

          setUsers(updatedUsers)
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

  // Update the handleUpdateUserStatus function:
  const handleUpdateUserStatus = async (id: string, newStatus: "Active" | "Inactive" | "Locked") => {
    try {
      setUpdatingUser(id)

      // Simulate updating user status
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Update local state
      setUsers((prev) => prev.map((user) => (user.id === id ? { ...user, status: newStatus } : user)))

      toast.success(`User status has been updated to ${newStatus}.`, {
        description: "User status updated",
      })
    } catch (err) {
      console.error("Error updating user status:", err)
      toast.error("Failed to update user status. Please try again.", {
        description: "Error",
      })
    } finally {
      setUpdatingUser(null)
    }
  }

  // Filter and search users
  const filteredUsers = users.filter((user) => {
    // Apply search filter
    if (
      searchQuery &&
      !user.username.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !user.email.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !`${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false
    }

    // Apply role filter
    if (filterRole && user.role !== filterRole) {
      return false
    }

    // Apply status filter
    if (filterStatus && user.status !== filterStatus) {
      return false
    }

    return true
  })

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "Admin":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Admin
          </Badge>
        )
      case "Manager":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Manager
          </Badge>
        )
      case "Operator":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Operator
          </Badge>
        )
      case "Viewer":
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            Viewer
          </Badge>
        )
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Active
          </Badge>
        )
      case "Inactive":
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            Inactive
          </Badge>
        )
      case "Locked":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Locked
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never"
    return format(new Date(dateString), "MMM d, yyyy h:mm a")
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  return (
    <div className="flex flex-col">
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <h1 className="text-lg font-semibold">User Management</h1>
          <div className="ml-auto flex items-center space-x-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                  <DialogDescription>Create a new user account for the warehouse management system</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" placeholder="Enter first name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" placeholder="Enter last name" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="Enter email address" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" placeholder="Enter username" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="operator">Operator</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="warehouse">Warehouse</SelectItem>
                          <SelectItem value="shipping">Shipping</SelectItem>
                          <SelectItem value="receiving">Receiving</SelectItem>
                          <SelectItem value="management">Management</SelectItem>
                          <SelectItem value="it">IT</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline">Cancel</Button>
                  <Button>Create User</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
                placeholder="Search users..."
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
                <DropdownMenuLabel>Filter by Role</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setFilterRole(null)}>All Roles</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterRole("Admin")}>Admin</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterRole("Manager")}>Manager</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterRole("Operator")}>Operator</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterRole("Viewer")}>Viewer</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setFilterStatus(null)}>All Statuses</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("Active")}>Active</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("Inactive")}>Inactive</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("Locked")}>Locked</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Users</CardTitle>
            <CardDescription>
              Manage user accounts and permissions
              {filterRole && ` • Role: ${filterRole}`}
              {filterStatus && ` • Status: ${filterStatus}`}
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
                      <TableHead className="w-[250px]">User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <div>
                              <Skeleton className="h-4 w-[120px]" />
                              <Skeleton className="h-3 w-[150px] mt-1" />
                            </div>
                          </div>
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
                    <TableHead className="w-[250px]">User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        {searchQuery || filterRole || filterStatus
                          ? "No users match your search criteria."
                          : "No users found. Add a user to see them here."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>{getInitials(user.firstName, user.lastName)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {user.firstName} {user.lastName}
                              </div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        <TableCell>{user.department}</TableCell>
                        <TableCell>{getStatusBadge(user.status)}</TableCell>
                        <TableCell>{formatDate(user.lastLogin)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                {updatingUser === user.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <MoreHorizontal className="h-4 w-4" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <UserCog className="mr-2 h-4 w-4" />
                                Edit User
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Key className="mr-2 h-4 w-4" />
                                Reset Password
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuLabel>Status</DropdownMenuLabel>
                              {user.status !== "Active" && (
                                <DropdownMenuItem
                                  onClick={() => handleUpdateUserStatus(user.id, "Active")}
                                  disabled={updatingUser === user.id}
                                >
                                  <UnlockIcon className="mr-2 h-4 w-4" />
                                  Activate User
                                </DropdownMenuItem>
                              )}
                              {user.status !== "Inactive" && (
                                <DropdownMenuItem
                                  onClick={() => handleUpdateUserStatus(user.id, "Inactive")}
                                  disabled={updatingUser === user.id}
                                >
                                  <ShieldCheck className="mr-2 h-4 w-4" />
                                  Deactivate User
                                </DropdownMenuItem>
                              )}
                              {user.status !== "Locked" && (
                                <DropdownMenuItem
                                  onClick={() => handleUpdateUserStatus(user.id, "Locked")}
                                  disabled={updatingUser === user.id}
                                  className="text-red-600"
                                >
                                  <LockIcon className="mr-2 h-4 w-4" />
                                  Lock Account
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
      </div>
    </div>
  )
}

