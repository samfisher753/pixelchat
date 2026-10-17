import { ImageCollection } from "@/types/ImageCollection";
import { PlayerAnimations, PlayerAnimationsCollection } from "@/types/PlayerAnimations";
import Player from "../entities/Player";
import { DEFAULT_AVATAR } from "@/constants/constants";
import { PlayerStatus } from "@/enums/PlayerStatus";
import { DEFAULT_LOOK, Look, parseLook } from "./avatar/Look";
import { avatarRenderer } from "./avatar/AvatarRenderer";

class Assets {

    images: ImageCollection;
    imgFiles: string[];
    avatars: PlayerAnimationsCollection;
    pendingAvatars: { [look: string]: Promise<PlayerAnimations> };
    // false si el navegador no puede generar avatares (sin WebGL): entonces todos usan la silueta base
    canGenerateAvatars: boolean;

    constructor() {
        this.images = {};
        this.imgFiles = [];
        this.avatars = {};
        this.pendingAvatars = {};
        this.canGenerateAvatars = true;
    }

    async load(): Promise<void> {
        this.fillFileArrays();
        await this.loadImages();
        // El avatar por defecto es el que se ve mientras se generan los demás y el de quien no tiene aspecto
        try {
            this.avatars[DEFAULT_AVATAR] = await avatarRenderer.buildAnimations(DEFAULT_LOOK);
        } catch (error) {
            console.warn('Este navegador no puede generar avatares (WebGL no disponible); se usa la silueta base.', error);
            this.canGenerateAvatars = false;
            this.avatars[DEFAULT_AVATAR] = await this.loadBaseCharacter();
        }
    }

    loadImages(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const promises: Promise<void>[] = [];
            for (const imgUrl of this.imgFiles) {
                const promise: Promise<void> = new Promise<void>((resolve2, reject2) => {
                    const tile: HTMLImageElement = new Image();
                    tile.crossOrigin = 'Anonymous';
                    tile.src = imgUrl
                    tile.onload = () => {
                        const s: string[] = tile.src.split('/');
                        const name: string = s[s.length-1].split('.')[0];
                        this.images[name] = tile;
                        resolve2();
                    };
                    tile.onerror = () => {
                        reject2();
                    };
                });
                promises.push(promise);
            }
            
            Promise.all(promises).then(() => {
                resolve();
            }).catch(() => {
                reject();
            });
        });
    }

    getImage(img: string): HTMLImageElement {
        return this.images[img];
    }

    getImgArray(player: string, status: PlayerStatus, direction: number){
        return this.avatars[player][status][direction];
    }

    fillFileArrays(): void {
        // Floors
        let path = '/assets/floor/';
        this.imgFiles.push(path+'grass.png');
        this.imgFiles.push(path+'default.png');

        path = '/assets/misc/';
        this.imgFiles.push(path+'shadow.png');
        this.imgFiles.push(path+'mouse-tile.png');
        this.imgFiles.push(path+'msg-pos.png');
    }

    // Genera los sprites del avatar en el navegador a partir de su cadena de aspecto. Si la cadena
    // no es un aspecto válido (vacía o un nombre antiguo de Habbo), se usa el avatar por defecto.
    async loadAvatarImages(lookString: string, player: Player | null): Promise<void> {
        const look: Look | null = parseLook(lookString);
        if (look === null || !this.canGenerateAvatars) {
            if (player !== null) player.images = this.avatars[DEFAULT_AVATAR];
            return;
        }
        if (!this.avatars[lookString]?.loaded) {
            this.pendingAvatars[lookString] ??= avatarRenderer.buildAnimations(look);
            try {
                this.avatars[lookString] = await this.pendingAvatars[lookString];
            } catch (error) {
                console.warn('No se pudo generar el avatar ' + lookString, error);
                this.avatars[lookString] = this.avatars[DEFAULT_AVATAR];
            } finally {
                delete this.pendingAvatars[lookString];
            }
        }
        if (player !== null) player.images = this.avatars[lookString];
    }

    // Silueta blanca dibujada a mano. Solo se usa si el navegador no puede generar avatares.
    async loadBaseCharacter(): Promise<PlayerAnimations> {
        const path = '/assets/character/';
        const eight = [0, 1, 2, 3, 4, 5, 6, 7];
        // Mismo orden que los avatares generados; donde se ve la cara se repite la imagen (no tiene parpadeo)
        const files: Record<string, string[][]> = {
            stand: eight.map(i => {
                const file = path + 'stand/bc-stand-' + i + '.png';
                return i < 3 ? [file] : [file, file];
            }),
            walk: eight.map(i => [0, 1, 2, 3].map(f => path + 'walk/bc-walk-' + i + '-' + f + '.png')),
            sit: [0, 2, 4, 6].map((d, i) => {
                const file = path + 'sit/bc-sit-' + d + '.png';
                return i < 2 ? [file] : [file, file];
            }),
            wave: eight.map(i => [0, 1].map(f => path + 'wave/bc-wave-' + i + '-' + f + '.png')),
        };
        const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('No se pudo cargar ' + src));
            img.src = src;
        });
        const anims: Record<string, unknown> = { loaded: true };
        await Promise.all(Object.entries(files).map(async ([status, dirs]) => {
            anims[status] = await Promise.all(dirs.map(frames => Promise.all(frames.map(loadImage))));
        }));
        return anims as unknown as PlayerAnimations;
    }

}

export const assets = new Assets();