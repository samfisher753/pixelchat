// Aspecto de los avatares propios de PixelChat. Se guarda en el campo `look` del usuario
// como una cadena de piezas separadas por puntos, por ejemplo:
// hd-ecb98f.hr-corto-4a2e1b.ha-no.ch-corta-logo-022f72.lg-largo-2a2d36.sh-f4f4f4.fc-normal.ac-no

export const HAIR_STYLES = ['corto', 'largo', 'coleta', 'cresta', 'rapado'] as const;
export const HATS = ['no', 'gorra', 'gorro'] as const;
export const SLEEVES = ['corta', 'larga'] as const;
export const PATTERNS = ['liso', 'rayas', 'logo'] as const;
export const LEGS = ['largo', 'corto'] as const;
export const FACES = ['normal', 'feliz', 'guino', 'sorpresa', 'triste', 'enfadado'] as const;
export const ACCESSORIES = ['no', 'mochila', 'bufanda'] as const;

export const SKIN_COLORS = ['#f6d5b8', '#ecb98f', '#d49b6b', '#ac7148', '#7d4b2d', '#4f301e'];
export const HAIR_COLORS = ['#1d1612', '#4a2e1b', '#8a5a2b', '#d9a54a', '#efe2b6', '#b3402b', '#9aa0a8', '#3a5fcf'];
export const CLOTH_COLORS = ['#f4f4f4', '#2a2d36', '#d23b3b', '#f08a24', '#f2c94c', '#3fa34d', '#2f80ed', '#022f72', '#8e44ad', '#e86fa8', '#7a5536', '#5bc0be'];

export type HairStyle = typeof HAIR_STYLES[number];
export type Hat = typeof HATS[number];
export type Sleeve = typeof SLEEVES[number];
export type Pattern = typeof PATTERNS[number];
export type Legs = typeof LEGS[number];
export type Face = typeof FACES[number];
export type Accessory = typeof ACCESSORIES[number];

export type Look = {
    skin: string;
    hair: HairStyle;
    hairColor: string;
    hat: Hat;
    hatColor: string;
    sleeve: Sleeve;
    pattern: Pattern;
    shirt: string;
    legs: Legs;
    pants: string;
    shoes: string;
    face: Face;
    acc: Accessory;
    accColor: string;
};

export const DEFAULT_LOOK: Look = {
    skin: SKIN_COLORS[1],
    hair: 'corto',
    hairColor: HAIR_COLORS[1],
    hat: 'no',
    hatColor: CLOTH_COLORS[2],
    sleeve: 'corta',
    pattern: 'logo',
    shirt: CLOTH_COLORS[7],
    legs: 'largo',
    pants: CLOTH_COLORS[1],
    shoes: CLOTH_COLORS[0],
    face: 'normal',
    acc: 'no',
    accColor: CLOTH_COLORS[4],
};

const HEX = /^[0-9a-f]{6}$/;

const hex = (c: string): string => c.slice(1).toLowerCase();

const oneOf = <T extends string>(list: readonly T[], value: string | undefined): T | null =>
    list.includes(value as T) ? value as T : null;

const color = (value: string | undefined): string | null =>
    value !== undefined && HEX.test(value) ? '#' + value : null;

export function serializeLook(look: Look): string {
    return [
        'hd-' + hex(look.skin),
        'hr-' + look.hair + '-' + hex(look.hairColor),
        'ha-' + look.hat + (look.hat !== 'no' ? '-' + hex(look.hatColor) : ''),
        'ch-' + look.sleeve + '-' + look.pattern + '-' + hex(look.shirt),
        'lg-' + look.legs + '-' + hex(look.pants),
        'sh-' + hex(look.shoes),
        'fc-' + look.face,
        'ac-' + look.acc + (look.acc !== 'no' ? '-' + hex(look.accColor) : ''),
    ].join('.');
}

// Devuelve null si la cadena no es un aspecto válido (por ejemplo, un nombre de Habbo antiguo).
export function parseLook(value: string | null | undefined): Look | null {
    if (!value) return null;
    const parts: Record<string, string[]> = {};
    for (const part of value.toLowerCase().split('.')) {
        const [key, ...rest] = part.split('-');
        parts[key] = rest;
    }
    const { hd, hr, ha, ch, lg, sh, fc, ac } = parts;
    if (!hd || !hr || !ha || !ch || !lg || !sh || !fc || !ac) return null;

    const hat = oneOf(HATS, ha[0]);
    const acc = oneOf(ACCESSORIES, ac[0]);
    const look = {
        skin: color(hd[0]),
        hair: oneOf(HAIR_STYLES, hr[0]),
        hairColor: color(hr[1]),
        hat,
        hatColor: hat === 'no' ? DEFAULT_LOOK.hatColor : color(ha[1]),
        sleeve: oneOf(SLEEVES, ch[0]),
        pattern: oneOf(PATTERNS, ch[1]),
        shirt: color(ch[2]),
        legs: oneOf(LEGS, lg[0]),
        pants: color(lg[1]),
        shoes: color(sh[0]),
        face: oneOf(FACES, fc[0]),
        acc,
        accColor: acc === 'no' ? DEFAULT_LOOK.accColor : color(ac[1]),
    };
    if (Object.values(look).some(v => v === null)) return null;
    return look as Look;
}

export function randomLook(): Look {
    const pick = <T>(list: readonly T[]): T => list[Math.floor(Math.random() * list.length)];
    return {
        skin: pick(SKIN_COLORS),
        hair: pick(HAIR_STYLES),
        hairColor: pick(HAIR_COLORS),
        hat: pick(['no', 'no', 'gorra', 'gorro'] as const),
        hatColor: pick(CLOTH_COLORS),
        sleeve: pick(SLEEVES),
        pattern: pick(PATTERNS),
        shirt: pick(CLOTH_COLORS),
        legs: pick(LEGS),
        pants: pick(CLOTH_COLORS),
        shoes: pick(CLOTH_COLORS),
        face: pick(FACES),
        acc: pick(['no', 'no', 'mochila', 'bufanda'] as const),
        accColor: pick(CLOTH_COLORS),
    };
}
