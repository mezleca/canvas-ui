import { Node } from "../core/node.ts";
import type { Renderer } from "../renderer/renderer.ts";

export class TextWidget extends Node {
    constructor(text?: string) {
        super();
        if (text) this.set_text(text);

        // default text style
        this.style.font("Arial", 20, { r: 255, g: 225, b: 255, a: 255 });
    }

    calculate(renderer: Renderer): void {
        const style = this.get_style();
        const metrics = renderer.measure_text(this.text, style);
        this.w = metrics.width;
        this.h = metrics.height;
    }

    override render(renderer: Renderer, dt: number): void {
        if (!this.visible || this.text == "") {
            return;
        }

        const style = this.get_style();
        const text_id = `${this.id}_text`;
        const outline_id = `${this.id}_outline`;

        // render text
        renderer.render_text(text_id, this.x, this.y + this.h, this.text, style);

        // render border if set
        if (style.border_size.value) {
            renderer.render_box(outline_id, this.x, this.y, this.w, this.h, {
                border_size: style.border_size,
                border_color: style.border_color,
                border_radius: style.border_radius
            } as any);
        }
    }
}
