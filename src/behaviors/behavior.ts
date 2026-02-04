import type { Node } from "../core/node.ts";
import type { Renderer } from "../renderer/renderer.ts";

export const BEHAVIOR_TYPES = {
    SCROLL: "scroll"
} as const;

export interface Behavior {
    type: string;
    node: Node;
    update(dt: number): void;
    render(renderer: Renderer): void;
}
