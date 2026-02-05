import { NodeStyle } from "../style/style.ts";
import { PADDING_POSITIONS } from "../style/state.ts";
import type { Renderer } from "../renderer/renderer.ts";
import type { InputState } from "./input.ts";
import type { UI } from "./ui.ts";
import { type Behavior, BEHAVIOR_TYPES } from "../behaviors/behavior.ts";
import { StyleState } from "../style/state.ts";

export class Node {
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
    visible: boolean;
    is_dirty: boolean;
    is_ghost: boolean;
    text: string;

    parent: Node | null;
    children: Node[];
    ui: UI | null;
    style: NodeStyle;
    behaviors: Behavior[];
    children_order_dirty: boolean;

    // event system
    private events: Map<string, (node: Node) => void>;
    private hovering: boolean;
    private holding: boolean;

    constructor() {
        this.id = crypto.randomUUID();
        this.x = 0;
        this.y = 0;
        this.w = 0;
        this.h = 0;
        this.visible = true;
        this.is_dirty = true;
        this.is_ghost = false;
        this.text = "";

        this.parent = null;
        this.children = [];
        this.ui = null;
        this.style = new NodeStyle(this);
        this.behaviors = [];
        this.children_order_dirty = false;

        this.events = new Map();
        this.hovering = false;
        this.holding = false;
    }

    // add a child node to this node
    add(child: Node): this {
        child.parent = this;
        child._propagate_ui_reference(this.ui);
        this.children.push(child);
        this.children_order_dirty = true;
        this.mark_dirty();
        if (this.ui) {
            this.ui.nodes_changed = true;
        }
        return this;
    }

    // add multiple children
    add_children(...children: Node[]): this {
        for (let i = 0; i < children.length; i++) {
            this.add(children[i]!);
        }
        return this;
    }

    // add a behavior to this node
    add_behavior(behavior: Behavior): this {
        this.behaviors.push(behavior);
        return this;
    }

    // find the first behavior by type
    find_behavior(type: string): Behavior | null {
        const behaviors = this.behaviors;
        for (let i = 0; i < behaviors.length; i++) {
            if (behaviors[i]!.type == type) return behaviors[i]!;
        }
        return null;
    }

    remove(id: string): this {
        const children = this.children;

        for (let i = children.length - 1; i >= 0; i--) {
            if (children[i]!.id == id) {
                children[i]!.parent = null;
                children.splice(i, 1);
                this.children_order_dirty = true;
                break;
            }
        }

        this.mark_dirty();

        if (this.ui) {
            this.ui.nodes_changed = true;
        }

        return this;
    }

    _notify_parent_order_change(): void {
        if (this.parent) {
            this.parent.children_order_dirty = true;
            this.parent.mark_dirty();
        }
    }

    _ensure_children_order(): void {
        if (!this.children_order_dirty || this.children.length <= 1) return;
        // stable sort keeps insertion order for equal z_index
        this.children.sort((a, b) => {
            const za = a.get_style().z_index.value;
            const zb = b.get_style().z_index.value;
            if (za === zb) return 0;
            return za - zb;
        });
        this.children_order_dirty = false;
    }

    mark_dirty(): void {
        this.is_dirty = true;

        if (this.ui) {
            this.ui.needs_render = true;
        }

        let parent = this.parent;

        while (parent) {
            parent.is_dirty = true;
            parent = parent.parent;
        }
    }

    mark_dirty_recursive(): void {
        this.is_dirty = true;

        if (this.ui) {
            this.ui.needs_render = true;
        }

        const children = this.children;

        for (let i = 0; i < children.length; i++) {
            children[i]!.mark_dirty_recursive();
        }
    }

    get_input_state(): InputState {
        if (!this.ui) {
            throw new Error("node not attached to ui");
        }
        return this.ui.get_input_state();
    }

    get_style(): StyleState {
        return this.style.get_current();
    }

    _propagate_ui_reference(ui: UI | null): void {
        this.ui = ui;
        const children = this.children;

        for (let i = 0; i < children.length; i++) {
            children[i]!._propagate_ui_reference(ui);
        }
    }

    _update_style_state(is_hovered: boolean, is_active: boolean): void {
        let new_state: "default" | "hover" | "active" | "disabled" = "default";

        if (is_active) {
            new_state = is_active ? "active" : "hover";
        } else if (is_hovered) {
            new_state = "hover";
        }

        if (new_state != this.style.current_state) {
            this.style.set_current_state(new_state);
            this.mark_dirty();
        }
    }

    render(renderer: Renderer, dt: number): void {
        if (!this.visible) return;

        // only render if needed
        if (renderer.should_render && renderer.should_render(this)) {
            this.draw(renderer);
            if (renderer.mark_rendered) {
                renderer.mark_rendered(this);
            }
        }

        // render behaviors
        const behaviors = this.behaviors;

        for (let i = 0; i < behaviors.length; i++) {
            behaviors[i]!.render(renderer);
        }

        // render children
        this._ensure_children_order();
        const children = this.children;

        for (let i = 0; i < children.length; i++) {
            const child = children[i]!;
            if (child.visible) {
                child.render(renderer, dt);
            }
        }
    }

    draw(renderer: Renderer): void {
        const style = this.get_style();
        renderer.render_box(this.id, this.x, this.y, this.w, this.h, style);
    }

    set_bounds(x: number, y: number, w: number, h: number): this {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        return this;
    }

    get_visual_offset(): { x: number; y: number } {
        let offset_x = 0;
        let offset_y = 0;
        let current = this.parent;

        while (current) {
            const behaviors = current.behaviors;
            for (let i = 0; i < behaviors.length; i++) {
                const b = behaviors[i]!;
                if (b.type == BEHAVIOR_TYPES.SCROLL) {
                    offset_y -= (b as any).scroll_top || 0;
                    offset_x -= (b as any).scroll_left || 0;
                }
            }
            current = current.parent;
        }
        return { x: offset_x, y: offset_y };
    }

    _is_hovered(x: number, y: number, w: number, h: number): boolean {
        const input = this.get_input_state();
        const visual_offset = this.get_visual_offset();

        // adjust node bounds by visual offset to match screen coordinates
        const x1 = x + visual_offset.x;
        const x2 = x + w + visual_offset.x;
        const y1 = y + visual_offset.y;
        const y2 = y + h + visual_offset.y;

        return input.cursor.x > x1 && input.cursor.x < x2 && input.cursor.y > y1 && input.cursor.y < y2;
    }

    is_hovered(): boolean {
        return this._is_hovered(this.x, this.y, this.w, this.h);
    }

    is_pressed(): boolean {
        return this.holding;
    }

    is_focused(): boolean {
        if (!this.ui) return false;
        return this.ui.get_input_state().focused_node === this;
    }

    get_parent_bounds(): { w: number; h: number } {
        if (this.parent && this.parent.w && this.parent.h) {
            return { w: this.parent.w, h: this.parent.h };
        }

        const input = this.get_input_state();
        return { w: input.screen.w, h: input.screen.h };
    }

    get_content_bounds(): {
        x: number;
        y: number;
        w: number;
        h: number;
        padding: { top: number; right: number; bottom: number; left: number };
        border: number;
    } {
        const style = this.get_style();
        const border = style.border_size.value || 0;

        const padding_top = style.padding.value[PADDING_POSITIONS.TOP] || 0;
        const padding_right = style.padding.value[PADDING_POSITIONS.RIGHT] || 0;
        const padding_bottom = style.padding.value[PADDING_POSITIONS.BOTTOM] || 0;
        const padding_left = style.padding.value[PADDING_POSITIONS.LEFT] || 0;

        return {
            x: this.x + border + padding_left,
            y: this.y + border + padding_top,
            w: this.w - border * 2 - padding_left - padding_right,
            h: this.h - border * 2 - padding_top - padding_bottom,
            padding: {
                top: padding_top,
                right: padding_right,
                bottom: padding_bottom,
                left: padding_left
            },
            border: border
        };
    }

    update(dt: number = 0.016): void {
        const input = this.get_input_state();
        const is_hovered = this.is_hovered();
        const has_m1_pressed = input.keys.has("mouse1");

        // update style state
        this._update_style_state(is_hovered, has_m1_pressed && this.holding);

        // hover state transitions
        if (is_hovered && !this.hovering) {
            this.hovering = true;
            this._emit("mouseover");
        } else if (!is_hovered && this.hovering) {
            this.hovering = false;
            this._emit("mouseleave");
        }

        // mouse down
        if (is_hovered && !this.holding && has_m1_pressed) {
            this.holding = true;
            this._emit("mousedown");
        }

        // mouse up / click handling
        if (!has_m1_pressed && this.holding) {
            this.holding = false;
            this._emit("mouseup");
            if (is_hovered) {
                this._emit("click");
            }
        }

        // update style tweens with actual dt
        this.style.update_tweens(dt);

        // emit update event for custom logic
        const update_cb = this.events.get("update");
        if (update_cb) (update_cb as any)(this, dt);
    }

    update_recursive(dt: number = 0.016): void {
        this.update(dt);

        // update behaviors
        const behaviors = this.behaviors;
        for (let i = 0; i < behaviors.length; i++) {
            behaviors[i]!.update(dt);
        }

        const children = this.children;
        for (let i = 0; i < children.length; i++) {
            const child = children[i]!;
            if (child.visible) {
                child.update_recursive(dt);
            }
        }
    }

    // event helpers
    on(event_name: string, callback: (node: Node, dt?: number) => void): this {
        this.events.set(event_name, callback);
        return this;
    }

    on_click(cb: (node: Node) => void): this {
        this.events.set("click", cb);
        return this;
    }

    on_hover(cb: (node: Node) => void): this {
        this.events.set("mouseover", cb);
        return this;
    }

    on_mouseleave(cb: (node: Node) => void): this {
        this.events.set("mouseleave", cb);
        return this;
    }

    private _emit(event_name: string): void {
        const cb = this.events.get(event_name);
        if (cb) cb(this);
    }

    set_id(id: string): this {
        if (id && id != "") {
            this.id = id;
            this.mark_dirty();
        }
        return this;
    }

    set_visible(value: boolean): this {
        if (this.visible != value) {
            this.visible = value;
            this.mark_dirty();
        }
        return this;
    }

    set_text(value: string): this {
        if (this.text != value) {
            this.text = value;
            this.mark_dirty();
        }
        return this;
    }

    set_position(x: number, y: number): this {
        if (this.x != x || this.y != y) {
            this.x = x;
            this.y = y;
            this.mark_dirty();
        }
        return this;
    }

    set_size(w: number, h: number): this {
        if (this.w != w || this.h != h) {
            this.w = w;
            this.h = h;
            this.mark_dirty();
        }
        return this;
    }
}
