/*********************************************************************************
 * Copyright (c) 2025 borkdominik and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the MIT License which is available at https://opensource.org/licenses/MIT.
 *
 * SPDX-License-Identifier: MIT
 *********************************************************************************/

import { configureActionHandler, FeatureModule, SetModelAction, TYPES, UpdateModelAction } from '@eclipse-glsp/client';
import { DiffInitialLoadCompleteAction } from './diff.action.js';
import { DiffHandler } from './diff.handler.js';
import { DiffVisualization } from './diff.postprocessor.js';
import { DiffStartup } from './diff.startup.js';

export const umlDiffVisualizationModule = new FeatureModule((bind, _unbind, isBound, rebind) => {
    const context = { bind, _unbind, isBound, rebind };

    bind(TYPES.IVNodePostprocessor).to(DiffVisualization);

    bind(TYPES.IDiagramStartup).to(DiffStartup);

    bind(DiffHandler).toSelf().inSingletonScope();
    configureActionHandler(context, SetModelAction.KIND, DiffHandler);
    configureActionHandler(context, UpdateModelAction.KIND, DiffHandler);
    configureActionHandler(context, DiffInitialLoadCompleteAction.KIND, DiffHandler);
    // If necessary for performance reasons, only execute the comparison on save
    // configureActionHandler(context, SaveModelAction.KIND, DiffHandler);
});
