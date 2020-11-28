// NOTE: WAなど同時押しの場合直前のkeyを配列に格納して、onkeyupで解放することで認識できる。
// NOTE: 慣性の追加(時間で速度減衰)
// NOTE: なくなったらエンターでリトライ、個数設定
// NOTE: プレイヤーを+-ではなく方向で制御

// setup canvas
"use strict"
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

const width = canvas.width = window.innerWidth;
const height = canvas.height = window.innerHeight;

const btn = document.querySelector("#playController");
const remainCount = document.querySelector("#remainCount");
const result = document.querySelector("#result");
const timer = document.querySelector("#timer");

let playing = true;
function phaseChange(){
    if(playing){
        playing = false;
        btn.textContent = "Play";
    }else {
        playing = true;
        btn.textContent = "Stop";
        loop();
    }
}
function showResult(){
    result.textContent = "Congratulations!";
}
btn.addEventListener("click", phaseChange);


// function to generate random number

function random(min, max) {
  const num = Math.floor(Math.random() * (max - min + 1)) + min;
  return num;
}

class Shape{
    constructor(x, y, velX, velY, exists){
        this.x = x;
        this.y = y;
        this.velX = velX;
        this.velY = velY;
        this.exists = exists;
    }
}

class Ball extends Shape{
    constructor(x, y, velX, velY, color, size, exists){
        super(x, y, velX, velY, exists);
        this.color = color;
        this.size = size; //円の半径(px)
    }
    // 円を描画
    draw(){
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.arc(this.x, this.y, this.size, 0, 2 * Math.PI);
        ctx.fill();
    }
    // 移動させる処理。画面端に到達したら速度を反転させる
    update(){
        if((this.x + this.size) >= width || (this.x - this.size) < 0){
            this.velX = -(this.velX);
        }
        if((this.y + this.size) >= height || (this.y - this.size) < 0){
            this.velY = -(this.velY);
        }

        this.x += this.velX;
        this.y += this.velY;
    }
    // 他のボールとの衝突判定
    collisionDetect(){
        // すべてのボールをチェックし自身のと当たっていれば
        for (let bi = 0; bi < balls.length; bi++) {
            const ball = balls[bi];
            // 自身なら飛ばす
            if(ball === this)continue;
            // ボール間が当たったら色を変える。
            const dx = this.x - ball.x;
            const dy = this.y - ball.y;
            const distance = Math.sqrt(dx ** 2 + dy ** 2);
            if(distance < this.size + ball.size && ball.exists){
                ball.color = this.color = `rgb(${random(0,255)},${random(0,255)},${random(0,255)})`;
            }
        }
    }
}
class EvilCirle extends Shape{
    constructor(x, y, accX, accY, velMax, resistance){
        super(x, y, 0, 0, true);
        this.color = "white";
        this.size = 10;
        // 加速度（厳密には間違っている。入力時に増減させる。
        this.accX = accX;
        this.accY = accY;
        // this.goDown = true;
        // this.goRight = true;
        this.velMax = velMax;
        this.resistance = resistance;
    }
    draw(){
        ctx.beginPath();
        ctx.lineWidth = 3;
        ctx.strokeStyle = this.color;
        ctx.arc(this.x, this.y, this.size, 0, 2 * Math.PI);
        ctx.stroke();
    }
    update(){
        this.x += this.velX;
        this.y += this.velY;
        this.velX *= this.resistance;
        this.velY *= this.resistance;
    }
    checkBounds(){
        // 画面端から出ないようにする
        if((this.x + this.size) >= width){
            this.x = width - this.size;

        }else if((this.x - this.size) < 0){
            this.x = this.size;
        }
        if((this.y + this.size) >= width){
            this.y = width - this.size;

        }else if((this.y - this.size) < 0){
            this.y = this.size;
        }
    }
    setControls(){
// 定義ないでlet,constを使うことでprivateな変数を利用できる。_から始めるとわかりやすい
        let _this = this;
        let activeKeys = [];
        window.onkeydown = (e)=>{
            // 現在押しているキーが既に押されていなければ追加
            if((e.key).match("[wasd]")){
                if(activeKeys.indexOf(e.key) === -1){
                    activeKeys.push(e.key);
                }
                for (let ai = 0; ai < activeKeys.length; ai++) {
                    const key = activeKeys[ai];
                    switch(key){
                        case "a":
                            _this.velX -= _this.accX; break;
                        case "d":
                            _this.velX += _this.accX; break;
                        case "w":
                            _this.velY -= _this.accY; break;
                        case "s":
                            _this.velY += _this.accY; break;
                    }
                }
                // 上限速度の設定
                if(Math.abs(this.velX) > this.velMax){
                    if(this.velX > 0){
                        this.velX = this.velMax;
                    }else {
                        this.velX = -this.velMax;
                    }
                }
                if(Math.abs(this.velY) > this.velMax){
                    if(this.velY > 0){
                        this.velY = this.velMax;
                    }else{
                        this.velY = -this.velMax;
                    }
                }
            }
        }
        window.onkeyup = (e) => {
            activeKeys.splice(activeKeys.indexOf(e.key), 1);
        }
    }
    collisionDetect(){
        // すべてのボールをチェックし自身のと当たっていれば
        for (let bi = 0; bi < balls.length; bi++) {
            const ball = balls[bi];
            // existsしないなら無視
            if(!ball.exists)continue;
            // ボール間が当たったら色を変える。
            const dx = this.x - ball.x;
            const dy = this.y - ball.y;
            const distance = Math.sqrt(dx ** 2 + dy ** 2);
            if(distance < this.size + ball.size){
                ball.exists = false;
            }
        }
    }
}

let balls = [];
let ballAmount = 25;

function addBall(){
    let size = random(20, 40);
    let ball = new Ball(
        random(0 + size, width - size),
        random(0 + size, height - size),
        random(-7, 7),
        random(-7, 7),
        `rgb(${random(0, 255)},${random(0,255)},${random(0,255)})`,
        size,
        true
        );
        balls.push(ball);
        ball.draw();
    }
    // 初期の追加
    while(balls.length + 1 <= ballAmount){
        addBall();
    }
    function loop(){
    ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
    ctx.fillRect(0, 0, width, height);

    // EvilCircle
    evilCircle.draw();
    evilCircle.checkBounds();
    evilCircle.collisionDetect();
    evilCircle.update();
    
    // Balls
    let ballCount = 0;
    for (let bi = 0; bi < balls.length; bi++) {
        const ball = balls[bi];
        if(!ball.exists)continue;
        ball.draw();
        ball.update();
        ball.collisionDetect();
        ballCount++;
    }
    // 残りのボール数のカウントが0になるまでカウント、0になったらresult
    remainCount.textContent = ballCount;
    if(ballCount !== 0){
        // count
        elapsedTime = Date.now() - startTime;
        let formattedTime = formatTime(elapsedTime);
        timer.textContent = formattedTime;

    }else{
        showResult();
    }
    
    // 再帰判定
    if(playing){
        requestAnimationFrame(loop);
    }
}
function formatTime(time){
    let formatString = "";
    let s = Math.floor(time/1000);
    let milis = time - (1000 * s);
    formatString = `${s}.${milis}`;
    return formatString;
}

const evilCircle = new EvilCirle(width/2, height/2, 5, 5, 5, 0.99);
evilCircle.setControls();
let startTime = Date.now();
let elapsedTime = 0;

// ゲーム開始
loop();

