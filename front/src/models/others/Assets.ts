import { ImageCollection } from "@/types/ImageCollection";
import { PlayerAnimations, PlayerAnimationsCollection } from "@/types/PlayerAnimations";
import Player from "../entities/Player";
import { DEFAULT_AVATAR } from "@/constants/constants";
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
    
    async load(player: Player): Promise<void> {
        this.fillFileArrays();
        await this.loadImages();
        await this.loadAvatarImages(DEFAULT_AVATAR, null);
        await this.loadAvatarImages(player.name, player);
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
            stand: [[], [], [], [], [], [], [], []],
            walk: [[], [], [], [], [], [], [], []],
            sit: [[], [], [], []],
            wave: [[], [], [], [], [], [], [], []],
        };
    }

    loadAvatarImages(playerName: string, player: Player | null): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.avatars[playerName] = this.createPlayerAnimationsObject();
            const av: PlayerAnimations = this.createAvatarFilesObject(playerName);
            const promises: Promise<void>[] = [];
            for (const status in av){
                this.avatars[playerName][status] = [];
                let i = 0;
                for (const dir of av[status]){
                    this.avatars[playerName][status].push([]);
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
                            this.avatars[playerName][status][i].push(img);
                        });
                        promises.push(promise);
                    }
                    i++;
                }
            }
    
            Promise.all(promises).then(() => {
                if (player !== null) player.images = this.avatars[playerName];
                resolve();
            }).catch(() => {
                if (playerName !== DEFAULT_AVATAR) 
                    this.avatars[playerName] = this.avatars[DEFAULT_AVATAR];
                if (player !== null) player.images = this.avatars[playerName];
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
            ['https://www.habbo.es/habbo-imaging/avatarimage?hb=image&user='+playerName+'&direction=6&head_direction=6'],
            ['https://www.habbo.es/habbo-imaging/avatarimage?hb=image&user='+playerName+'&direction=7&head_direction=7'],
            ['https://www.habbo.es/habbo-imaging/avatarimage?hb=image&user='+playerName+'&direction=0&head_direction=0'],
            ['https://www.habbo.es/habbo-imaging/avatarimage?hb=image&user='+playerName+'&direction=1&head_direction=1',
             'https://www.habbo.es/habbo-imaging/avatarimage?hb=image&user='+playerName+'&direction=1&head_direction=1&gesture=eyb'],
            ['https://www.habbo.es/habbo-imaging/avatarimage?hb=image&user='+playerName+'&direction=2&head_direction=2',
             'https://www.habbo.es/habbo-imaging/avatarimage?hb=image&user='+playerName+'&direction=2&head_direction=2&gesture=eyb'],
            ['https://www.habbo.es/habbo-imaging/avatarimage?hb=image&user='+playerName+'&direction=3&head_direction=3',
             'https://www.habbo.es/habbo-imaging/avatarimage?hb=image&user='+playerName+'&direction=3&head_direction=3&gesture=eyb'],
            ['https://www.habbo.es/habbo-imaging/avatarimage?hb=image&user='+playerName+'&direction=4&head_direction=4',
             'https://www.habbo.es/habbo-imaging/avatarimage?hb=image&user='+playerName+'&direction=4&head_direction=4&gesture=eyb'],
            ['https://www.habbo.es/habbo-imaging/avatarimage?hb=image&user='+playerName+'&direction=5&head_direction=5',
             'https://www.habbo.es/habbo-imaging/avatarimage?hb=image&user='+playerName+'&direction=5&head_direction=5&gesture=eyb']
        ];

        av['walk'] = [];
        let d = 6;
        for (let i=0; i<8; ++i){
            av['walk'].push([]);
            for (let f=0; f<4; ++f){
                let s = 'https://www.habbo.es/habbo-imaging/avatarimage?hb=image&user='+playerName+'&direction='+d+'&head_direction='+d+'&action=wlk&frame='+f;
                av['walk'][i].push(s);
            }
            d = (d+1)%8;
        }

        av['sit'] = [
            ['https://www.habbo.es/habbo-imaging/avatarimage?hb=image&user='+playerName+'&direction=6&head_direction=6&action=sit'],
            ['https://www.habbo.es/habbo-imaging/avatarimage?hb=image&user='+playerName+'&direction=0&head_direction=0&action=sit'],
            ['https://www.habbo.es/habbo-imaging/avatarimage?hb=image&user='+playerName+'&direction=2&head_direction=2&action=sit',
             'https://www.habbo.es/habbo-imaging/avatarimage?hb=image&user='+playerName+'&direction=2&head_direction=2&action=sit&gesture=eyb'],
            ['https://www.habbo.es/habbo-imaging/avatarimage?hb=image&user='+playerName+'&direction=4&head_direction=4&action=sit',
             'https://www.habbo.es/habbo-imaging/avatarimage?hb=image&user='+playerName+'&direction=4&head_direction=4&action=sit&gesture=eyb']
        ];

        av['wave'] = [];
        d = 6;
        for (let i=0; i<8; ++i){
            av['wave'].push([]);
            for (let f=0; f<2; ++f){
                let s = 'https://www.habbo.es/habbo-imaging/avatarimage?hb=image&user='+playerName+'&direction='+d+'&head_direction='+d+'&action=wav&frame='+f;
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