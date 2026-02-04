const MBUTTON_NAMES: Record<number, string> = {
    0: "mouse1",
    1: "mouse3",
    2: "mouse2"
};

export type EventData = {
    x?: number;
    y?: number;
    delta_x?: number;
    delta_y?: number;
    key?: string;
    type?: string;
    width?: number;
    height?: number;
    ctrl_key?: boolean;
};

export type UIEventHandler = (data: EventData) => void;

export interface UIEventTarget {
    on_mouse_move?: UIEventHandler;
    on_wheel?: UIEventHandler;
    on_key_press?: UIEventHandler;
    on_key_release?: UIEventHandler;
    on_resize?: UIEventHandler;
    on_blur?: UIEventHandler;
}

const registered_uis = new Set<UIEventTarget>();

export const register_ui = (ui: UIEventTarget): void => {
    registered_uis.add(ui);

    // setup event listeners
    if (registered_uis.size == 1 && typeof window != "undefined") {
        setup_dom_events();
    }
};

export const unregister_ui = (ui: UIEventTarget): void => {
    registered_uis.delete(ui);
};

const update_uis = (event_name: keyof UIEventTarget, data: EventData): void => {
    for (const ui of registered_uis) {
        const handler = ui[event_name];
        if (handler) {
            handler(data);
        }
    }
};

let events_setup = false;

const setup_dom_events = (): void => {
    if (events_setup || typeof window == "undefined") return;
    events_setup = true;

    window.addEventListener("mousemove", (e) => {
        update_uis("on_mouse_move", { x: e.clientX, y: e.clientY });
    });

    window.addEventListener("wheel", (e) => {
        if (e.ctrlKey) return;
        update_uis("on_wheel", { delta_x: e.deltaX, delta_y: e.deltaY });
    });

    window.addEventListener("mousedown", (e) => {
        const name = MBUTTON_NAMES[e.button];
        if (name) {
            update_uis("on_key_press", { key: name, type: "mouse" });
        }
    });

    window.addEventListener("mouseup", (e) => {
        const name = MBUTTON_NAMES[e.button];
        if (name) {
            update_uis("on_key_release", { key: name, type: "mouse" });
        }
    });

    window.addEventListener("keydown", (e) => {
        update_uis("on_key_press", { key: e.code, type: "keyboard" });
    });

    window.addEventListener("keyup", (e) => {
        update_uis("on_key_release", { key: e.code, type: "keyboard" });
    });

    window.addEventListener("resize", () => {
        update_uis("on_resize", { width: window.innerWidth, height: window.innerHeight });
    });

    window.addEventListener("blur", () => {
        update_uis("on_blur", {});
    });
};
