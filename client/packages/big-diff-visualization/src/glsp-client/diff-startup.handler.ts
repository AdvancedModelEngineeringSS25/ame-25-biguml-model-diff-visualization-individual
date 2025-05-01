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
    type GLSPModelSource,
    type IActionDispatcher,
    type IActionHandler,
    type ICommand,
    RequestModelAction,
    type SetModelAction,
    TYPES
} from '@eclipse-glsp/client';
import { inject, injectable } from 'inversify';
import {
    DiffInitialLoadCompleteAction,
    GenerateLastCommitModelFileActionResponse,
    RequestDeleteLastCommitModelFileAction
} from '../common/diff.action.js';

/**
 * This class handles the communication with the vscode client after the temporary file has been requested.
 * It triggers the GLSP server to read the temporary file, forwarding the GModel, and then triggers the deletion
 * of the temporary file by the vscode client.
 */
@injectable()
export class DiffStartupHandler implements IActionHandler {
    @inject(TYPES.IActionDispatcher)
    protected actionDispatcher: IActionDispatcher;

    @inject(TYPES.ModelSource)
    protected modelSource: GLSPModelSource;

    handle(action: Action): void | Action | ICommand {
        // DeleteLastCommitModelFileActionResponse is theoretically also handled, but only serves to finish the action cycle
        if (!GenerateLastCommitModelFileActionResponse.is(action)) {
            return;
        }

        // If no path is available, this means no last committed version exists, because either there is no git/repo or the model is newly created
        if (!action.path) {
            this.actionDispatcher.dispatch(
                DiffInitialLoadCompleteAction.create({ model: { type: 'graph', id: '_no-model_', children: [] }, noGit: action.noGit })
            );
            return;
        }

        // Request a GModel of the last committed version of the model
        this.actionDispatcher
            .request<SetModelAction>(
                RequestModelAction.create({
                    options: { sourceUri: 'file://' + action.path, diagramType: this.modelSource.diagramType }
                })
            )
            .then(result => {
                // Inform the handler that the load of the last committed model was successful and that comparisons can now be done
                this.actionDispatcher.dispatch(DiffInitialLoadCompleteAction.create({ model: result.newRoot, noGit: false }));
                // Also inform the vscode client that the temporary files can be deleted
                this.actionDispatcher.dispatch(RequestDeleteLastCommitModelFileAction.create({ path: action.path }));
                // In order for user input to work as expected, the GLSP server needs to get the correct context again, therefore the current model is requested again
                this.actionDispatcher.request<SetModelAction>(
                    RequestModelAction.create({
                        options: { sourceUri: this.modelSource.sourceUri ?? '', diagramType: this.modelSource.diagramType }
                    })
                );
            });
    }
}
