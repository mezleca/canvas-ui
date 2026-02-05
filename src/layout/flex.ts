import { BaseLayout } from "./base.ts";
import type { Node } from "../core/node.ts";
import type { Renderer } from "../renderer/renderer.ts";

export type FlexDirection = "row" | "column";
export type FlexJustify = "start" | "center" | "end" | "space-between" | "space-around";
export type FlexAlign = "start" | "center" | "end" | "stretch";

export class FlexLayout extends BaseLayout {
    direction: FlexDirection;
    justify: FlexJustify;
    align: FlexAlign;
    gap: number;
    wrap: boolean;
    auto_resize_width: boolean;
    auto_resize_height: boolean;

    private rows: Array<{
        children: Node[];
        main_size: number;
        cross_size: number;
        position: number;
    }>;

    constructor(w?: number, h?: number) {
        super(w, h);
        this.direction = "row";
        this.justify = "start";
        this.align = "start";
        this.gap = 10;
        this.wrap = true;
        this.auto_resize_width = false;
        this.auto_resize_height = false;
        this.rows = [];
    }

    set_direction(direction: FlexDirection): this {
        this.direction = direction;
        this.mark_dirty();
        return this;
    }

    set_justify(justify: FlexJustify): this {
        this.justify = justify;
        this.mark_dirty();
        return this;
    }

    set_align(align: FlexAlign): this {
        this.align = align;
        this.mark_dirty();
        return this;
    }

    set_gap(gap: number): this {
        this.gap = gap;
        this.mark_dirty();
        return this;
    }

    set_wrap(wrap: boolean): this {
        this.wrap = wrap;
        this.mark_dirty();
        return this;
    }

    set_resize(options: { width?: boolean; height?: boolean }): this {
        if (options.width !== undefined) this.auto_resize_width = options.width;
        if (options.height !== undefined) this.auto_resize_height = options.height;
        this.mark_dirty();
        return this;
    }

    calculate(renderer: Renderer): void {
        const scroll = this.get_scroll_behavior();
        if (!this.is_dirty && !this.auto_resize_height && !this.auto_resize_width) {
            if (scroll) {
                scroll.max_scroll = Math.max(0, this.content_height - this.h);
                this.update_visibility(scroll.scroll_top);
            }
            return;
        }

        const is_row = this.direction == "row";
        const available_size = this.get_available_size();
        const style = this.get_style();

        // speculative resize to match parent availability
        if (this.auto_resize_width && available_size.width > 0) {
            const new_w = this._clamp_with_style(available_size.width, style.min_width.value, style.max_width.value);
            if (new_w != this.w) this.w = new_w;
        }

        if (this.auto_resize_height && available_size.height > 0) {
            const new_h = this._clamp_with_style(available_size.height, style.min_height.value, style.max_height.value);
            if (new_h != this.h) this.h = new_h;
        }

        const content_bounds = this.get_content_bounds();

        // determines the wrap limit (max main size)
        let max_main_size = is_row ? content_bounds.w : content_bounds.h;

        if (is_row && this.auto_resize_width && available_size.width > 0) {
            const style_max_w = this.get_style().max_width.value;
            let potential_w = available_size.width;

            if (style_max_w !== null) {
                potential_w = Math.min(potential_w, style_max_w);
            }

            // convert border-box width to content width
            max_main_size = potential_w - (content_bounds.padding.left + content_bounds.padding.right + content_bounds.border * 2);
        } else if (!is_row && this.auto_resize_height && available_size.height > 0) {
            const style_max_h = this.get_style().max_height.value;
            let potential_h = available_size.height;

            if (style_max_h !== null) {
                potential_h = Math.min(potential_h, style_max_h);
            }

            max_main_size = potential_h - (content_bounds.padding.top + content_bounds.padding.bottom + content_bounds.border * 2);
        }

        // clear rows
        this.rows = [];

        let current_row = this._create_row();

        // organize children into rows/columns
        const children = this.children;
        for (let i = 0; i < children.length; i++) {
            const child = children[i]!;

            if (child.is_dirty && this._can_calculate(child)) {
                child.calculate(renderer);
            }

            const child_main_size = (is_row ? child.w : child.h) + (child.is_ghost ? 0 : this.gap);
            const child_cross_size = is_row ? child.h : child.w;
            const needs_new_row = this.wrap && current_row.children.length > 0 && current_row.main_size + child_main_size > max_main_size;

            if (needs_new_row) {
                this.rows.push(current_row);
                current_row = this._create_row();
            }

            current_row.children.push(child);
            current_row.main_size += child_main_size;
            current_row.cross_size = Math.max(current_row.cross_size, child_cross_size);
        }

        if (current_row.children.length > 0) {
            this.rows.push(current_row);
        }

        // calculate total cross size
        let total_cross_size = 0;
        const rows = this.rows;

        for (let i = 0; i < rows.length; i++) {
            total_cross_size += rows[i]!.cross_size;
        }

        if (this.rows.length > 1) {
            total_cross_size += (this.rows.length - 1) * this.gap;
        }

        // position rows
        let cross_offset = 0;

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i]!;
            row.position = cross_offset;
            cross_offset += row.cross_size + this.gap;
        }

        // position children within rows
        for (let ri = 0; ri < rows.length; ri++) {
            const row = rows[ri]!;
            const row_children = row.children;
            const last_child = row_children.length > 0 ? row_children[row_children.length - 1]! : null;
            const row_main_size_without_gaps = row.main_size - (last_child && !last_child.is_ghost ? this.gap : 0);
            let main_offset = 0;
            let spacing = 0;

            if (this.justify == "center") {
                main_offset = (max_main_size - row_main_size_without_gaps) / 2;
            } else if (this.justify == "end") {
                main_offset = max_main_size - row_main_size_without_gaps;
            } else if (this.justify == "space-between" && row_children.length > 1) {
                let total_child_size = 0;
                for (let j = 0; j < row_children.length; j++) {
                    const row_child = row_children[j]!;
                    total_child_size += is_row ? row_child.w : row_child.h;
                }
                spacing = (max_main_size - total_child_size) / (row_children.length - 1);
            } else if (this.justify == "space-around" && row_children.length > 0) {
                let total_child_size = 0;
                for (let j = 0; j < row_children.length; j++) {
                    const row_child = row_children[j]!;
                    total_child_size += is_row ? row_child.w : row_child.h;
                }
                spacing = (max_main_size - total_child_size) / row_children.length;
                main_offset = spacing / 2;
            }

            let current_main = main_offset;

            for (let ci = 0; ci < row_children.length; ci++) {
                const child = row_children[ci]!;
                const child_main_size = is_row ? child.w : child.h;
                const child_cross_size = is_row ? child.h : child.w;

                let cross_pos = row.position;
                const cross_space = !is_row && !this.wrap ? content_bounds.w : row.cross_size;
                if (this.align == "center") {
                    cross_pos += (cross_space - child_cross_size) / 2;
                } else if (this.align == "end") {
                    cross_pos += cross_space - child_cross_size;
                }

                const x = content_bounds.x + (is_row ? current_main : cross_pos);
                const y = content_bounds.y + (is_row ? cross_pos : current_main);
                child.set_position(x, y);

                current_main += child_main_size;

                // apply gap or calculated spacing
                if (this.justify == "space-between" || this.justify == "space-around") {
                    current_main += spacing;
                } else {
                    current_main += child.is_ghost ? 0 : this.gap;
                }
            }
        }

        // update content height based on direction
        if (is_row) {
            this.content_height = total_cross_size + content_bounds.padding.top + content_bounds.padding.bottom;
        } else {
            let max_row_main_size = 0;
            for (let i = 0; i < rows.length; i++) {
                const row = rows[i]!;
                const actual_size = row.children.length > 0 ? row.main_size - this.gap : 0;
                max_row_main_size = Math.max(max_row_main_size, actual_size);
            }
            this.content_height = max_row_main_size + content_bounds.padding.top + content_bounds.padding.bottom;
        }

        // auto resize if needed
        if (this.auto_resize_width) {
            let required_w = 0;
            if (this.direction == "row") {
                let max_row_width = 0;
                for (let i = 0; i < rows.length; i++) {
                    const row = rows[i]!;
                    max_row_width = Math.max(max_row_width, row.main_size);
                }
                required_w = max_row_width + content_bounds.padding.left + content_bounds.padding.right + content_bounds.border * 2;
            } else {
                // column: width is max cross size (widest child)
                required_w = total_cross_size + content_bounds.padding.left + content_bounds.padding.right + content_bounds.border * 2;
            }

            let new_w = this._clamp_with_style(required_w, style.min_width.value, style.max_width.value);

            // if we have available space constraint from parent, respect it unless it's 0 (unbounded)
            if (available_size.width > 0) {
                new_w = Math.min(new_w, available_size.width);
            }
            this.w = new_w;
        }

        if (this.auto_resize_height) {
            let new_h = this._clamp_with_style(this.content_height + content_bounds.border * 2, style.min_height.value, style.max_height.value);

            // if we have available space constraint from parent, respect it unless it's 0 (unbounded)
            if (available_size.height > 0) {
                new_h = Math.min(new_h, available_size.height);
            }
            this.h = new_h;
        }

        // update scroll
        if (scroll) {
            scroll.content_height = this.content_height;
            scroll.max_scroll = Math.max(0, this.content_height - content_bounds.h);

            // clamp scroll to new max
            if (scroll.scroll_top > scroll.max_scroll) {
                scroll.scroll_top = scroll.max_scroll;
            }

            this.update_visibility(scroll.scroll_top);
        }
    }

    private _create_row(): { children: Node[]; main_size: number; cross_size: number; position: number } {
        return {
            children: [],
            main_size: 0,
            cross_size: 0,
            position: 0
        };
    }

    private _clamp_with_style(value: number, min_value: number | null, max_value: number | null): number {
        let result = Math.max(min_value || 0, value);
        if (max_value !== null) result = Math.min(result, max_value);
        return result;
    }

    private _can_calculate(node: Node): node is Node & { calculate: (renderer: Renderer) => void } {
        return typeof (node as any).calculate === "function";
    }
}
