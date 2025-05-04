/*********************************************************************************
 * Copyright (c) 2025 borkdominik and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the MIT License which is available at https://opensource.org/licenses/MIT.
 *
 * SPDX-License-Identifier: MIT
 *********************************************************************************/

import { type BIGGLSPVSCodeConnector, TYPES, type VSCodeCommand } from '@borkdominik-biguml/big-vscode-integration/vscode';
import { inject, injectable } from 'inversify';
import * as vscode from 'vscode';
import { SetDiffPreferencesAction } from '../common/diff-setting.action.js';

/** This class provides a vscode command to toggle the enablement of the diff-visualization feature. */
@injectable()
export class ToggleDiffCommand implements VSCodeCommand {
    @inject(TYPES.GLSPVSCodeConnector)
    protected readonly connector: BIGGLSPVSCodeConnector;

    get id(): string {
        return 'bigUML.toggle.diff';
    }

    async execute(): Promise<void> {
        const config = vscode.workspace.getConfiguration('bigUML');
        const showDiff = config.get<boolean>('showDiff') ?? true;

        // Save the changed diff in the global extension settings
        await config.update('showDiff', !showDiff, vscode.ConfigurationTarget.Global);

        // Notify any active client about the change
        this.connector.sendActionToActiveClient(SetDiffPreferencesAction.create({ showDiff: !showDiff }));
    }
}
