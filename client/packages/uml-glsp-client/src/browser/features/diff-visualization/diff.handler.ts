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
    SetModelAction,
    TYPES,
    UpdateModelAction
} from '@eclipse-glsp/client';
import { inject, injectable } from 'inversify';
import { DiffInitialLoadCompleteAction } from './diff.action.js';

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

        const flaggedAction = action as { _fromDiffHandler?: boolean };
        if (SetModelAction.is(action) || (UpdateModelAction.is(action) && !flaggedAction._fromDiffHandler)) {
            this.currentModel = action.newRoot;
            console.log(action);
        }

        // If necessary for performance reasons, this could only be execute on save, i.e. SaveModelAction.is(action)
        if (this.initialModel && this.currentModel && !flaggedAction._fromDiffHandler) {
            // TODO do a proper comparison of models for visualization purposes
            console.log('Initial Model', this.initialModel);
            console.log('Current Model', this.currentModel);
            this.currentModel.children?.forEach(child => {
                console.log(child.cssClasses);
                child.cssClasses?.push('diff-visualization');
            });

            // The dispatch is necessary to rerender the webview to make the visualization visible
            const flaggedOptions = { animate: false, _fromDiffHandler: true };
            this.actionDispatcher.dispatch(UpdateModelAction.create(this.currentModel, flaggedOptions));
        }
    }
}
