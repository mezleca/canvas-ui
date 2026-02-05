import { StyleState, PADDING_POSITIONS, type TextAlign, type TextBaseline, type Justify, type VerticalAlign } from "./state.ts";
import type { Color } from "./color.ts";
import { Tween, TweenManager, EASINGS, type EasingFn } from "./interpolation.ts";
import { StyleProperty } from "./property.ts";
import { ColorProperty } from "./color.ts";

export type StateName = "default" | "hover" | "active" | "disabled";

export class NodeStyle {
    private states_map: Record<StateName, StyleState>;
    private computed_state: StyleState; // the actual rendered values
    current_state: StateName;
    private element: any;
    private tween_manager: TweenManager;
    private transitions: Map<string, { duration: number; easing: EasingFn }>;

    constructor(element: any) {
        this.states_map = {
            default: new StyleState(),
            hover: new StyleState(),
            active: new StyleState(),
            disabled: new StyleState()
        };
        this.computed_state = new StyleState(); // starts as default values
        this.current_state = "default";
        this.element = element;
        this.tween_manager = new TweenManager();
        this.transitions = new Map();

        this.setup_change_listeners();
    }

    private setup_change_listeners(): void {
        // listen to changes on declared states (to mark dirty when styles change)
        for (const state of Object.values(this.states_map)) {
            this.add_listeners_to_state(state);
        }
        // listen to changes on computed state (for tween updates)
        this.add_listeners_to_state(this.computed_state);
    }

    private add_listeners_to_state(state: StyleState): void {
        const prop_keys = Object.keys(state) as (keyof StyleState)[];

        for (const key of prop_keys) {
            const prop = state[key];

            if (prop instanceof StyleProperty || prop instanceof ColorProperty) {
                const original_on_change = (prop as any).on_change;
                (prop as any).on_change = (new_value: any, old_value: any) => {
                    this.element.mark_dirty();
                    if (key === "z_index" && this.element.notify_parent_order_change) {
                        this.element.notify_parent_order_change();
                    }
                    original_on_change(new_value, old_value);
                };
            }
        }
    }

    get current(): StyleState {
        return this.computed_state;
    }

    get states() {
        return this.states_map;
    }

    get_current(): StyleState {
        return this.computed_state;
    }

    set_current_state(state_name: StateName): this {
        if (this.current_state == state_name) {
            return this;
        }

        const target_state = this.states_map[state_name];
        if (!target_state) {
            return this;
        }

        // clear existing tweens for clean transition
        this.tween_manager.clear();

        // create transitions for properties that have them configured
        const prop_keys = Object.keys(this.computed_state) as (keyof StyleState)[];

        for (const key of prop_keys) {
            const computed_prop = this.computed_state[key];
            const target_prop = target_state[key];
            const config = this.transitions.get(key as string);

            if (config && computed_prop && target_prop) {
                if (computed_prop instanceof ColorProperty && target_prop instanceof ColorProperty) {
                    const tween = new Tween(computed_prop, computed_prop.value, target_prop.value, config.duration, config.easing);
                    this.tween_manager.add(tween);
                } else if (computed_prop instanceof StyleProperty && target_prop instanceof StyleProperty) {
                    if (typeof computed_prop.value == "number" && typeof target_prop.value == "number") {
                        const tween = new Tween(computed_prop, computed_prop.value, target_prop.value, config.duration, config.easing);
                        this.tween_manager.add(tween);
                    } else {
                        // non-numeric, just set instantly
                        computed_prop.value = target_prop.value;
                    }
                }
            } else if (computed_prop && target_prop) {
                // no transition, set instantly
                if (computed_prop instanceof StyleProperty || computed_prop instanceof ColorProperty) {
                    computed_prop.value = (target_prop as any).value;
                }
            }
        }

        this.current_state = state_name;
        this.element.mark_dirty();
        return this;
    }

    update_tweens(dt: number): void {
        const had_active = this.tween_manager.active_count > 0;
        this.tween_manager.update(dt);

        // if tweens were active, keep marking dirty for animation
        if (had_active) {
            this.element.mark_dirty();
        }
    }

    // builder methods
    done(): any {
        this.element.mark_dirty();
        return this.element;
    }

    private apply_to_states(property_updates: Partial<Record<keyof StyleState, any>>, states: StateName | StateName[] | null = null): void {
        const target_states =
            states == null
                ? Object.values(this.states_map)
                : Array.isArray(states)
                  ? states.map((s) => this.states_map[s]).filter(Boolean)
                  : [this.states_map[states]].filter(Boolean);

        let changed = false;
        for (const state of target_states) {
            const entries = Object.entries(property_updates) as [keyof StyleState, any][];

            for (const [key, value] of entries) {
                const prop = state[key];
                if ((prop instanceof StyleProperty || prop instanceof ColorProperty) && value != null) {
                    if (!this.values_equal((prop as any).value, value)) {
                        prop.value = value;
                        changed = true;
                    }
                }
            }
        }

        // if updating current state (or all), update computed to match
        const current_state_updated =
            states == null || states == this.current_state || (Array.isArray(states) && states.includes(this.current_state));

        if (current_state_updated) {
            for (const [key, value] of Object.entries(property_updates) as [keyof StyleState, any][]) {
                const prop = this.computed_state[key];
                if ((prop instanceof StyleProperty || prop instanceof ColorProperty) && value != null) {
                    if (!this.values_equal((prop as any).value, value)) {
                        prop.value = value;
                        changed = true;
                    }
                }
            }
        }

        if (changed) {
            this.element.mark_dirty();
        }
    }

    private update_padding_position(position: number, value: number, states: StateName | StateName[] | null = null): void {
        const target_states =
            states == null
                ? Object.values(this.states_map)
                : Array.isArray(states)
                  ? states.map((s) => this.states_map[s]).filter(Boolean)
                  : [this.states_map[states]].filter(Boolean);

        for (const state of target_states) {
            const current_padding = [...state.padding.value] as [number, number, number, number];
            if (current_padding[position] === value) {
                continue;
            }
            current_padding[position] = value;
            state.padding.value = current_padding;
        }

        // sync computed if needed
        if (states == null || states == "default" || (Array.isArray(states) && states.includes("default"))) {
            if (this.current_state == "default") {
                const current_padding = [...this.computed_state.padding.value] as [number, number, number, number];
                if (current_padding[position] === value) {
                    return;
                }
                current_padding[position] = value;
                this.computed_state.padding.value = current_padding;
            }
        }
    }

    private values_equal(a: any, b: any): boolean {
        if (a === b) return true;
        if (a == null || b == null) return false;

        if (Array.isArray(a) && Array.isArray(b)) {
            if (a.length !== b.length) return false;
            for (let i = 0; i < a.length; i++) {
                if (a[i] !== b[i]) return false;
            }
            return true;
        }

        if (typeof a == "object" && typeof b == "object") {
            const a_keys = Object.keys(a);
            const b_keys = Object.keys(b);
            if (a_keys.length !== b_keys.length) return false;
            for (const key of a_keys) {
                if ((a as any)[key] !== (b as any)[key]) return false;
            }
            return true;
        }

        return false;
    }

    // transition configuration
    transition(property: keyof StyleState, duration: number, easing: keyof typeof EASINGS | EasingFn = "linear"): this {
        const easing_fn = typeof easing == "string" ? EASINGS[easing] : easing;
        this.transitions.set(property as string, { duration, easing: easing_fn });
        return this;
    }

    // style setters
    text_align(value: TextAlign, states: StateName | StateName[] | null = null): this {
        this.apply_to_states({ text_align: value }, states);
        return this;
    }

    text_baseline(value: TextBaseline, states: StateName | StateName[] | null = null): this {
        this.apply_to_states({ text_baseline: value }, states);
        return this;
    }

    font(font: string, size?: number, color?: Color, states: StateName | StateName[] | null = null): this {
        const props: Partial<Record<keyof StyleState, any>> = { font };
        if (size != null) props.font_size = size;
        if (color != null) props.font_color = color;
        this.apply_to_states(props, states);
        return this;
    }

    font_size(value: number, states: StateName | StateName[] | null = null): this {
        this.apply_to_states({ font_size: value }, states);
        return this;
    }

    font_color(value: Color, states: StateName | StateName[] | null = null): this {
        this.apply_to_states({ font_color: value }, states);
        return this;
    }

    spacing(value: number, states: StateName | StateName[] | null = null): this {
        this.apply_to_states({ spacing: value }, states);
        return this;
    }

    rotate(value: number, states: StateName | StateName[] | null = null): this {
        this.apply_to_states({ rotate: value }, states);
        return this;
    }

    z_index(value: number, states: StateName | StateName[] | null = null): this {
        this.apply_to_states({ z_index: value }, states);
        return this;
    }

    border(size: number, color?: Color, states: StateName | StateName[] | null = null): this {
        const props: Partial<Record<keyof StyleState, any>> = { border_size: size };
        if (color) props.border_color = color;
        this.apply_to_states(props, states);
        return this;
    }

    border_size(value: number, states: StateName | StateName[] | null = null): this {
        this.apply_to_states({ border_size: value }, states);
        return this;
    }

    border_color(value: Color, states: StateName | StateName[] | null = null): this {
        this.apply_to_states({ border_color: value }, states);
        return this;
    }

    border_radius(value: number, states: StateName | StateName[] | null = null): this {
        this.apply_to_states({ border_radius: value }, states);
        return this;
    }

    background_color(value: Color, states: StateName | StateName[] | null = null): this {
        this.apply_to_states({ background_color: value }, states);
        return this;
    }

    scrollbar_width(value: number, states: StateName | StateName[] | null = null): this {
        this.apply_to_states({ scrollbar_width: value }, states);
        return this;
    }

    scrollbar_thumb_width(value: number, states: StateName | StateName[] | null = null): this {
        this.apply_to_states({ scrollbar_thumb_width: value }, states);
        return this;
    }

    scrollbar_thumb_radius(value: number, states: StateName | StateName[] | null = null): this {
        this.apply_to_states({ scrollbar_thumb_radius: value }, states);
        return this;
    }

    scrollbar_background_color(value: Color, states: StateName | StateName[] | null = null): this {
        this.apply_to_states({ scrollbar_background_color: value }, states);
        return this;
    }

    scrollbar_thumb_color(value: Color, states: StateName | StateName[] | null = null): this {
        this.apply_to_states({ scrollbar_thumb_color: value }, states);
        return this;
    }

    horizontal_justify(value: Justify, states: StateName | StateName[] | null = null): this {
        this.apply_to_states({ horizontal_justify: value }, states);
        return this;
    }

    vertical_justify(value: VerticalAlign, states: StateName | StateName[] | null = null): this {
        this.apply_to_states({ vertical_justify: value }, states);
        return this;
    }

    max_width(value: number | null, states: StateName | StateName[] | null = null): this {
        this.apply_to_states({ max_width: value }, states);
        return this;
    }

    max_height(value: number | null, states: StateName | StateName[] | null = null): this {
        this.apply_to_states({ max_height: value }, states);
        return this;
    }

    min_width(value: number | null, states: StateName | StateName[] | null = null): this {
        this.apply_to_states({ min_width: value }, states);
        return this;
    }

    min_height(value: number | null, states: StateName | StateName[] | null = null): this {
        this.apply_to_states({ min_height: value }, states);
        return this;
    }

    padding(...values: number[]): this {
        if (values.length == 0) return this;

        const v0 = values[0] ?? 0;
        const v1 = values[1] ?? 0;
        const v2 = values[2] ?? 0;
        const v3 = values[3] ?? 0;

        const padding: [number, number, number, number] = values.length == 1 ? [v0, v0, v0, v0] : [v0, v1, v2, v3];

        this.apply_to_states({ padding });
        return this;
    }

    padding_left(value: number, states: StateName | StateName[] | null = null): this {
        this.update_padding_position(PADDING_POSITIONS.LEFT, value, states);
        return this;
    }

    padding_right(value: number, states: StateName | StateName[] | null = null): this {
        this.update_padding_position(PADDING_POSITIONS.RIGHT, value, states);
        return this;
    }

    padding_top(value: number, states: StateName | StateName[] | null = null): this {
        this.update_padding_position(PADDING_POSITIONS.TOP, value, states);
        return this;
    }

    padding_bottom(value: number, states: StateName | StateName[] | null = null): this {
        this.update_padding_position(PADDING_POSITIONS.BOTTOM, value, states);
        return this;
    }
}

export { PADDING_POSITIONS };
