"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Clock, Archive, Trash } from "lucide-react"
import { cn } from "@/lib/utils"
import { Task, TaskStatus } from "@/types/task"
import { useTaskManagement } from "@/components/task/hooks/useTaskManagement"
import { format } from "date-fns"

type FilterStatus = "completed" | "archived" | "deleted" | "all"

export default function TaskHistoryPage() {
  const router = useRouter()
  const { tasks } = useTaskManagement()
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all")

  // Filter out active tasks and sort by most recent
  const historicalTasks = tasks
    .filter(task => task.status !== "active")
    .filter(task => 
      filterStatus === "all" ? true : task.status === filterStatus
    )
    .sort((a, b) => {
      const getDate = (task: Task) => {
        switch (task.status) {
          case "completed": return task.completedAt
          case "archived": return task.archivedAt
          case "deleted": return task.deletedAt
          default: return task.updatedAt
        }
      }
      return new Date(getDate(b)).getTime() - new Date(getDate(a)).getTime()
    })

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case "completed": return <Clock className="h-4 w-4" />
      case "archived": return <Archive className="h-4 w-4" />
      case "deleted": return <Trash className="h-4 w-4" />
      default: return null
    }
  }

  const getStatusDate = (task: Task) => {
    switch (task.status) {
      case "completed": return task.completedAt
      case "archived": return task.archivedAt
      case "deleted": return task.deletedAt
      default: return task.updatedAt
    }
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push("/")}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Task History</h1>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <Button
          variant={filterStatus === "all" ? "default" : "outline"}
          onClick={() => setFilterStatus("all")}
        >
          All
        </Button>
        <Button
          variant={filterStatus === "completed" ? "default" : "outline"}
          onClick={() => setFilterStatus("completed")}
        >
          Completed
        </Button>
        <Button
          variant={filterStatus === "archived" ? "default" : "outline"}
          onClick={() => setFilterStatus("archived")}
        >
          Archived
        </Button>
        <Button
          variant={filterStatus === "deleted" ? "default" : "outline"}
          onClick={() => setFilterStatus("deleted")}
        >
          Deleted
        </Button>
      </div>

      <div className="space-y-4">
        {historicalTasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No {filterStatus === "all" ? "historical" : filterStatus} tasks found
          </div>
        ) : (
          historicalTasks.map(task => (
            <div
              key={task.id}
              className="flex items-start gap-4 p-4 rounded-lg border bg-card"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn(
                    "text-sm font-medium",
                    task.status === "completed" && "text-green-600",
                    task.status === "archived" && "text-blue-600",
                    task.status === "deleted" && "text-red-600"
                  )}>
                    {getStatusIcon(task.status)}
                  </span>
                  <span className={cn(
                    "text-sm",
                    task.status === "deleted" && "line-through"
                  )}>
                    {task.text}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>
                    {task.status.charAt(0).toUpperCase() + task.status.slice(1)} on{" "}
                    {format(new Date(getStatusDate(task)), "MMM d, yyyy 'at' h:mm a")}
                  </span>
                  <span>Quadrant: {task.quadrant.toUpperCase()}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
