/**********************************************************************************
 * Copyright (c) 2025 borkdominik and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the MIT License which is available at https://opensource.org/licenses/MIT.
 *
 * SPDX-License-Identifier: MIT
 **********************************************************************************/

import { TYPES, type ActionDispatcher, type ActionListener, type Disposable } from '@borkdominik-biguml/big-vscode-integration/vscode';
import { DisposableCollection } from '@eclipse-glsp/protocol';
import { inject, injectable, postConstruct } from 'inversify';
import * as vscode from 'vscode';
import {
    DeleteLastCommitModelFileActionResponse,
    GenerateLastCommitModelFileActionResponse,
    RequestDeleteLastCommitModelFileAction,
    RequestGenerateLastCommitModelFileAction
} from '../common/diff.action.js';

/**
 * This handler explicitly serves to handle events that require the vscode API and cannot be handled by the GLSP server/client.
 * More specifically, this handler creates and deletes temporary files to get a snapshot of the last committed model version.
 */
@injectable()
export class DiffActionHandler implements Disposable {
    @inject(TYPES.ActionDispatcher)
    protected readonly actionDispatcher: ActionDispatcher;
    @inject(TYPES.ActionListener)
    protected readonly actionListener: ActionListener;

    private readonly toDispose = new DisposableCollection();

    @postConstruct()
    protected init(): void {
        this.toDispose.push(
            // This listener grabs the RequestGenerate action from the GLSP action cycle and creates a temporary file
            // of the last committed model version
            this.actionListener.handleGLSPRequest<RequestGenerateLastCommitModelFileAction>(
                RequestGenerateLastCommitModelFileAction.KIND,
                async message => {
                    // Every model should have a source uri so this is simply a sanity check
                    if (!message.action.path) {
                        return GenerateLastCommitModelFileActionResponse.create();
                    }

                    // Check that the git extension is available
                    const gitExtension = vscode.extensions.getExtension('vscode.git');
                    if (!gitExtension) {
                        return GenerateLastCommitModelFileActionResponse.create();
                    }

                    // Ensure it is activated
                    if (!gitExtension.isActive) {
                        await gitExtension.activate();
                    }

                    // Get the containing repo, if there is any
                    const git = gitExtension.exports.getAPI(1);
                    const repo = git.getRepository(message.action.path);
                    if (!repo) {
                        return GenerateLastCommitModelFileActionResponse.create();
                    }

                    // In case of windows, remove the leading slash for correct path matching
                    let path = message.action.path;
                    if (path.match(/^\/\w:\//)) {
                        path = path.substring(1);
                    }

                    // Read both the .uml and .unotation file of the latest commit
                    let umlContent, unotationContent;
                    try {
                        umlContent = await repo.show('HEAD', path);
                        unotationContent = await repo.show('HEAD', path.replace(/\.uml$/, '.unotation'));
                    } catch (error) {
                        // In this case, git is not the issue but rather the non-existant files (i.e. newly created)
                        return GenerateLastCommitModelFileActionResponse.create({ path: '', noGit: false });
                    }

                    // Derive uris for the temporary file
                    const tempUmlUri = vscode.Uri.parse(message.action.path.replace(/\.uml$/, '.temp.uml'));
                    const tempUnotationUri = vscode.Uri.parse(message.action.path.replace(/\.uml$/, '.temp.unotation'));

                    // Create the files via the vscode API
                    vscode.workspace.fs.writeFile(tempUmlUri, Buffer.from(umlContent, 'utf8'));
                    vscode.workspace.fs.writeFile(tempUnotationUri, Buffer.from(unotationContent, 'utf8'));

                    // Send a response that will be received by the GLSP client and handled there
                    return GenerateLastCommitModelFileActionResponse.create({
                        path: tempUmlUri.path,
                        noGit: false
                    });
                }
            ),
            // This listener serves to delete the previously created temporary files as they are not required anymore
            this.actionListener.handleGLSPRequest<RequestDeleteLastCommitModelFileAction>(
                RequestDeleteLastCommitModelFileAction.KIND,
                async message => {
                    // Sanity check
                    if (!message.action.path) {
                        return DeleteLastCommitModelFileActionResponse.create();
                    }

                    const tempUmlUri = vscode.Uri.parse(message.action.path);
                    const tempUnotationUri = vscode.Uri.parse(message.action.path.replace(/\.uml$/, '.unotation'));

                    // Delete the files via the vscode API
                    this.silentDelete(tempUmlUri);
                    this.silentDelete(tempUnotationUri);

                    // Because of the stateful behavior of the GLSP server and its authority to save files, it saves
                    // the temporary file again on SaveModelAction
                    // Therefore these watchers are instated to immediately delete those files again
                    // This is a necessary measure to deal with imo improper server behavior
                    const watcherUml = vscode.workspace.createFileSystemWatcher(
                        new vscode.RelativePattern(
                            vscode.workspace.getWorkspaceFolder(tempUmlUri) ?? '',
                            vscode.workspace.asRelativePath(tempUmlUri)
                        )
                    );
                    watcherUml.onDidCreate(this.silentDelete);
                    this.toDispose.push(watcherUml);

                    const watcherUnotation = vscode.workspace.createFileSystemWatcher(
                        new vscode.RelativePattern(
                            vscode.workspace.getWorkspaceFolder(tempUnotationUri) ?? '',
                            vscode.workspace.asRelativePath(tempUnotationUri)
                        )
                    );
                    watcherUnotation.onDidCreate(this.silentDelete);
                    this.toDispose.push(watcherUnotation);

                    // The Response doesn't serve a particular purpose except cleanly finishing the action cycle
                    return DeleteLastCommitModelFileActionResponse.create();
                }
            )
        );
    }

    private silentDelete(uri: vscode.Uri) {
        try {
            vscode.workspace.fs.delete(uri, { useTrash: false });
        } catch (error) {
            // The possible errors of delete are ignored as the usage is already safe
            // Possibly missing files are expected
        }
    }

    dispose(): void {
        this.toDispose.dispose();
    }
}
