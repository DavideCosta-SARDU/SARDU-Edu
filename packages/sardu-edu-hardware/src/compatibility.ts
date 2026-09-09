import type { BoardDefinition, ComponentDefinition, HardwareDefinitions, HardwareSelection } from './contracts'

export type CompatibilityIssueCode =
  | 'unknown-board'
  | 'unknown-backend'
  | 'unsupported-backend'
  | 'unsupported-mode'
  | 'unknown-component'
  | 'unsupported-component'
  | 'missing-capability'
  | 'unknown-robot'
  | 'robot-board-mismatch'
  | 'robot-backend-mismatch'
  | 'robot-component-mismatch'

export interface CompatibilityIssue {
  readonly code: CompatibilityIssueCode
  readonly definitionId: string
}

const supportsMode = (modes: readonly string[], mode: string): boolean => modes.includes(mode)

const checkComponent = (
  board: BoardDefinition,
  component: ComponentDefinition,
  selection: HardwareSelection,
): CompatibilityIssue[] => {
  const issues: CompatibilityIssue[] = []
  if (
    !component.boardIds.includes(board.id) ||
    !component.backendIds.includes(selection.backendId) ||
    !supportsMode(component.modes, selection.mode)
  ) {
    issues.push({ code: 'unsupported-component', definitionId: component.id })
  }
  component.requiredCapabilities.forEach((capability) => {
    if (!board.capabilities.includes(capability)) {
      issues.push({ code: 'missing-capability', definitionId: capability })
    }
  })
  return issues
}

export const checkCompatibility = (
  definitions: HardwareDefinitions,
  selection: HardwareSelection,
): readonly CompatibilityIssue[] => {
  const board = definitions.boards.get(selection.boardId)
  if (!board) return [{ code: 'unknown-board', definitionId: selection.boardId }]

  const backend = definitions.backends.get(selection.backendId)
  if (!backend) return [{ code: 'unknown-backend', definitionId: selection.backendId }]

  const issues: CompatibilityIssue[] = []
  if (!board.backendIds.includes(backend.id)) {
    issues.push({ code: 'unsupported-backend', definitionId: backend.id })
  }
  if (!supportsMode(board.modes, selection.mode) || !supportsMode(backend.modes, selection.mode)) {
    issues.push({ code: 'unsupported-mode', definitionId: selection.mode })
  }

  const selectedComponents = selection.componentIds ?? []
  selectedComponents.forEach((componentId) => {
    const component = definitions.components.get(componentId)
    if (!component) {
      issues.push({ code: 'unknown-component', definitionId: componentId })
    } else {
      issues.push(...checkComponent(board, component, selection))
    }
  })

  if (selection.robotId) {
    const robot = definitions.robots.get(selection.robotId)
    if (!robot) {
      issues.push({ code: 'unknown-robot', definitionId: selection.robotId })
    } else {
      if (robot.boardId !== board.id) {
        issues.push({ code: 'robot-board-mismatch', definitionId: robot.id })
      }
      if (!robot.backendIds.includes(backend.id) || !supportsMode(robot.modes, selection.mode)) {
        issues.push({ code: 'robot-backend-mismatch', definitionId: robot.id })
      }
      selectedComponents.forEach((componentId) => {
        if (!robot.componentIds.includes(componentId)) {
          issues.push({ code: 'robot-component-mismatch', definitionId: componentId })
        }
      })
    }
  }

  return issues
}
