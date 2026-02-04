import { StyleProperty } from "./property.ts";

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
        return { ...this._value };
    }

    override set value(color: Partial<Color>) {
        super.value = { ...DEFAULT_COLOR, ...this._value, ...color };
    }

    to_rgb(): string {
        const { r, g, b, a } = this._value;
        return `rgba(${r}, ${g}, ${b}, ${a / 255})`;
    }

    // linear interpolation between two colors
    static lerp(from: Color, to: Color, t: number): Color {
        t = Math.max(0, Math.min(1, t));
        return {
            r: Math.round(from.r + (to.r - from.r) * t),
            g: Math.round(from.g + (to.g - from.g) * t),
            b: Math.round(from.b + (to.b - from.b) * t),
            a: Math.round(from.a + (to.a - from.a) * t)
        };
    }
}
