import type { Node } from "./node.ts";

export type InputState = {
    keys: Set<string>;
    cursor: {
        x: number;
        y: number;
        delta_y: number;
        delta_x: number;
    };
    screen: {
        w: number;
        h: number;
    };
    focused_node: Node | null;
};

export const create_input_state = (): InputState => ({
    keys: new Set(),
    cursor: { x: 0, y: 0, delta_y: 0, delta_x: 0 },
    screen: {
        w: typeof window != "undefined" ? window.innerWidth : 800,
        h: typeof window != "undefined" ? window.innerHeight : 600
    },
    focused_node: null
});
