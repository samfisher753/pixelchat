let app = document.getElementById('app');

let canvas = document.createElement('canvas');
canvas.width = 33;
canvas.height = 80;
let ctx = canvas.getContext('2d');

let img = new Image();
img.onload = () => {
    getLayer();
};
img.src = 'test4.png';

app.appendChild(canvas);


function getLayer() {
    ctx.drawImage(img, 0, 0);
    console.log(ctx.getImageData(26,3,1,1).data);
    let imgd = ctx.getImageData(0,0,33,80);
    let l = imgd.data.length/4;
    for (let i=0; i<l; ++i){
        let index = i*4;

        if (imgd.data[index] === 0 && imgd.data[index+1] === 0 
            && imgd.data[index+2] === 0) continue;


        let refColor = {r: 255, g: 203, b: 150};
        if (imgd.data[index] === refColor.r && imgd.data[index+1] === refColor.g 
            && imgd.data[index+2] === refColor.b) {
            imgd.data[index] = 255;
            imgd.data[index+1] = 255;
            imgd.data[index+2] = 255;
        }
        else {
            let alpha = calcBlackAlpha(refColor, imgd.data[index],
                imgd.data[index+1],imgd.data[index+2]);

            imgd.data[index] = 0;
            imgd.data[index+1] = 0;
            imgd.data[index+2] = 0;
            imgd.data[index+3] = alpha;
        }
    }
    ctx.putImageData(imgd,0,0);
}

function calcBlackAlpha(refColor, r, g, b) {
    let dr = refColor.r - r;
    let dg = refColor.g - g;
    let db = refColor.b - b;

    let davg = (dr+dg+db)/3;
    let alpha = (davg+15)%256;
    return alpha;
}