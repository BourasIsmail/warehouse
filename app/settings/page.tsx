"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Loader2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchSystemSettings, type SystemSetting, updateSystemSetting } from "@/lib/fiware-service"
import { toast } from "sonner"

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true)
        const data = await fetchSystemSettings()
        setSettings(data)
        setError(null)
      } catch (err) {
        console.error("Error loading settings:", err)
        setError("Failed to load system settings. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [])

  const handleUpdateSetting = async (id: string, value: string) => {
    try {
      setSaving(id)
      await updateSystemSetting(id, value, "Admin")

      // Update local state
      setSettings((prev) => prev.map((setting) => (setting.id === id ? { ...setting, value } : setting)))

      toast.success("The system setting has been successfully updated.", {
        description: "Setting updated",
      })
    } catch (err) {
      console.error("Error updating setting:", err)
      toast.error("Failed to update the setting. Please try again.", {
        description: "Error",
      })
    } finally {
      setSaving(null)
    }
  }

  // Group settings by category
  const groupedSettings = settings.reduce(
    (acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = []
      }
      acc[setting.category].push(setting)
      return acc
    },
    {} as Record<string, SystemSetting[]>,
  )

  const renderSettingInput = (setting: SystemSetting) => {
    const key = setting.key.toLowerCase()

    if (key.includes("enable") || key.includes("active") || key.includes("allow")) {
      const isChecked = setting.value.toLowerCase() === "true"
      return (
        <div className="flex items-center space-x-2">
          <Switch
            id={setting.id}
            checked={isChecked}
            onCheckedChange={(checked) => handleUpdateSetting(setting.id, checked.toString())}
            disabled={saving === setting.id}
          />
          <Label htmlFor={setting.id}>{isChecked ? "Enabled" : "Disabled"}</Label>
        </div>
      )
    }

    if (key.includes("interval") || key.includes("timeout") || key.includes("limit")) {
      return (
        <div className="flex w-full max-w-sm items-center space-x-2">
          <Input
            type="number"
            value={setting.value}
            onChange={(e) => handleUpdateSetting(setting.id, e.target.value)}
            disabled={saving === setting.id}
          />
          {saving === setting.id && <Loader2 className="h-4 w-4 animate-spin" />}
        </div>
      )
    }

    if (key.includes("mode") || key.includes("type") || key.includes("format")) {
      const options = getOptionsForSetting(key)
      return (
        <div className="flex w-full max-w-sm items-center space-x-2">
          <Select
            defaultValue={setting.value}
            onValueChange={(value) => handleUpdateSetting(setting.id, value)}
            disabled={saving === setting.id}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select option" />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {saving === setting.id && <Loader2 className="h-4 w-4 animate-spin" />}
        </div>
      )
    }

    // Default to text input
    return (
      <div className="flex w-full max-w-sm items-center space-x-2">
        <Input
          value={setting.value}
          onChange={(e) => handleUpdateSetting(setting.id, e.target.value)}
          disabled={saving === setting.id}
        />
        {saving === setting.id && <Loader2 className="h-4 w-4 animate-spin" />}
      </div>
    )
  }

  const getOptionsForSetting = (key: string) => {
    if (key.includes("mode")) {
      return ["Standard", "Advanced", "Debug"]
    }
    if (key.includes("type")) {
      return ["Default", "Custom", "Legacy"]
    }
    if (key.includes("format")) {
      return ["JSON", "XML", "CSV", "Text"]
    }
    return ["Option 1", "Option 2", "Option 3"]
  }

  return (
    <div className="flex flex-col">
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <h1 className="text-lg font-semibold">System Settings</h1>
        </div>
      </div>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        {loading ? (
          <div className="space-y-6">
            <Skeleton className="h-10 w-[300px]" />
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-[200px]" />
                    <Skeleton className="h-4 w-[300px]" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <div key={j} className="grid gap-2">
                        <Skeleton className="h-4 w-[150px]" />
                        <Skeleton className="h-10 w-full max-w-sm" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="p-4 border border-red-200 rounded-md bg-red-50 text-red-700">
            <p className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              {error}
            </p>
          </div>
        ) : (
          <Tabs defaultValue="general" className="space-y-4">
            <TabsList>
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="integration">Integration</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>Configure general system settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {groupedSettings["General"]?.map((setting) => (
                    <div key={setting.id} className="grid gap-2">
                      <Label htmlFor={setting.id}>{setting.key}</Label>
                      {renderSettingInput(setting)}
                      <p className="text-sm text-muted-foreground">{setting.description}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Warehouse Configuration</CardTitle>
                  <CardDescription>Configure warehouse-specific settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {groupedSettings["Warehouse"]?.map((setting) => (
                    <div key={setting.id} className="grid gap-2">
                      <Label htmlFor={setting.id}>{setting.key}</Label>
                      {renderSettingInput(setting)}
                      <p className="text-sm text-muted-foreground">{setting.description}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Settings</CardTitle>
                  <CardDescription>Configure how and when notifications are sent</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {groupedSettings["Notifications"]?.map((setting) => (
                    <div key={setting.id} className="grid gap-2">
                      <Label htmlFor={setting.id}>{setting.key}</Label>
                      {renderSettingInput(setting)}
                      <p className="text-sm text-muted-foreground">{setting.description}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Configure security and access control settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {groupedSettings["Security"]?.map((setting) => (
                    <div key={setting.id} className="grid gap-2">
                      <Label htmlFor={setting.id}>{setting.key}</Label>
                      {renderSettingInput(setting)}
                      <p className="text-sm text-muted-foreground">{setting.description}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="integration" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>FIWARE Integration</CardTitle>
                  <CardDescription>Configure FIWARE component integration settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {groupedSettings["FIWARE"]?.map((setting) => (
                    <div key={setting.id} className="grid gap-2">
                      <Label htmlFor={setting.id}>{setting.key}</Label>
                      {renderSettingInput(setting)}
                      <p className="text-sm text-muted-foreground">{setting.description}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>External API Integration</CardTitle>
                  <CardDescription>Configure external API integration settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {groupedSettings["API"]?.map((setting) => (
                    <div key={setting.id} className="grid gap-2">
                      <Label htmlFor={setting.id}>{setting.key}</Label>
                      {renderSettingInput(setting)}
                      <p className="text-sm text-muted-foreground">{setting.description}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Advanced Settings</CardTitle>
                  <CardDescription>Configure advanced system settings (use with caution)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {groupedSettings["Advanced"]?.map((setting) => (
                    <div key={setting.id} className="grid gap-2">
                      <Label htmlFor={setting.id}>{setting.key}</Label>
                      {renderSettingInput(setting)}
                      <p className="text-sm text-muted-foreground">{setting.description}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}

