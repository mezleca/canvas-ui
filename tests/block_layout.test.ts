import { describe, expect, test } from "bun:test";
import { BlockLayout } from "../src/layout/block.ts";
import { BoxWidget } from "../src/widgets/box.ts";
import { LineWidget } from "../src/widgets/line.ts";
import { create_mock_ui } from "./helpers.ts";

const create_mock_renderer = () =>
    ({
        render_box: () => {},
        render_text: () => {},
        render_line: () => {},
        render_image: () => {},
        measure_text: () => ({ width: 0, height: 0 })
    }) as any;

describe("block layout", () => {
    test("stacks children vertically with gap", () => {
        const mock_ui = create_mock_ui();
        const layout = new BlockLayout(200, 200);
        layout.set_gap(10);
        layout.ui = mock_ui;

        const box1 = new BoxWidget(50, 20);
        const box2 = new BoxWidget(50, 30);

        layout.add_children(box1, box2);
        layout.calculate(create_mock_renderer());

        expect(box1.y).toBe(0);
        expect(box2.y).toBe(30); // 20 + 10
    });

    test("auto resize height accounts for children", () => {
        const mock_ui = create_mock_ui();
        const layout = new BlockLayout(200, 0);
        layout.set_resize({ height: true });
        layout.set_gap(10);
        layout.ui = mock_ui;

        const box1 = new BoxWidget(50, 20);
        const box2 = new BoxWidget(50, 30);

        layout.add_children(box1, box2);
        layout.calculate(create_mock_renderer());

        expect(layout.h).toBe(60); // 20 + 10 + 30
    });

    test("fixed layout ignores line in flow", () => {
        const mock_ui = create_mock_ui();
        const layout = new BlockLayout(200, 200);
        layout.set_resize({ height: false });
        layout.set_gap(10);
        layout.ui = mock_ui;

        const box1 = new BoxWidget(50, 20);
        const line = new LineWidget([
            { x: 0, y: 0 },
            { x: 0, y: 40 }
        ]);
        const box2 = new BoxWidget(50, 20);

        layout.add_children(box1, line, box2);
        layout.calculate(create_mock_renderer());

        expect(box1.y).toBe(0);
        expect(box2.y).toBe(30); // line should not push
    });

    test("inline layout wraps children", () => {
        const mock_ui = create_mock_ui();
        const layout = new BlockLayout(100, 200);
        layout.set_inline(true);
        layout.set_gap(10);
        layout.ui = mock_ui;

        const box1 = new BoxWidget(60, 20);
        const box2 = new BoxWidget(60, 20);

        layout.add_children(box1, box2);
        layout.calculate(create_mock_renderer());

        expect(box1.y).toBe(0);
        expect(box2.y).toBe(30); // wrap to next line (20 + 10)
    });
});
