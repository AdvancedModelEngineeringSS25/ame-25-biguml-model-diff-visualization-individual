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
import { cleanModel, compareModels } from '../common/diff.util.js';

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
                const elementIds = cleanModel(this.currentModel);
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
            const elementIds = compareModels(this.initialModel, this.currentModel);

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
}
