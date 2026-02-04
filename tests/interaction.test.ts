import { test, expect } from "bun:test";
import { UI } from "../src/core/ui.ts";
import { Node } from "../src/core/node.ts";
import { CanvasRenderer } from "../src/renderer/canvas.ts";

// mock renderer to track render calls
class MockRenderer extends CanvasRenderer {
    render_calls = 0;

    override initialize(settings: any) {}
    override clear() {
        this.render_calls++;
    }
    override render_box(id: any, x: any, y: any, w: any, h: any, style: any) {}
    override render_text(id: any, x: any, y: any, text: any, style: any) {}
    override measure_text(text: any, style: any) {
        return { width: 0, height: 0 };
    }
    override set_clip(x: number, y: number, w: number, h: number) {}
    override restore_clip() {}
    override push_transform() {}
    override pop_transform() {}
    override translate(x: number, y: number) {}
    override scale(x: number, y: number) {}
}

test("ui render loop - hover triggers redraw", async () => {
    // setup
    const renderer = new MockRenderer();
    const ui = new UI(renderer);

    // add node
    const node = new Node().set_bounds(0, 0, 100, 100);
    // ensure node has a specific hover style so state change happens
    node.style.background_color({ r: 255, g: 0, b: 0, a: 255 }, "hover");

    ui.add(node);

    // initial render (frame 0)
    // forced because viewport_dirty starts true logic or first add
    await ui.render(0);
    expect(renderer.render_calls).toBe(1);

    // frame 1: no input change
    await ui.render(16);
    expect(renderer.render_calls).toBe(1); // should not render again

    // simulate mouse move over node
    ui.on_mouse_move({ x: 50, y: 50 });

    // frame 2:
    // update runs before render, so hover state is applied immediately
    await ui.render(32);
    expect(renderer.render_calls).toBe(2);

    // frame 3:
    // no additional changes, no new render
    await ui.render(48);
    expect(renderer.render_calls).toBe(2);

    expect(node.style.current_state).toBe("hover");
});

test("ui render loop - mouse leave triggers redraw", async () => {
    // setup
    const renderer = new MockRenderer();
    const ui = new UI(renderer);
    const node = new Node().set_bounds(0, 0, 100, 100);
    node.style.background_color({ r: 255, g: 0, b: 0, a: 255 }, "hover");
    ui.add(node);

    // get to hover state
    ui.on_mouse_move({ x: 50, y: 50 });
    await ui.render(0); // update runs here
    await ui.render(16); // render runs here
    expect(node.style.current_state).toBe("hover");
    const base_calls = renderer.render_calls;

    // move mouse out
    ui.on_mouse_move({ x: 200, y: 200 });

    // frame X: update runs, sets default state, dirty=true
    await ui.render(32);

    // frame X+1: render runs because dirty=true
    await ui.render(48);

    expect(renderer.render_calls).toBeGreaterThan(base_calls);
    expect(node.style.current_state).toBe("default");
});

test("ui set_root propagates ui to existing children", () => {
    const renderer = new MockRenderer();
    const ui = new UI(renderer);

    const parent = new Node();
    const child = new Node();
    parent.add_children(child);

    ui.set_root(parent);

    // accessing input state should not throw for child
    expect(() => child.get_input_state()).not.toThrow();
});
