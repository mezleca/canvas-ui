import { test, expect } from "bun:test";
import { FlexLayout } from "../src/layout/flex.ts";
import { BoxWidget } from "../src/widgets/box.ts";
import { SpacerWidget } from "../src/widgets/spacer.ts";
import { UI } from "../src/core/ui.ts";
import { CanvasRenderer } from "../src/renderer/canvas.ts";

// helper to create a test ui
const create_test_ui = () => {
    const renderer = {
        measure_text: () => ({ width: 0, height: 0 }),
        should_render: () => true,
        mark_rendered: () => {},
        cleanup_unused: () => {}
    } as any;

    return new UI(renderer);
};

test("flex layout - row direction with gap", () => {
    const ui = create_test_ui();

    const layout = new FlexLayout(400, 600);
    layout.set_direction("row");
    layout.set_gap(10);
    layout.set_justify("start");

    const box1 = new BoxWidget(100, 50);
    const box2 = new BoxWidget(100, 50);
    const box3 = new BoxWidget(100, 50);

    layout.add_children(box1, box2, box3);

    ui.add(layout);

    const renderer = {
        measure_text: () => ({ width: 0, height: 0 })
    } as any;

    layout.calculate(renderer);

    // check positions - should be side by side with 10px gap
    expect(box1.x).toBe(0);
    expect(box2.x).toBe(110); // 100 + 10
    expect(box3.x).toBe(220); // 100 + 10 + 100 + 10
});

test("flex layout - center justify", () => {
    const ui = create_test_ui();

    const layout = new FlexLayout(400, 600);
    layout.set_direction("row");
    layout.set_gap(10);
    layout.set_justify("center");

    const box = new BoxWidget(100, 50);
    layout.add_children(box);

    ui.add(layout);

    const renderer = {
        measure_text: () => ({ width: 0, height: 0 })
    } as any;

    layout.calculate(renderer);

    // should be centered in 400px width
    expect(box.x).toBe(150); // (400 - 100) / 2
});

test("flex layout - wrapping behavior", () => {
    const ui = create_test_ui();

    const layout = new FlexLayout(250, 600);
    layout.set_direction("row");
    layout.set_gap(10);
    layout.set_wrap(true);

    const box1 = new BoxWidget(100, 50);
    const box2 = new BoxWidget(100, 50);
    const box3 = new BoxWidget(100, 50);

    layout.add_children(box1, box2, box3);

    ui.add(layout);

    const renderer = {
        measure_text: () => ({ width: 0, height: 0 })
    } as any;

    layout.calculate(renderer);

    // first row: box1, box2 (210px total with gap)
    // second row: box3
    expect(box1.y).toBeLessThan(box3.y);
    expect(box2.y).toBe(box1.y);
});

test("layout visibility - ignores ghost nodes", () => {
    const layout = new FlexLayout(200, 200);
    layout.set_direction("column");
    layout.set_wrap(false);
    layout.set_gap(0);

    const spacer = new SpacerWidget(100, 100);
    const box = new BoxWidget(100, 100);

    spacer.x = 0;
    spacer.y = 0;
    box.x = 0;
    box.y = 0;

    layout.add_children(spacer, box);

    layout.update_visibility(0);

    expect(spacer.visible).toBe(false);
    expect(box.visible).toBe(true);
});

test("layout visibility - culls on horizontal bounds too", () => {
    const layout = new FlexLayout(200, 200);
    layout.set_direction("column");
    layout.set_wrap(false);
    layout.set_gap(0);

    const inside = new BoxWidget(50, 50);
    inside.x = 0;
    inside.y = 0;

    const outside = new BoxWidget(50, 50);
    outside.x = 500;
    outside.y = 0;

    layout.add_children(inside, outside);

    layout.update_visibility(0);

    expect(inside.visible).toBe(true);
    expect(outside.visible).toBe(false);
});
