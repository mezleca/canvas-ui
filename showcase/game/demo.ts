import {
    CanvasRenderer,
    UI,
    TextWidget,
    BoxWidget,
    ImageWidget,
    clamp,
    create_box,
    create_text,
    create_button,
    create_image,
    create_flex,
    create_free
} from "../../index.ts";

import cat_img from "../../static/cat.png";

const renderer = new CanvasRenderer();
renderer.initialize({ width: 1200, height: 800, background: "#1a1a1a" });

const ui = new UI(renderer);
ui.set_continuous_render(true);

const color = (r: number, g: number, b: number, a: number = 255) => ({ r, g, b, a });
const snap = (v: number) => {
    const ratio = typeof window != "undefined" ? window.devicePixelRatio || 1 : 1;
    return Math.round(v * ratio) / ratio;
};
const rainbow = (t: number) => {
    const r = Math.round(140 + 80 * Math.sin(t));
    const g = Math.round(140 + 80 * Math.sin(t + 2));
    const b = Math.round(140 + 80 * Math.sin(t + 4));
    return color(r, g, b);
};

const root = create_flex({ w: 1200, h: 800, direction: "column", wrap: false });
root.style.background_color(color(26, 26, 26));
root.style.padding(0);

const game_view = create_free({ w: 1200, h: 800 });
game_view.style.background_color(color(24, 24, 24));
game_view.style.border(2, color(40, 40, 40));
game_view.style.border_radius(6);

root.add_children(game_view);
ui.set_root(root);
ui.set_root_fullscreen();

root.on_resize((node, info) => {
    game_view.set_size(info.w, info.h);
    game_view.set_position(0, 0);
});

type Platform = { x: number; y: number; w: number; h: number; node: BoxWidget };
type Enemy = {
    x: number;
    y: number;
    w: number;
    h: number;
    vx: number;
    min_x: number;
    max_x: number;
    start_x: number;
    start_y: number;
    base_vx: number;
    alive: boolean;
    hp: number;
    max_hp: number;
    rainbow: boolean;
    rainbow_phase: number;
    node: BoxWidget;
};

type Star = {
    x: number;
    y: number;
    size: number;
    speed: number;
    parallax: number;
    node: BoxWidget;
};

type Aurora = {
    x: number;
    y: number;
    w: number;
    h: number;
    speed: number;
    node: BoxWidget;
};

type Particle = {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    max_life: number;
    node: BoxWidget;
    active: boolean;
};

type FloatText = {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    max_life: number;
    node: TextWidget;
    active: boolean;
};

const platforms: Platform[] = [];
const enemies: Enemy[] = [];
const stars: Star[] = [];
const auroras: Aurora[] = [];
const particles: Particle[] = [];
const void_particles: Particle[] = [];
const float_texts: FloatText[] = [];

const add_platform = (x: number, y: number, w: number, h: number) => {
    const node = new BoxWidget(w, h);
    node.style.background_color(color(55, 58, 64));
    node.style.border_radius(0);
    game_view.add_children(node);

    const platform = { x, y, w, h, node };
    platforms.push(platform);
    return platform;
};

const add_enemy = (platform: Platform, offset_x: number, elite: boolean = false) => {
    const w = 36;
    const h = 24;
    const node = new BoxWidget(w, h);
    node.style.background_color(color(220, 80, 80));
    node.style.border_radius(0);
    game_view.add_children(node);

    const min_x = platform.x + 8;
    const max_x = platform.x + platform.w - w - 8;
    const start_x = clamp(platform.x + offset_x, min_x, max_x);
    const base_vx = 60;
    const max_hp = elite ? 4 : 1;

    enemies.push({
        x: start_x,
        y: platform.y - h,
        w,
        h,
        vx: base_vx,
        min_x,
        max_x,
        start_x,
        start_y: platform.y - h,
        base_vx,
        alive: true,
        hp: max_hp,
        max_hp,
        rainbow: elite,
        rainbow_phase: Math.random() * Math.PI * 2,
        node
    });
};

const world_length = 4200;

const add_star = (x: number, y: number, size: number, speed: number, parallax: number, alpha: number) => {
    const node = new BoxWidget(size, size);
    node.style.background_color(color(140, 150, 170, alpha));
    node.style.border_radius(size);
    game_view.add_children(node);
    stars.push({ x, y, size, speed, parallax, node });
};

const add_aurora = (x: number, y: number, w: number, h: number, speed: number, tint: { r: number; g: number; b: number }) => {
    const node = new BoxWidget(w, h);
    node.style.background_color(color(tint.r, tint.g, tint.b, 70));
    node.style.border_radius(h);
    game_view.add_children(node);
    auroras.push({ x, y, w, h, speed, node });
};

const seed_auroras = () => {
    add_aurora(120, 120, 520, 90, 18, { r: 70, g: 90, b: 120 });
    add_aurora(640, 160, 620, 110, 12, { r: 80, g: 100, b: 140 });
    add_aurora(1400, 100, 520, 80, 22, { r: 90, g: 110, b: 150 });
};

const seed_particles = () => {
    const total = 80;
    for (let i = 0; i < total; i++) {
        const node = new BoxWidget(4, 4);
        node.style.background_color(color(250, 220, 160, 0));
        node.set_visible(false);
        game_view.add_children(node);
        particles.push({ x: 0, y: 0, vx: 0, vy: 0, life: 0, max_life: 0, node, active: false });
    }
};

const seed_void_particles = () => {
    const total = 50;
    for (let i = 0; i < total; i++) {
        const node = new BoxWidget(3, 3);
        node.style.background_color(color(120, 140, 180, 0));
        node.set_visible(false);
        game_view.add_children(node);
        void_particles.push({ x: 0, y: 0, vx: 0, vy: 0, life: 0, max_life: 0, node, active: false });
    }
};

const seed_float_texts = () => {
    const total = 16;
    for (let i = 0; i < total; i++) {
        const node = new TextWidget("-1");
        node.style.font("Arial", 12, color(220, 200, 180));
        node.set_visible(false);
        game_view.add_children(node);
        float_texts.push({ x: 0, y: 0, vx: 0, vy: 0, life: 0, max_life: 0, node, active: false });
    }
};

const seed_stars = () => {
    const total = 42;
    for (let i = 0; i < total; i++) {
        const layer = i % 3;
        const size = layer == 0 ? 2 : layer == 1 ? 3 : 4;
        const speed = layer == 0 ? 10 : layer == 1 ? 18 : 26;
        const parallax = layer == 0 ? 0.2 : layer == 1 ? 0.35 : 0.55;
        const alpha = layer == 0 ? 120 : layer == 1 ? 170 : 210;
        add_star(Math.random() * world_length, 60 + Math.random() * 360, size, speed, parallax, alpha);
    }
};

seed_stars();
seed_auroras();
seed_particles();
seed_void_particles();
seed_float_texts();

add_platform(0, 620, 780, 48);
add_platform(860, 560, 320, 36);
add_platform(1260, 500, 280, 32);
add_platform(1660, 430, 260, 32);
add_platform(2000, 520, 320, 36);
add_platform(2420, 460, 300, 32);
add_platform(2820, 380, 260, 32);
add_platform(3120, 440, 280, 32);
add_platform(3440, 360, 260, 32);
const last_platform = add_platform(3740, 320, 320, 36);

add_enemy(platforms[1]!, 80);
add_enemy(platforms[3]!, 120, true);
add_enemy(platforms[5]!, 140);
add_enemy(platforms[7]!, 120);
add_enemy(platforms[8]!, 80, true);

const player = create_image({ src: cat_img, w: 48, h: 48 });
player.style.border_radius(10);
player.style.border(2, color(40, 60, 90));
player.style.background_color(color(20, 20, 24));

game_view.add_children(player);

const goal = create_box({ w: 50, h: 80, bg: color(200, 200, 200) });
goal.style.background_color(color(200, 200, 200));
goal.style.border_radius(0);

game_view.add_children(goal);

const goal_label = create_text({ text: "GOAL", font: "Arial", size: 14, color: color(30, 25, 15) });

game_view.add_children(goal_label);

const info_overlay = create_free({ w: 260, h: 120 });
info_overlay.style.background_color(color(0, 0, 0, 0));
const hud_panel = create_flex({ w: 260, h: 120, direction: "column", wrap: false, gap: 6 });
hud_panel.style.background_color(color(32, 32, 32, 230));
hud_panel.style.border(1, color(60, 60, 60));
hud_panel.style.border_radius(6);
hud_panel.style.padding(10);
info_overlay.add_children(hud_panel);
game_view.add_children(info_overlay);

const hud_title = create_text({ text: "CAT PLATFORMER", font: "Arial", size: 14, color: color(230, 230, 230) });
const lives_text = create_text({ text: "Lives: 3", font: "Arial", size: 12, color: color(200, 200, 200) });
const progress_text = create_text({ text: "Progress: 0%", font: "Arial", size: 12, color: color(180, 180, 180) });
const fps_text = create_text({ text: "FPS: 0", font: "Arial", size: 11, color: color(150, 150, 150) });
const frame_text = create_text({ text: "Frame: 0ms", font: "Arial", size: 11, color: color(140, 140, 140) });
const hint_text = create_text({
    text: "Move: A/D or arrows | Jump: Space | Pause: Esc",
    font: "Arial",
    size: 11,
    color: color(140, 140, 140)
});

const energy_bar = create_box({ w: 220, h: 10, bg: color(150, 150, 150), radius: 6 });
const energy_bar_bg = create_box({ w: 220, h: 10, bg: color(20, 20, 20), radius: 6, border: 1, border_color: color(70, 70, 70) });

const energy_wrap = create_free({ w: 220, h: 14 });
energy_wrap.style.background_color(color(0, 0, 0, 0));
energy_wrap.style.border_radius(6);
energy_wrap.add_children(energy_bar_bg, energy_bar);

hud_panel.add_children(hud_title, lives_text, progress_text, fps_text, frame_text, energy_wrap, hint_text);

const menu_overlay = create_free({ w: 1200, h: 800 });
menu_overlay.style.background_color(color(0, 0, 0, 170));
menu_overlay.style.z_index(1000);
menu_overlay.set_visible(false);

const menu_panel = create_flex({ w: 340, h: 230, direction: "column", align: "center", justify: "center", wrap: false, gap: 12 });
menu_panel.style.background_color(color(38, 38, 38));
menu_panel.style.border(2, color(90, 90, 90));
menu_panel.style.border_radius(12);
menu_panel.style.padding(18);

const menu_title = create_text({ text: "", font: "Arial", size: 18, color: color(230, 230, 230) });
const menu_hint = create_text({ text: "", font: "Arial", size: 12, color: color(170, 170, 170) });
menu_hint.set_visible(false);

const menu_button_primary = create_button({ text: "" });
const menu_button_secondary = create_button({ text: "" });
const menu_buttons = [menu_button_primary, menu_button_secondary];

menu_panel.add_children(menu_title, menu_hint, menu_button_primary, menu_button_secondary);
menu_overlay.add_children(menu_panel);
game_view.add_children(menu_overlay);

const set_menu = (options: { title: string; hint?: string; buttons: string[] }) => {
    menu_title.set_text(options.title);

    if (options.hint) {
        menu_hint.set_visible(true);
        menu_hint.set_text(options.hint);
    } else {
        menu_hint.set_visible(false);
        menu_hint.set_text("");
    }

    for (let i = 0; i < menu_buttons.length; i++) {
        const label = options.buttons[i];
        const btn = menu_buttons[i]!;
        if (label) {
            btn.set_visible(true);
            btn.set_text(label);
        } else {
            btn.set_visible(false);
            btn.set_text("");
        }
    }
};

const resume_button = menu_button_primary;
const restart_button = menu_button_primary;
const retry_button = menu_button_primary;
const win_hint = menu_hint;

const player_state = {
    x: 80,
    y: 520,
    w: 48,
    h: 48,
    vx: 0,
    vy: 0,
    grounded: false,
    lives: 3,
    invuln: 0
};

const physics = {
    gravity: 1800,
    move_speed: 240,
    jump_speed: 620
};

let camera_x = 0;
let paused = false;
let won = false;
let game_over = false;
let escape_down = false;
let jump_down = false;
let screen_shake = 0;
let screen_shake_dir = 1;
let shake_x = 0;
let shake_y = 0;
let win_timer = 0;
let accumulator = 0;
const fixed_step = 1 / 60;

const set_paused = (value: boolean) => {
    if (paused === value) return;
    paused = value;
    if (paused) {
        set_menu({ title: "Paused", buttons: ["Resume"] });
        menu_overlay.set_visible(true);
    } else {
        menu_overlay.set_visible(false);
    }
};

const reset_enemies = () => {
    for (const enemy of enemies) {
        enemy.x = enemy.start_x;
        enemy.y = enemy.start_y;
        enemy.vx = enemy.base_vx;
        enemy.alive = true;
        enemy.hp = enemy.max_hp;
        enemy.rainbow_phase = Math.random() * Math.PI * 2;
        if (!enemy.node.parent) {
            game_view.add_children(enemy.node);
        }
        enemy.node.set_visible(true);
    }
};

const reset_player = (reset_lives: boolean) => {
    player_state.x = 80;
    player_state.y = 520;
    player_state.vx = 0;
    player_state.vy = 0;
    player_state.grounded = false;
    player_state.invuln = 0;
    camera_x = 0;

    if (reset_lives) {
        player_state.lives = 3;
        reset_enemies();
    }
};

const restart_game = () => {
    won = false;
    game_over = false;
    set_paused(false);
    menu_overlay.set_visible(false);
    reset_player(true);
    win_timer = 0;
};

resume_button.on_click(() => set_paused(false));
restart_button.on_click(() => restart_game());
retry_button.on_click(() => restart_game());

const aabb = (ax: number, ay: number, aw: number, ah: number, bx: number, by: number, bw: number, bh: number) =>
    ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;

const emit_particles = (x: number, y: number, count: number, speed: number, spread: number, tint: { r: number; g: number; b: number }) => {
    let spawned = 0;
    for (const p of particles) {
        if (spawned >= count) break;
        if (p.active) continue;
        p.active = true;
        p.life = 0.6 + Math.random() * 0.4;
        p.max_life = p.life;
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * spread;
        p.vx = Math.cos(angle) * speed * (0.5 + Math.random());
        p.vy = Math.sin(angle) * speed * (0.5 + Math.random());
        p.x = x;
        p.y = y;
        p.node.set_visible(true);
        p.node.style.background_color(color(tint.r, tint.g, tint.b, 220));
        spawned++;
    }
};

const emit_void_particle = (x: number, y: number) => {
    for (const p of void_particles) {
        if (p.active) continue;
        p.active = true;
        p.life = 1.2 + Math.random() * 0.6;
        p.max_life = p.life;
        p.vx = (Math.random() - 0.5) * 30;
        p.vy = -80 - Math.random() * 80;
        p.x = x;
        p.y = y;
        p.node.set_visible(true);
        p.node.style.background_color(color(120, 150, 200, 180));
        return;
    }
};

const emit_float_text = (x: number, y: number, text: string, tint: { r: number; g: number; b: number }) => {
    for (const f of float_texts) {
        if (f.active) continue;
        f.active = true;
        f.life = 0.8 + Math.random() * 0.3;
        f.max_life = f.life;
        f.vx = (Math.random() - 0.5) * 20;
        f.vy = -40 - Math.random() * 30;
        f.x = x;
        f.y = y;
        f.node.set_text(text);
        f.node.style.font("Arial", 12, color(tint.r, tint.g, tint.b));
        f.node.set_visible(true);
        return;
    }
};

const update_hud = (bounds: { x: number; y: number; w: number; h: number }) => {
    info_overlay.set_position(bounds.x + 16, bounds.y + 16);

    lives_text.set_text(`Lives: ${player_state.lives}`);

    const goal_x = last_platform.x + last_platform.w - 20;
    const progress = clamp(Math.round(((player_state.x + player_state.w) / goal_x) * 100), 0, 100);
    progress_text.set_text(`Progress: ${progress}%`);
    fps_text.set_text(`FPS: ${ui.fps}`);
    frame_text.set_text(`Frame: ${(ui.delta_time * 1000).toFixed(1)}ms`);

    const energy = clamp((player_state.lives / 3) * 1.0, 0, 1);
    energy_bar.set_size(220 * energy, 10);
    const pulse = 0.6 + Math.abs(Math.sin(Date.now() / 400)) * 0.4;
    energy_bar.style.background_color(color(120 + 40 * pulse, 140 + 30 * energy, 160, 230));
};

const update_overlays = (bounds: { x: number; y: number; w: number; h: number }) => {
    if (menu_overlay.w !== bounds.w || menu_overlay.h !== bounds.h) {
        menu_overlay.set_size(bounds.w, bounds.h);
    }
    menu_overlay.set_position(bounds.x, bounds.y);

    const x = snap(bounds.x + (bounds.w - menu_panel.w) / 2);
    const y = snap(bounds.y + (bounds.h - menu_panel.h) / 2);
    menu_panel.set_position(x, y);
};

const update_world_nodes = (bounds: { x: number; y: number; w: number; h: number }) => {
    const view_w = bounds.w;
    camera_x = clamp(player_state.x - view_w * 0.4, 0, Math.max(0, world_length - view_w));

    const place_node = (node: BoxWidget | ImageWidget | TextWidget, wx: number, wy: number) => {
        const next_x = snap(bounds.x + wx - camera_x + shake_x);
        const next_y = snap(bounds.y + wy + shake_y);
        node.set_position(next_x, next_y);
    };

    for (const star of stars) {
        const star_x = star.x - camera_x * star.parallax;
        place_node(star.node, star_x, star.y);
    }

    for (const aurora of auroras) {
        const aurora_x = aurora.x - camera_x * 0.15;
        place_node(aurora.node, aurora_x, aurora.y);
    }

    for (const platform of platforms) {
        place_node(platform.node, platform.x, platform.y);
    }

    for (const enemy of enemies) {
        if (!enemy.alive) continue;
        place_node(enemy.node, enemy.x, enemy.y);
    }

    place_node(player, player_state.x, player_state.y);

    const goal_x = last_platform.x + last_platform.w - 40;
    const goal_y = last_platform.y - 70;
    place_node(goal, goal_x, goal_y);
    place_node(goal_label, goal_x + 6, goal_y + 26);

    for (const p of particles) {
        if (!p.active) continue;
        place_node(p.node, p.x, p.y);
    }

    for (const f of float_texts) {
        if (!f.active) continue;
        place_node(f.node, f.x, f.y);
    }

    for (const p of void_particles) {
        if (!p.active) continue;
        place_node(p.node, p.x, p.y);
    }
};

game_view.on("update", (node: any, dt: number = 0) => {
    if (!node || !node.get_input_state) return;

    const input = node.get_input_state();
    const screen = input.screen;
    const bounds = game_view.get_content_bounds();

    const escape_now = input.keys.has("Escape");
    if (escape_now && !escape_down && !won && !game_over) {
        set_paused(!paused);
    }
    escape_down = escape_now;

    game_view.mark_dirty();
    update_hud(bounds);
    update_overlays(bounds);

    if (paused) {
        update_world_nodes(bounds);
        return;
    }

    if (won || game_over) {
        if (won && win_timer > 0) {
            win_timer = Math.max(0, win_timer - dt);
            win_hint.set_text(`Returning to start in ${Math.ceil(win_timer)}s`);
            if (win_timer === 0) {
                restart_game();
            }
        }
        update_world_nodes(bounds);
        return;
    }

    const left = input.keys.has("ArrowLeft") || input.keys.has("KeyA");
    const right = input.keys.has("ArrowRight") || input.keys.has("KeyD");
    const jump = input.keys.has("Space") || input.keys.has("ArrowUp") || input.keys.has("KeyW");
    const jump_pressed = jump && !jump_down;

    if (player_state.invuln > 0) {
        player_state.invuln = Math.max(0, player_state.invuln - dt);
    }

    accumulator = Math.min(accumulator + dt, 0.2);
    let jump_used = false;

    // fixed-step loop keeps physics consistent regardless of render rate
    while (accumulator >= fixed_step) {
        player_state.vx = 0;
        if (left) player_state.vx -= physics.move_speed;
        if (right) player_state.vx += physics.move_speed;

        if (jump_pressed && player_state.grounded && !jump_used) {
            player_state.vy = -physics.jump_speed;
            player_state.grounded = false;
            emit_particles(player_state.x + player_state.w * 0.5, player_state.y + player_state.h, 12, 220, Math.PI / 2, {
                r: 200,
                g: 210,
                b: 230
            });
            jump_used = true;
        }

        player_state.vy += physics.gravity * fixed_step;

        const prev_y = player_state.y;

        player_state.x += player_state.vx * fixed_step;

        for (const platform of platforms) {
            if (aabb(player_state.x, player_state.y, player_state.w, player_state.h, platform.x, platform.y, platform.w, platform.h)) {
                if (player_state.vx > 0) {
                    player_state.x = platform.x - player_state.w;
                } else if (player_state.vx < 0) {
                    player_state.x = platform.x + platform.w;
                }
            }
        }

        player_state.y += player_state.vy * fixed_step;
        player_state.grounded = false;

        for (const platform of platforms) {
            if (aabb(player_state.x, player_state.y, player_state.w, player_state.h, platform.x, platform.y, platform.w, platform.h)) {
                if (player_state.vy > 0) {
                    const impact = player_state.vy;
                    player_state.y = platform.y - player_state.h;
                    player_state.vy = 0;
                    player_state.grounded = true;
                    if (impact > 520) {
                        emit_particles(player_state.x + player_state.w * 0.5, player_state.y + player_state.h, 18, 260, Math.PI / 1.2, {
                            r: 255,
                            g: 220,
                            b: 150
                        });
                        screen_shake = 0.18;
                    }
                } else if (player_state.vy < 0) {
                    player_state.y = platform.y + platform.h;
                    player_state.vy = 0;
                }
            }
        }

        for (const enemy of enemies) {
            if (!enemy.alive) continue;

            if (enemy.rainbow) {
                enemy.rainbow_phase += fixed_step * 4;
                enemy.node.style.background_color(rainbow(enemy.rainbow_phase));
            }

            enemy.x += enemy.vx * fixed_step;
            if (enemy.x <= enemy.min_x) {
                enemy.x = enemy.min_x;
                enemy.vx = Math.abs(enemy.vx);
            } else if (enemy.x >= enemy.max_x) {
                enemy.x = enemy.max_x;
                enemy.vx = -Math.abs(enemy.vx);
            }

            const hit = aabb(player_state.x, player_state.y, player_state.w, player_state.h, enemy.x, enemy.y, enemy.w, enemy.h);
            if (!hit) continue;

            const player_was_above = prev_y + player_state.h <= enemy.y + 8;
            if (player_state.vy > 0 && player_was_above) {
                enemy.hp -= 1;
                player_state.vy = -physics.jump_speed * 0.6;
                emit_float_text(enemy.x + enemy.w * 0.5, enemy.y - 10, "-1", { r: 220, g: 200, b: 180 });
                emit_particles(enemy.x + enemy.w * 0.5, enemy.y + enemy.h * 0.5, 10, 220, Math.PI, {
                    r: 210,
                    g: 200,
                    b: 180
                });
                if (enemy.hp <= 0) {
                    enemy.alive = false;
                    game_view.remove(enemy.node.id);
                    emit_particles(enemy.x + enemy.w * 0.5, enemy.y + enemy.h * 0.5, 20, 260, Math.PI, {
                        r: 255,
                        g: 180,
                        b: 120
                    });
                }
                continue;
            }

            if (player_state.invuln <= 0) {
                player_state.lives -= 1;
                player_state.invuln = 1.0;
                reset_player(false);

                if (player_state.lives <= 0) {
                    game_over = true;
                    set_menu({ title: "Game over", buttons: ["Try again"] });
                    menu_overlay.set_visible(true);
                }
            }
        }

        if (player_state.y > 900) {
            if (player_state.invuln <= 0) {
                player_state.lives -= 1;
                player_state.invuln = 1.0;
                reset_player(false);

                if (player_state.lives <= 0) {
                    game_over = true;
                    set_menu({ title: "Game over", buttons: ["Try again"] });
                    menu_overlay.set_visible(true);
                }
            }
        }

        const goal_x = last_platform.x + last_platform.w - 40;
        const goal_y = last_platform.y - 70;
        if (aabb(player_state.x, player_state.y, player_state.w, player_state.h, goal_x, goal_y, goal.w, goal.h)) {
            won = true;
            set_menu({ title: "You made it!", hint: "Returning to start in 3s", buttons: ["Back to start"] });
            menu_overlay.set_visible(true);
            win_timer = 3;
        }

        for (const star of stars) {
            star.x -= star.speed * fixed_step;
            if (star.x < 0) {
                star.x += world_length;
            }
        }

        for (const aurora of auroras) {
            aurora.x -= aurora.speed * fixed_step;
            if (aurora.x + aurora.w < 0) {
                aurora.x = world_length + Math.random() * 200;
            }
        }

        const void_rate = 1.2;
        if (Math.random() < void_rate * fixed_step) {
            const void_y = 760 + Math.random() * 120;
            const void_x = camera_x + Math.random() * (bounds.w + 200) - 100;
            emit_void_particle(void_x, void_y);
        }

        for (const p of particles) {
            if (!p.active) continue;
            p.life -= fixed_step;
            p.vy += 520 * fixed_step;
            p.x += p.vx * fixed_step;
            p.y += p.vy * fixed_step;
            if (p.life <= 0) {
                p.active = false;
                p.node.set_visible(false);
                continue;
            }
            const alpha = Math.round(200 * (p.life / p.max_life));
            p.node.style.background_color(color(250, 210, 160, alpha));
        }

        for (const p of void_particles) {
            if (!p.active) continue;
            p.life -= fixed_step;
            p.y += p.vy * fixed_step;
            p.x += p.vx * fixed_step;
            if (p.life <= 0) {
                p.active = false;
                p.node.set_visible(false);
                continue;
            }
            const alpha = Math.round(140 * (p.life / p.max_life));
            p.node.style.background_color(color(120, 150, 200, alpha));
        }

        for (const f of float_texts) {
            if (!f.active) continue;
            f.life -= fixed_step;
            f.x += f.vx * fixed_step;
            f.y += f.vy * fixed_step;
            if (f.life <= 0) {
                f.active = false;
                f.node.set_visible(false);
                continue;
            }
            const alpha = Math.round(200 * (f.life / f.max_life));
            f.node.style.font("Arial", 12, color(220, 200, 180, alpha));
        }

        accumulator -= fixed_step;
    }

    if (screen_shake > 0) {
        screen_shake = Math.max(0, screen_shake - dt);
        screen_shake_dir *= -1;
        const shake = screen_shake * 10 * screen_shake_dir;
        shake_x = shake;
        shake_y = -shake;
    } else {
        shake_x = 0;
        shake_y = 0;
    }

    update_world_nodes(bounds);
    jump_down = jump;
});

const render_loop = (time: number) => {
    ui.render(time);
    requestAnimationFrame(render_loop);
};

requestAnimationFrame(render_loop);
