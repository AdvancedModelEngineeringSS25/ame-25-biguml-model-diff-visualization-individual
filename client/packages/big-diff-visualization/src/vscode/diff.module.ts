/*********************************************************************************
 * Copyright (c) 2025 borkdominik and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the MIT License which is available at https://opensource.org/licenses/MIT.
 *
 * SPDX-License-Identifier: MIT
 *********************************************************************************/

import { TYPES } from '@borkdominik-biguml/big-vscode-integration/vscode';
import { FeatureModule } from '@eclipse-glsp/client';
import { DiffActionHandler } from './diff.handler.js';

export const diffModule = new FeatureModule(bind => {
    // The handler needs to be bound on the vscode client, because the handled events serve
    // specifically the communication with vscode and its API
    bind(DiffActionHandler).toSelf().inSingletonScope();
    bind(TYPES.Disposable).toService(DiffActionHandler);
    bind(TYPES.RootInitialization).toService(DiffActionHandler);
});
