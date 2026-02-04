import { Node } from "../core/node.ts";
import type { Renderer } from "../renderer/renderer.ts";

export class ImageWidget extends Node {
    image: HTMLImageElement | null;
    loaded: boolean;

    constructor(src?: string, w?: number, h?: number) {
        super();
        this.w = w || 0;
        this.h = h || 0;
        this.image = null;
        this.loaded = false;

        if (src) {
            this.load(src);
        }
    }

    load(src: string): void {
        const img = new Image();

        img.onload = () => {
            this.image = img;
            this.loaded = true;
            if (this.w == 0) this.w = img.naturalWidth;
            if (this.h == 0) this.h = img.naturalHeight;
            this.mark_dirty();
        };

        img.onerror = () => {
            console.error(`failed to load image: ${src}`);
        };

        img.src = src;
    }

    override render(renderer: Renderer, dt: number): void {
        if (!this.visible || !this.loaded || !this.image) {
            return;
        }

        const style = this.get_style();
        renderer.render_image(this.id, this.x, this.y, this.w, this.h, this.image, style);
    }
}
