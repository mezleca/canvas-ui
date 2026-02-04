import { BaseRenderer } from "./renderer.ts";
import { StyleState } from "../style/state.ts";

export class CanvasRenderer extends BaseRenderer {
    canvas: HTMLCanvasElement | null;
    ctx: CanvasRenderingContext2D | null;

    constructor() {
        super();
        this.canvas = null;
        this.ctx = null;
    }

    initialize(settings: { width?: number; height?: number; background?: string } = {}): void {
        const new_canvas = document.createElement("canvas");
        new_canvas.width = settings.width || 800;
        new_canvas.height = settings.height || 800;
        new_canvas.style.background = settings.background || "black";
        this.canvas = new_canvas;
        this.ctx = new_canvas.getContext("2d");
        document.body.appendChild(new_canvas);
    }

    resize(width: number, height: number): void {
        if (!this.canvas) return;
        this.canvas.width = width;
        this.canvas.height = height;
    }

    resize_viewport(width: number, height: number, dpr: number): void {
        if (!this.canvas) return;
        this.canvas.width = width * dpr;
        this.canvas.height = height * dpr;
        this.canvas.style.width = width + "px";
        this.canvas.style.height = height + "px";
        this.canvas.style.display = "block";
        if (document.body) {
            document.body.style.margin = "0";
            document.body.style.overflow = "hidden";
        }
        if (this.ctx) {
            this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
    }

    clear(): void {
        if (!this.ctx || !this.canvas) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    render_box(id: string, x: number, y: number, w: number, h: number, style: StyleState): void {
        if (!this.ctx) return;

        const ctx = this.ctx;
        ctx.save();

        const border = style.border_size?.value || 0;

        const inset = border / 2;

        const bx = x + inset;
        const by = y + inset;
        const bw = w - border;
        const bh = h - border;

        if (style.border_radius.value > 0) {
            this._draw_rounded_rect(ctx, bx, by, bw, bh, style.border_radius.value);
        } else {
            ctx.beginPath();
            ctx.rect(bx, by, bw, bh);
        }

        if (style.background_color.value) {
            const c = style.background_color.value;
            if (c.a > 0) {
                ctx.fillStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${c.a / 255})`;
                ctx.fill();
            }
        }

        if (style.border_color.value && border > 0) {
            const c = style.border_color.value;
            if (c.a > 0) {
                ctx.strokeStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${c.a / 255})`;
                ctx.lineWidth = border;
                ctx.stroke();
            }
        }

        ctx.restore();
    }

    render_text(id: string, x: number, y: number, text: string, style: StyleState): void {
        if (!this.ctx) return;

        const ctx = this.ctx;

        if (style?.font.value) ctx.font = `${style.font_size.value}px ${style.font.value}`;
        if (style?.text_align.value) ctx.textAlign = style.text_align.value;
        if (style?.text_baseline.value) ctx.textBaseline = style.text_baseline.value;

        if (style?.font_color) {
            const c = style.font_color.value;
            ctx.fillStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${c.a / 255})`;
            ctx.fillText(text, x, y);
        }
    }

    measure_text(text: string, style: StyleState): { width: number; height: number } {
        if (!this.ctx) return { width: 0, height: 0 };

        const ctx = this.ctx;

        if (style?.font.value) ctx.font = `${style.font_size.value}px ${style.font.value}`;
        if (style?.text_align.value) ctx.textAlign = style.text_align.value;
        if (style?.text_baseline.value) ctx.textBaseline = style.text_baseline.value;

        const metrics = ctx.measureText(text);

        return {
            width: metrics.width,
            height: metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent
        };
    }

    render_image(id: string, x: number, y: number, w: number, h: number, image: HTMLImageElement, style: StyleState): void {
        if (!this.ctx) return;

        const ctx = this.ctx;
        ctx.save();
        ctx.translate(x + w / 2, y + h / 2);

        if (style.rotate.value > 0) {
            const deg = (style.rotate.value * Math.PI) / 180;
            ctx.rotate(deg);
        }

        if (style?.border_radius.value > 0) {
            // draw path in local coordinates (centered)
            this._draw_rounded_rect(ctx, -w / 2, -h / 2, w, h, style.border_radius.value);
            ctx.clip();
        }

        ctx.drawImage(image, -w / 2, -h / 2, w, h);
        ctx.restore();
    }

    set_clip(x: number, y: number, w: number, h: number): void {
        if (!this.ctx) return;
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.rect(x, y, w, h);
        this.ctx.clip();
    }

    restore_clip(): void {
        if (!this.ctx) return;
        this.ctx.restore();
    }

    push_transform(): void {
        if (!this.ctx) return;
        this.ctx.save();
    }

    pop_transform(): void {
        if (!this.ctx) return;
        this.ctx.restore();
    }

    translate(x: number, y: number): void {
        if (!this.ctx) return;
        this.ctx.translate(x, y);
    }

    scale(x: number, y: number = x): void {
        if (!this.ctx) return;
        this.ctx.scale(x, y);
    }

    private _draw_rounded_rect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, radius: number): void {
        if (w < 2 * radius) radius = w / 2;
        if (h < 2 * radius) radius = h / 2;

        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.arcTo(x + w, y, x + w, y + h, radius);
        ctx.arcTo(x + w, y + h, x, y + h, radius);
        ctx.arcTo(x, y + h, x, y, radius);
        ctx.arcTo(x, y, x + w, y, radius);
        ctx.closePath();
    }
}
