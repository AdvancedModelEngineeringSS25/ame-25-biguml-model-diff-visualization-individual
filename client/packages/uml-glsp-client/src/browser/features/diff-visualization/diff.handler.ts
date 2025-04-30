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
            // TODO do a proper comparison of models for visualization purposes
            console.log('Initial Model', this.initialModel);
            console.log('Current Model', this.currentModel);
            this.currentModel.children?.forEach(child => {
                console.log(child);
                child.cssClasses?.push('diff-visualization');
            });

            // This dispatch triggers a rerender of the webview
            // Theoretically this should be called with `elements` and `add`, but this leads to a delay in rendering
            // By simply adding the classes directly to the model and using the action for a rerender, this issue is circumvented
            this.actionDispatcher.dispatch(ModifyCSSFeedbackAction.create({}));
        }
    }
}
