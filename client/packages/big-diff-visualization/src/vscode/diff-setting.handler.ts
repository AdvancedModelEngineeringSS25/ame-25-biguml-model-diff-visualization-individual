/**********************************************************************************
 * Copyright (c) 2025 borkdominik and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the MIT License which is available at https://opensource.org/licenses/MIT.
 *
 * SPDX-License-Identifier: MIT
 **********************************************************************************/

import { TYPES, type ActionDispatcher, type ActionListener, type Disposable } from '@borkdominik-biguml/big-vscode-integration/vscode';
import { GLSPIsReadyAction } from '@borkdominik-biguml/uml-glsp-client';
import { DisposableCollection } from '@eclipse-glsp/protocol';
import { inject, injectable, postConstruct } from 'inversify';
import * as vscode from 'vscode';
import { SetDiffPreferencesAction } from '../common/diff-setting.action.js';

/** This handler informs the GLSP client about the current feature enablement. */
@injectable()
export class DiffSettingActionHandler implements Disposable {
    @inject(TYPES.ActionDispatcher)
    protected readonly actionDispatcher: ActionDispatcher;
    @inject(TYPES.ActionListener)
    protected readonly actionListener: ActionListener;

    private readonly toDispose = new DisposableCollection();

    @postConstruct()
    protected init(): void {
        this.toDispose.push(
            this.actionListener.handleGLSPRequest(GLSPIsReadyAction.KIND, async () => {
                const config = vscode.workspace.getConfiguration('bigUML');
                const showDiff = config.get<boolean>('showDiff');

                return SetDiffPreferencesAction.create({ showDiff: showDiff !== false });
            })
        );
    }

    dispose(): void {
        this.toDispose.dispose();
    }
}
