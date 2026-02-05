import { BaseLayout } from "./base.ts";
import type { Node } from "../core/node.ts";
import type { Renderer } from "../renderer/renderer.ts";
import { LineWidget } from "../widgets/line.ts";

export class BlockLayout extends BaseLayout {
    gap: number;
    inline: boolean;

    constructor(w?: number, h?: number) {
        super(w, h);
        this.gap = 8;
        this.inline = false;
    }

    set_gap(gap: number): this {
        this.gap = gap;
        this.mark_dirty();
        return this;
    }

    set_inline(value: boolean): this {
        this.inline = value;
        this.mark_dirty();
        return this;
    }

    calculate(renderer: Renderer): void {
        const scroll = this.get_scroll_behavior();

        const style = this.get_style();
        const available_size = this.get_available_space();

        if (this.auto_resize_width && available_size.width > 0) {
            const new_w = this.clamp_with_style(available_size.width, style.min_width.value, style.max_width.value);
            if (new_w != this.w) this.w = new_w;
        }

        if (this.auto_resize_height && available_size.height > 0) {
            const new_h = this.clamp_with_style(available_size.height, style.min_height.value, style.max_height.value);
            if (new_h != this.h) this.h = new_h;
        }

        const content_bounds = this.get_content_bounds();
        const children = this.children;

        let y = content_bounds.y;
        let max_w = 0;

        if (this.inline) {
            const start_x = content_bounds.x;
            const max_x = content_bounds.x + content_bounds.w;
            let x = start_x;
            let line_height = 0;
            let line_width = 0;

            for (let i = 0; i < children.length; i++) {
                const child = children[i]!;

                if (child.is_dirty && this.can_calculate(child)) {
                    child.calculate(renderer);
                }

                const ignore_line_in_fixed_layout = !this.auto_resize_height && !this.auto_resize_width && child instanceof LineWidget;
                if (ignore_line_in_fixed_layout) {
                    child.set_position(x, y);
                    continue;
                }

                const child_w = child.w;
                const child_h = child.h;

                if (x !== start_x && x + child_w > max_x) {
                    max_w = Math.max(max_w, line_width > 0 ? line_width - this.gap : 0);
                    y += line_height + this.gap;
                    x = start_x;
                    line_height = 0;
                    line_width = 0;
                }

                child.set_position(x, y);
                if (!child.is_ghost) {
                    x += child_w + this.gap;
                    line_width += child_w + this.gap;
                    line_height = Math.max(line_height, child_h);
                }
            }

            max_w = Math.max(max_w, line_width > 0 ? line_width - this.gap : 0);
            this.content_height = y - content_bounds.y + line_height + content_bounds.padding.top + content_bounds.padding.bottom;
        } else {
            for (let i = 0; i < children.length; i++) {
                const child = children[i]!;

                if (child.is_dirty && this.can_calculate(child)) {
                    child.calculate(renderer);
                }

                const ignore_line_in_fixed_layout = !this.auto_resize_height && child instanceof LineWidget;
                if (ignore_line_in_fixed_layout) {
                    child.set_position(content_bounds.x, y);
                    continue;
                }

                child.set_position(content_bounds.x, y);
                y += child.h + (child.is_ghost ? 0 : this.gap);
                max_w = Math.max(max_w, child.w);
            }

            if (children.length > 0) {
                y -= this.gap;
            }

            this.content_height = y - content_bounds.y + content_bounds.padding.top + content_bounds.padding.bottom;
        }
        this.is_dirty = false;

        if (this.auto_resize_width) {
            const required_w = max_w + content_bounds.padding.left + content_bounds.padding.right + content_bounds.border * 2;
            let new_w = this.clamp_with_style(required_w, style.min_width.value, style.max_width.value);
            if (available_size.width > 0) {
                new_w = Math.min(new_w, available_size.width);
            }
            this.w = new_w;
        }

        if (this.auto_resize_height) {
            let new_h = this.clamp_with_style(this.content_height + content_bounds.border * 2, style.min_height.value, style.max_height.value);
            if (available_size.height > 0) {
                new_h = Math.min(new_h, available_size.height);
            }
            this.h = new_h;
        }

        if (scroll) {
            scroll.content_height = this.content_height;
            scroll.max_scroll = Math.max(0, this.content_height - content_bounds.h);
            if (scroll.scroll_top > scroll.max_scroll) {
                scroll.scroll_top = scroll.max_scroll;
            }
            this.update_child_visibility(scroll.scroll_top);
        }
    }

    private can_calculate(node: Node): node is Node & { calculate: (renderer: Renderer) => void } {
        return typeof (node as any).calculate === "function";
    }
}
