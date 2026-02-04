import { test, expect } from "bun:test";
import { UI } from "../src/core/ui.ts";
import { BoxWidget } from "../src/widgets/box.ts";
import { Node } from "../src/core/node.ts";
import { create_mock_ui } from "./helpers.ts";

test("z_index - hit test prefers higher z_index", () => {
    const ui = new UI({} as any);
    const root = new BoxWidget(200, 200);
    root.set_position(0, 0);

    const back = new BoxWidget(200, 200);
    const front = new BoxWidget(200, 200);
    back.set_position(0, 0);
    front.set_position(0, 0);

    root.add_children(back, front);
    ui.set_root(root);

    back.style.z_index(0);
    front.style.z_index(10);

    ui.on_mouse_move({ x: 50, y: 50 });
    ui.update(16);

    expect(ui.get_input_state().focused_node).toBe(front);
});

test("z_index - render order follows z_index", () => {
    const ui = new UI({} as any);
    const root = new Node();
    root.set_position(0, 0);

    const nodes = [new Node(), new Node(), new Node()];
    nodes[0]!.style.z_index(5);
    nodes[1]!.style.z_index(-2);
    nodes[2]!.style.z_index(5);

    root.add_children(...nodes);
    ui.set_root(root);

    const render_order: string[] = [];
    const renderer = {
        render_box: (id: string) => render_order.push(id),
        should_render: () => true,
        mark_rendered: () => {},
        measure_text: () => ({ width: 0, height: 0 })
    } as any;

    root.render(renderer, 0);

    const sorted = [...nodes].sort((a, b) => {
        const za = a.get_style().z_index.value;
        const zb = b.get_style().z_index.value;
        if (za === zb) return 0;
        return za - zb;
    });

    expect(render_order.slice(-3)).toEqual(sorted.map((node) => node.id));
});

test("z_index - ties keep insertion order", () => {
    const ui = new UI({} as any);
    const root = new Node();
    root.set_position(0, 0);

    const first = new Node();
    const second = new Node();
    root.add_children(first, second);
    ui.set_root(root);

    first.style.z_index(3);
    second.style.z_index(3);

    const render_order: string[] = [];
    const renderer = {
        render_box: (id: string) => render_order.push(id),
        should_render: () => true,
        mark_rendered: () => {},
        measure_text: () => ({ width: 0, height: 0 })
    } as any;

    root.render(renderer, 0);
    expect(render_order.slice(-2)).toEqual([first.id, second.id]);
});
