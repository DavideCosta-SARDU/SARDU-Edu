/**
 * Copyright 2026 Scratch Foundation
 * SPDX-License-Identifier: Apache-2.0
 */
import * as Blockly from 'blockly/core'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import '../../src/blocks/vertical_extensions'
import '../../src/renderer/renderer'

let container: HTMLElement
let workspace: Blockly.WorkspaceSvg

beforeAll(() => {
  container = document.createElement('div')
  container.style.width = '800px'
  container.style.height = '600px'
  document.body.appendChild(container)
  workspace = Blockly.inject(container, { renderer: 'scratch_classic' })
  Blockly.common.defineBlocksWithJsonArray([
    {
      type: 'test_sardu_board_program',
      message0: 'start',
      message1: '%1',
      args1: [{ type: 'input_statement', name: 'SUBSTACK' }],
      message2: 'forever',
      message3: '%1',
      args3: [{ type: 'input_statement', name: 'SUBSTACK2' }],
      extensions: ['shape_terminal_hat'],
    },
    {
      type: 'test_standard_hat',
      message0: 'when started',
      extensions: ['shape_hat'],
    },
  ])
})

afterAll(() => {
  workspace.dispose()
  container.remove()
})

afterEach(() => {
  workspace.clear()
})

describe('terminal hat rendering', () => {
  it('removes the bottom connection only from the SARDU board program shape', () => {
    const program = workspace.newBlock('test_sardu_board_program')
    const standardHat = workspace.newBlock('test_standard_hat')

    expect(program.nextConnection).toBeNull()
    expect(program.getInput('SUBSTACK')?.connection).not.toBeNull()
    expect(program.getInput('SUBSTACK2')?.connection).not.toBeNull()
    expect(standardHat.nextConnection).not.toBeNull()
  })
})
