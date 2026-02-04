import { test, expect } from "bun:test";
import { Tween, EASINGS } from "../src/style/interpolation.ts";
import { StyleProperty } from "../src/style/property.ts";
import { ColorProperty, type Color } from "../src/style/color.ts";

test("tween - number interpolation", () => {
    const prop = new StyleProperty(0);
    const tween = new Tween(prop, 0, 100, 1000, EASINGS.linear);

    // at 50% progress
    const complete = tween.update(0.5);
    expect(complete).toBe(false);
    expect(prop.value).toBe(50);

    // at 100% progress
    tween.update(0.5);
    expect(prop.value).toBe(100);
});

test("tween - color interpolation", () => {
    const prop = new ColorProperty({ r: 0, g: 0, b: 0, a: 255 });
    const from: Color = { r: 0, g: 0, b: 0, a: 255 };
    const to: Color = { r: 255, g: 255, b: 255, a: 255 };

    const tween = new Tween(prop, from, to, 1000, EASINGS.linear);

    // at 50% progress
    tween.update(0.5);
    const value = prop.value;

    expect(value.r).toBeCloseTo(128, 1);
    expect(value.g).toBeCloseTo(128, 1);
    expect(value.b).toBeCloseTo(128, 1);
});

test("tween - ease in out", () => {
    const prop = new StyleProperty(0);
    const tween = new Tween(prop, 0, 100, 1000, EASINGS.ease_in_out);

    // ease_in_out should accelerate then decelerate
    tween.update(0.25);
    const quarter = prop.value;

    tween.update(0.25);
    const half = prop.value;

    // at 50%, should be close to 50 for ease_in_out
    expect(half).toBeGreaterThan(40);
    expect(half).toBeLessThan(60);
});
