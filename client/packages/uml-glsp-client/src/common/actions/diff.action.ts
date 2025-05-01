/*********************************************************************************
 * Copyright (c) 2025 borkdominik and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the MIT License which is available at https://opensource.org/licenses/MIT.
 *
 * SPDX-License-Identifier: MIT
 *********************************************************************************/

import { Action, RequestAction, type GModelRootSchema, type ResponseAction } from '@eclipse-glsp/protocol';

/** This action is sent after the last committed version of the model has been restored and read */
export interface DiffInitialLoadCompleteAction extends ResponseAction {
    kind: typeof DiffInitialLoadCompleteAction.KIND;
    /** The result of a RequestModelAction */
    model: GModelRootSchema;
    /** Whether git (or a repo) is even available or not, as this changes the interpretation of the result */
    noGit: boolean;
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
            noGit: true,
            ...options
        };
    }
}

/** This action is triggered by the GLSP client for the vscode client to create the temporary model file */
export interface RequestGenerateLastCommitModelFileAction extends RequestAction<GenerateLastCommitModelFileActionResponse> {
    kind: typeof RequestGenerateLastCommitModelFileAction.KIND;
    /** The path of the original model file */
    path: string;
}
export namespace RequestGenerateLastCommitModelFileAction {
    export const KIND = 'requestGenerateLastCommitModelFile';

    export function is(object: unknown): object is RequestGenerateLastCommitModelFileAction {
        return RequestAction.hasKind(object, KIND);
    }

    export function create(
        options: Omit<RequestGenerateLastCommitModelFileAction, 'kind' | 'requestId'>
    ): RequestGenerateLastCommitModelFileAction {
        return {
            kind: KIND,
            requestId: '',
            ...options
        };
    }
}

/**
 * This action is sent by the vscode client to the GLSP client as a response to RequestGenerateLastCommitModelFileAction,
 * signaling that the temporary has been created and can be read by the GLSP server
 */
export interface GenerateLastCommitModelFileActionResponse extends ResponseAction {
    kind: typeof GenerateLastCommitModelFileActionResponse.KIND;
    /** Path of the temporary file */
    path: string;
    /** Whether git (or a repo) is even available or not, as this changes the interpretation of the result */
    noGit: boolean;
}
export namespace GenerateLastCommitModelFileActionResponse {
    export const KIND = 'generateLastCommitModelFileResponse';

    export function is(object: unknown): object is GenerateLastCommitModelFileActionResponse {
        return Action.hasKind(object, KIND);
    }

    export function create(
        options?: Omit<GenerateLastCommitModelFileActionResponse, 'kind' | 'responseId'> & { responseId?: string }
    ): GenerateLastCommitModelFileActionResponse {
        return {
            kind: KIND,
            responseId: '',
            path: '',
            noGit: true,
            ...options
        };
    }
}

/** This action is sent by the GLSP client for the vscode client to delete the previously created temporary model files */
export interface RequestDeleteLastCommitModelFileAction extends RequestAction<DeleteLastCommitModelFileActionResponse> {
    kind: typeof RequestDeleteLastCommitModelFileAction.KIND;
    /** Path of the temporary file */
    path: string;
}
export namespace RequestDeleteLastCommitModelFileAction {
    export const KIND = 'requestDeleteLastCommitModelFile';

    export function is(object: unknown): object is RequestDeleteLastCommitModelFileAction {
        return RequestAction.hasKind(object, KIND);
    }

    export function create(
        options: Omit<RequestDeleteLastCommitModelFileAction, 'kind' | 'requestId'>
    ): RequestDeleteLastCommitModelFileAction {
        return {
            kind: KIND,
            requestId: '',
            ...options
        };
    }
}

/** This action is sent by the vscode client to the GLSP client, but serves no particular purpose except finishing the action cycle */
export interface DeleteLastCommitModelFileActionResponse extends ResponseAction {
    kind: typeof DeleteLastCommitModelFileActionResponse.KIND;
}
export namespace DeleteLastCommitModelFileActionResponse {
    export const KIND = 'deleteLastCommitModelFileResponse';

    export function is(object: unknown): object is DeleteLastCommitModelFileActionResponse {
        return Action.hasKind(object, KIND);
    }

    export function create(
        options?: Omit<DeleteLastCommitModelFileActionResponse, 'kind' | 'responseId'> & { responseId?: string }
    ): DeleteLastCommitModelFileActionResponse {
        return {
            kind: KIND,
            responseId: '',
            ...options
        };
    }
}
