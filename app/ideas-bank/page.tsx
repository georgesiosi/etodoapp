'use client'

import React, { useEffect, useState } from 'react'
import { useIdeasManagement, Idea } from '@/components/ideas/hooks/useIdeasManagement'
import { useTaskManagement } from '@/components/task/hooks/useTaskManagement'
import { useRouter } from 'next/navigation'
import { ArrowLeftIcon } from '@heroicons/react/24/solid'
import { formatDistanceToNow } from 'date-fns'

export default function IdeasBankPage() {
  const { ideas, setInitialIdeas, deleteIdea, convertIdeaToTask } = useIdeasManagement()
  const { addTaskWithAIAnalysis } = useTaskManagement()
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Load ideas from localStorage
    const loadIdeas = () => {
      try {
        const storedIdeas = localStorage.getItem('ideas')
        if (storedIdeas) {
          const parsedIdeas = JSON.parse(storedIdeas) as Idea[]
          console.log('[DEBUG] Loaded ideas from localStorage:', parsedIdeas.length)
          setInitialIdeas(parsedIdeas)
        } else {
          console.log('[DEBUG] No ideas found in localStorage')
        }
      } catch (error) {
        console.error('Error loading ideas from localStorage:', error)
      } finally {
        setLoading(false)
      }
    }

    loadIdeas()
  }, [setInitialIdeas])

  // Save ideas to localStorage whenever they change
  useEffect(() => {
    if (!loading) {
      try {
        localStorage.setItem('ideas', JSON.stringify(ideas))
        console.log('[DEBUG] Saved ideas to localStorage:', ideas.length)
      } catch (error) {
        console.error('Error saving ideas to localStorage:', error)
      }
    }
  }, [ideas, loading])

  const handleDeleteIdea = (id: string) => {
    deleteIdea(id)
  }

  const handleConvertToTask = async (id: string) => {
    const ideaData = convertIdeaToTask(id)
    if (ideaData) {
      // Add the idea as a task
      await addTaskWithAIAnalysis(ideaData.ideaText)
      
      // Show a toast notification
      const event = new CustomEvent('showToast', {
        detail: {
          message: 'Idea converted to task',
          type: 'success'
        }
      })
      window.dispatchEvent(event)
    }
  }

  const getTaskTypeLabel = (taskType: string) => {
    switch (taskType) {
      case 'personal':
        return 'Personal'
      case 'work':
      case 'business':
        return 'Work/Business'
      case 'idea':
        return 'Idea'
      default:
        return 'Unknown'
    }
  }

  const getTaskTypeColor = (taskType: string) => {
    switch (taskType) {
      case 'personal':
        return 'bg-purple-100 text-purple-800'
      case 'work':
      case 'business':
        return 'bg-blue-100 text-blue-800'
      case 'idea':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-8">
        <button
          onClick={() => router.push('/')}
          className="mr-4 p-2 rounded-full hover:bg-gray-200 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <h1 className="text-3xl font-bold">Ideas Bank</h1>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      ) : ideas.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500">No ideas yet. Ideas will appear here when you create tasks that are identified as ideas.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Idea
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ideas.map((idea) => (
                <tr key={idea.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-normal">
                    <div className="text-sm text-gray-900">{idea.text}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTaskTypeColor(idea.taskType)}`}>
                      {getTaskTypeLabel(idea.taskType)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDistanceToNow(idea.createdAt, { addSuffix: true })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${idea.connectedToPriority ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                      {idea.connectedToPriority ? 'Priority-related' : 'General idea'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleConvertToTask(idea.id)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Convert to Task
                    </button>
                    <button
                      onClick={() => handleDeleteIdea(idea.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
