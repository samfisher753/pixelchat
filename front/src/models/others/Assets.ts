import { ImageCollection } from "@/types/ImageCollection";
import { PlayerAnimations, PlayerAnimationsCollection } from "@/types/PlayerAnimations";
import Player from "../entities/Player";
import { DEFAULT_AVATAR, DEFAULT_HABBO_AVATAR, AVATAR_API_URL } from "@/constants/constants";
import { PlayerStatus } from "@/enums/PlayerStatus";

class Assets {

    images: ImageCollection;
    imgFiles: string[];
    avatars: PlayerAnimationsCollection;

    constructor() {
        this.images = {};
        this.imgFiles = [];
        this.avatars = {};
    }
    
    async load(): Promise<void> {
        this.fillFileArrays();
        await this.loadImages();
        await this.loadAvatarImages(DEFAULT_HABBO_AVATAR, null);
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

    createPlayerAnimationsObject(): PlayerAnimations {
        return {
            loaded: false,
            stand: [[], [], [], [], [], [], [], []],
            walk: [[], [], [], [], [], [], [], []],
            sit: [[], [], [], []],
            wave: [[], [], [], [], [], [], [], []],
        };
    }

    getPreviewImage(avatarName: string): Promise<HTMLImageElement> {
        return new Promise<HTMLImageElement>((resolve, reject) => {
            const img: HTMLImageElement = new Image();
            img.crossOrigin = 'Anonymous';
            img.src = AVATAR_API_URL + '?hb=image&user='+avatarName+'&direction=4&head_direction=4';
            img.onload = () => {
                resolve(img);
            };
            img.onerror = () => {
                reject();
            };
        });
    }

    loadAvatarImages(avatarName: string, player: Player | null): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (!avatarName) {
                if (player !== null) player.images = this.avatars[DEFAULT_HABBO_AVATAR];
                resolve();
                return;
            }            
            this.avatars[avatarName] = this.createPlayerAnimationsObject();
            const av: PlayerAnimations = this.createAvatarFilesObject(avatarName);
            const promises: Promise<void>[] = [];
            for (const status in av){
                this.avatars[avatarName][status] = [];
                let i = 0;
                for (const dir of av[status]){
                    this.avatars[avatarName][status].push([]);
                    for (const frame of dir){
                        const promise: Promise<void> = new Promise<void>((resolve2, reject2) => {
                            const img: HTMLImageElement = new Image();
                            img.crossOrigin = 'Anonymous';
                            img.src = frame;
                            img.onload = () => {
                                resolve2();
                            };
                            img.onerror = () => {
                                reject2();
                            };
                            this.avatars[avatarName][status][i].push(img);
                        });
                        promises.push(promise);
                    }
                    i++;
                }
            }
    
            Promise.all(promises).then(() => {
                this.avatars[avatarName].loaded = true;
                if (player !== null) player.images = this.avatars[avatarName];
                if (avatarName === DEFAULT_AVATAR && player === null) {
                    this.avatars[DEFAULT_HABBO_AVATAR] = this.avatars[DEFAULT_AVATAR];
                }
                resolve();
            }).catch(async () => {
                if (avatarName === DEFAULT_AVATAR) {
                    alert("Error al cargar los gráficos del personaje base.");
                } else if (avatarName === DEFAULT_HABBO_AVATAR) {
                    await this.loadAvatarImages(DEFAULT_AVATAR, null);
                    resolve();
                    return;
                } else {
                    this.avatars[avatarName] = this.avatars[DEFAULT_HABBO_AVATAR];
                }
                if (player !== null) player.images = this.avatars[avatarName];
                reject();
            });
        });
    }

    createAvatarFilesObject(playerName): PlayerAnimations {
        if (playerName.toLowerCase().includes("base")) {
            return this.createBaseCharacterFilesObject();
        }

        const av: any = {}; 

        av['stand'] = [
            [AVATAR_API_URL + '?hb=image&user='+playerName+'&direction=6&head_direction=6'],
            [AVATAR_API_URL + '?hb=image&user='+playerName+'&direction=7&head_direction=7'],
            [AVATAR_API_URL + '?hb=image&user='+playerName+'&direction=0&head_direction=0'],
            [AVATAR_API_URL + '?hb=image&user='+playerName+'&direction=1&head_direction=1',
             AVATAR_API_URL + '?hb=image&user='+playerName+'&direction=1&head_direction=1&gesture=eyb'],
            [AVATAR_API_URL + '?hb=image&user='+playerName+'&direction=2&head_direction=2',
             AVATAR_API_URL + '?hb=image&user='+playerName+'&direction=2&head_direction=2&gesture=eyb'],
            [AVATAR_API_URL + '?hb=image&user='+playerName+'&direction=3&head_direction=3',
             AVATAR_API_URL + '?hb=image&user='+playerName+'&direction=3&head_direction=3&gesture=eyb'],
            [AVATAR_API_URL + '?hb=image&user='+playerName+'&direction=4&head_direction=4',
             AVATAR_API_URL + '?hb=image&user='+playerName+'&direction=4&head_direction=4&gesture=eyb'],
            [AVATAR_API_URL + '?hb=image&user='+playerName+'&direction=5&head_direction=5',
             AVATAR_API_URL + '?hb=image&user='+playerName+'&direction=5&head_direction=5&gesture=eyb']
        ];

        av['walk'] = [];
        let d = 6;
        for (let i=0; i<8; ++i){
            av['walk'].push([]);
            for (let f=0; f<4; ++f){
                let s = AVATAR_API_URL + '?hb=image&user='+playerName+'&direction='+d+'&head_direction='+d+'&action=wlk&frame='+f;
                av['walk'][i].push(s);
            }
            d = (d+1)%8;
        }

        av['sit'] = [
            [AVATAR_API_URL + '?hb=image&user='+playerName+'&direction=6&head_direction=6&action=sit'],
            [AVATAR_API_URL + '?hb=image&user='+playerName+'&direction=0&head_direction=0&action=sit'],
            [AVATAR_API_URL + '?hb=image&user='+playerName+'&direction=2&head_direction=2&action=sit',
             AVATAR_API_URL + '?hb=image&user='+playerName+'&direction=2&head_direction=2&action=sit&gesture=eyb'],
            [AVATAR_API_URL + '?hb=image&user='+playerName+'&direction=4&head_direction=4&action=sit',
             AVATAR_API_URL + '?hb=image&user='+playerName+'&direction=4&head_direction=4&action=sit&gesture=eyb']
        ];

        av['wave'] = [];
        d = 6;
        for (let i=0; i<8; ++i){
            av['wave'].push([]);
            for (let f=0; f<2; ++f){
                let s = AVATAR_API_URL + '?hb=image&user='+playerName+'&direction='+d+'&head_direction='+d+'&action=wav&frame='+f;
                av['wave'][i].push(s);
            }
            d = (d+1)%8;
        }

        return av;
    }

    createBaseCharacterFilesObject(): PlayerAnimations {
        const av: any = {};
        const path: string = "/assets/character/";
        const pathStand: string = path + "stand/";

        av['stand'] = [
            [pathStand+"bc-stand-0.png"],
            [pathStand+"bc-stand-1.png"],
            [pathStand+"bc-stand-2.png"],
            [pathStand+"bc-stand-3.png",
            pathStand+"bc-stand-3.png"],
            [pathStand+"bc-stand-4.png",
            pathStand+"bc-stand-4.png"],
            [pathStand+"bc-stand-5.png",
            pathStand+"bc-stand-5.png"],
            [pathStand+"bc-stand-6.png",
            pathStand+"bc-stand-6.png"],
            [pathStand+"bc-stand-7.png",
            pathStand+"bc-stand-7.png"]
        ];

        const pathWalk: string = path + "walk/";
        av['walk'] = [];
        for (let i=0; i<8; ++i){
            av['walk'].push([]);
            for (let f=0; f<4; ++f){
                const s: string = pathWalk+"bc-walk-"+i+"-"+f+".png";
                av['walk'][i].push(s);
            }
        }

        const pathSit: string = path + "sit/";
        av['sit'] = [
            [pathSit+"bc-sit-0.png"],
            [pathSit+"bc-sit-2.png"],
            [pathSit+"bc-sit-4.png",
            pathSit+"bc-sit-4.png"],
            [pathSit+"bc-sit-6.png",
            pathSit+"bc-sit-6.png"]
        ];

        const pathWave: string = path + "wave/";
        av['wave'] = [];
        for (let i=0; i<8; ++i){
            av['wave'].push([]);
            for (let f=0; f<2; ++f){
                const s: string = pathWave+"bc-wave-"+i+"-"+f+".png";
                av['wave'][i].push(s);
            }
        }

        return av;
    }

}

export const assets = new Assets();