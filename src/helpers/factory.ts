import { BoxWidget } from "../widgets/box.ts";
import { TextWidget } from "../widgets/text.ts";
import { ButtonWidget } from "../widgets/button.ts";
import { ImageWidget } from "../widgets/image.ts";
import { FlexLayout, type FlexAlign, type FlexDirection, type FlexJustify } from "../layout/flex.ts";
import { FreeLayout } from "../layout/free.ts";
import { BlockLayout } from "../layout/block.ts";
import type { Color } from "../style/color.ts";
import type { vec2d } from "../core/math.ts";
import { LineWidget } from "../widgets/line.ts";

export const create_box = (
    options: {
        w?: number;
        h?: number;
        bg?: Color;
        radius?: number;
        border?: number;
        border_color?: Color;
        padding?: number | [number, number, number, number];
        parent?: any;
    } = {}
): BoxWidget => {
    const box = new BoxWidget(options.w, options.h);
    if (options.bg) box.style.background_color(options.bg);
    if (options.border != null) {
        if (options.border_color) {
            box.style.border(options.border, options.border_color);
        } else {
            box.style.border(options.border);
        }
    }
    if (options.radius != null) box.style.border_radius(options.radius);
    if (options.padding != null) {
        if (Array.isArray(options.padding)) {
            box.style.padding(options.padding[0], options.padding[1], options.padding[2], options.padding[3]);
        } else {
            box.style.padding(options.padding);
        }
    }
    if (options.parent && options.parent.add_children) {
        options.parent.add_children(box);
    }
    return box;
};

export const create_line = (
    options: {
        points?: vec2d[];
        size?: number;
        color?: Color;
        parent?: any;
    } = {}
): LineWidget => {
    const line = new LineWidget(options.points ?? []);

    line.style.border_size(options.size ?? 1);

    if (options.color) line.style.background_color(options.color);
    if (options.parent && options.parent.add_children) {
        options.parent.add_children(line);
    }

    return line;
};

export const create_text = (
    options: {
        text?: string;
        font?: string;
        size?: number;
        color?: Color;
        align?: "left" | "center" | "right" | "start" | "end";
        baseline?: "alphabetic" | "top" | "hanging" | "middle" | "ideographic" | "bottom";
        parent?: any;
    } = {}
): TextWidget => {
    const text = new TextWidget(options.text);
    if (options.font || options.size || options.color) {
        text.style.font(options.font || "Arial", options.size || 14, options.color || { r: 255, g: 255, b: 255, a: 255 });
    }
    if (options.align) text.style.text_align(options.align);
    if (options.baseline) text.style.text_baseline(options.baseline);
    if (options.parent && options.parent.add_children) {
        options.parent.add_children(text);
    }
    return text;
};

export const create_button = (
    options: {
        text?: string;
        w?: number;
        h?: number;
        on_click?: (node: any) => void;
        parent?: any;
    } = {}
): ButtonWidget => {
    const btn = new ButtonWidget(options.text, options.w, options.h);
    if (options.on_click) btn.on_click(options.on_click as any);
    if (options.parent && options.parent.add_children) {
        options.parent.add_children(btn);
    }
    return btn;
};

export const create_image = (
    options: {
        src?: string;
        w?: number;
        h?: number;
        parent?: any;
    } = {}
): ImageWidget => {
    const image = new ImageWidget(options.src, options.w, options.h);
    if (options.parent && options.parent.add_children) {
        options.parent.add_children(image);
    }
    return image;
};

export const create_flex = (
    options: {
        w?: number;
        h?: number;
        direction?: FlexDirection;
        gap?: number;
        wrap?: boolean;
        justify?: FlexJustify;
        align?: FlexAlign;
        parent?: any;
    } = {}
): FlexLayout => {
    const flex = new FlexLayout(options.w, options.h);
    if (options.direction) flex.set_direction(options.direction);
    if (options.gap != null) flex.set_gap(options.gap);
    if (options.wrap != null) flex.set_wrap(options.wrap);
    if (options.justify) flex.set_justify(options.justify);
    if (options.align) flex.set_align(options.align);
    if (options.parent && options.parent.add_children) {
        options.parent.add_children(flex);
    }
    return flex;
};

export const create_free = (
    options: {
        w?: number;
        h?: number;
        parent?: any;
    } = {}
): FreeLayout => {
    const free = new FreeLayout(options.w, options.h);
    if (options.parent && options.parent.add_children) {
        options.parent.add_children(free);
    }
    return free;
};

export const create_block = (
    options: {
        w?: number;
        h?: number;
        gap?: number;
        inline?: boolean;
        parent?: any;
    } = {}
): BlockLayout => {
    const block = new BlockLayout(options.w, options.h);
    if (options.gap != null) block.set_gap(options.gap);
    if (options.inline != null) block.set_inline(options.inline);
    if (options.parent && options.parent.add_children) {
        options.parent.add_children(block);
    }
    return block;
};
