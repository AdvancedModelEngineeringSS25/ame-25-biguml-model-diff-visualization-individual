/**********************************************************************************
 * Copyright (c) 2025 borkdominik and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the MIT License which is available at https://opensource.org/licenses/MIT.
 *
 * SPDX-License-Identifier: MIT
 **********************************************************************************/
import { type GLSPModelSource, type IActionDispatcher, type IDiagramStartup, TYPES } from '@eclipse-glsp/client';
import { inject, injectable } from 'inversify';
import {
    type GenerateLastCommitModelFileActionResponse,
    RequestGenerateLastCommitModelFileAction
} from '../../../common/actions/diff.action.js';

/**
 * This class requests the last committed version of the model as a temporary file so it can later on be read as
 * another GModel parallel to the current working version in order to compare them and provide visual highlighting of the changes.
 */
@injectable()
export class DiffStartup implements IDiagramStartup {
    @inject(TYPES.IActionDispatcher)
    protected actionDispatcher: IActionDispatcher;

    @inject(TYPES.ModelSource)
    protected modelSource: GLSPModelSource;

    public async postRequestModel(): Promise<void> {
        // Request the last committed model file version as a temporary file from the vscode client
        this.actionDispatcher.request<GenerateLastCommitModelFileActionResponse>(
            // The sourceUri starts with 'file://' which needs to be ignored
            RequestGenerateLastCommitModelFileAction.create({ path: this.modelSource.sourceUri?.replace('file://', '') ?? '' })
        );
    }
}
