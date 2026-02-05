import { Node } from "../core/node.ts";
import { StyleState } from "../style/state.ts";
import type { Renderer } from "../renderer/renderer.ts";
import type { Color } from "../style/color.ts";

export class SliderWidget extends Node {
    min: number;
    max: number;
    value: number;
    step: number;
    dragging: boolean;
    private on_change_cb: ((value: number) => void) | null;
    private thumb_style: StyleState;
    private thumb_size: number;
    show_fill: boolean;
    private fill_style: StyleState;

    constructor(w: number = 160, h: number = 8) {
        super();
        this.w = w;
        this.h = h;
        this.min = 0;
        this.max = 100;
        this.value = 0;
        this.step = 1;
        this.dragging = false;
        this.on_change_cb = null;
        this.thumb_size = h;
        this.show_fill = true;

        this.style.background_color({ r: 40, g: 40, b: 40, a: 255 });
        this.style.border(1, { r: 80, g: 80, b: 80, a: 255 });
        this.style.border_radius(4);

        this.thumb_style = new StyleState();
        this.thumb_style.background_color.value = { r: 200, g: 200, b: 200, a: 255 };
        this.thumb_style.border_radius.value = 4;

        this.fill_style = new StyleState();
        this.fill_style.background_color.value = { r: 140, g: 140, b: 140, a: 255 };
        this.fill_style.border_radius.value = 4;
    }

    set_range(min: number, max: number): this {
        this.min = min;
        this.max = max;
        this.set_value(this.value);
        return this;
    }

    set_step(step: number): this {
        this.step = Math.max(0.0001, step);
        return this;
    }

    set_value(value: number): this {
        const clamped = Math.max(this.min, Math.min(this.max, value));
        const snapped = this.step > 0 ? Math.round((clamped - this.min) / this.step) * this.step + this.min : clamped;
        if (this.value != snapped) {
            this.value = snapped;
            this.mark_dirty();
            if (this.on_change_cb) this.on_change_cb(this.value);
        }
        return this;
    }

    on_change(cb: (value: number) => void): this {
        this.on_change_cb = cb;
        return this;
    }

    set_thumb_color(color: Color): this {
        this.thumb_style.background_color.value = color;
        this.mark_dirty();
        return this;
    }

    set_fill_color(color: Color): this {
        this.fill_style.background_color.value = color;
        this.mark_dirty();
        return this;
    }

    set_show_fill(value: boolean): this {
        this.show_fill = value;
        this.mark_dirty();
        return this;
    }

    set_thumb_size(size: number): this {
        this.thumb_size = size;
        this.mark_dirty();
        return this;
    }

    private value_from_cursor(cursor_x: number): number {
        const visual_offset = this.get_visual_offset();
        const local_x = cursor_x - (this.x + visual_offset.x);
        const track_w = this.w;
        const t = track_w > 0 ? local_x / track_w : 0;
        return this.min + Math.max(0, Math.min(1, t)) * (this.max - this.min);
    }

    override update(dt: number = 0.016): void {
        super.update(dt);

        const input = this.get_input_state();
        const mouse_down = input.keys.has("mouse1");
        const hovered = this.is_hovered();

        if (mouse_down && (hovered || this.dragging)) {
            this.dragging = true;
            this.set_value(this.value_from_cursor(input.cursor.x));
        } else {
            this.dragging = false;
        }
    }

    override render(renderer: Renderer, dt: number): void {
        if (!this.visible) return;

        const style = this.get_style();
        renderer.render_box(this.id, this.x, this.y, this.w, this.h, style);

        const track_w = this.w;
        const range = this.max - this.min;
        const t = track_w > 0 && range != 0 ? (this.value - this.min) / range : 0;
        const clamped_t = Math.max(0, Math.min(1, t));
        const thumb_x = this.x + clamped_t * track_w - this.thumb_size / 2;
        const thumb_y = this.y + this.h / 2 - this.thumb_size / 2;
        const thumb_id = `${this.id}_thumb`;

        if (this.show_fill) {
            const fill_id = `${this.id}_fill`;
            const fill_w = Math.max(0, clamped_t * track_w);
            renderer.render_box(fill_id, this.x, this.y, fill_w, this.h, this.fill_style);
        }

        renderer.render_box(thumb_id, thumb_x, thumb_y, this.thumb_size, this.thumb_size, this.thumb_style);
    }
}
