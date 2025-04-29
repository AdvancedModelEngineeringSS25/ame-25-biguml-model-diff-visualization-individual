/*********************************************************************************
 * Copyright (c) 2025 borkdominik and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the MIT License which is available at https://opensource.org/licenses/MIT.
 *
 * SPDX-License-Identifier: MIT
 *********************************************************************************/

import { Action, type GModelRootSchema, type ResponseAction } from '@eclipse-glsp/protocol';

export interface DiffInitialLoadCompleteAction extends ResponseAction {
    kind: typeof DiffInitialLoadCompleteAction.KIND;
    model: GModelRootSchema;
}
export namespace DiffInitialLoadCompleteAction {
    export const KIND = 'diffInitialLoadcompleteAction';

    export function is(object: unknown): object is DiffInitialLoadCompleteAction {
        return Action.hasKind(object, KIND);
    }

    export function create(
        options?: Omit<DiffInitialLoadCompleteAction, 'kind' | 'responseId'> & { responseId?: string }
    ): DiffInitialLoadCompleteAction {
        return {
            kind: KIND,
            responseId: '',
            model: { type: 'graph', id: '_no-model_', children: [] },
            ...options
        };
    }
}
