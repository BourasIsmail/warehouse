import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { WireCloudDashboard } from "@/components/wirecloud-dashboard"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlusCircle, Settings } from "lucide-react"

export default function WireCloudPage() {
  return (
    <div className="flex flex-col">
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <h1 className="text-lg font-semibold">WireCloud Dashboards</h1>
          <div className="ml-auto flex items-center space-x-4">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Dashboard
            </Button>
          </div>
        </div>
      </div>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <Tabs defaultValue="dashboards" className="space-y-4">
          <TabsList>
            <TabsTrigger value="dashboards">Dashboards</TabsTrigger>
            <TabsTrigger value="widgets">Widgets</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboards" className="space-y-4">
            <WireCloudDashboard />
          </TabsContent>

          <TabsContent value="widgets" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Available Widgets</CardTitle>
                <CardDescription>Widgets that can be used in your WireCloud dashboards</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { name: "Temperature Chart", type: "Chart", description: "Line chart for temperature sensors" },
                    { name: "Inventory Table", type: "Table", description: "Interactive table of inventory items" },
                    { name: "Zone Map", type: "Map", description: "Warehouse zone visualization" },
                    { name: "Alert Panel", type: "Panel", description: "Real-time alerts display" },
                    { name: "Sensor Status", type: "Status", description: "IoT sensor status indicators" },
                    { name: "Shipment Tracker", type: "Tracker", description: "Track shipments in real-time" },
                  ].map((widget, index) => (
                    <Card key={index}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-md">{widget.name}</CardTitle>
                        <CardDescription>{widget.type}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{widget.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>WireCloud Settings</CardTitle>
                <CardDescription>Configure WireCloud integration settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center p-8 text-center">
                  <div className="space-y-2">
                    <Settings className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="text-lg font-medium">WireCloud Configuration</h3>
                    <p className="text-muted-foreground">
                      Configure connection settings, authentication, and preferences for WireCloud integration.
                    </p>
                    <Button className="mt-4">Configure WireCloud</Button>
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

