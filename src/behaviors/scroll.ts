import { type Behavior, BEHAVIOR_TYPES } from "./behavior.ts";
import type { Renderer } from "../renderer/renderer.ts";
import type { Node } from "../core/node.ts";

export class ScrollBehavior implements Behavior {
    type = BEHAVIOR_TYPES.SCROLL;
    node: Node;
    scroll_top: number;
    max_scroll: number;
    content_height: number;
    last_viewport_h: number;
    last_content_h: number;
    holding_scrollbar: boolean;
    drag_start_y: number;
    drag_start_scroll: number;

    constructor(node: Node) {
        this.node = node;
        this.scroll_top = 0;
        this.max_scroll = 0;
        this.content_height = 0;
        this.last_viewport_h = 0;
        this.last_content_h = 0;
        this.holding_scrollbar = false;
        this.drag_start_y = 0;
        this.drag_start_scroll = 0;
    }

    update(dt: number): void {
        this.handle_scroll();
    }

    handle_scroll(): void {
        const input = this.node.get_input_state();
        const style = this.node.get_style();
        const content_bounds = this.node.get_content_bounds();
        const viewport_h = content_bounds.h;

        this.max_scroll = Math.max(0, this.content_height - viewport_h);

        let updated = false;

        if (viewport_h != this.last_viewport_h || this.content_height != this.last_content_h) {
            this.last_viewport_h = viewport_h;
            this.last_content_h = this.content_height;
            this.node.mark_dirty();
        }

        if (this.max_scroll > 0) {
            const scrollbar_width = style.scrollbar_width.value;
            const scrollbar_x = this.node.x + this.node.w - scrollbar_width;
            const is_holding = input.keys.has("mouse1");
            const is_over_scrollbar = this.node._is_hovered(scrollbar_x, this.node.y, scrollbar_width, this.node.h);

            // start drag
            if (!this.holding_scrollbar && is_over_scrollbar && is_holding) {
                this.holding_scrollbar = true;
                this.drag_start_y = input.cursor.y;
                this.drag_start_scroll = this.scroll_top;
            }

            // end drag
            if (this.holding_scrollbar && !is_holding) {
                this.holding_scrollbar = false;
            }

            // handle drag (priority over wheel)
            if (this.holding_scrollbar) {
                const delta_y = input.cursor.y - this.drag_start_y;
                const scroll_ratio = this.max_scroll / (this.node.h - this._get_thumb_height(content_bounds.h));
                const new_scroll = this.drag_start_scroll + delta_y * scroll_ratio;

                if (new_scroll != this.scroll_top) {
                    updated = true;
                }

                this.scroll_top = Math.max(0, Math.min(new_scroll, this.max_scroll));
            }

            // handle wheel
            else if (input.cursor.delta_y != 0) {
                // only scroll if this is the nearest scrollable ancestor of the focused node
                // or if we are the focused node
                const focused = input.focused_node;
                const nearest = this.find_nearest_scrollable(focused);

                if (nearest === this.node) {
                    const old_scroll = this.scroll_top;

                    if (input.cursor.delta_y > 0) {
                        this.scroll_top = Math.min(this.scroll_top + Math.abs(input.cursor.delta_y), this.max_scroll);
                    } else if (input.cursor.delta_y < 0) {
                        this.scroll_top = Math.max(this.scroll_top - Math.abs(input.cursor.delta_y), 0);
                    }

                    if (old_scroll != this.scroll_top) {
                        updated = true;
                    }
                }
            }
        } else {
            if (this.scroll_top != 0) {
                this.scroll_top = 0;
                updated = true;
            }
        }

        // enforce bounds ensuring no overshoot
        if (this.scroll_top > this.max_scroll) {
            this.scroll_top = this.max_scroll;
            updated = true;
        }

        // when scroll changes, force redraw of all children to ensure
        // visibility culled elements are rendered when scrolled into view
        if (updated) {
            this.node.mark_dirty_recursive();
        }
    }

    find_nearest_scrollable(start_node: Node | null): Node | null {
        let current = start_node;
        while (current) {
            const behaviors = current.behaviors;
            for (let i = 0; i < behaviors.length; i++) {
                if (behaviors[i]!.type == BEHAVIOR_TYPES.SCROLL) {
                    return current;
                }
            }
            current = current.parent;
        }
        return null;
    }

    get_thumb_height(): number {
        return this._get_thumb_height(this.node.get_content_bounds().h);
    }

    private _get_thumb_height(viewport_h: number): number {
        if (this.content_height <= 0) return 20;
        const view_ratio = viewport_h / this.content_height;
        return Math.max(20, this.node.h * view_ratio);
    }

    render(renderer: Renderer): void {
        // don't render scrollbar if no overflow or content not calculated
        if (this.max_scroll <= 0 || this.content_height <= this.node.h) return;

        const style = this.node.get_style();
        const scrollbar_x = this.node.x + this.node.w - style.scrollbar_width.value;
        const scrollbar_id = `${this.node.id}_scrollbar_bg`;

        // render background track
        renderer.render_box(scrollbar_id, scrollbar_x, this.node.y, style.scrollbar_width.value, this.node.h, {
            background_color: style.scrollbar_background_color,
            border_size: { value: 0 },
            border_radius: style.scrollbar_thumb_radius,
            border_color: { value: null }
        } as any);

        // render thumb
        const thumb_height = this._get_thumb_height(this.node.get_content_bounds().h);

        const max_scroll = Math.max(1, this.content_height - this.node.h);
        const scroll_frac = this.scroll_top / max_scroll;
        const available_space = this.node.h - thumb_height;
        const thumb_y = this.node.y + scroll_frac * available_space;

        const scrollbar_thumb_id = `${this.node.id}_scrollbar_thumb`;

        renderer.render_box(scrollbar_thumb_id, scrollbar_x, thumb_y, style.scrollbar_thumb_width.value, thumb_height, {
            background_color: style.scrollbar_thumb_color,
            border_size: { value: 0 },
            border_radius: style.scrollbar_thumb_radius,
            border_color: { value: null }
        } as any);
    }
}
