"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, UserCheck, UserMinus, Activity } from "lucide-react"
import { UserHeatMap } from "@/components/user-heat-map"
import { UserActivityChart } from "@/components/user-activity-chart"

interface AdminDashboardProps {
  stats: {
    totalUsers: number
    activeUsers: number
    inactiveUsers: number
  }
  activityData: {
    activityByDay: number[]
    activityByHour: number[]
  }
}

export function AdminDashboard({ stats, activityData }: AdminDashboardProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Registered users</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">Active in the last 7 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Users</CardTitle>
            <UserMinus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inactiveUsers}</div>
            <p className="text-xs text-muted-foreground">Inactive for more than 7 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activity Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Active users percentage</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="heatmap" className="space-y-4">
        <TabsList>
          <TabsTrigger value="heatmap">User Activity Heatmap</TabsTrigger>
          <TabsTrigger value="charts">Activity Charts</TabsTrigger>
        </TabsList>
        <TabsContent value="heatmap" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Activity Heatmap</CardTitle>
              <CardDescription>User activity distribution across days and hours</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <UserHeatMap activityData={activityData} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="charts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity by Day & Hour</CardTitle>
              <CardDescription>User activity patterns throughout the week</CardDescription>
            </CardHeader>
            <CardContent>
              <UserActivityChart activityData={activityData} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
