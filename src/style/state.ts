import { StyleProperty } from "./property.ts";
import { ColorProperty, type Color } from "./color.ts";

export const PADDING_POSITIONS = {
    TOP: 0,
    RIGHT: 1,
    BOTTOM: 2,
    LEFT: 3
} as const;

export type TextAlign = "left" | "center" | "right" | "start" | "end";
export type TextBaseline = "alphabetic" | "top" | "hanging" | "middle" | "ideographic" | "bottom";
export type Justify = "left" | "center" | "right";
export type VerticalAlign = "top" | "center" | "bottom";

export class StyleState {
    // text
    text_align: StyleProperty<TextAlign>;
    text_baseline: StyleProperty<TextBaseline>;
    font: StyleProperty<string>;
    font_size: StyleProperty<number>;
    font_color: ColorProperty;

    // layout
    spacing: StyleProperty<number>;
    horizontal_justify: StyleProperty<Justify>;
    vertical_justify: StyleProperty<VerticalAlign>;
    max_width: StyleProperty<number | null>;
    max_height: StyleProperty<number | null>;
    min_width: StyleProperty<number | null>;
    min_height: StyleProperty<number | null>;

    // border
    border_size: StyleProperty<number>;
    border_radius: StyleProperty<number>;
    border_color: ColorProperty;
    background_color: ColorProperty;

    // scrollbar
    scrollbar_width: StyleProperty<number>;
    scrollbar_thumb_width: StyleProperty<number>;
    scrollbar_thumb_radius: StyleProperty<number>;
    scrollbar_background_color: ColorProperty;
    scrollbar_thumb_color: ColorProperty;

    // other
    padding: StyleProperty<[number, number, number, number]>;
    rotate: StyleProperty<number>;

    constructor() {
        this.text_align = new StyleProperty<TextAlign>("left", {
            validator: (v) => ["left", "center", "right", "start", "end"].includes(v)
        });

        this.text_baseline = new StyleProperty<TextBaseline>("alphabetic", {
            validator: (v) => ["alphabetic", "top", "hanging", "middle", "ideographic", "bottom"].includes(v)
        });

        this.font = new StyleProperty("Arial");
        this.font_size = new StyleProperty(12, { min: 1, max: 1000 });
        this.font_color = new ColorProperty();

        this.spacing = new StyleProperty(10, { min: 0 });
        this.horizontal_justify = new StyleProperty<Justify>("left", {
            validator: (v) => ["left", "center", "right"].includes(v)
        });

        this.vertical_justify = new StyleProperty<VerticalAlign>("top", {
            validator: (v) => ["top", "center", "bottom"].includes(v)
        });

        this.max_width = new StyleProperty<number | null>(null, {
            validator: (v) => v === null || (typeof v === "number" && v >= 0)
        });

        this.max_height = new StyleProperty<number | null>(null, {
            validator: (v) => v === null || (typeof v === "number" && v >= 0)
        });

        this.min_width = new StyleProperty<number | null>(0, {
            validator: (v) => v === null || (typeof v === "number" && v >= 0)
        });

        this.min_height = new StyleProperty<number | null>(0, {
            validator: (v) => v === null || (typeof v === "number" && v >= 0)
        });

        this.border_size = new StyleProperty(0, { min: 0 });
        this.border_radius = new StyleProperty(0, { min: 0 });
        this.border_color = new ColorProperty({ r: 180, g: 180, b: 180, a: 120 });
        this.background_color = new ColorProperty();

        this.scrollbar_width = new StyleProperty(12, { min: 1 });
        this.scrollbar_thumb_width = new StyleProperty(12, { min: 1 });
        this.scrollbar_thumb_radius = new StyleProperty(4, { min: 0 });
        this.scrollbar_background_color = new ColorProperty({ r: 0, g: 0, b: 0, a: 0 });
        this.scrollbar_thumb_color = new ColorProperty({ r: 160, g: 160, b: 160, a: 120 });

        this.padding = new StyleProperty<[number, number, number, number]>([0, 0, 0, 0], {
            validator: (v) => Array.isArray(v) && v.length == 4 && v.every((n) => typeof n == "number" && n >= 0)
        });

        this.rotate = new StyleProperty(0);
    }

    copy(): StyleState {
        const new_state = new StyleState();
        const keys = Object.keys(this) as (keyof StyleState)[];

        for (const key of keys) {
            const prop = this[key];
            if (prop instanceof StyleProperty || prop instanceof ColorProperty) {
                (new_state[key] as any) = prop.clone();
            }
        }

        return new_state;
    }

    reset_all(): this {
        const keys = Object.keys(this) as (keyof StyleState)[];

        for (const key of keys) {
            const prop = this[key];
            if (prop instanceof StyleProperty || prop instanceof ColorProperty) {
                prop.reset();
            }
        }

        return this;
    }
}
