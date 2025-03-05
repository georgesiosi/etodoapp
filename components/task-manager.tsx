"use client"

import { useEffect, useState } from "react"
import { useProfile } from "@/hooks/use-profile"
import { ReasoningLogService } from "@/services/ai/reasoningLogService"
import { useReflectionSystem } from "@/components/task/hooks/useReflectionSystem"
import { useTaskManagement } from "@/components/task/hooks/useTaskManagement"
import { useIdeasManagement } from "@/components/ideas/hooks/useIdeasManagement"
import type { TaskOrIdeaType } from "@/types/task"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Plus, History } from "lucide-react"
import { useRouter } from "next/navigation"
import { exportTasksToCSV } from "@/lib/export-utils"
import { EisenhowerMatrix } from "@/components/eisenhower-matrix"
import { TaskModal } from "@/components/task-modal"
import { ReflectionCard } from "@/components/ui/reflection-card"
import { TaskCompletionConfetti } from "@/components/ui/task-completion-confetti"
import { VelocityMeters } from "@/components/velocity-meters"
import IdeaPriorityDialog from "@/components/ideas/idea-priority-dialog"
import { ScorecardButton } from "@/components/scorecard-button"
import { EndDayScorecard } from "@/components/end-day-scorecard"

export function TaskManager() {
  const router = useRouter();
  const { toast } = useToast();
  const { 
    tasks, 
    addTask, 
    addTaskWithAIAnalysis, 
    updateTask, 
    deleteTask, 
    toggleTask, 
    reorderTasks,
    setInitialTasks,
    showConfetti,
    hideConfetti
  } = useTaskManagement()
  const { addIdea, ideas, setInitialIdeas } = useIdeasManagement()
  const { reflectingTask, startReflection, submitReflection, cancelReflection } = useReflectionSystem()

  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [isAIThinking, setIsAIThinking] = useState(false)
  const [ideaDialogOpen, setIdeaDialogOpen] = useState(false)
  const [currentIdea, setCurrentIdea] = useState({ text: "", taskType: "personal" as TaskType, connectedToPriority: false });

  // Flag to track if tasks are being loaded from localStorage
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [isLoadingIdeas, setIsLoadingIdeas] = useState(true);
  const [scorecardOpen, setScorecardOpen] = useState(false);

  // Load tasks from localStorage on mount
  useEffect(() => {
    const loadTasks = () => {
      try {
        const savedTasks = localStorage.getItem("tasks");
        if (savedTasks) {
          const parsedTasks = JSON.parse(savedTasks);
          
          // Debug logging for loaded tasks
          console.log("[DEBUG] Loading tasks from localStorage:", parsedTasks);
          console.log("[DEBUG] Task types from localStorage:", parsedTasks.map((t: any) => ({ id: t.id, text: t.text.substring(0, 20), type: t.taskType })));
          
          // Check if any tasks have work or business type
          const workTasks = parsedTasks.filter((t: any) => t.taskType === "work" || t.taskType === "business");
          console.log("[DEBUG] Work/Business tasks in localStorage:", workTasks.map((t: any) => ({ id: t.id, text: t.text.substring(0, 20), type: t.taskType })));
          
          // Convert string dates to numbers
          const formattedTasks = parsedTasks.map((task: any) => ({
            ...task,
            createdAt: typeof task.createdAt === 'string' ? 
              (isNaN(Number(task.createdAt)) ? new Date(task.createdAt).getTime() : Number(task.createdAt)) : 
              task.createdAt,
            updatedAt: typeof task.updatedAt === 'string' ? 
              (isNaN(Number(task.updatedAt)) ? new Date(task.updatedAt).getTime() : Number(task.updatedAt)) : 
              task.updatedAt,
            completedAt: task.completedAt ? 
              (typeof task.completedAt === 'string' ? 
                (isNaN(Number(task.completedAt)) ? new Date(task.completedAt).getTime() : Number(task.completedAt)) : 
                task.completedAt) : 
              undefined
          }));
          
          // Debug logging for formatted tasks
          console.log("[DEBUG] Formatted tasks after loading:", formattedTasks);
          console.log("[DEBUG] Task types after formatting:", formattedTasks.map((t: any) => ({ id: t.id, text: t.text.substring(0, 20), type: t.taskType })));
          
          // Check if any tasks have work or business type after formatting
          const formattedWorkTasks = formattedTasks.filter((t: any) => t.taskType === "work" || t.taskType === "business");
          console.log("[DEBUG] Work/Business tasks after formatting:", formattedWorkTasks.map((t: any) => ({ id: t.id, text: t.text.substring(0, 20), type: t.taskType })));
          
          setInitialTasks(formattedTasks);
        }
        setIsLoadingTasks(false);
      } catch (error) {
        console.error("Error loading tasks from localStorage:", error);
        setIsLoadingTasks(false);
      }
    };
    
    loadTasks();
  }, [setInitialTasks]);

  // Load ideas from localStorage on mount
  useEffect(() => {
    const loadIdeas = () => {
      try {
        const savedIdeas = localStorage.getItem("ideas");
        if (savedIdeas) {
          const parsedIdeas = JSON.parse(savedIdeas);
          
          // Debug logging for loaded ideas
          console.log("[DEBUG] Loading ideas from localStorage:", parsedIdeas);
          
          // Convert string dates to numbers if needed
          const formattedIdeas = parsedIdeas.map((idea: any) => ({
            ...idea,
            createdAt: typeof idea.createdAt === 'string' ? 
              (isNaN(Number(idea.createdAt)) ? new Date(idea.createdAt).getTime() : Number(idea.createdAt)) : 
              idea.createdAt,
            updatedAt: typeof idea.updatedAt === 'string' ? 
              (isNaN(Number(idea.updatedAt)) ? new Date(idea.updatedAt).getTime() : Number(idea.updatedAt)) : 
              idea.updatedAt
          }));
          
          setInitialIdeas(formattedIdeas);
        }
        setIsLoadingIdeas(false);
      } catch (error) {
        console.error("Error loading ideas from localStorage:", error);
        setIsLoadingIdeas(false);
      }
    };
    
    loadIdeas();
  }, [setInitialIdeas]);

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    if (tasks.length > 0) {
      try {
        // Debug logging for tasks before saving
        console.log("[DEBUG] Saving tasks to localStorage:", tasks);
        console.log("[DEBUG] Task types before saving:", tasks.map((t: any) => ({ id: t.id, text: t.text.substring(0, 20), type: t.taskType })));
        
        localStorage.setItem("tasks", JSON.stringify(tasks));
        
          // Verify what was saved
          const savedTasks = localStorage.getItem("tasks");
          if (savedTasks) {
            const parsedTasks = JSON.parse(savedTasks);
            console.log("[DEBUG] Verified saved tasks:", parsedTasks.length);
            console.log("[DEBUG] Verified task types:", parsedTasks.map((t: any) => ({ id: t.id, text: t.text.substring(0, 20), type: t.taskType })));
          }
      } catch (error) {
        console.error("Error saving tasks to localStorage:", error);
        toast({
          title: "Error Saving Tasks",
          description: "There was a problem saving your tasks. Changes may not persist.",
          variant: "destructive",
        });
      }
    }
  }, [tasks, toast]);

  // Save ideas to localStorage whenever they change
  useEffect(() => {
    if (!isLoadingIdeas && ideas.length > 0) {
      try {
        localStorage.setItem("ideas", JSON.stringify(ideas));
        console.log("[DEBUG] Saved ideas to localStorage:", ideas.length);
      } catch (error) {
        console.error("Error saving ideas to localStorage:", error);
        toast({
          title: "Error Saving Ideas",
          description: "There was a problem saving your ideas. Changes may not persist.",
          variant: "destructive",
        });
      }
    }
  }, [ideas, isLoadingIdeas, toast]);
  
  // Set up export tasks event listener
  useEffect(() => {
    const handleExport = () => handleExportTasks();
    window.addEventListener('exportTasks', handleExport);
    return () => window.removeEventListener('exportTasks', handleExport);
  }, []);



  const handleUpdateTaskStatus = (taskId: string, status: TaskStatus) => {
    // Find all tasks in the same quadrant
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const quadrantTasks = tasks.filter(t => t.quadrant === task.quadrant);
    
    // Calculate new order based on status
    let newOrder: number;
    if (status === 'completed') {
      // If completing task, put it at the end
      const maxOrder = Math.max(...quadrantTasks.map(t => t.order || 0));
      newOrder = maxOrder + 1;
    } else if (status === 'active') {
      // If uncompleting task, put it at the start of active tasks
      const activeTasks = quadrantTasks.filter(t => t.status === 'active');
      const minActiveOrder = activeTasks.length > 0 
        ? Math.min(...activeTasks.map(t => t.order || 0))
        : 0;
      newOrder = minActiveOrder - 1;
    }


    const timestamp = new Date().toISOString();
    const updates: Partial<Task> = {
      status,
      ...(status === 'completed' && { completedAt: timestamp }),
      ...(status === 'archived' && { archivedAt: timestamp }),
      updatedAt: timestamp,
      order: newOrder
    };

    updateTask(taskId, updates);
  };

  const handleAddTask = async (text: string, quadrant: string) => {
    if (!text.trim()) return;
    
    try {
      // Set AI thinking state to true - will show indicator in Q4
      setIsAIThinking(true);
      
      // First, analyze with AI without creating a task
      const response = await fetch('/api/analyze-reflection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task: text,
          justification: '',
          goal: '',
          priority: '',
          currentQuadrant: quadrant,
          personalContext: useProfile.getState().getPersonalContext()
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to analyze input: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log("[DEBUG] AI analysis result:", result);
      
      if (result.isIdea) {
        console.log("[DEBUG] AI detected an idea:", text);
        
        // Add directly to ideas bank with priority connection info
        const idea = addIdea({
          text,
          taskType: 'idea',
          connectedToPriority: result.connectedToPriority || false
        });
        
        if (idea) {
          setTaskModalOpen(false);
          
          // Show a toast notification with a link to the Ideas Bank
          toast({
            title: "Idea Added",
            description: (
              <div>
                Added to Ideas Bank.{" "}
                <button 
                  onClick={() => router.push("/ideas-bank")} 
                  className="font-medium underline hover:text-primary"
                >
                  View Ideas Bank
                </button>
              </div>
            ),
            duration: 5000,
          });
        }
      } else {
        // It's a regular task, create it with the analyzed properties
        const task = addTask({
          text,
          quadrant: result.suggestedQuadrant || (quadrant as "q1" | "q2" | "q3" | "q4"),
          taskType: result.taskType || 'work',
          completed: false,
          needsReflection: false,
          status: 'active'
        });
        
        if (task) {
          // Store the reasoning log
          try {
            ReasoningLogService.storeLog({
              taskId: task.id,
              taskText: text,
              timestamp: Date.now(),
              suggestedQuadrant: result.suggestedQuadrant,
              taskType: result.taskType || 'work',
              reasoning: result.reasoning || 'No reasoning provided',
              alignmentScore: result.alignmentScore || 5,
              urgencyScore: result.urgencyScore || 5,
              importanceScore: result.importanceScore || 5
            });
          } catch (logError) {
            console.error('Error storing reasoning log:', logError);
            // Continue execution even if logging fails
          }
          
          setTaskModalOpen(false);
          toast({
            title: "Task Added",
            description: "Your new task has been added and categorized by AI.",
          });
        } else {
          toast({
            title: "Error Adding Task",
            description: "There was a problem adding your task. Please try again.",
            variant: "destructive",
          });
        }
      }
      
      // Set AI thinking state back to false
      setIsAIThinking(false);
    } catch (error) {
      console.error("Error in handleAddTask:", error);
      setIsAIThinking(false);
      toast({
        title: "Error Adding Task",
        description: "There was a problem adding your task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleMoveTask = (taskId: string, newQuadrant: QuadrantType) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Update the task's quadrant
    updateTask(taskId, { quadrant: newQuadrant });

    // Show a toast notification
    toast({
      title: "Task Moved",
      description: `Task moved to ${newQuadrant === 'q1' ? 'Urgent & Important' :
                    newQuadrant === 'q2' ? 'Important, Not Urgent' :
                    newQuadrant === 'q3' ? 'Urgent, Not Important' :
                    'Neither Urgent nor Important'}`
    });
  }

  const handleExportTasks = () => {
    exportTasksToCSV()
    toast({
      title: "Tasks Exported",
      description: "Your tasks have been exported to CSV",
    })
  }

  const handleSendToIdeasBank = () => {
    // Add the idea to the Ideas Bank
    const idea = addIdea({
      text: currentIdea.text,
      taskType: currentIdea.taskType,
      connectedToPriority: currentIdea.connectedToPriority
    });
    
    if (idea) {
      setIdeaDialogOpen(false);
      setTaskModalOpen(false);
      
      // Show a toast notification with a link to the Ideas Bank
      toast({
        title: "Idea Added",
        description: (
          <div>
            Added to Ideas Bank.{" "}
            <button 
              onClick={() => router.push("/ideas-bank")} 
              className="font-medium underline hover:text-primary"
            >
              View Ideas Bank
            </button>
          </div>
        ),
        duration: 5000,
      });
    }
  };

  const handleConvertToTask = async () => {
    // Convert the idea to a task
    const { task } = await addTaskWithAIAnalysis(currentIdea.text);
    
    if (task) {
      setIdeaDialogOpen(false);
      setTaskModalOpen(false);
      toast({
        title: "Task Added",
        description: "Your idea has been converted to a task and categorized by AI.",
      });
    }
  };

  return (
    <div>
      {/* Confetti animation for completing urgent & important tasks */}
      <TaskCompletionConfetti show={showConfetti} onComplete={hideConfetti} />
      
      {/* Idea priority dialog */}
      <IdeaPriorityDialog
        isOpen={ideaDialogOpen}
        ideaText={currentIdea.text}
        onClose={() => setIdeaDialogOpen(false)}
        onSendToIdeasBank={handleSendToIdeasBank}
        onConvertToTask={handleConvertToTask}
      />
      
      {/* Export tasks event listener is set up in a useEffect at the component level */}

      {/* Floating Action Button for adding tasks */}
      <Button 
        variant="default" 
        onClick={() => setTaskModalOpen(true)}
        className="floating-action-button"
        aria-label="Add new task"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Task Actions Section */}
      <div className="mb-4 flex justify-end space-x-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => router.push("/history")}
        >
          <History className="h-4 w-4" />
          History
        </Button>
        <ScorecardButton
          onClick={() => setScorecardOpen(true)}
          tasks={tasks.filter(t => t.status === 'active' || t.status === 'completed')}
          className="w-auto"
        />
      </div>

      <div className="mt-4">
        <EisenhowerMatrix
          tasks={tasks
            .filter(t => {
              // Show active tasks and tasks completed today
              if (t.status === 'active') return true;
              if (t.status === 'completed' && t.completedAt) {
                const completedDate = new Date(t.completedAt);
                const today = new Date();
                return completedDate.toDateString() === today.toDateString();
              }
              return false;
            })
            .map(task => ({
            ...task,
            createdAt: String(task.createdAt),
            updatedAt: String(task.updatedAt),
            completedAt: task.completedAt ? String(task.completedAt) : undefined
          }))}
          onToggleTask={(id) => {
            const task = tasks.find(t => t.id === id);
            if (!task) return;
            handleUpdateTaskStatus(id, task.status === 'completed' ? 'active' : 'completed');
          }}
          onDeleteTask={(id) => handleUpdateTaskStatus(id, 'archived')}
          onReflectionRequested={startReflection}
          onMoveTask={handleMoveTask}
          onEditTask={(taskId, newText) => {
            updateTask(taskId, { text: newText });
            toast({
              title: "Task Updated",
              description: "Your task has been updated successfully.",
            });
          }}
          onReorderTasks={reorderTasks}
          isAIThinking={isAIThinking}
        />
      </div>

      {reflectingTask && (
        <ReflectionCard
          task={reflectingTask}
          onSubmit={submitReflection}
          onCancel={cancelReflection}
        />
      )}

      <TaskModal 
        open={taskModalOpen}
        onOpenChange={setTaskModalOpen}
        onAddTask={handleAddTask}
        isAIThinking={isAIThinking}
      />
      
      {/* Velocity Meters */}
      <div className="mt-6 mb-2">
        
        {/* Velocity Meters for personal and work tasks */}
        <EndDayScorecard
          isOpen={scorecardOpen}
          onClose={() => setScorecardOpen(false)}
          tasks={tasks}
          onUpdateTaskStatus={handleUpdateTaskStatus}
        />

        <VelocityMeters 
          tasks={tasks.filter(t => t.status === 'active' || t.status === 'completed').map(task => {
            return {
              ...task,
              createdAt: String(task.createdAt),
              updatedAt: String(task.updatedAt),
              completedAt: task.completedAt ? String(task.completedAt) : undefined
            };
          })} 
        />
      </div>
    </div>
  )
}
