class GameObject{
    constructor(config){
        this.isMounted = false;
        this.id = null;
        this.x = config.x || 0;
        this.y = config.y || 0;
        this.direction = config.direction || "down";
        this.sprite = new Sprite({
            gameObject: this,
            src: config.src || "./images/characters/people/cat.png",
            ...config,
        }) 

        this.behaviorLoop = config.behaviorLoop || {};
        this.behaviorLoopIndex = 0;

        this.talking = config.talking || [];
        this.retryTimeout = null;
    }

    mount(map){
        this.isMounted = true;

        // If we have a behavior loop, kick off after a short delay for overworld event
        setTimeout(()=>{
            this.doBehaviorEvent(map);
        })
    }

    async doBehaviorEvent(map){

        // Don't start idle behavior if cutscene playing or no config || isStanding (avoid stacking async timeout)
        if (this.behaviorLoop[this.behaviorLoopIndex] === undefined 
            || this.behaviorLoop.length === 0 || this.isStanding){
            return;
        }

        if (map.isCutscenePlaying){

            if(this.retryTimeout){
                clearTimeout(this.retryTimeout);
            }

            this.retryTimeout = setTimeout(() =>{
                this.doBehaviorEvent(map);
            }, 1000)
            return;
        }

        // Setting up our event with relevant info
        let eventConfig = this.behaviorLoop[this.behaviorLoopIndex];
        eventConfig.who = this.id;

        // Create and evnet instance out of our next event config
        const eventHandler = new OverworldEvent({map, event: eventConfig});
        await eventHandler.init();

        // Setting the next event to fire
        this.behaviorLoopIndex += 1;
        if(this.behaviorLoopIndex === this.behaviorLoop.length){
            this.behaviorLoopIndex = 0;
        }

        this.doBehaviorEvent(map);
    }
}