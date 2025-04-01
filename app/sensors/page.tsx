import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { SensorStatusList } from "@/components/sensor-status-list"
import { Plus, RefreshCcw } from "lucide-react"
import { FiwareIntegration } from "@/components/fiware-integration"

export default function SensorsPage() {
  return (
    <div className="flex flex-col">
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <h1 className="text-lg font-semibold">IoT Sensors</h1>
          <div className="ml-auto flex items-center space-x-4">
            <Button variant="outline">
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh Data
            </Button>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Sensor
            </Button>
          </div>
        </div>
      </div>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <Tabs defaultValue="sensors" className="space-y-4">
          <TabsList>
            <TabsTrigger value="sensors">Sensors</TabsTrigger>
            <TabsTrigger value="data">Sensor Data</TabsTrigger>
            <TabsTrigger value="fiware">FIWARE Integration</TabsTrigger>
          </TabsList>
          <TabsContent value="sensors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Sensor Status</CardTitle>
                <CardDescription>Monitor all IoT sensors across the warehouse</CardDescription>
              </CardHeader>
              <CardContent>
                <SensorStatusList />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="data" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Sensor Data Visualization</CardTitle>
                <CardDescription>Historical sensor data and trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center p-8 text-center">
                  <div className="space-y-2">
                    <p>This view would integrate with WireCloud dashboards for advanced data visualization</p>
                    <Button variant="outline">Open in WireCloud</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="fiware" className="space-y-4">
            <FiwareIntegration />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

