import { Node } from "../core/node.ts";

export class SpacerWidget extends Node {
    constructor(w?: number, h?: number) {
        super();
        this.w = w || 0;
        this.h = h || 0;
        this.is_ghost = true;
        this.visible = false;
    }
}
