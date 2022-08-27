class Sprite{
    constructor(config){
        // Set up the Image
        this.image  = new Image();
        this.image.src = config.src;
        this.image.onload = () => {
            this.isLoaded = true;
        }
        this.tileSize = config.tileSize || 32
        this.offset = config.offset || {x: 8, y: 18,}

        // Shadow
        this.shadow = new Image();
        this.shadow.src = "/images/characters/shadow.png"
        this.shadow.onload = () => {
            this.isShadowLoaded = true;
        }
        this.useShadow = true

        // Configure Animation & Initial State
        this.animations = config.animations || {
            "idle-down":[[0,0]],
            "idle-right":[[0,1]],
            "idle-up":[[0,2]],
            "idle-left":[[0,3]],
            "walk-down": [[1,0], [2,0], [3,0], [0,0]],
            "walk-right": [[1,1], [2,1], [3,1], [0,1]],
            "walk-up": [[1,2], [2,2], [3,2], [0,2]],
            "walk-left": [[1,3], [2,3], [3,3], [0,3]],
        }
        this.currentAnimation = config.currentAnimation || "idle-down"
        this.currentAnimationFrame = 0

        this.animationFrameLimit = config.animationFrameLimit || 8;
        this.animationFrameProgress = this.animationFrameLimit;

        this.gameObject = config.gameObject
    }

    get frame(){
        return this.animations[this.currentAnimation][this.currentAnimationFrame];
    }

    setAnimation(key){
        if(this.currentAnimation !== key){
            this.currentAnimation = key;
            this.currentAnimationFrame = 0;
            this.animationFrameProgress = this.animationFrameLimit;
        }
    }

    updateAnimationProgress(){
        //Downtick frame progress
        if (this.animationFrameProgress > 0){
            this.animationFrameProgress -= 1;
            return;
        }

        //Reset the counter
        this.animationFrameProgress = this.animationFrameLimit;
        this.currentAnimationFrame += 1;
        if (this.frame == undefined){
            this.currentAnimationFrame = 0;
        }
    }

    draw(ctx, cameraPerson){
        const x = this.gameObject.x - this.offset.x + utils.withGrid(10.5) -cameraPerson.x;
        const y = this.gameObject.y - this.offset.y + utils.withGrid(6) -cameraPerson.y;

        this.isShadowLoaded && ctx.drawImage(this.shadow,
            x + (this.offset.x - 8),
            y + (this.offset.y - 18)
        )

        const [frameX, frameY] = this.frame; 

        this.isLoaded && ctx.drawImage(this.image, 
            frameX * this.tileSize, frameY * this.tileSize,
            this.tileSize,this.tileSize,
            x,y,
            this.tileSize,this.tileSize
        )

        this.updateAnimationProgress();
    }
}