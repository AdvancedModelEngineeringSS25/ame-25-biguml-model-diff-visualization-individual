/*********************************************************************************
 * Copyright (c) 2025 borkdominik and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the MIT License which is available at https://opensource.org/licenses/MIT.
 *
 * SPDX-License-Identifier: MIT
 *********************************************************************************/

import { Action, type ResponseAction } from '@eclipse-glsp/protocol';

/** This action is sent by the vscode client to the GLSP client to inform about changes of the feature enablement */
export interface SetDiffPreferencesAction extends ResponseAction {
    kind: typeof SetDiffPreferencesAction.KIND;
    showDiff: boolean;
}
export namespace SetDiffPreferencesAction {
    export const KIND = 'SetDiffPreferencesAction';

    export function is(object: unknown): object is SetDiffPreferencesAction {
        return Action.hasKind(object, KIND);
    }

    export function create(
        options?: Omit<SetDiffPreferencesAction, 'kind' | 'responseId'> & { responseId?: string }
    ): SetDiffPreferencesAction {
        return {
            kind: KIND,
            responseId: '',
            showDiff: true,
            ...options
        };
    }
}
