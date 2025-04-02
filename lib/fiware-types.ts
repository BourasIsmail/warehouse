// Define types for Orion Context Broker entities

// Entity base type with common properties
export interface OrionEntity {
    id: string
    type: string
}

// Entity attribute types
export interface TextAttribute {
    type: "Text"
    value: string
}

export interface NumberAttribute {
    type: "Number"
    value: number
}

export interface DateTimeAttribute {
    type: "DateTime"
    value: string
}

export interface BooleanAttribute {
    type: "Boolean"
    value: boolean
}

export interface StructuredValueAttribute {
    type: "StructuredValue"
    value: unknown
}

// Generic entity type
export interface GenericOrionEntity extends OrionEntity {
    [key: string]:
    | TextAttribute
    | NumberAttribute
    | DateTimeAttribute
    | BooleanAttribute
    | StructuredValueAttribute
    | string
}

// Sensor entity
export interface OrionSensor extends OrionEntity {
    name?: TextAttribute
    sensorType?: TextAttribute
    location?: TextAttribute
    batteryLevel?: NumberAttribute
    dateModified?: DateTimeAttribute
    temperature?: NumberAttribute
    humidity?: NumberAttribute
    weight?: NumberAttribute
    scanRate?: NumberAttribute
}

// Inventory item entity
export interface OrionInventoryItem extends OrionEntity {
    sku?: TextAttribute
    name?: TextAttribute
    quantity?: NumberAttribute
    location?: TextAttribute
    threshold?: NumberAttribute
    dateModified?: DateTimeAttribute
}

// Warehouse zone entity
export interface OrionWarehouseZone extends OrionEntity {
    name?: TextAttribute
    capacity?: NumberAttribute
    currentInventory?: NumberAttribute
    dateModified?: DateTimeAttribute
}

// Alert entity
export interface OrionAlert extends OrionEntity {
    message?: TextAttribute
    severity?: TextAttribute
    zone?: TextAttribute
    timestamp?: DateTimeAttribute
}

// Shipment entity
export interface OrionShipment extends OrionEntity {
    shipmentId?: TextAttribute
    status?: TextAttribute
    origin?: TextAttribute
    destination?: TextAttribute
    carrier?: TextAttribute
    trackingNumber?: TextAttribute
    items?: StructuredValueAttribute
    scheduledDate?: DateTimeAttribute
    actualDate?: DateTimeAttribute
    dateCreated?: DateTimeAttribute
    dateModified?: DateTimeAttribute
}

// Order entity
export interface OrionOrder extends OrionEntity {
    orderId?: TextAttribute
    customer?: TextAttribute
    status?: TextAttribute
    items?: StructuredValueAttribute
    totalAmount?: NumberAttribute
    paymentStatus?: TextAttribute
    orderDate?: DateTimeAttribute
    shipByDate?: DateTimeAttribute
    priority?: TextAttribute
    notes?: TextAttribute
    dateCreated?: DateTimeAttribute
    dateModified?: DateTimeAttribute
}

// Report entity
export interface OrionReport extends OrionEntity {
    name?: TextAttribute
    description?: TextAttribute
    reportType?: TextAttribute
    createdBy?: TextAttribute
    dateCreated?: DateTimeAttribute
    lastRun?: DateTimeAttribute
    schedule?: TextAttribute
    format?: TextAttribute
    url?: TextAttribute
}

// User entity
export interface OrionUser extends OrionEntity {
    username?: TextAttribute
    email?: TextAttribute
    firstName?: TextAttribute
    lastName?: TextAttribute
    role?: TextAttribute
    department?: TextAttribute
    lastLogin?: DateTimeAttribute
    status?: TextAttribute
    dateCreated?: DateTimeAttribute
}

// System setting entity
export interface OrionSystemSetting extends OrionEntity {
    category?: TextAttribute
    key?: TextAttribute
    value?: TextAttribute
    description?: TextAttribute
    updatedBy?: TextAttribute
    dateModified?: DateTimeAttribute
}

export interface OrderItem {
    id: string
    sku: string
    productName: string
    price: number
    quantity: number
}

export interface Order {
    id: string
    orderId: string
    customer: string
    status: "New" | "Processing" | "Shipped" | "Delivered" | "Cancelled"
    items: OrderItem[]
    totalAmount: number
    paymentStatus: "Pending" | "Paid" | "Refunded"
    orderDate: string
    shipByDate: string
    priority: "Low" | "Normal" | "High" | "Urgent"
    notes: string
}

export interface User {
    id: string
    username: string
    email: string
    firstName: string
    lastName: string
    role: "Admin" | "Manager" | "Operator" | "Viewer"
    department: string
    lastLogin: string | null
    status: "Active" | "Inactive" | "Locked"
    createdAt: string
}

export interface ShipmentItem {
    id: string
    productId: string
    productName: string
    quantity: number
    sku: string
}

export interface Shipment {
    id: string
    shipmentId: string
    status: "Pending" | "In Transit" | "Delivered" | "Cancelled"
    origin: string
    destination: string
    carrier: string
    trackingNumber: string
    items: ShipmentItem[]
    scheduledDate: string
    actualDate: string | null
    createdAt: string
    updatedAt: string
}

