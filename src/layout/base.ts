import { Node } from "../core/node.ts";
import { BEHAVIOR_TYPES, type Behavior } from "../behaviors/behavior.ts";
import type { ScrollBehavior } from "../behaviors/scroll.ts";
import type { Renderer } from "../renderer/renderer.ts";

export abstract class BaseLayout extends Node {
    has_overflow: boolean;
    content_height: number;
    private cached_scroll: ScrollBehavior | null;

    constructor(w?: number, h?: number) {
        super();
        this.w = w || 0;
        this.h = h || 0;
        this.has_overflow = true;
        this.content_height = 0;
        this.cached_scroll = null;
    }

    abstract calculate(renderer: Renderer): void;

    override add_behavior(behavior: Behavior): this {
        this.behaviors.push(behavior);

        if (behavior.type == BEHAVIOR_TYPES.SCROLL) {
            this.cached_scroll = behavior as ScrollBehavior;
        }

        return this;
    }

    protected get_scroll_behavior(): ScrollBehavior | null {
        if (this.cached_scroll) {
            return this.cached_scroll;
        }

        const scroll = this.find_behavior(BEHAVIOR_TYPES.SCROLL) as ScrollBehavior | null;
        this.cached_scroll = scroll;
        return scroll;
    }

    override draw(renderer: Renderer): void {
        const style = this.get_style();
        const id = `${this.id}_background`;
        renderer.render_box(id, this.x, this.y, this.w, this.h, style);
    }

    get_available_size(): { width: number; height: number } {
        const parent_bounds = this.get_parent_bounds();
        return { width: parent_bounds.w - this.x, height: parent_bounds.h - this.y };
    }

    override render(renderer: Renderer, dt: number): void {
        if (!this.visible) {
            return;
        }

        const content_bounds = this.get_content_bounds();

        // render background / border
        this.draw(renderer);

        // calculate layout
        this.calculate(renderer);

        // find scroll behavior if exists
        let scroll_top = 0;
        const scroll = this.get_scroll_behavior();
        if (scroll) {
            scroll_top = scroll.scroll_top || 0;
        }

        // set clipping to content area
        renderer.set_clip(content_bounds.x, content_bounds.y, content_bounds.w, content_bounds.h);

        // save and translate context for scroll offset
        renderer.push_transform();
        renderer.translate(0, -scroll_top);

        // render children with scroll offset already applied
        const children = this.children;

        for (let i = 0; i < children.length; i++) {
            const child = children[i]!;
            if (child.visible) {
                child.render(renderer, dt);
            }
        }

        // restore context
        renderer.pop_transform();
        renderer.restore_clip();

        // render behaviors (including scrollbar) - these should NOT be affected by scroll
        const behaviors = this.behaviors;
        for (let i = 0; i < behaviors.length; i++) {
            behaviors[i]!.render(renderer);
        }
    }

    update_visibility(scroll_top: number): void {
        const content_bounds = this.get_content_bounds();
        const view_top = content_bounds.y + scroll_top;
        const view_bottom = view_top + content_bounds.h;

        // buffer is 10% of viewport height, ensures smooth scrolling without popping
        const buffer = Math.max(50, content_bounds.h * 0.1);

        const view_left = content_bounds.x;
        const view_right = content_bounds.x + content_bounds.w;
        const buffer_x = Math.max(50, content_bounds.w * 0.1);

        const children = this.children;

        for (let i = 0; i < children.length; i++) {
            const child = children[i]!;

            if (child.is_ghost) {
                continue;
            }

            const child_top = child.y;
            const child_bottom = child.y + child.h;
            const child_left = child.x;
            const child_right = child.x + child.w;

            const is_visible = child_bottom + buffer >= view_top && child_top - buffer <= view_bottom;
            const is_visible_x = child_right + buffer_x >= view_left && child_left - buffer_x <= view_right;

            child.set_visible(is_visible && is_visible_x);
        }
    }
}
