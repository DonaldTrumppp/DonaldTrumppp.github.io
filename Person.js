class Person extends GameObject {
    constructor(config) {
        super(config);
        this.movingProgressRemaining = 0;
        this.isStanding = false;

        this.isplayerControlled = config.isplayerControlled || false;

        this.directionUpdate = {
            "up": ["y", -1],
            "down": ["y", 1],
            "left": ["x", -1],
            "right": ["x", 1],
        }
    }

    update(state) {
        if (this.movingProgressRemaining > 0) {
            this.updatePosition();
        }
        else {

            // more cases such as not keyboard ready

            // no cutscene playing && keyboard ready && have a arrow pressed
            if (!state.map.isCutscenePlaying && this.isplayerControlled && state.arrow) {
                this.startBehavior(state, {
                    type: "walk",
                    direction: state.arrow,
                    
                })
                
            }
            this.updateSprite();
        }
        
    }

    startBehavior(state, behavior) {
        // Set character direction to behavior
        this.direction = behavior.direction;
        if (behavior.type === "walk") {
            // stop if space is taken (wall or another gameObject)
            if (state.map.isSpaceTaken(this.x, this.y, this.direction)) {

                behavior.retry && setTimeout(() => {
                    this.startBehavior(state, behavior)
                }, 10)

                return;
            }

            this.movingProgressRemaining = 16;
            this.updateSprite();
        }

        if (behavior.type === "stand"){
            this.isStanding = true;
            setTimeout(() =>{
                utils.emitEvent("PersonStandingComplete", {
                    whoId: this.id,
                });
                this.isStanding = false;
            }, behavior.time)
        }
    }

    updatePosition() {
        const [property, change] = this.directionUpdate[this.direction];
        this[property] += change;
        this.movingProgressRemaining -= 1;

        if (this.movingProgressRemaining == 0){
            // walking completed
            utils.emitEvent("PersonWalkingComplete", {
                whoId: this.id,
            })
        }
    }

    updateSprite() {
        if (this.movingProgressRemaining > 0) {
            this.sprite.setAnimation("walk-" + this.direction);
            return;
        }
        this.sprite.setAnimation("idle-" + this.direction);
    }
}