import { Node } from "../core/node.ts";
import type { Renderer } from "../renderer/renderer.ts";

export class BoxWidget extends Node {
    constructor(w?: number, h?: number) {
        super();
        this.w = w || 0;
        this.h = h || 0;
    }

    override render(renderer: Renderer, dt: number): void {
        if (!this.visible) return;

        const style = this.get_style();
        renderer.render_box(this.id, this.x, this.y, this.w, this.h, style);
    }
}
