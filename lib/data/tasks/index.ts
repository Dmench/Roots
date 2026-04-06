import { BRUSSELS_TASKS } from './brussels'
import { LISBON_TASKS } from './lisbon'
import type { Task, CityId, Stage, SituationTag } from '@/lib/types'

export const ALL_TASKS: Task[] = [...BRUSSELS_TASKS, ...LISBON_TASKS]

export function getTasksForCity(cityId: CityId): Task[] {
  return ALL_TASKS.filter(t => t.cityId === cityId)
}

export function filterTasks(
  tasks: Task[],
  stage?: Stage,
  situations?: SituationTag[],
): Task[] {
  return tasks.filter(task => {
    if (stage && !task.stageRelevance.includes(stage)) return false
    if (situations && situations.length > 0 && task.situationRelevance.length > 0) {
      const hasMatch = task.situationRelevance.some(s => situations.includes(s))
      if (!hasMatch) return false
    }
    return true
  })
}

export function getTask(cityId: CityId, slug: string): Task | undefined {
  return ALL_TASKS.find(t => t.cityId === cityId && t.slug === slug)
}
