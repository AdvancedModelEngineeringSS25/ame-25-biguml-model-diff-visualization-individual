/*********************************************************************************
 * Copyright (c) 2025 borkdominik and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the MIT License which is available at https://opensource.org/licenses/MIT.
 *
 * SPDX-License-Identifier: MIT
 *********************************************************************************/
import { type GModelElementSchema, type GModelRootSchema } from '@eclipse-glsp/client';

/** Recursively traverse the graph and remove the Diff CSS classes from affected elements and return their ids */
function cleanElements(child: GModelElementSchema): string[] {
    const elementIds: string[] = [];
    const before = (child.cssClasses ?? []).length;
    child.cssClasses = child.cssClasses?.filter(css => css !== 'diff-visualization-create' && css !== 'diff-visualization-edit');
    // Only count the removal if the number of classes changed
    if (before !== (child.cssClasses ?? []).length) {
        elementIds.push(child.id);
    }
    child.children?.forEach(c => elementIds.push(...cleanElements(c)));
    return elementIds;
}

/** Removes the Diff CSS classes from affected model elements and returns the affected ids */
export function cleanModel(currentModel: GModelRootSchema): string[] {
    const elementIds: string[] = [];
    currentModel.children?.forEach(child => elementIds.push(...cleanElements(child)));
    return elementIds;
}

/** Check relevant attributes if the elements qualify as GNodes */
function isSameIfGNodes(iChild: any, cChild: any) {
    // GLabel also has a position, but in that case it is automatically derived and shouldn't be used as a criterion
    if (iChild.position && cChild.position && !iChild.text && !cChild.text) {
        const samePosition = iChild.position.x === cChild.position.x && iChild.position.y === cChild.position.y;
        // Size is currently not used as a criterion, because it is too easily triggered by bounding box changes,
        // i.e. a text is changes, which changes the size of its container and therefore is registered as a change
        // This leads to visual clutter
        return samePosition;
    }
    return true;
}

/** Check relevant attributes if the elements qualify as GEdges */
function isSameIfGEdges(iChild: any, cChild: any) {
    if (iChild.sourceId && iChild.targetId && cChild.sourceId && cChild.targetId) {
        const sameSourceId = iChild.sourceId === cChild.sourceId;
        const sameTargetId = iChild.targetId === cChild.targetId;
        return sameSourceId && sameTargetId;
    }
    return true;
}

/** Check relevant attributes if the elements qualify as GLabels */
function isSameIfGLabels(iChild: any, cChild: any) {
    if (iChild.text && iChild.text) {
        return iChild.text === cChild.text;
    }
    return true;
}

/**
 * Recursively traverse the graph structure and check whether the elements differ between initial and current model version.
 * On detected differences, CSS classes are directly added to the current model.
 */
function compareElements(iChild: GModelElementSchema | undefined, cChild: GModelElementSchema): [string, string][] {
    // If no initial node exists, we assume this is due to it being created
    if (!iChild) {
        cChild.cssClasses?.push('diff-visualization-create');
        return [[cChild.id, 'create']];
    }

    const elementIds: [string, string][] = [];

    // Depending on relevant attributes changes between the versions of the node are detected
    const sameType = iChild.type === cChild.type;
    const sameIfGNodes = isSameIfGNodes(iChild, cChild);
    const sameIfGEdges = isSameIfGEdges(iChild, cChild);
    const sameIfGLabels = isSameIfGLabels(iChild, cChild);

    if (!sameType || !sameIfGNodes || !sameIfGEdges || !sameIfGLabels) {
        cChild.cssClasses?.push('diff-visualization-edit');
        elementIds.push([cChild.id, 'edit']);
        // Changes on a higher tree level does not preclude changes on lower levels, therefore no return
    }

    // Recursively compare the child nodes
    cChild.children?.forEach(cc => {
        const ic = iChild.children?.find(ic => ic.id === cc.id);
        elementIds.push(...compareElements(ic, cc));
    });

    return elementIds;
}

/** Special start method for recursive tree comparison, since the model root has a different type to each subsequent child layer */
export function compareModels(initialModel: GModelRootSchema, currentModel: GModelRootSchema): [string, string][] {
    const elementIds: [string, string][] = [];
    currentModel.children?.forEach(cChild => {
        const iChild = initialModel.children?.find(iChild => iChild.id === cChild.id);
        elementIds.push(...compareElements(iChild, cChild));
    });
    return elementIds;
}
