/**
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { ContinuousFlyout, type LabelFlyoutItem } from '@blockly/continuous-toolbox'
import * as Blockly from 'blockly/core'
import { CheckboxBubble } from './checkbox_bubble'
import { stripIds } from './scratch_blocks_utils'
import { StatusIndicatorLabel } from './status_indicator_label'
import { STATUS_INDICATOR_LABEL_TYPE } from './status_indicator_label_flyout_inflater'

interface ReflowElement extends Blockly.BlockSvg {
  checkboxInFlyout?: boolean
}

interface CheckboxIcon {
  setChecked: (value: boolean) => void
}

function isCheckboxIcon(icon: Blockly.IIcon | undefined): icon is Blockly.IIcon & CheckboxIcon {
  return !!icon && typeof (icon as { setChecked?: unknown }).setChecked === 'function'
}

export class CheckableContinuousFlyout extends ContinuousFlyout {
  declare protected tabWidth_: number
  declare MARGIN: number
  declare GAP_Y: number
  private requestedWidth = 250
  private horizontalScrollbar?: Blockly.Scrollbar

  /**
   * Creates a new CheckableContinuousFlyout.
   * @param workspaceOptions Configuration options for the flyout workspace.
   */
  constructor(workspaceOptions: Blockly.Options) {
    workspaceOptions.modalInputs = false
    super(workspaceOptions)
    this.tabWidth_ = 0
    this.MARGIN = 12
    this.GAP_Y = 12
  }

  /**
   * Serializes a block to JSON in order to copy it to the main workspace.
   * @param block The block to serialize.
   * @returns A JSON representation of the block.
   */
  protected serializeBlock(block: Blockly.BlockSvg) {
    const json = super.serializeBlock(block)
    // Strip all IDs so every block in the tree (including shadows) gets a
    // fresh ID when placed on the workspace. Without this, disposed shadows
    // from a previous copy can reuse the flyout's IDs, causing two workspace
    // blocks to share the same shadow in the VM. Deleting one then destroys
    // the other's shadow (bug 878291).
    return stripIds(json)
  }

  /**
   * Set the state of a checkbox by block ID.
   * @param blockId ID of the block whose checkbox should be set
   * @param value Value to set the checkbox to.
   */
  setCheckboxState(blockId: string, value: boolean) {
    const icon = this.getWorkspace().getBlockById(blockId)?.getIcon('checkbox')
    if (!icon) {
      return
    }
    if (!isCheckboxIcon(icon)) {
      throw new Error(
        `[CheckableContinuousFlyout.setCheckboxState] Expected checkbox icon with setChecked for block ${blockId}`,
      )
    }
    icon.setChecked(value)
  }

  getFlyoutScale() {
    return 0.675
  }

  getWidth() {
    return this.requestedWidth ?? 250
  }

  setWidth(width: number) {
    this.requestedWidth = Math.max(0, width)
    this.position()
    this.reflow()
    this.horizontalScrollbar?.resize()
  }

  init(targetWorkspace: Blockly.WorkspaceSvg) {
    super.init(targetWorkspace)
    this.horizontalScrollbar = new Blockly.Scrollbar(
      this.workspace_,
      true,
      false,
      'blocklyFlyoutScrollbar',
      this.SCROLLBAR_MARGIN,
    )
    this.position()
  }

  protected positionAt_(width: number, height: number, x: number, y: number) {
    super.positionAt_(width, height, x, y)
    this.horizontalScrollbar?.setOrigin(x, y)
    this.horizontalScrollbar?.resize()
  }

  protected setMetrics_(xyRatio: { x: number; y: number }) {
    super.setMetrics_(xyRatio)
    if (!this.isVisible() || typeof xyRatio.x !== 'number') return

    const metricsManager = this.workspace_.getMetricsManager()
    const scrollMetrics = metricsManager.getScrollMetrics()
    const viewMetrics = metricsManager.getViewMetrics()
    const absoluteMetrics = metricsManager.getAbsoluteMetrics()
    this.workspace_.scrollX = -(
      scrollMetrics.left + (scrollMetrics.width - viewMetrics.width) * xyRatio.x
    )
    this.workspace_.translate(
      this.workspace_.scrollX + absoluteMetrics.left,
      this.workspace_.scrollY + absoluteMetrics.top,
    )
  }

  dispose() {
    this.horizontalScrollbar?.dispose()
    this.horizontalScrollbar = undefined
    super.dispose()
  }

  protected reflowInternal_() {
    super.reflowInternal_()
    this.horizontalScrollbar?.resize()

    if (this.RTL) {
      // The parent implementation assumes that the flyout grows to fit its
      // contents, and adjusts blocks in RTL mode accordingly. In Scratch, the
      // flyout width is fixed (and blocks may exceed it), so re-adjust blocks
      // accordingly based on the actual fixed width.
      const flyoutItems = this.getContents()
      for (const item of flyoutItems) {
        const element = item.getElement()
        if (!(element instanceof Blockly.BlockSvg)) {
          continue
        }
        const oldX = element.getBoundingRectangle().left
        let newX = this.getWidth() / this.workspace_.scale - element.getBoundingRectangle().getWidth() - this.MARGIN
        if ('checkboxInFlyout' in element && (element as ReflowElement).checkboxInFlyout) {
          newX -= CheckboxBubble.CHECKBOX_SIZE + CheckboxBubble.CHECKBOX_MARGIN
        }
        element.moveBy(newX - oldX, 0)
      }
    }
  }

  /**
   * Validates that the given toolbox item represents a label.
   * @param item The toolbox item to check.
   * @returns True if the item represents a label in the flyout.
   */
  protected toolboxItemIsLabel(item: Blockly.FlyoutItem): item is LabelFlyoutItem {
    if (item.getType() === STATUS_INDICATOR_LABEL_TYPE) {
      return true
    }
    return super.toolboxItemIsLabel(item)
  }

  /**
   * Updates the state of status indicators for hardware-based extensions.
   */
  refreshStatusButtons() {
    for (const item of this.contents) {
      const element = item.getElement()
      if (element instanceof StatusIndicatorLabel) {
        element.refreshStatus()
      }
    }
  }

  scrollTo(position: number) {
    super.scrollTo(Math.ceil(position))
  }
}
