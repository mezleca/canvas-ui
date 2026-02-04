import { StyleState } from "../style/state.ts";
import type { Node } from "../core/node.ts";

// renderer defines the drawing surface api used by nodes/layouts
export interface Renderer {
    initialize(settings: any): void;
    resize?(width: number, height: number): void;
    clear(): void;

    // rendering primitives
    render_box(id: string, x: number, y: number, w: number, h: number, style: StyleState): void;
    render_text(id: string, x: number, y: number, text: string, style: StyleState): void;
    render_image(id: string, x: number, y: number, w: number, h: number, image: any, style: StyleState): void;

    // measurements
    measure_text(text: string, style: StyleState): { width: number; height: number };

    // transform stack
    push_transform(): void;
    pop_transform(): void;
    translate(x: number, y: number): void;
    scale(x: number, y?: number): void;

    // clipping
    set_clip(x: number, y: number, w: number, h: number): void;
    restore_clip(): void;

    // optional caching for performance
    should_render?(node: Node): boolean;
    mark_rendered?(node: Node): void;
    cleanup_unused?(active_nodes: Node[]): void;
}

type CachedNodeData = {
    x: number;
    y: number;
    w: number;
    h: number;
    style_state: string;
    rendered_at: number;
};

export abstract class BaseRenderer implements Renderer {
    protected cached_elements: Map<string, CachedNodeData>;
    protected render_queue: Set<string>;

    constructor() {
        this.cached_elements = new Map();
        this.render_queue = new Set();
    }

    abstract initialize(settings: any): void;
    abstract clear(): void;
    abstract render_box(id: string, x: number, y: number, w: number, h: number, style: StyleState): void;
    abstract render_text(id: string, x: number, y: number, text: string, style: StyleState): void;
    abstract render_image(id: string, x: number, y: number, w: number, h: number, image: any, style: StyleState): void;
    abstract measure_text(text: string, style: StyleState): { width: number; height: number };
    abstract set_clip(x: number, y: number, w: number, h: number): void;
    abstract restore_clip(): void;
    abstract push_transform(): void;
    abstract pop_transform(): void;
    abstract translate(x: number, y: number): void;
    abstract scale(x: number, y?: number): void;

    should_render(node: Node): boolean {
        const cached = this.cached_elements.get(node.id);

        if (!cached) {
            return true;
        }

        if (node.is_dirty) {
            return true;
        }

        if (cached.x != node.x || cached.y != node.y || cached.w != node.w || cached.h != node.h) {
            return true;
        }

        if (cached.style_state != node.style.current_state) {
            return true;
        }

        return false;
    }

    mark_rendered(node: Node): void {
        this.cached_elements.set(node.id, {
            x: node.x,
            y: node.y,
            w: node.w,
            h: node.h,
            style_state: node.style.current_state,
            rendered_at: performance.now()
        });

        node.is_dirty = false;
        this.render_queue.delete(node.id);
    }

    invalidate(node_id: string): void {
        this.cached_elements.delete(node_id);
        this.render_queue.add(node_id);
    }

    cleanup_unused(active_nodes: Node[]): void {
        const active_ids = new Set(active_nodes.map((n) => n.id));

        for (const cached_id of this.cached_elements.keys()) {
            if (!active_ids.has(cached_id)) {
                this.cached_elements.delete(cached_id);
                this.render_queue.delete(cached_id);
            }
        }
    }
}
