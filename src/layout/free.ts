import { BaseLayout } from "./base.ts";
import type { Renderer } from "../renderer/renderer.ts";

export class FreeLayout extends BaseLayout {
    constructor(w?: number, h?: number) {
        super(w, h);
    }

    calculate(renderer: Renderer): void {
        const scroll = this.get_scroll_behavior();
        const content_bounds = this.get_content_bounds();
        let content_bottom = content_bounds.y;

        const children = this.children;
        for (let i = 0; i < children.length; i++) {
            const child = children[i]!;
            if (child.is_dirty && (child as any).calculate) {
                (child as any).calculate(renderer);
            }

            // fallback to content position if not explicitly set
            if (child.x == 0) child.x = content_bounds.x;
            if (child.y == 0) child.y = content_bounds.y;

            const child_bottom = child.y + child.h;
            content_bottom = Math.max(content_bottom, child_bottom);
        }

        this.content_height = content_bottom - content_bounds.y + content_bounds.padding.top + content_bounds.padding.bottom;
        this.is_dirty = false;

        // update scroll
        if (scroll) {
            scroll.content_height = this.content_height;
            scroll.max_scroll = Math.max(0, this.content_height - content_bounds.h);
            this.update_child_visibility(scroll.scroll_top || 0);
        }
    }
}
