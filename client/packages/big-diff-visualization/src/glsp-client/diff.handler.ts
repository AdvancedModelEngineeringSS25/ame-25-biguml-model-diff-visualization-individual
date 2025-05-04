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
import { SetDiffPreferencesAction } from '../common/diff-setting.action.js';
import { DiffInitialLoadCompleteAction } from '../common/diff.action.js';

/**
 * This handler is responsible for detecting changes in the model compared to the last committed version
 * and subsequently display a visualization of those changes.
 */
@injectable()
export class DiffHandler implements IActionHandler {
    @inject(TYPES.IActionDispatcher)
    protected actionDispatcher: IActionDispatcher;

    /** Only do comparisons if the feature is enabled */
    private featureActive: boolean = true;

    /** Depending on whether git is available, comparisions make no sense */
    private ignoreCompare: boolean = false;
    private initialModel: GModelRootSchema;
    private currentModel: GModelRootSchema;

    handle(action: Action): void | Action | ICommand {
        if (SetDiffPreferencesAction.is(action)) {
            // Remember the current enablement state of the feature
            this.featureActive = action.showDiff;
            // If the feature was disabled, we need to remove all the CSS classes
            if (!action.showDiff) {
                const elementIds = this.cleanModel();
                // The proper API is used in addition to direct model action in order to ensure reliable rerendering
                this.actionDispatcher.dispatch(
                    ModifyCSSFeedbackAction.create({
                        elements: elementIds,
                        remove: ['diff-visualization-create', 'diff-visualization-edit']
                    })
                );
            }
        }

        if (DiffInitialLoadCompleteAction.is(action)) {
            this.initialModel = action.model;
            this.ignoreCompare = action.noGit;
        }

        if (SetModelAction.is(action) || UpdateModelAction.is(action)) {
            this.currentModel = action.newRoot;
        }

        // If necessary for performance reasons, this could only be execute on save, i.e. SaveModelAction.is(action)
        // If git is not available, then no comparisisons should occur
        if (this.featureActive && !this.ignoreCompare && this.initialModel && this.currentModel) {
            const elementIds = this.compareModels();

            // Due to the ModifyCSSFeedbackAction API, we need to seperate the elements by applied CSS
            const createIds: string[] = [];
            const editIds: string[] = [];
            elementIds.forEach(id => (id[1] === 'create' ? createIds.push(id[0]) : editIds.push(id[0])));

            // This dispatch triggers a rerender of the webview
            // The API is used in addition to direct model changes to ensure reliable and fast rerenders
            this.actionDispatcher.dispatch(
                ModifyCSSFeedbackAction.create({
                    elements: createIds,
                    add: ['diff-visualization-create']
                })
            );
            this.actionDispatcher.dispatch(
                ModifyCSSFeedbackAction.create({
                    elements: editIds,
                    add: ['diff-visualization-edit']
                })
            );
        }
    }

    // Special start method for recursive tree cleaning, since the model root has a different type to each subsequent child layer
    // Removes the Diff CSS classes from affected model elements and returns the affected ids
    private cleanModel(): string[] {
        const elementIds: string[] = [];
        this.currentModel.children?.forEach(child => elementIds.push(...this.cleanElements(child)));
        return elementIds;
    }

    // Recursively traverse the graph and remove the Diff CSS classes from affected elements and return their ids
    private cleanElements(child: GModelElementSchema): string[] {
        const elementIds: string[] = [];
        const before = (child.cssClasses ?? []).length;
        child.cssClasses = child.cssClasses?.filter(css => css !== 'diff-visualization-create' && css !== 'diff-visualization-edit');
        // Only count the removal if the number of classes changed
        if (before !== (child.cssClasses ?? []).length) {
            elementIds.push(child.id);
        }
        child.children?.forEach(c => elementIds.push(...this.cleanElements(c)));
        return elementIds;
    }

    // Special start method for recursive tree comparison, since the model root has a different type to each subsequent child layer
    private compareModels(): [string, string][] {
        const elementIds: [string, string][] = [];
        this.currentModel.children?.forEach(cChild => {
            const iChild = this.initialModel.children?.find(iChild => iChild.id === cChild.id);
            elementIds.push(...this.compareElements(iChild, cChild));
        });
        return elementIds;
    }

    // Recursively traverse the graph structure and check whether the elements differ between initial and current model version
    // On detected differences, css classes are directly added to the current model
    private compareElements(iChild: GModelElementSchema | undefined, cChild: GModelElementSchema): [string, string][] {
        // If no initial node exists, we assume this is due to it being created
        if (!iChild) {
            cChild.cssClasses?.push('diff-visualization-create');
            return [[cChild.id, 'create']];
        }

        const elementIds: [string, string][] = [];

        // Depending on relevant attributes changes between the versions of the node are detected
        const sameType = iChild.type === cChild.type;
        const sameIfGNodes = this.isSameIfGNodes(iChild, cChild);
        const sameIfGEdges = this.isSameIfGEdges(iChild, cChild);
        const sameIfGLabels = this.isSameIfGLabels(iChild, cChild);

        if (!sameType || !sameIfGNodes || !sameIfGEdges || !sameIfGLabels) {
            cChild.cssClasses?.push('diff-visualization-edit');
            elementIds.push([cChild.id, 'edit']);
            // Changes on a higher tree level does not preclude changes on lower levels, therefore no return
        }

        // Recursively compare the child nodes
        cChild.children?.forEach(cc => {
            const ic = iChild.children?.find(ic => ic.id === cc.id);
            elementIds.push(...this.compareElements(ic, cc));
        });

        return elementIds;
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
