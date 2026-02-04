import { Node } from "../core/node.ts";
import { PADDING_POSITIONS } from "../style/state.ts";
import type { Renderer } from "../renderer/renderer.ts";

export class ButtonWidget extends Node {
    constructor(text?: string, w?: number, h?: number) {
        super();
        this.w = w || 0;
        this.h = h || 0;
        this.text = text || "";

        // default style
        this.style.background_color({ r: 58, g: 58, b: 58, a: 255 });
        this.style.font("Arial", 16, { r: 220, g: 220, b: 220, a: 255 });
        this.style.border(1);
        this.style.text_align("center");
        this.style.text_baseline("middle");
        this.style.border_color({ r: 70, g: 70, b: 70, a: 255 });
        this.style.border_radius(4);
        this.style.padding(8, 16, 8, 16);

        // hover state - subtle change
        this.style.background_color({ r: 70, g: 70, b: 70, a: 255 }, "hover");
        this.style.border_color({ r: 85, g: 85, b: 85, a: 255 }, "hover");

        // active state - darker for pressed effect
        this.style.background_color({ r: 45, g: 45, b: 45, a: 255 }, "active");
        this.style.border_color({ r: 35, g: 35, b: 35, a: 255 }, "active");

        // setup transitions
        this.style.transition("background_color", 150, "ease_in_out");
        this.style.transition("border_color", 150, "ease_in_out");
    }

    calculate(renderer: Renderer): void {
        const style = this.get_style();
        const text_metrics = renderer.measure_text(this.text, style);

        // text size + padding
        const pads_w = style.padding.value[PADDING_POSITIONS.LEFT] + style.padding.value[PADDING_POSITIONS.RIGHT];
        const pads_h = style.padding.value[PADDING_POSITIONS.TOP] + style.padding.value[PADDING_POSITIONS.BOTTOM];
        const border = (style.border_size.value || 0) * 2;

        this.w = text_metrics.width + pads_w + border;
        this.h = style.font_size.value + pads_h + border;
    }

    override render(renderer: Renderer, dt: number): void {
        if (!this.visible) return;

        const style = this.get_style();
        const box_id = `${this.id}_button_box_widget`;
        const text_id = `${this.id}_button_text_widget`;

        // render button box
        renderer.render_box(box_id, this.x, this.y, this.w, this.h, style);

        // render centered text
        renderer.render_text(text_id, this.x + this.w / 2, this.y + this.h / 2, this.text, style);
    }
}
