import { StyleProperty } from "./property.ts";
import { ColorProperty, type Color } from "./color.ts";

export type EasingFn = (t: number) => number;

// common easing functions
export const EASINGS = {
    linear: (t: number) => t,
    ease_in: (t: number) => t * t,
    ease_out: (t: number) => t * (2 - t),
    ease_in_out: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),

    // cubic bezier approximations
    ease: (t: number) => {
        const c1 = 0.25;
        const c2 = 0.1;
        const c3 = 0.25;
        const c4 = 1.0;
        return (1 - t) ** 3 * 0 + 3 * (1 - t) ** 2 * t * c2 + 3 * (1 - t) * t ** 2 * c4 + t ** 3 * 1;
    }
};

export class Tween {
    private property: StyleProperty<any> | ColorProperty;
    private from: any;
    private to: any;
    private duration: number;
    private elapsed: number;
    private easing: EasingFn;
    private on_complete?: () => void;
    private is_color: boolean;
    private cancelled: boolean;

    constructor(
        property: StyleProperty<any> | ColorProperty,
        from: any,
        to: any,
        duration: number,
        easing: EasingFn = EASINGS.linear,
        on_complete?: () => void
    ) {
        this.property = property;
        this.from = from;
        this.to = to;
        this.duration = duration;
        this.elapsed = 0;
        this.easing = easing;
        this.on_complete = on_complete;
        this.is_color = property instanceof ColorProperty;
        this.cancelled = false;
    }

    update(dt: number): boolean {
        if (this.cancelled) {
            return true;
        }

        this.elapsed += dt * 1000; // convert to ms

        const t = Math.min(1, this.elapsed / this.duration);
        const eased_t = this.easing(t);

        if (this.is_color && this.property instanceof ColorProperty) {
            const interpolated = ColorProperty.lerp(this.from as Color, this.to as Color, eased_t);
            this.property.value = interpolated;
        } else if (typeof this.from == "number" && typeof this.to == "number") {
            const interpolated = this.from + (this.to - this.from) * eased_t;
            this.property.value = interpolated;
        }

        if (t >= 1) {
            this.property.value = this.to;
            if (this.on_complete) {
                this.on_complete();
            }
            return true;
        }

        return false;
    }

    cancel(): void {
        this.cancelled = true;
    }
}

// manages all active tweens
export class TweenManager {
    private tweens: Set<Tween>;

    constructor() {
        this.tweens = new Set();
    }

    add(tween: Tween): void {
        this.tweens.add(tween);
    }

    update(dt: number): void {
        for (const tween of this.tweens) {
            const complete = tween.update(dt);
            if (complete) {
                this.tweens.delete(tween);
            }
        }
    }

    clear(): void {
        for (const tween of this.tweens) {
            tween.cancel();
        }
        this.tweens.clear();
    }

    get active_count(): number {
        return this.tweens.size;
    }
}
