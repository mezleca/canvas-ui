export interface vec2d {
    x: number;
    y: number;
}

export const clamp = (value: number, min: number, max: number): number => {
    return Math.max(min, Math.min(value, max));
};
