import { Node } from "../core/node.ts";
import { StyleState } from "../style/state.ts";
import type { Renderer } from "../renderer/renderer.ts";
import type { Color } from "../style/color.ts";

export class CheckboxWidget extends Node {
    checked: boolean;
    radio: boolean;
    group: string | null;
    private check_style: StyleState;
    private on_change_cb: ((value: boolean) => void) | null;

    constructor(size: number = 18) {
        super();
        this.w = size;
        this.h = size;
        this.checked = false;
        this.radio = false;
        this.group = null;
        this.on_change_cb = null;

        // default style
        this.style.background_color({ r: 30, g: 30, b: 30, a: 255 });
        this.style.border(1, { r: 80, g: 80, b: 80, a: 255 });
        this.style.border_radius(3);

        this.check_style = new StyleState();
        this.check_style.background_color.value = { r: 200, g: 200, b: 200, a: 255 };
        this.check_style.border_radius.value = 0;

        this.on_click(() => {
            if (this.radio) {
                this.set_checked(true);
                this.uncheck_group();
            } else {
                this.set_checked(!this.checked);
            }
        });
    }

    set_checked(value: boolean): this {
        if (this.checked != value) {
            this.checked = value;
            this.mark_dirty();
            if (this.on_change_cb) this.on_change_cb(this.checked);
        }
        return this;
    }

    is_checked(): boolean {
        return this.checked;
    }

    set_radio(value: boolean, group: string | null = null): this {
        this.radio = value;
        this.group = group;
        this.style.border_radius(value ? Math.round(this.w / 2) : 3);
        this.mark_dirty();
        return this;
    }

    set_check_color(color: Color): this {
        this.check_style.background_color.value = color;
        this.mark_dirty();
        return this;
    }

    on_change(cb: (value: boolean) => void): this {
        this.on_change_cb = cb;
        return this;
    }

    private uncheck_group(): void {
        if (!this.group || !this.parent) return;
        for (const child of this.parent.children) {
            if (child instanceof CheckboxWidget && child !== this && child.group === this.group) {
                child.set_checked(false);
            }
        }
    }

    override render(renderer: Renderer, dt: number): void {
        if (!this.visible) return;

        const style = this.get_style();
        renderer.render_box(this.id, this.x, this.y, this.w, this.h, style);

        if (this.checked) {
            const inset = Math.max(3, Math.floor(this.w * 0.25));
            const size = this.w - inset * 2;
            const check_id = `${this.id}_check`;

            this.check_style.border_radius.value = this.radio ? size / 2 : 0;
            renderer.render_box(check_id, this.x + inset, this.y + inset, size, size, this.check_style);
        }
    }
}
