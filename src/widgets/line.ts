import type { vec2d } from "../core/math.ts";
import { Node } from "../core/node.ts";
import type { Renderer } from "../renderer/renderer.ts";

export class LineWidget extends Node {
    private points: vec2d[] = [];
    private bounds_min_x: number = 0;
    private bounds_min_y: number = 0;
    private bounds_max_x: number = 0;
    private bounds_max_y: number = 0;

    constructor(points: vec2d[]) {
        super();
        if (points) this.set_points(points);
    }

    set_points(points: vec2d[]): void {
        this.points = points;
        this.update_bounds();
        this.mark_dirty();
    }

    calculate(): void {
        this.update_bounds();
    }

    override render(renderer: Renderer, dt: number): void {
        if (!this.visible) return;

        const style = this.get_style();
        const offset_x = this.x - this.bounds_min_x;
        const offset_y = this.y - this.bounds_min_y;

        renderer.render_line(this.id, this.points, style, { x: offset_x, y: offset_y });
    }

    private update_bounds(): void {
        if (this.points.length === 0) {
            this.bounds_min_x = 0;
            this.bounds_min_y = 0;
            this.bounds_max_x = 0;
            this.bounds_max_y = 0;
            this.w = 0;
            this.h = 0;
            return;
        }

        const style = this.get_style();
        const stroke = style.border_size.value || 0;
        const half_stroke = stroke / 2;

        let min_x = this.points[0]!.x;
        let max_x = this.points[0]!.x;
        let min_y = this.points[0]!.y;
        let max_y = this.points[0]!.y;

        for (let i = 1; i < this.points.length; i++) {
            const point = this.points[i]!;
            if (point.x < min_x) min_x = point.x;
            if (point.x > max_x) max_x = point.x;
            if (point.y < min_y) min_y = point.y;
            if (point.y > max_y) max_y = point.y;
        }

        this.bounds_min_x = min_x - half_stroke;
        this.bounds_min_y = min_y - half_stroke;
        this.bounds_max_x = max_x + half_stroke;
        this.bounds_max_y = max_y + half_stroke;

        this.w = Math.max(0, this.bounds_max_x - this.bounds_min_x);
        this.h = Math.max(0, this.bounds_max_y - this.bounds_min_y);
    }
}
