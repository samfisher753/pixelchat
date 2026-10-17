import {
    AmbientLight, BoxGeometry, CanvasTexture, Color, ColorManagement, DirectionalLight, Group, LinearSRGBColorSpace,
    Material, Mesh, MeshBasicMaterial, MeshLambertMaterial, NearestFilter, OrthographicCamera, Scene, Vector3, WebGLRenderer,
} from "three";
import { PlayerAnimations } from "@/types/PlayerAnimations";
import { Look, serializeLook } from "./Look";

// Genera en el navegador los sprites de un avatar a partir de su aspecto (Look):
// un muñeco de cajas en 3D fotografiado en isométrico 2:1, del mismo tamaño y en el
// mismo formato que las imágenes que antes se pedían a habbo.es.

export type AvatarAnim = 'stand' | 'walk' | 'sit' | 'wave';

const SW = 64;                      // ancho del sprite
const SH = 112;                     // alto del sprite
const FOOT = 100;                   // altura de los pies dentro del sprite (Player.ts dibuja en y-84 = centro de la casilla - 100)
const SIT_LIFT = 15;                // Player.drawSit baja el sprite 15 px (lo necesitaban los de Habbo); aquí se compensa
const PPU = 64 / Math.SQRT2;        // una casilla mide 64 px de ancho en pantalla
const OUTLINE: [number, number, number] = [22, 17, 36];
// Todos los sprites de una tanda se dibujan en una sola imagen (atlas) y se leen de la GPU de una vez:
// cada lectura obliga a esperar a la GPU, y hacer dos por sprite (imagen y máscara de la cara) era lo más lento.
const ATLAS_COLS = 16;
const ATLAS_ROWS = 9;
const ATLAS_SLOTS = ATLAS_COLS * ATLAS_ROWS;

// Mismo orden que espera Player.ts: índice 0 = dirección 6 de Habbo
const DIRS8 = [6, 7, 0, 1, 2, 3, 4, 5];
const DIRS_SIT = [6, 0, 2, 4];
const SHEET: { anim: AvatarAnim; dirs: number[]; frames: (i: number) => number }[] = [
    { anim: 'stand', dirs: DIRS8, frames: i => (i < 3 ? 1 : 2) },
    { anim: 'walk', dirs: DIRS8, frames: () => 4 },
    { anim: 'sit', dirs: DIRS_SIT, frames: i => (i < 2 ? 1 : 2) },
    { anim: 'wave', dirs: DIRS8, frames: () => 2 },
];

// ---------- Color ----------
const hexToRgb = (h: string): [number, number, number] => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
const rgbToHex = (c: number[]): string => '#' + c.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const mix = (a: string, b: string, t: number): string => { const A = hexToRgb(a), B = hexToRgb(b); return rgbToHex(A.map((v, i) => v + (B[i] - v) * t)); };
const shade = (a: string, t: number): string => (t < 0 ? mix(a, '#000000', -t) : mix(a, '#ffffff', t));
const lum = (a: string): number => { const [r, g, b] = hexToRgb(a); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };

// ---------- Rasgos de la cara ----------
// Ojos, boca, cejas y mejillas son dibujos fijos en píxeles de pantalla que se colocan donde
// cae cada punto de la cara. Así los dos ojos miden siempre lo mismo, se mire desde donde se mire.
const GLYPH = {
    eye: ['XXw', 'XXX', 'XXX', 'XXX'],
    eyeBig: ['XXw', 'XXX', 'XXX', 'XXX', 'XXX'],
    eyeShut: ['...', '...', '...', 'XXX'],
    eyeHappy: ['...', '.X.', 'X.X', '...'],
    mouth: {
        normal: ['mmm'], feliz: ['m...m', '.mmm.'], guino: ['m...m', '.mmm.'],
        sorpresa: ['.mm.', 'm..m', '.mm.'], triste: ['.mmm.', 'm...m'], enfadado: ['mmmm'],
    },
    browSadL: ['..bb', 'bb..'], browSadR: ['bb..', '..bb'],
    browAngryL: ['bb..', '..bb'], browAngryR: ['..bb', 'bb..'],
    blush: ['pp'],
};
// Dónde va cada rasgo, en coordenadas de una cara de 16×16
const ANCHOR = {
    eyeL: [5, 8.5], eyeR: [11, 8.5], mouth: [8, 12.75], browL: [4.5, 5.5], browR: [11.5, 5.5], cheekL: [2.5, 11.5], cheekR: [13.5, 11.5],
} satisfies Record<string, [number, number]>;
type Anchors = Record<keyof typeof ANCHOR, [number, number]>;

// ---------- Cuerpo (en casillas) ----------
const HS = 0.5;                     // lado de la cabeza
const HEAD_BOTTOM = 1.42;
const HEAD_TOP = HEAD_BOTTOM + HS;
const LEG_H = 0.72;
const THIGH = LEG_H / 2;            // la rodilla está a media pierna
const SIT_BACK = 0.25;              // al sentarse, la cadera se echa un cuarto de casilla hacia atrás

type Limb = Group;
type Leg = { hip: Group; knee: Group };
// root gira el muñeco; body lo desplaza (al sentarse se echa hacia atrás dentro de la casilla)
type Rig = { root: Group; body: Group; head: Mesh; front: Material; armL: Limb; armR: Limb; legL: Leg; legR: Leg };
type SpriteJob = { anim: AvatarAnim; frame: number; dir: number };
type Rendered = { job: SpriteJob; blink: boolean; anchors: Anchors };

class AvatarRenderer {

    private renderer: WebGLRenderer | null = null;
    private scene!: Scene;
    private camera!: OrthographicCamera;
    private rig: Rig | null = null;
    private rigKey = '';
    private readonly faceKey = new MeshBasicMaterial({ color: 0xff00ff });
    private readonly atlasCtx: CanvasRenderingContext2D;
    private readonly tmp = new Vector3();
    // Las generaciones van de una en una porque comparten el mismo muñeco 3D
    private queue: Promise<unknown> = Promise.resolve();

    constructor() {
        const c = document.createElement('canvas');
        c.width = ATLAS_COLS * SW;
        c.height = ATLAS_ROWS * SH;
        this.atlasCtx = c.getContext('2d', { willReadFrequently: true })!;
    }

    // Genera todas las animaciones repartiendo el trabajo en varios fotogramas para no
    // congelar el juego. Si hay varios avatares pendientes, se generan por turnos.
    buildAnimations(look: Look): Promise<PlayerAnimations> {
        const job = this.queue.then(() => this.build(look));
        this.queue = job.catch(() => undefined);
        return job;
    }

    private async build(look: Look): Promise<PlayerAnimations> {
        const jobs: SpriteJob[] = [];
        for (const block of SHEET) {
            block.dirs.forEach((dir, i) => {
                for (let frame = 0; frame < block.frames(i); frame++) jobs.push({ anim: block.anim, frame, dir });
            });
        }
        const sprites: HTMLCanvasElement[] = [];
        const perBatch = ATLAS_SLOTS / 2;                  // cada sprite ocupa dos huecos: imagen y máscara
        for (let start = 0; start < jobs.length; start += perBatch) {
            sprites.push(...await this.renderBatch(look, jobs.slice(start, start + perBatch)));
        }

        const anims: Record<string, HTMLCanvasElement[][]> = {};
        let k = 0;
        for (const block of SHEET) {
            anims[block.anim] = block.dirs.map((_, i) => sprites.slice(k, k += block.frames(i)));
        }
        return { loaded: true, ...anims } as unknown as PlayerAnimations;
    }

    // Un sprite de 64×112. `dir` usa la numeración de direcciones de Habbo (3 = de frente).
    renderSprite(look: Look, anim: AvatarAnim, frame: number, dir: number): Promise<HTMLCanvasElement> {
        const job = this.queue.then(async () => (await this.renderBatch(look, [{ anim, frame, dir }]))[0]);
        this.queue = job.catch(() => undefined);
        return job;
    }

    private async renderBatch(look: Look, jobs: SpriteJob[]): Promise<HTMLCanvasElement[]> {
        this.init();
        const key = serializeLook(look);
        if (this.rigKey !== key) {
            this.buildRig(look);
            this.rigKey = key;
        }
        const renderer = this.renderer!, rig = this.rig!;

        renderer.setScissorTest(false);
        renderer.clear();
        renderer.setScissorTest(true);
        const rendered: Rendered[] = jobs.map((job, i) => {
            const blink = this.pose(job.anim, job.frame);
            rig.root.rotation.y = (4 - job.dir) * Math.PI / 4;
            rig.root.updateMatrixWorld(true);
            this.renderToSlot(2 * i);
            rig.head.material = this.headMaterials(rig, this.faceKey);
            this.renderToSlot(2 * i + 1);
            rig.head.material = this.headMaterials(rig, rig.front);
            const anchors = {} as Anchors;
            for (const name of Object.keys(ANCHOR) as (keyof typeof ANCHOR)[]) anchors[name] = this.faceAnchor(ANCHOR[name]);
            return { job, blink, anchors };
        });

        const used = Math.ceil((2 * jobs.length) / ATLAS_COLS);
        this.atlasCtx.clearRect(0, 0, ATLAS_COLS * SW, used * SH);
        this.atlasCtx.drawImage(renderer.domElement, 0, 0, ATLAS_COLS * SW, used * SH, 0, 0, ATLAS_COLS * SW, used * SH);
        const atlas = this.atlasCtx.getImageData(0, 0, ATLAS_COLS * SW, used * SH);

        const sprites: HTMLCanvasElement[] = [];
        let sliceStart = performance.now();
        for (let i = 0; i < rendered.length; i++) {
            const { job, blink, anchors } = rendered[i];
            sprites.push(this.post(look, slot(atlas, 2 * i), slot(atlas, 2 * i + 1), anchors, blink, job.anim === 'sit' ? SIT_LIFT : 0));
            if (performance.now() - sliceStart > 8) {
                await new Promise(r => setTimeout(r, 0));
                sliceStart = performance.now();
            }
        }
        return sprites;
    }

    // Dibuja la escena en un hueco del atlas (WebGL cuenta las filas desde abajo)
    private renderToSlot(index: number): void {
        const x = (index % ATLAS_COLS) * SW, y = (ATLAS_ROWS - 1 - Math.floor(index / ATLAS_COLS)) * SH;
        this.renderer!.setViewport(x, y, SW, SH);
        this.renderer!.setScissor(x, y, SW, SH);
        this.renderer!.render(this.scene, this.camera);
    }

    private init(): void {
        if (this.renderer !== null) return;
        // Colores tal cual (sin gestión de color) para que el resultado coincida con los prototipos
        ColorManagement.enabled = false;
        const renderer = new WebGLRenderer({ antialias: false, alpha: true, preserveDrawingBuffer: true });
        renderer.outputColorSpace = LinearSRGBColorSpace;
        renderer.setPixelRatio(1);
        renderer.setSize(ATLAS_COLS * SW, ATLAS_ROWS * SH, false);
        renderer.setClearColor(0x000000, 0);
        this.renderer = renderer;

        this.scene = new Scene();
        // Las luces de three.js dividen entre π; se compensa para mantener la intensidad de los prototipos
        this.scene.add(new AmbientLight(0xffffff, 0.5 * Math.PI));
        const sun = new DirectionalLight(0xffffff, 0.6 * Math.PI);
        sun.position.set(0.4, 1.6, 1);
        this.scene.add(sun);

        this.camera = new OrthographicCamera(-32 / PPU, 32 / PPU, FOOT / PPU, -(SH - FOOT) / PPU, 0.1, 100);
        const pitch = Math.PI / 6, r = 20;     // 30° de inclinación = suelo 2:1
        this.camera.position.set(r * Math.cos(pitch) / Math.SQRT2, r * Math.sin(pitch), r * Math.cos(pitch) / Math.SQRT2);
        this.camera.lookAt(0, 0, 0);
        this.camera.updateMatrixWorld(true);
    }

    // ---------- Texturas ----------

    private tex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, mirror = false): CanvasTexture {
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        const g = c.getContext('2d')!;
        if (mirror) { g.translate(w, 0); g.scale(-1, 1); }
        draw(g);
        const t = new CanvasTexture(c);
        t.magFilter = NearestFilter;
        t.minFilter = NearestFilter;
        t.generateMipmaps = false;
        return t;
    }

    // Cabeza (8×8). En las caras laterales el frente queda a la izquierda.
    private paintHead(look: Look, face: 'front' | 'side' | 'top' | 'back', mirror = false): CanvasTexture {
        const hc = look.hairColor, H = look.hair, buzz = mix(look.hairColor, look.skin, 0.45);
        return this.tex(8, 8, g => {
            px(g, look.skin, 0, 0, 8, 8);
            if (face === 'top') px(g, H === 'rapado' || H === 'cresta' ? buzz : hc, 0, 0, 8, 8);
            if (face === 'back') {
                if (H === 'rapado' || H === 'cresta') px(g, buzz, 0, 0, 8, 4);
                else if (H === 'corto') px(g, hc, 0, 0, 8, 6);
                else px(g, hc, 0, 0, 8, 8);
            }
            if (face === 'side') {
                if (H === 'rapado' || H === 'cresta') px(g, buzz, 2, 0, 6, 3);
                else if (H === 'largo') { px(g, hc, 0, 0, 8, 3); px(g, hc, 2, 3, 6, 5); }
                else { px(g, hc, 1, 0, 7, 3); px(g, hc, 4, 3, 4, H === 'coleta' ? 4 : 3); }
                if (H !== 'largo') px(g, shade(look.skin, -0.12), 2, 4, 1, 2);
            }
            if (face === 'front') {
                if (H === 'corto' || H === 'coleta') { px(g, hc, 0, 0, 8, 2); px(g, hc, 0, 2, 1, 1); px(g, hc, 7, 2, 1, 1); }
                if (H === 'largo') { px(g, hc, 0, 0, 8, 2); px(g, hc, 0, 2, 1, 6); px(g, hc, 7, 2, 1, 6); }
                if (H === 'rapado' || H === 'cresta') px(g, buzz, 0, 0, 8, 1);
            }
            if (look.hat !== 'no') {
                if (face === 'top') px(g, look.hatColor, 0, 0, 8, 8);
                else px(g, look.hatColor, 0, 0, 8, look.hat === 'gorro' ? 3 : 2);
            }
        }, mirror);
    }

    // Torso (8×11)
    private paintTorso(look: Look, face: 'front' | 'side' | 'back', mirror = false): CanvasTexture {
        return this.tex(8, 11, g => {
            px(g, look.shirt, 0, 0, 8, 11);
            if (look.pattern === 'rayas') {
                const stripe = lum(look.shirt) > 0.6 ? shade(look.shirt, -0.35) : mix(look.shirt, '#ffffff', 0.55);
                for (let y = 2; y < 10; y += 3) px(g, stripe, 0, y, 8, 1);
            }
            if (face === 'front') {
                px(g, look.skin, 3, 0, 2, 1);
                px(g, shade(look.shirt, -0.2), 2, 0, 1, 1);
                px(g, shade(look.shirt, -0.2), 5, 0, 1, 1);
                if (look.pattern === 'logo') {
                    const c = lum(look.shirt) > 0.6 ? '#022f72' : '#ffffff';
                    px(g, c, 2, 3, 4, 3);
                    px(g, c, 2, 6, 1, 1);
                    px(g, look.shirt, 3, 4, 1, 1);
                    px(g, look.shirt, 4, 4, 1, 1);
                }
            }
            px(g, look.pants, 0, 10, 8, 1);
        }, mirror);
    }

    // ---------- Muñeco ----------

    private buildRig(look: Look): void {
        if (this.rig !== null) {
            this.scene.remove(this.rig.root);
            disposeTree(this.rig.root);
        }
        const M = (c: string) => new MeshLambertMaterial({ color: new Color(c) });
        const T = (t: CanvasTexture) => new MeshLambertMaterial({ map: t });
        const root = new Group();
        const body = new Group();
        root.add(body);

        const front = T(this.paintHead(look, 'front'));
        const head = new Mesh(new BoxGeometry(HS, HS, HS), [
            T(this.paintHead(look, 'side')), T(this.paintHead(look, 'side', true)), T(this.paintHead(look, 'top')),
            M(look.skin), front, T(this.paintHead(look, 'back')),
        ]);
        head.position.y = HEAD_BOTTOM + HS / 2;
        body.add(head);

        const add = (w: number, h: number, d: number, mat: Material | Material[], x: number, y: number, z: number): void => {
            const m = new Mesh(new BoxGeometry(w, h, d), mat);
            m.position.set(x, y, z);
            body.add(m);
        };
        const H = look.hair, hatOn = look.hat !== 'no';
        if (H === 'largo') add(HS, 0.62, 0.06, M(look.hairColor), 0, HEAD_TOP - 0.41, -(HS / 2 + 0.03));
        if (H === 'coleta') {
            add(0.14, 0.3, 0.12, M(look.hairColor), 0, HEAD_BOTTOM + 0.12, -(HS / 2 + 0.08));
            add(0.16, 0.05, 0.08, M(look.hatColor), 0, HEAD_BOTTOM + 0.3, -(HS / 2 + 0.05));
        }
        if (H === 'cresta' && !hatOn) add(0.12, 0.14, HS * 0.85, M(look.hairColor), 0, HEAD_TOP + 0.07, 0);
        if (look.hat === 'gorra') {
            add(HS + 0.05, 0.12, HS + 0.05, M(look.hatColor), 0, HEAD_TOP - 0.03, 0);
            add(HS * 0.8, 0.03, 0.2, M(shade(look.hatColor, -0.25)), 0, HEAD_TOP - 0.075, HS / 2 + 0.1);
        }
        if (look.hat === 'gorro') {
            add(HS + 0.06, 0.18, HS + 0.06, M(look.hatColor), 0, HEAD_TOP - 0.04, 0);
            add(0.12, 0.09, 0.12, M(shade(look.hatColor, 0.35)), 0, HEAD_TOP + 0.09, 0);
        }

        add(0.5, 0.7, 0.28, [
            T(this.paintTorso(look, 'side')), T(this.paintTorso(look, 'side', true)), M(look.shirt), M(look.pants),
            T(this.paintTorso(look, 'front')), T(this.paintTorso(look, 'back')),
        ], 0, LEG_H + 0.35, 0);

        if (look.acc === 'mochila') {
            add(0.36, 0.44, 0.14, M(look.accColor), 0, 1.06, -0.21);
            add(0.26, 0.14, 0.05, M(shade(look.accColor, -0.2)), 0, 0.95, -0.3);
            for (const x of [-0.13, 0.13]) add(0.05, 0.56, 0.02, M(shade(look.accColor, -0.25)), x, 1.12, 0.15);
        }
        if (look.acc === 'bufanda') {
            add(0.54, 0.1, 0.34, M(look.accColor), 0, 1.38, 0);
            add(0.1, 0.28, 0.03, M(shade(look.accColor, -0.12)), 0.11, 1.2, 0.17);
        }

        type Part = { w: number; h: number; d: number; mat: Material | Material[]; z?: number };
        const limb = (x: number, y: number, parts: Part[]): Limb => {
            const g = new Group();
            g.position.set(x, y, 0);
            let yy = 0;
            for (const p of parts) {
                const m = new Mesh(new BoxGeometry(p.w, p.h, p.d), p.mat);
                m.position.set(0, yy - p.h / 2, p.z ?? 0);
                g.add(m);
                yy -= p.h;
            }
            body.add(g);
            return g;
        };
        const armLen = 0.64, sleeve = look.sleeve === 'corta' ? 0.24 : armLen - 0.12;
        const arm = (x: number) => limb(x, HEAD_BOTTOM, [
            { w: 0.16, h: sleeve, d: 0.18, mat: M(look.shirt) },
            { w: 0.15, h: armLen - sleeve, d: 0.17, mat: M(look.skin) },
        ]);
        const shoeH = 0.14, pantsH = look.legs === 'largo' ? LEG_H - shoeH : 0.28, skinH = LEG_H - shoeH - pantsH;
        const shoe = M(look.shoes), sole = M(shade(look.shoes, -0.4));
        const legParts: Part[] = [
            { w: 0.22, h: pantsH, d: 0.24, mat: M(look.pants) },
            ...(skinH > 0 ? [{ w: 0.19, h: skinH, d: 0.21, mat: M(look.skin) }] : []),
            { w: 0.22, h: shoeH, d: 0.3, z: 0.03, mat: [shoe, shoe, shoe, sole, shoe, shoe] },
        ];
        // La pierna se parte en la rodilla: lo que queda por encima cuelga de la cadera y lo de debajo, de la rodilla
        const leg = (x: number): Leg => {
            const hip = new Group();
            hip.position.set(x, LEG_H, 0);
            const knee = new Group();
            knee.position.y = -THIGH;
            hip.add(knee);
            const piece = (parent: Group, p: Part, from: number, to: number, origin: number) => {
                if (to - from <= 1e-6) return;
                const m = new Mesh(new BoxGeometry(p.w, to - from, p.d), p.mat);
                m.position.set(0, origin - (from + to) / 2, p.z ?? 0);
                parent.add(m);
            };
            let top = 0;
            for (const p of legParts) {
                const from = top, to = top + p.h;
                piece(hip, p, from, Math.min(to, THIGH), 0);
                piece(knee, p, Math.max(from, THIGH), to, THIGH);
                top = to;
            }
            body.add(hip);
            return { hip, knee };
        };

        this.rig = { root, body, head, front, armL: arm(0.33), armR: arm(-0.33), legL: leg(0.125), legR: leg(-0.125) };
        this.scene.add(root);
    }

    // Coloca brazos y piernas. Devuelve si en este fotograma los ojos están cerrados.
    private pose(anim: AvatarAnim, frame: number): boolean {
        const r = this.rig!;
        for (const g of [r.armL, r.armR, r.legL.hip, r.legL.knee, r.legR.hip, r.legR.knee]) g.rotation.set(0, 0, 0);
        r.body.position.set(0, 0, 0);
        if (anim === 'walk') {
            const a = [0.5, 0, -0.5, 0][frame % 4];
            r.legL.hip.rotation.x = a;
            r.legR.hip.rotation.x = -a;
            // La pierna que queda atrás dobla un poco la rodilla
            r.legL.knee.rotation.x = a > 0 ? 0.45 : 0;
            r.legR.knee.rotation.x = a < 0 ? 0.45 : 0;
            r.armL.rotation.x = -a * 0.8;
            r.armR.rotation.x = a * 0.8;
            r.body.position.y = -(1 - Math.cos(a)) * LEG_H;
        }
        if (anim === 'sit') {
            // Sentado en el suelo con las rodillas hacia arriba y la cadera echada hacia atrás,
            // para que los pies no salgan de la casilla
            r.legL.hip.rotation.x = r.legR.hip.rotation.x = -(Math.PI / 2 + Math.PI / 6);
            r.legL.knee.rotation.x = r.legR.knee.rotation.x = 1.5;
            r.armL.rotation.x = r.armR.rotation.x = -0.6;
            r.body.position.set(0, 0.12 - LEG_H, -SIT_BACK);
        }
        if (anim === 'wave') {
            r.armR.rotation.z = frame % 2 ? -2.65 : -2.95;
            r.armR.rotation.x = -0.15;
        }
        return (anim === 'stand' || anim === 'sit') && frame === 1;
    }

    private headMaterials(rig: Rig, front: Material): Material[] {
        const mats = (rig.head.material as Material[]).slice();
        mats[4] = front;
        return mats;
    }

    // Posición en el sprite de un punto de la cara (coordenadas de una cara de 16×16)
    private faceAnchor([u, v]: [number, number]): [number, number] {
        this.tmp.set(-HS / 2 + (u / 16) * HS, HS / 2 - (v / 16) * HS, HS / 2)
            .applyMatrix4(this.rig!.head.matrixWorld)
            .project(this.camera);
        return [((this.tmp.x + 1) / 2) * SW, ((1 - this.tmp.y) / 2) * SH];
    }

    // Recorta la transparencia a 0/255, pinta la cara y añade un contorno de 1 px.
    // En la segunda imagen la cara se pintó en magenta: esos píxeles son la parte visible de la cara.
    private post(look: Look, image: ImageData, mask: ImageData, anchors: Anchors, blink: boolean, lift: number): HTMLCanvasElement {
        const d = image.data, m = mask.data;
        const solid = new Uint8Array(SW * SH), face = new Uint8Array(SW * SH);
        let faceSeen = false;
        for (let p = 0; p < SW * SH; p++) {
            const on = d[p * 4 + 3] >= 128;
            solid[p] = on ? 1 : 0;
            d[p * 4 + 3] = on ? 255 : 0;
            if (m[p * 4] === 255 && m[p * 4 + 1] === 0 && m[p * 4 + 2] === 255 && m[p * 4 + 3] === 255) {
                face[p] = 1;
                faceSeen = true;
            }
        }
        if (faceSeen) drawFeatures(look, d, face, anchors, blink);
        for (let y = 0; y < SH; y++) {
            for (let x = 0; x < SW; x++) {
                const p = y * SW + x;
                if (solid[p]) continue;
                if ((x > 0 && solid[p - 1]) || (x < SW - 1 && solid[p + 1]) || (y > 0 && solid[p - SW]) || (y < SH - 1 && solid[p + SW])) {
                    d[p * 4] = OUTLINE[0];
                    d[p * 4 + 1] = OUTLINE[1];
                    d[p * 4 + 2] = OUTLINE[2];
                    d[p * 4 + 3] = 255;
                }
            }
        }
        const c = document.createElement('canvas');
        c.width = SW;
        c.height = SH;
        c.getContext('2d')!.putImageData(image, 0, -lift);
        return c;
    }

}

// Copia un hueco del atlas a una imagen propia de 64×112
function slot(atlas: ImageData, index: number): ImageData {
    const out = new ImageData(SW, SH);
    const x0 = (index % ATLAS_COLS) * SW, y0 = Math.floor(index / ATLAS_COLS) * SH;
    for (let y = 0; y < SH; y++) {
        const from = ((y0 + y) * atlas.width + x0) * 4;
        out.data.set(atlas.data.subarray(from, from + SW * 4), y * SW * 4);
    }
    return out;
}

function px(g: CanvasRenderingContext2D, c: string, x: number, y: number, w: number, h: number): void {
    g.fillStyle = c;
    g.fillRect(x, y, w, h);
}

function disposeTree(obj: Group): void {
    obj.traverse(o => {
        if (!(o instanceof Mesh)) return;
        o.geometry.dispose();
        for (const mat of ([] as Material[]).concat(o.material)) {
            if (mat instanceof MeshLambertMaterial && mat.map) mat.map.dispose();
            mat.dispose();
        }
    });
}

function drawFeatures(look: Look, d: Uint8ClampedArray, face: Uint8Array, A: Anchors, blink: boolean): void {
    const E = look.face;
    const rgb: Record<string, [number, number, number]> = {
        X: hexToRgb('#1b1420'),
        w: hexToRgb('#ffffff'),
        m: hexToRgb(mix(shade(look.skin, -0.45), '#9c2f3c', 0.45)),
        b: hexToRgb(shade(look.hairColor, -0.15)),
        p: hexToRgb(mix(look.skin, '#ff5a6e', 0.35)),
    };
    const inside = (x: number, y: number) => x >= 0 && y >= 0 && x < SW && y < SH;
    // Un rasgo se dibuja entero si al menos la mitad cae sobre la parte visible de la cara;
    // así un ojo junto al borde no pierde píxeles y los dos quedan iguales.
    const stamp = (rows: string[], [ax, ay]: [number, number]): void => {
        const w = rows[0].length, h = rows.length, x0 = Math.round(ax - w / 2), y0 = Math.round(ay - h / 2);
        const pts: [number, number, string][] = [];
        rows.forEach((r, j) => [...r].forEach((ch, i) => { if (ch !== '.') pts.push([x0 + i, y0 + j, ch]); }));
        const onFace = pts.filter(([x, y]) => inside(x, y) && face[y * SW + x]).length;
        if (onFace * 2 < pts.length) return;
        for (const [x, y, ch] of pts) {
            if (!inside(x, y)) continue;
            const p = y * SW + x;
            if (d[p * 4 + 3] !== 255) continue;
            const c = rgb[ch];
            d[p * 4] = c[0];
            d[p * 4 + 1] = c[1];
            d[p * 4 + 2] = c[2];
        }
    };

    // Los ojos van los últimos para que nada los pise
    if (E === 'feliz' || E === 'guino') { stamp(GLYPH.blush, A.cheekL); stamp(GLYPH.blush, A.cheekR); }
    stamp(GLYPH.mouth[E], A.mouth);
    if (E === 'triste') { stamp(GLYPH.browSadL, A.browL); stamp(GLYPH.browSadR, A.browR); }
    if (E === 'enfadado') { stamp(GLYPH.browAngryL, A.browL); stamp(GLYPH.browAngryR, A.browR); }
    if (blink) { stamp(GLYPH.eyeShut, A.eyeL); stamp(GLYPH.eyeShut, A.eyeR); }
    else if (E === 'guino') { stamp(GLYPH.eye, A.eyeL); stamp(GLYPH.eyeHappy, A.eyeR); }
    else {
        const eye = E === 'sorpresa' ? GLYPH.eyeBig : GLYPH.eye;
        stamp(eye, A.eyeL);
        stamp(eye, A.eyeR);
    }
}

export const avatarRenderer = new AvatarRenderer();
