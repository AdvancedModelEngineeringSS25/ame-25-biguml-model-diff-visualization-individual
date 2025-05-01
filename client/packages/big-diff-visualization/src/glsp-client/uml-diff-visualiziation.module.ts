/*********************************************************************************
 * Copyright (c) 2025 borkdominik and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the MIT License which is available at https://opensource.org/licenses/MIT.
 *
 * SPDX-License-Identifier: MIT
 *********************************************************************************/

import '../../styles/index.css';

import { configureActionHandler, FeatureModule, SetModelAction, TYPES, UpdateModelAction } from '@eclipse-glsp/client';
import { ExtensionActionKind } from '@eclipse-glsp/vscode-integration-webview';
import {
    DeleteLastCommitModelFileActionResponse,
    DiffInitialLoadCompleteAction,
    GenerateLastCommitModelFileActionResponse,
    RequestDeleteLastCommitModelFileAction,
    RequestGenerateLastCommitModelFileAction
} from '../common/diff.action.js';
import { DiffStartupHandler } from './diff-startup.handler.js';
import { DiffHandler } from './diff.handler.js';
import { DiffStartup } from './diff.startup.js';

export const umlDiffVisualizationModule = new FeatureModule((bind, _unbind, isBound, rebind) => {
    const context = { bind, _unbind, isBound, rebind };

    bind(TYPES.IDiagramStartup).to(DiffStartup);

    bind(DiffHandler).toSelf().inSingletonScope();
    configureActionHandler(context, SetModelAction.KIND, DiffHandler);
    configureActionHandler(context, UpdateModelAction.KIND, DiffHandler);
    configureActionHandler(context, DiffInitialLoadCompleteAction.KIND, DiffHandler);
    // If necessary for performance reasons, only execute the comparison on save
    // configureActionHandler(context, SaveModelAction.KIND, DiffHandler);

    configureActionHandler(context, GenerateLastCommitModelFileActionResponse.KIND, DiffStartupHandler);
    configureActionHandler(context, DeleteLastCommitModelFileActionResponse.KIND, DiffStartupHandler);

    // Forward the given actions between GLSP client and vscode client
    bind(ExtensionActionKind).toConstantValue(RequestGenerateLastCommitModelFileAction.KIND);
    bind(ExtensionActionKind).toConstantValue(GenerateLastCommitModelFileActionResponse.KIND);
    bind(ExtensionActionKind).toConstantValue(RequestDeleteLastCommitModelFileAction.KIND);
    bind(ExtensionActionKind).toConstantValue(DeleteLastCommitModelFileActionResponse.KIND);
});
