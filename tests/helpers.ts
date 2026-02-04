import type { InputState } from "../src/core/input.ts";

type MockInputOverrides = Partial<Omit<InputState, "cursor" | "screen">> & {
    cursor?: Partial<InputState["cursor"]>;
    screen?: Partial<InputState["screen"]>;
};

export const create_mock_ui = (overrides: MockInputOverrides = {}) => {
    const input_state: InputState = {
        screen: { w: 800, h: 600, ...(overrides.screen || {}) },
        cursor: { x: 0, y: 0, delta_y: 0, delta_x: 0, ...(overrides.cursor || {}) },
        keys: overrides.keys || new Set(),
        prev_keys: new Set(),
        just_pressed: new Set(),
        just_released: new Set(),
        keys_changed: false,
        focused_node: overrides.focused_node ?? null
    };

    return {
        input_state,
        get_input_state: () => input_state
    } as any;
};

export const create_mock_renderer_with_transforms = () => {
    const transforms: Array<{ x: number; y: number }> = [];
    let current_transform = { x: 0, y: 0 };

    return {
        measure_text: () => ({ width: 0, height: 0 }),
        render_box: () => {},
        render_text: () => {},
        push_transform: () => {
            transforms.push({ ...current_transform });
        },
        pop_transform: () => {
            if (transforms.length > 0) {
                current_transform = transforms.pop()!;
            }
        },
        translate: (x: number, y: number) => {
            current_transform.x += x;
            current_transform.y += y;
        },
        set_clip: () => {},
        restore_clip: () => {},
        get_current_transform: () => current_transform,
        reset: () => {
            transforms.length = 0;
            current_transform = { x: 0, y: 0 };
        }
    } as any;
};
