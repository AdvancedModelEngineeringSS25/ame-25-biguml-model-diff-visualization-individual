/*********************************************************************************
 * Copyright (c) 2025 borkdominik and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the MIT License which is available at https://opensource.org/licenses/MIT.
 *
 * SPDX-License-Identifier: MIT
 *********************************************************************************/
import {
    type Action,
    type GModelElementSchema,
    type GModelRootSchema,
    type IActionDispatcher,
    type IActionHandler,
    type ICommand,
    ModifyCSSFeedbackAction,
    SetModelAction,
    TYPES,
    UpdateModelAction
} from '@eclipse-glsp/client';
import { inject, injectable } from 'inversify';
import { DiffInitialLoadCompleteAction } from './diff.action.js';

/**
 * This handler is responsible for detecting changes in the model compared to the last committed version
 * and subsequently display a visualization of those changes.
 */
@injectable()
export class DiffHandler implements IActionHandler {
    @inject(TYPES.IActionDispatcher)
    protected actionDispatcher: IActionDispatcher;

    private initialModel: GModelRootSchema;
    private currentModel: GModelRootSchema;

    handle(action: Action): void | Action | ICommand {
        if (DiffInitialLoadCompleteAction.is(action)) {
            this.initialModel = action.model;
        }

        if (SetModelAction.is(action) || UpdateModelAction.is(action)) {
            this.currentModel = action.newRoot;
            console.log(action);
        }

        // If necessary for performance reasons, this could only be execute on save, i.e. SaveModelAction.is(action)
        if (this.initialModel && this.currentModel) {
            console.log('Initial Model', this.initialModel);
            console.log('Current Model', this.currentModel);
            this.compareModels();

            // This dispatch triggers a rerender of the webview
            // Theoretically this should be called with `elements` and `add`, but this leads to a delay in rendering
            // By simply adding the classes directly to the model and using the action for a rerender, this issue is circumvented
            this.actionDispatcher.dispatch(ModifyCSSFeedbackAction.create({}));
        }
    }

    // Special start method for recursive tree comparison, since the model root has a different type to each subsequent child layer
    private compareModels() {
        this.currentModel.children?.forEach(cChild => {
            const iChild = this.initialModel.children?.find(iChild => iChild.id === cChild.id);
            this.compareElements(iChild, cChild);
        });
    }

    // Recursively traverse the graph structure and check whether the elements differ between initial and current model version
    // On detected differences, css classes are directly added to the current model
    private compareElements(iChild: GModelElementSchema | undefined, cChild: GModelElementSchema) {
        // If no initial node exists, we assume this is due to it being created
        if (!iChild) {
            cChild.cssClasses?.push('diff-visualization-create');
            return;
        }

        // Depending on relevant attributes changes between the versions of the node are detected
        const sameType = iChild.type === cChild.type;
        const sameIfGNodes = this.isSameIfGNodes(iChild, cChild);
        const sameIfGEdges = this.isSameIfGEdges(iChild, cChild);
        const sameIfGLabels = this.isSameIfGLabels(iChild, cChild);

        if (!sameType || !sameIfGNodes || !sameIfGEdges || !sameIfGLabels) {
            cChild.cssClasses?.push('diff-visualization-edit');
            // Changes on a higher tree level does not preclude changes on lower levels, therefore no return
        }

        // Recursively compare the child nodes
        cChild.children?.forEach(cc => {
            const ic = iChild.children?.find(ic => ic.id === cc.id);
            this.compareElements(ic, cc);
        });
    }

    // Check relevant attributes if the elements qualify as GNodes
    private isSameIfGNodes(iChild: any, cChild: any) {
        // GLabel also has a position, but in that case it is automatically derived and shouldn't be used as a criterion
        if (iChild.position && cChild.position && !iChild.text && !cChild.text) {
            const samePosition = iChild.position.x === cChild.position.x && iChild.position.y === cChild.position.y;
            // Size is currently not used as a criterion, because it is too easily triggered by bounding box changes,
            // i.e. a text is changes, which changes the size of its container and therefore is registered as a change
            // This leads to visual clutter
            return samePosition;
        }
        return true;
    }

    // Check relevant attributes if the elements qualify as GEdges
    private isSameIfGEdges(iChild: any, cChild: any) {
        if (iChild.sourceId && iChild.targetId && cChild.sourceId && cChild.targetId) {
            const sameSourceId = iChild.sourceId === cChild.sourceId;
            const sameTargetId = iChild.targetId === cChild.targetId;
            return sameSourceId && sameTargetId;
        }
        return true;
    }

    // Check relevant attributes if the elements qualify as GLabels
    private isSameIfGLabels(iChild: any, cChild: any) {
        if (iChild.text && iChild.text) {
            return iChild.text === cChild.text;
        }
        return true;
    }
}
