/**********************************************************************************
 * Copyright (c) 2025 borkdominik and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the MIT License which is available at https://opensource.org/licenses/MIT.
 *
 * SPDX-License-Identifier: MIT
 **********************************************************************************/
import {
    type GLSPModelSource,
    type IActionDispatcher,
    type IDiagramStartup,
    RequestModelAction,
    type SetModelAction,
    TYPES
} from '@eclipse-glsp/client';
import { inject, injectable } from 'inversify';
import { DiffInitialLoadCompleteAction } from './diff.action.js';

/**
 * This class requests the last committed version of the model as another GModel parallel to the current working version
 * in order to compare them and provide visual highlighting of the changes.
 */
@injectable()
export class DiffStartup implements IDiagramStartup {
    @inject(TYPES.IActionDispatcher)
    protected actionDispatcher: IActionDispatcher;

    @inject(TYPES.ModelSource)
    protected modelSource: GLSPModelSource;

    public async postRequestModel(): Promise<void> {
        // TODO create a temporary model file of the last committed version
        // TODO handle the case that no previous version exists, i.e. this is the first version
        const isFirstVersion = false;
        if (isFirstVersion) {
            return await this.actionDispatcher.dispatch(DiffInitialLoadCompleteAction.create());
        }
        // Request a GModel of the last committed version of the model
        const result = await this.actionDispatcher.request<SetModelAction>(
            RequestModelAction.create({
                options: { sourceUri: this.modelSource.sourceUri ?? '', diagramType: this.modelSource.diagramType }
            })
        );
        // Inform the handler that the load of the last committed model was successful and that comparisons can now be done
        await this.actionDispatcher.dispatch(DiffInitialLoadCompleteAction.create({ model: result.newRoot }));
    }
}
