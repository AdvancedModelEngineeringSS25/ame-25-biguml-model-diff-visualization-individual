/*********************************************************************************
 * Copyright (c) 2025 borkdominik and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the MIT License which is available at https://opensource.org/licenses/MIT.
 *
 * SPDX-License-Identifier: MIT
 *********************************************************************************/
/** @jsx svg */
import { isBoundsAware, isSelectable, setClass, type GModelElement, type IVNodePostprocessor } from '@eclipse-glsp/client';
import { injectable } from 'inversify';
import { type VNode } from 'snabbdom';

// TODO possibly remove if completely resolved in handler
@injectable()
export class DiffVisualization implements IVNodePostprocessor {
    decorate(vnode: VNode, element: GModelElement): VNode {
        if (isSelectable(element) && element.selected && isBoundsAware(element)) {
            // console.log(new Date().toLocaleTimeString(), vnode, element);
            setClass(vnode, 'diff-visualization', true);
        }

        return vnode;
    }

    postUpdate(): void {
        // nothing to do
    }
}
