import { StyleProperty } from "./property.ts";
import { clamp } from "../core/math.ts";

export type Color = {
    r: number;
    g: number;
    b: number;
    a: number;
};

const DEFAULT_COLOR: Color = { r: 255, g: 255, b: 255, a: 255 };

export class ColorProperty extends StyleProperty<Color> {
    constructor(
        initial_color: Color = DEFAULT_COLOR,
        options: {
            on_change?: (new_value: Color, old_value: Color) => void;
        } = {}
    ) {
        super(initial_color, {
            ...options,
            validator: (color) => {
                return (
                    color &&
                    color.r >= 0 &&
                    color.r <= 255 &&
                    color.g >= 0 &&
                    color.g <= 255 &&
                    color.b >= 0 &&
                    color.b <= 255 &&
                    color.a >= 0 &&
                    color.a <= 255
                );
            }
        });
    }

    override get value(): Color {
        return { ...this.value_data };
    }

    override set value(color: Partial<Color>) {
        const next = { ...DEFAULT_COLOR, ...this.value_data, ...color };
        if (!("a" in color)) {
            next.a = 255;
        }
        super.value = next;
    }

    to_rgb(): string {
        const { r, g, b, a } = this.value_data;
        return `rgba(${r}, ${g}, ${b}, ${a / 255})`;
    }

    // linear interpolation between two colors
    static lerp(from: Color, to: Color, t: number): Color {
        t = clamp(t, 0, 1);
        return {
            r: Math.round(from.r + (to.r - from.r) * t),
            g: Math.round(from.g + (to.g - from.g) * t),
            b: Math.round(from.b + (to.b - from.b) * t),
            a: Math.round(from.a + (to.a - from.a) * t)
        };
    }
}
