class Tract {
    constructor(glottis, n_segments) {
        this.sampleRate = 48000;
        this.n = n_segments;
        this.bladeStart = 10;
        this.tipStart = 32;
        this.lipStart = 39;
        this.R = [];//component going right
        this.L = [];//component going left
        this.reflection = [];
        this.junctionOutputR = [];
        this.junctionOutputL = [];
        // this.maxAmplitude = [];
        this.diameter = [];
        this.restDiameter = [];
        this.targetDiameter = [];
        this.newDiameter = [];
        this.A = [];
        this.glottalReflection = 0.75;
        this.lipReflection = -0.85;
        this.lastObstruction = -1;
        this.fade = 1.0; //0.9999,
        this.movementSpeed = 15; //cm per second
        this.transients = [];
        this.lipOutput = 0;
        this.noseOutput = 0;
        this.velumTarget = 0.01;

        this.originX = 340;
        this.originY = 449;
        this.radius = 298;
        this.scale = 60;
        this.tongueIndex = 12.9;
        this.tongueDiameter = 2.43;
        this.innerTongueControlRadius = 2.05;
        this.outerTongueControlRadius = 3.5;
        this.tongueTouch = 0;
        this.angleScale = 0.64;
        this.angleOffset = -0.24;
        this.noseOffset = 0.8;
        this.gridOffset = 1.7;

        this.bladeStart = Math.floor(this.bladeStart*this.n/44);
        this.tipStart = Math.floor(this.tipStart*this.n/44);
        this.lipStart = Math.floor(this.lipStart*this.n/44);
        this.diameter = new Float64Array(this.n);
        this.restDiameter = new Float64Array(this.n);
        this.targetDiameter = new Float64Array(this.n);
        this.newDiameter = new Float64Array(this.n);
        for (let i=0; i<this.n; i++)
        {
            let diameter = 0;
            if (i<7*this.n/44-0.5) diameter = 0.6;
            else if (i<12*this.n/44) diameter = 1.1;
            else diameter = 1.5;
            this.diameter[i] = this.restDiameter[i] = this.targetDiameter[i] = this.newDiameter[i] = diameter;
        }
        this.R = new Float64Array(this.n);
        this.L = new Float64Array(this.n);
        this.reflection = new Float64Array(this.n+1);
        this.newReflection = new Float64Array(this.n+1);
        this.junctionOutputR = new Float64Array(this.n+1);
        this.junctionOutputL = new Float64Array(this.n+1);
        this.A =new Float64Array(this.n);
        this.maxAmplitude = new Float64Array(this.n);

        this.noseLength = Math.floor(28*this.n/44)
        this.noseStart = this.n-this.noseLength + 1;
        this.noseR = new Float64Array(this.noseLength);
        this.noseL = new Float64Array(this.noseLength);
        this.noseJunctionOutputR = new Float64Array(this.noseLength+1);
        this.noseJunctionOutputL = new Float64Array(this.noseLength+1);
        this.noseReflection = new Float64Array(this.noseLength+1);
        this.noseDiameter = new Float64Array(this.noseLength);
        this.noseA = new Float64Array(this.noseLength);
        // this.noseMaxAmplitude = new Float64Array(this.noseLength);
        for (let i=0; i<this.noseLength; i++)
        {
            let diameter;
            let d = 2*(i/this.noseLength);
            if (d<1) diameter = 0.4+1.6*d;
            else diameter = 0.5+1.5*(2-d);
            diameter = Math.min(diameter, 1.9);
            this.noseDiameter[i] = diameter;
        }
        this.newReflectionLeft = this.newReflectionRight = this.newReflectionNose = 0;
        this.calculateReflections();
        this.calculateNoseReflections();
        this.noseDiameter[0] = this.velumTarget;

        this.setRestDiameter();
        for (let i=0; i<this.n; i++)
        {
            this.diameter[i] = this.targetDiameter[i] = this.restDiameter[i];
        }
        this.tongueLowerIndexBound = this.bladeStart+2;
        this.tongueUpperIndexBound = this.tipStart-3;
        this.tongueIndexCentre = 0.5*(this.tongueLowerIndexBound+this.tongueUpperIndexBound);

        this.touches = []
        this.glottis = glottis;
        this.my_math = require('../utils/math');
    }

    reshapeTract(deltaTime)
    {
        // let my_math = require('./math');
        let amount = deltaTime * this.movementSpeed;
        let newLastObstruction = -1;
        for (let i=0; i<this.n; i++)
        {
            let diameter = this.diameter[i];
            let targetDiameter = this.targetDiameter[i];
            if (diameter <= 0) newLastObstruction = i;
            let slowReturn;
            if (i<this.noseStart) slowReturn = 0.6;
            else if (i >= this.tipStart) slowReturn = 1.0;
            else slowReturn = 0.6+0.4*(i-this.noseStart)/(this.tipStart-this.noseStart);
            this.diameter[i] = this.my_math.moveTowards_2(diameter, targetDiameter, slowReturn*amount, 2*amount);
        }
        if (this.lastObstruction>-1 && newLastObstruction === -1 && this.noseA[0]<0.05)
        {
            this.addTransient(this.lastObstruction);
        }
        this.lastObstruction = newLastObstruction;

        amount = deltaTime * this.movementSpeed;
        this.noseDiameter[0] = this.my_math.moveTowards_2(this.noseDiameter[0], this.velumTarget,
            amount*0.25, amount*0.1);
        this.noseA[0] = this.noseDiameter[0]*this.noseDiameter[0];
    }

    calc_junctions(lambda)
    {
        for (let i=1; i<this.n; i++)
        {
            let r = this.reflection[i] * (1-lambda) + this.newReflection[i]*lambda;
            let w = r * (this.R[i-1] + this.L[i]);
            this.junctionOutputR[i] = this.R[i-1] - w;
            this.junctionOutputL[i] = this.L[i] + w;
        }
    }

    calc_lipOutput()
    {
        for (let i=0; i<this.n; i++)
        {
            this.R[i] = this.junctionOutputR[i]*0.999;
            this.L[i] = this.junctionOutputL[i+1]*0.999;
        }
        this.lipOutput = this.R[this.n-1];
    }

    calc_nose_junctions()
    {
        for (let i=1; i<this.noseLength; i++)
        {
            let w = this.noseReflection[i] * (this.noseR[i-1] + this.noseL[i]);
            this.noseJunctionOutputR[i] = this.noseR[i-1] - w;
            this.noseJunctionOutputL[i] = this.noseL[i] + w;
        }
    }

    calc_noseOutput()
    {
        for (let i=0; i<this.noseLength; i++)
        {
            this.noseR[i] = this.noseJunctionOutputR[i] * this.fade;
            this.noseL[i] = this.noseJunctionOutputL[i+1] * this.fade;
        }
        this.noseOutput = this.noseR[this.noseLength-1];
    }

    runStep(glottalOutput, turbulenceNoise, lambda)
    {
        //mouth
        this.processTransients();
        this.addTurbulenceNoise(turbulenceNoise);

        //this.glottalReflection = -0.8 + 1.6 * Glottis.newTenseness;
        this.junctionOutputR[0] = this.L[0] * this.glottalReflection + glottalOutput;
        this.junctionOutputL[this.n] = this.R[this.n-1] * this.lipReflection;

        this.calc_junctions(lambda)

        //now at junction with nose
        let ii = this.noseStart;
        let r = this.newReflectionLeft * (1-lambda) + this.reflectionLeft*lambda;
        this.junctionOutputL[ii] = r*this.R[ii-1]+(1+r)*(this.noseL[0]+this.L[ii]);
        r = this.newReflectionRight * (1-lambda) + this.reflectionRight*lambda;
        this.junctionOutputR[ii] = r*this.L[ii]+(1+r)*(this.R[ii-1]+this.noseL[0]);
        r = this.newReflectionNose * (1-lambda) + this.reflectionNose*lambda;
        this.noseJunctionOutputR[0] = r*this.noseL[0]+(1+r)*(this.L[ii]+this.R[ii-1]);

        this.calc_lipOutput()

        //nose
        this.noseJunctionOutputL[this.noseLength] = this.noseR[this.noseLength-1] * this.lipReflection;

        this.calc_nose_junctions()

        this.calc_noseOutput()
    }

    finishBlock()
    {
        this.reshapeTract(512/48000);
        this.calculateReflections();
    }

    addTransient(position)
    {
        let trans = {}
        trans.position = position;
        trans.timeAlive = 0;
        trans.lifeTime = 0.2;
        trans.strength = 0.3;
        trans.exponent = 200;
        this.transients.push(trans);
    }

    processTransients()
    {
        for (let i = 0; i < this.transients.length; i++)
        {
            let trans = this.transients[i];
            let amplitude = trans.strength * Math.pow(2, -trans.exponent * trans.timeAlive);
            this.R[trans.position] += amplitude/2;
            this.L[trans.position] += amplitude/2;
            trans.timeAlive += 1.0/(this.sampleRate*2);
        }
        for (let i=this.transients.length-1; i>=0; i--)
        {
            let trans = this.transients[i];
            if (trans.timeAlive > trans.lifeTime)
            {
                this.transients.splice(i,1);
            }
        }
    }

    addTurbulenceNoise(turbulenceNoise)
    {
        for (let i=0; i<this.touches.length; i++)
        {
            let touch = this.touches[i];
            let index = touch[0]
            let diameter = touch[1]
            if (index<2 || index>this.n) continue;
            if (diameter<=0) continue;
            let intensity = 1
            this.addTurbulenceNoiseAtIndex(0.66*turbulenceNoise*intensity, index, diameter);
        }
    }

    addTurbulenceNoiseAtIndex(turbulenceNoise, index, diameter)
    {
        // let my_math = require('./math');
        let i = Math.floor(index);
        let delta = index - i;
        turbulenceNoise *= this.glottis.getNoiseModulator();
        let thinness0 = this.my_math.clamp(8*(0.7-diameter),0,1);
        let openness = this.my_math.clamp(30*(diameter-0.3),0,1);
        let noise0 = turbulenceNoise*(1-delta)*thinness0*openness;
        let noise1 = turbulenceNoise*delta*thinness0*openness;
        this.R[i+1] += noise0/2;
        this.L[i+1] += noise0/2;
        this.R[i+2] += noise1/2;
        this.L[i+2] += noise1/2;
    }

    getIndex(x,y)
    {
        let xx = x-this.originX; let yy = y-this.originY;
        let angle = Math.atan2(yy, xx);
        while (angle> 0) angle -= 2*Math.PI;
        return (Math.PI + angle - this.angleOffset)*(this.lipStart-1) / (this.angleScale*Math.PI);
    }

    getDiameter(x,y)
    {
        let xx = x-this.originX; let yy = y-this.originY;
        return (this.radius-Math.sqrt(xx*xx + yy*yy))/this.scale;
    }

    getXY(index, diameter)
    {
        let angle = this.angleOffset + index * this.angleScale * Math.PI / (this.lipStart - 1)
        let wobble = 0
        angle += wobble
        let r = this.radius - this.scale * diameter + 100 * wobble
        let x = this.originX - r * Math.cos(angle)
        let y = this.originY - r * Math.sin(angle)

        return [x, y]
    }



    calculateReflections()
    {
        for (let i=0; i<this.n; i++)
        {
            this.A[i] = this.diameter[i]*this.diameter[i]; //ignoring PI etc.
        }
        for (let i=1; i<this.n; i++)
        {
            this.reflection[i] = this.newReflection[i];
            if (this.A[i] === 0) this.newReflection[i] = 0.999; //to prevent some bad behaviour if 0
            else this.newReflection[i] = (this.A[i-1]-this.A[i]) / (this.A[i-1]+this.A[i]);
        }

        //now at junction with nose

        this.reflectionLeft = this.newReflectionLeft;
        this.reflectionRight = this.newReflectionRight;
        this.reflectionNose = this.newReflectionNose;
        let sum = this.A[this.noseStart]+this.A[this.noseStart+1]+this.noseA[0];
        this.newReflectionLeft = (2*this.A[this.noseStart]-sum)/sum;
        this.newReflectionRight = (2*this.A[this.noseStart+1]-sum)/sum;
        this.newReflectionNose = (2*this.noseA[0]-sum)/sum;
    }

    calculateNoseReflections()
    {
        for (let i=0; i<this.noseLength; i++)
        {
            this.noseA[i] = this.noseDiameter[i]*this.noseDiameter[i];
        }
        for (let i=1; i<this.noseLength; i++)
        {
            this.noseReflection[i] = (this.noseA[i-1]-this.noseA[i]) / (this.noseA[i-1]+this.noseA[i]);
        }
    }

    setRestDiameter()
    {
        for (let i=this.bladeStart; i<this.lipStart; i++)
        {
            let t = 1.1 * Math.PI*(this.tongueIndex - i)/(this.tipStart - this.bladeStart);
            let fixedTongueDiameter = 2+(this.tongueDiameter-2)/1.5;
            let curve = (1.5-fixedTongueDiameter+this.gridOffset)*Math.cos(t);
            if (i === this.bladeStart-2 || i === this.lipStart-1) curve *= 0.8;
            if (i === this.bladeStart || i === this.lipStart-2) curve *= 0.94;
            this.restDiameter[i] = 1.5 - curve;
        }
    }

    handleTouches()
    {
        let tractCanvasHeight = 600

        if (this.tongueTouch !== 0) this.tongueTouch = 0;

        if (this.tongueTouch === 0)
        {
            for (let j=0; j<this.touches.length; j++)
            {
                let touch = this.touches[j];
                let index = touch[0];
                let diameter = touch[1];
                if (index >= this.tongueLowerIndexBound-4 && index<=this.tongueUpperIndexBound+4
                    && diameter >= this.innerTongueControlRadius-0.5 && diameter <= this.outerTongueControlRadius+0.5)
                {
                    this.tongueTouch = touch;
                }
            }
        }

        if (this.tongueTouch !== 0)
        {
            // let my_math = require('./math');
            let index = this.tongueTouch[0];
            let diameter = this.tongueTouch[1];
            let fromPoint = (this.outerTongueControlRadius-diameter)/(this.outerTongueControlRadius-this.innerTongueControlRadius);
            fromPoint = this.my_math.clamp(fromPoint, 0, 1);
            fromPoint = Math.pow(fromPoint, 0.58) - 0.2*(fromPoint*fromPoint-fromPoint); //horrible kludge to fit curve to straight line
            this.tongueDiameter = this.my_math.clamp(diameter, this.innerTongueControlRadius, this.outerTongueControlRadius);
            // this.tongueIndex = Math.clamp(index, this.tongueLowerIndexBound, this.tongueUpperIndexBound);
            let out = fromPoint*0.5*(this.tongueUpperIndexBound-this.tongueLowerIndexBound);
            this.tongueIndex = this.my_math.clamp(index, this.tongueIndexCentre-out, this.tongueIndexCentre+out);
        }

        this.setRestDiameter();
        for (let i=0; i<this.n; i++) this.targetDiameter[i] = this.restDiameter[i];

        //other constrictions and nose
        this.velumTarget = 0.01;
        for (let j=0; j<this.touches.length; j++)
        {
            let touch = this.touches[j];
            // let x = touch[0]
            // let y = touch[1]
            let index = touch[0];
            let diameter = touch[1];
            let y = this.getXY(index, diameter)[1];
            if (index > this.noseStart && diameter < -this.noseOffset)
            {
                this.velumTarget = 0.4;
            }
            if (diameter < -0.85-this.noseOffset) continue;
            diameter -= 0.3;
            if (diameter<0) diameter = 0;
            let width=2;
            if (index<25) width = 10;
            else if (index>=this.tipStart) width= 5;
            else width = 10-5*(index-25)/(this.tipStart-25);
            if (index >= 2 && index < this.n && y<tractCanvasHeight && diameter < 3)
            {
                let intIndex = Math.round(index);
                for (let i=-Math.ceil(width)-1; i<width+1; i++)
                {
                    if (intIndex+i<0 || intIndex+i>=this.n) continue;
                    let relpos = (intIndex+i) - index;
                    relpos = Math.abs(relpos)-0.5;
                    let shrink;
                    if (relpos <= 0) shrink = 0;
                    else if (relpos > width) shrink = 1;
                    else shrink = 0.5*(1-Math.cos(Math.PI * relpos / width));
                    if (diameter < this.targetDiameter[intIndex+i])
                    {
                        this.targetDiameter[intIndex+i] = diameter + (this.targetDiameter[intIndex+i]-diameter)*shrink;
                    }
                }
            }
        }
    }
}

module.exports = Tract