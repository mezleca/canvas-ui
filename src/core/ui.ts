import { Node } from "./node.ts";
import type { Renderer } from "../renderer/renderer.ts";
import { register_ui, unregister_ui, type EventData } from "./events.ts";
import { create_input_state, type InputState } from "./input.ts";

export class UI {
    renderer: Renderer;
    root: Node;
    delta_time: number;
    last_time: number;
    fps: number;
    last_fps_update: number;
    frame_count: number;
    time_smoothing: number;
    smoothed_delta: number;
    internal_time: number;
    all_nodes: Node[];
    should_render: boolean;
    needs_render: boolean;
    nodes_changed: boolean;
    current_dpr: number;
    current_width: number;
    current_height: number;
    viewport_dirty: boolean;
    input_state: InputState;
    continuous_render: boolean;
    auto_resize_root: boolean;

    constructor(renderer: Renderer) {
        if (!renderer) {
            throw new Error("missing renderer");
        }

        this.renderer = renderer;
        this.delta_time = 0;
        this.last_time = 0;
        this.fps = 0;
        this.last_fps_update = 0;
        this.frame_count = 0;
        this.time_smoothing = 0.1;
        this.smoothed_delta = 0;
        this.internal_time = 0;
        this.root = new Node();
        this.root.ui = this;
        this.all_nodes = [];
        this.should_render = false;
        this.needs_render = true;
        this.nodes_changed = false;
        this.current_dpr = typeof window != "undefined" ? window.devicePixelRatio || 1 : 1;
        this.current_width = 0;
        this.current_height = 0;
        this.viewport_dirty = true;
        this.input_state = create_input_state();
        this.continuous_render = false;
        this.auto_resize_root = false;

        // bind event handlers to preserve this context
        this.on_mouse_move = this.on_mouse_move.bind(this);
        this.on_wheel = this.on_wheel.bind(this);
        this.on_key_press = this.on_key_press.bind(this);
        this.on_key_release = this.on_key_release.bind(this);
        this.on_resize = this.on_resize.bind(this);
        this.on_blur = this.on_blur.bind(this);

        register_ui(this);
    }

    set_resize(options: { width?: boolean; height?: boolean }): void {
        const root = this.root as any;

        if (root.set_resize) {
            root.set_resize(options);
        }

        this.auto_resize_root = false;
    }

    set_root_fullscreen(value: boolean = true): void {
        this.auto_resize_root = value;
        if (!value) return;
        this.root.set_position(0, 0);
        this.root.set_size(this.input_state.screen.w, this.input_state.screen.h);
        this.root.mark_dirty_recursive();
    }

    set_root(node: Node): void {
        this.root = node;
        node._propagate_ui_reference(this);
        this._collect_all_nodes();

        if (this.auto_resize_root) {
            this.root.w = this.current_width;
            this.root.h = this.current_height;
            this.root.mark_dirty();
        }
    }

    add(node: Node): void {
        node.ui = this;
        this.root.add(node);
        this.nodes_changed = true;
    }

    private _is_point_in_rect(x: number, y: number, rx: number, ry: number, rw: number, rh: number): boolean {
        return x >= rx && x <= rx + rw && y >= ry && y <= ry + rh;
    }

    private _has_overflow(node: Node): boolean {
        return (node as any).has_overflow === true;
    }

    private _is_point_in_content_bounds(node: Node, scroll_offset_x: number, scroll_offset_y: number, cursor_x: number, cursor_y: number): boolean {
        const bounds = node.get_content_bounds();
        const bx = bounds.x - scroll_offset_x;
        const by = bounds.y - scroll_offset_y;
        return this._is_point_in_rect(cursor_x, cursor_y, bx, by, bounds.w, bounds.h);
    }

    private _get_child_scroll_offsets(node: Node, scroll_offset_x: number, scroll_offset_y: number): { x: number; y: number } {
        const scroll = node.find_behavior("scroll") as any;
        if (!scroll) return { x: scroll_offset_x, y: scroll_offset_y };
        return {
            x: scroll_offset_x + (scroll.scroll_left || 0),
            y: scroll_offset_y + (scroll.scroll_top || 0)
        };
    }

    private _hit_test_recursive(node: Node, scroll_offset_x: number, scroll_offset_y: number, cursor_x: number, cursor_y: number): Node | null {
        if (!node.visible) return null;

        const visual_x = node.x - scroll_offset_x;
        const visual_y = node.y - scroll_offset_y;

        // check intersection with self
        if (this._is_point_in_rect(cursor_x, cursor_y, visual_x, visual_y, node.w, node.h)) {
            // check children (top-most / last painted first)
            // assuming children are painted in order, so last child is on top
            node._ensure_children_order();
            const children = node.children;

            // if the node clips its content, only hit-test children inside the content bounds
            if (this._has_overflow(node) && !this._is_point_in_content_bounds(node, scroll_offset_x, scroll_offset_y, cursor_x, cursor_y)) {
                return node;
            }

            // account for scroll behavior when testing children (scroll affects descendants, not the node itself)
            const next_scroll = this._get_child_scroll_offsets(node, scroll_offset_x, scroll_offset_y);

            for (let i = children.length - 1; i >= 0; i--) {
                const child = children[i]!;
                const hit = this._hit_test_recursive(child, next_scroll.x, next_scroll.y, cursor_x, cursor_y);
                if (hit) return hit;
            }

            return node;
        }

        return null;
    }

    get_input_state(): InputState {
        return this.input_state;
    }

    set_continuous_render(value: boolean): void {
        this.continuous_render = value;
        if (value) {
            this.should_render = true;
        }
    }

    request_render(): void {
        this.should_render = true;
        this.needs_render = true;
    }

    is_key_down(key: string): boolean {
        return this.input_state.keys.has(key);
    }

    was_key_pressed(key: string): boolean {
        return this.input_state.just_pressed.has(key);
    }

    was_key_released(key: string): boolean {
        return this.input_state.just_released.has(key);
    }

    get_stats(): { fps: number; frame_ms: number; dt: number } {
        return { fps: this.fps, frame_ms: this.delta_time * 1000, dt: this.delta_time };
    }

    get_time(): number {
        return this.internal_time;
    }

    set_time_smoothing(alpha: number): void {
        this.time_smoothing = Math.max(0, Math.min(1, alpha));
        if (this.time_smoothing === 0) {
            this.smoothed_delta = 0;
        }
    }

    on_mouse_move(data: EventData): void {
        let changed = false;
        if (data.x != undefined && data.x !== this.input_state.cursor.x) {
            this.input_state.cursor.x = data.x;
            changed = true;
        }
        if (data.y != undefined && data.y !== this.input_state.cursor.y) {
            this.input_state.cursor.y = data.y;
            changed = true;
        }
        if (changed) this.request_render();
    }

    on_wheel(data: EventData): void {
        let changed = false;
        if (data.delta_y != undefined && data.delta_y !== 0) {
            this.input_state.cursor.delta_y = data.delta_y;
            changed = true;
        }
        if (data.delta_x != undefined && data.delta_x !== 0) {
            this.input_state.cursor.delta_x = data.delta_x;
            changed = true;
        }
        if (changed) this.request_render();
    }

    on_key_press(data: EventData): void {
        if (data.key && !this.input_state.keys.has(data.key)) {
            this.input_state.keys.add(data.key);
            this.input_state.keys_changed = true;
            this.request_render();
        }
    }

    on_key_release(data: EventData): void {
        if (data.key && this.input_state.keys.has(data.key)) {
            this.input_state.keys.delete(data.key);
            this.input_state.keys_changed = true;
            this.request_render();
        }
    }

    on_resize(data: EventData): void {
        if (data.width != undefined) this.input_state.screen.w = data.width;
        if (data.height != undefined) this.input_state.screen.h = data.height;
        this.viewport_dirty = true;
        this.should_render = true;
        // force root dirty to pick up new available size
        if (this.root) this.root.mark_dirty_recursive();
    }

    on_blur(): void {
        if (this.input_state.keys.size > 0) {
            this.input_state.keys.clear();
            this.input_state.keys_changed = true;
        }
        this.request_render();
    }

    private _collect_all_nodes(): void {
        this.all_nodes.length = 0;
        this._collect_recursive(this.root);
    }

    private _collect_recursive(node: Node): void {
        this.all_nodes.push(node);
        const children = node.children;
        for (let i = 0; i < children.length; i++) {
            this._collect_recursive(children[i]!);
        }
    }

    private update_viewport(): boolean {
        if (typeof window == "undefined") {
            return false;
        }

        const screen_w = window.innerWidth;
        const screen_h = window.innerHeight;
        const device_pixel_rate = window.devicePixelRatio || 1;

        const needs_update =
            this.viewport_dirty || this.current_width != screen_w || this.current_height != screen_h || this.current_dpr != device_pixel_rate;

        if (!needs_update) {
            return false;
        }

        this.current_width = screen_w;
        this.current_height = screen_h;
        this.current_dpr = device_pixel_rate;
        this.viewport_dirty = false;

        this.input_state.screen.w = screen_w;
        this.input_state.screen.h = screen_h;

        if (this.auto_resize_root) {
            this.root.w = screen_w;
            this.root.h = screen_h;
            this.root.mark_dirty_recursive();
        }

        if (this.renderer.resize_viewport) {
            this.renderer.resize_viewport(screen_w, screen_h, device_pixel_rate);
        }

        return true;
    }

    async render(current_time: number): Promise<void> {
        const viewport_changed = this.update_viewport();
        if (this.continuous_render) this.should_render = true;

        // update input + layout before any render pass
        this.update(current_time);
        this._refresh_nodes_if_needed();

        if (this.should_render || this.needs_render || viewport_changed) {
            this._render_frame();
        }
    }

    update(current_time: number): void {
        this._update_time(current_time);
        this._update_focus();
        // update behaviors/layouts with the latest dt
        this.root.update_recursive(this.delta_time);
        this._update_key_transitions();
        this._reset_wheel();
        this._update_fps(current_time);
    }

    destroy(): void {
        unregister_ui(this);
    }

    private _refresh_nodes_if_needed(): void {
        if (!this.nodes_changed) return;
        this._collect_all_nodes();
        this.nodes_changed = false;
    }

    private _render_frame(): void {
        this.renderer.clear();
        this.root.render(this.renderer, this.internal_time);

        if (this.renderer.cleanup_unused) {
            this.renderer.cleanup_unused(this.all_nodes);
        }

        // render pass complete, reset dirty flags
        this.should_render = false;
        this.needs_render = false;

        const nodes = this.all_nodes;
        for (let i = 0; i < nodes.length; i++) {
            nodes[i]!.is_dirty = false;
        }
    }

    private _update_time(current_time: number): void {
        this.delta_time = (current_time - this.last_time) / 1000;
        this.last_time = current_time;

        // clamp dt spikes to keep simulation stable
        if (this.delta_time > 0.1) {
            this.delta_time = 0.1;
        }

        // optional dt smoothing for more consistent motion
        if (this.time_smoothing > 0) {
            if (this.smoothed_delta === 0) {
                this.smoothed_delta = this.delta_time;
            } else {
                this.smoothed_delta += (this.delta_time - this.smoothed_delta) * this.time_smoothing;
            }
            this.delta_time = this.smoothed_delta;
        }

        this.internal_time += this.delta_time;
    }

    private _update_focus(): void {
        const input = this.input_state;
        input.focused_node = this._hit_test_recursive(this.root, 0, 0, input.cursor.x, input.cursor.y);
    }

    private _update_key_transitions(): void {
        if (!this.input_state.keys_changed && this.input_state.just_pressed.size === 0 && this.input_state.just_released.size === 0) {
            return;
        }

        const just_pressed = this.input_state.just_pressed;
        const just_released = this.input_state.just_released;
        const prev_keys = this.input_state.prev_keys;

        just_pressed.clear();
        just_released.clear();

        for (const key of this.input_state.keys) {
            if (!prev_keys.has(key)) {
                just_pressed.add(key);
            }
        }

        for (const key of prev_keys) {
            if (!this.input_state.keys.has(key)) {
                just_released.add(key);
            }
        }

        prev_keys.clear();
        for (const key of this.input_state.keys) {
            prev_keys.add(key);
        }

        this.input_state.keys_changed = false;
    }

    private _reset_wheel(): void {
        this.input_state.cursor.delta_y = 0;
        this.input_state.cursor.delta_x = 0;
    }

    private _update_fps(current_time: number): void {
        this.frame_count++;
        if (current_time - this.last_fps_update >= 1000) {
            this.fps = Math.round((this.frame_count * 1000) / (current_time - this.last_fps_update));
            this.frame_count = 0;
            this.last_fps_update = current_time;
        }
    }
}
