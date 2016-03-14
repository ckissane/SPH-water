var delta = new Date();
var colors = [
    "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd",
    "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"
];
var mouseX = 0;
var mouseY = 0;
var press = false;

document.getElementById("canvas").onmousedown = function(event) {
    clickControl(event);
}

document.getElementById("canvas").onmousemove = function(event) {
    clickControl(event);
};

function clickControl(event) {

    mouseX = event.layerX;
    mouseY = event.layerY;
    if (event.buttons == 1 || event.buttons == 2)
        press = true;
    else
        press = false;

}
var pixelArray = [];
var RANGE2;
var w = $("body").width();
var h = $("body").height();
var SPH = {
    GRAVITY: 0.05,
    RANGE: 20,
    PRESSURE: 0.5,
    VISCOSITY: 0.1
};
$("body").keydown(function(event) {
    console.log(event.which);
    if (event.which == 38) {
        event.preventDefault();
        SPH.RANGE = SPH.RANGE + 1;
    }
    if (event.which == 40) {
        event.preventDefault();
        SPH.RANGE--;
    }
});
var currentCenter;

var initialize = (function() {
    var col = 0;
    $("#canvas").attr("width", $("body").width());
    $("#canvas").attr("height", $("body").height());
    /* clickControl({
            layerX: 0.5,
            layerY: 3,
            buttons: 1
        });*/
    RANGE2 = SPH.RANGE * SPH.RANGE;
    var DENSITY = 1;
    var NUM_GRIDSX = Math.floor(w / 10);
    var NUM_GRIDSY = Math.floor(h / 10);
    var INV_GRID_SIZEX = 1 / (w / NUM_GRIDSX);
    var INV_GRID_SIZEY = 1 / (h / NUM_GRIDSY);
    var canvas2 = document.getElementById('canvas');
    var ctx2 = canvas2.getContext('2d');
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    canvas2.width = $("body").width();
    canvas2.height = $("body").height();
    canvas.width = $("body").width();
    canvas.height = $("body").height();
    var particles = [];
    var numParticles = 0;
    var neighbors = [];
    var numNeighbors = 0;
    var count = 0;

    var grids = [];
    

    function frame(e) {



        //var tempDelta = delta + 0;
        //delta = 0;
        //calc();
        ctx.clearRect(0, 0, w, h);
        draw();
        ctx2.clearRect(0, 0, w, h);
        ctx2.drawImage(canvas,0,0);
        //ctx2.clearRect(0, 0, w, h);
        //ctx2.drawImage(canvas, 0, 0);
        //ctx2.fill();

        ctx.font = "30px Arial";
        ctx.fillText("" + SPH.RANGE, 10, 30);


    }

    function draw() {
        drag();
        //ctx2.fillRect(0,0,10,10);
        // ctx2.fill();

        //ctx.beginPath();
        //ctx.fillStyle = "black";
        //ctx.fillRect(0, 0, w, h);
        //ctx.fill();

        ctx.globalCompositeOperation = 'normal';
        for (var i = 0; i < numParticles; i++) {
            var p = particles[i];
            //var grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size / 2);

            ctx.fillStyle = "blue";

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size / 8, 0, 2 * Math.PI, false);

            ctx.fill();

        }
        ctx.globalCompositeOperation = 'normal';


    }

    function pour() {
        if (count % 5 === 0) {
            var p = new Particle(mouseX, mouseY);
            p.vy = 3;
            particles[numParticles++] = p;

        }
    }

    function calc() {
        if (press) {
            pour();
        }
        var deltaC=new Date().getTime()-delta.getTime();
        delta=new Date();
        updateGrids();
        findNeighbors();
        calcPressure();
        calcForce();
        move(deltaC/50);
    }

    function move(d) {
        count++;
        for (var i = 0; i < numParticles; i++) {
            var p = particles[i];
            for (var j = 0; j < d; j++) {
                p.move();
            }
        }
    }

    function drag() {

        for (var i = 0; i < numParticles; i++) {
            var p = particles[i];
            p.drag();
        }
    }

    function updateGrids() {
        var i;
        var j;
        for (i = 0; i < NUM_GRIDSX; i++)
            for (j = 0; j < NUM_GRIDSY; j++)
                grids[i][j].clear();
        for (i = 0; i < numParticles; i++) {
            var p = particles[i];
            p.fx = p.fy = p.density = 0;
            p.gx = Math.floor(p.x * INV_GRID_SIZEX);
            p.gy = Math.floor(p.y * INV_GRID_SIZEY);
            if ((!p.x) | (!p.y)) {
                console.log("the error is on line 338, p.x and p.y are undefined")
            }
            if (p.gx < 0)
                p.gx = 0;
            if (p.gy < 0)
                p.gy = 0;
            if (p.gx > NUM_GRIDSX - 1)
                p.gx = NUM_GRIDSX - 1;
            if (p.gy > NUM_GRIDSY - 1)
                p.gy = NUM_GRIDSY - 1;
            grids[p.gx][p.gy].add(p);
        }
    }

    function findNeighbors() {
        numNeighbors = 0;
        for (var i = 0; i < numParticles; i++) {
            var p = particles[i];
            var xMin = p.gx !== 0;
            var xMax = p.gx != NUM_GRIDSX - 1;
            var yMin = p.gy !== 0;
            var yMax = p.gy != NUM_GRIDSY - 1;
            findNeighborsInGrid(p, grids[p.gx][p.gy]);
            if (xMin) findNeighborsInGrid(p, grids[p.gx - 1][p.gy]);
            if (xMax) findNeighborsInGrid(p, grids[p.gx + 1][p.gy]);
            if (yMin) findNeighborsInGrid(p, grids[p.gx][p.gy - 1]);
            if (yMax) findNeighborsInGrid(p, grids[p.gx][p.gy + 1]);
            if (xMin && yMin) findNeighborsInGrid(p, grids[p.gx - 1][p.gy - 1]);
            if (xMin && yMax) findNeighborsInGrid(p, grids[p.gx - 1][p.gy + 1]);
            if (xMax && yMin) findNeighborsInGrid(p, grids[p.gx + 1][p.gy - 1]);
            if (xMax && yMax) findNeighborsInGrid(p, grids[p.gx + 1][p.gy + 1]);
        }
    }

    function findPaintNeighbors(p) {
        var negs = [];
        var xMin = p.gx !== 0;
        var xMax = p.gx != NUM_GRIDSX - 1;
        var yMin = p.gy !== 0;
        var yMax = p.gy != NUM_GRIDSY - 1;
        findPaintNeighborsInGrid(p, grids[p.gx][p.gy], negs);
        if (xMin) findPaintNeighborsInGrid(p, grids[p.gx - 1][p.gy], negs);
        if (xMax) findPaintNeighborsInGrid(p, grids[p.gx + 1][p.gy], negs);
        if (yMin) findPaintNeighborsInGrid(p, grids[p.gx][p.gy - 1], negs);
        if (yMax) findPaintNeighborsInGrid(p, grids[p.gx][p.gy + 1], negs);
        if (xMin && yMin) findPaintNeighborsInGrid(p, grids[p.gx - 1][p.gy - 1], negs);
        if (xMin && yMax) findPaintNeighborsInGrid(p, grids[p.gx - 1][p.gy + 1], negs);
        if (xMax && yMin) findPaintNeighborsInGrid(p, grids[p.gx + 1][p.gy - 1], negs);
        if (xMax && yMax) findPaintNeighborsInGrid(p, grids[p.gx + 1][p.gy + 1], negs);
        return negs;
    }

    function findPaintNeighborsInGrid(pi, g, negs) {
        //var neigs=[];
        for (var j = 0; j < g.numParticles; j++) {
            var pj = g.particles[j];
            if (pi == pj)
                continue;
            var distance = (pi.x - pj.x) * (pi.x - pj.x) + (pi.y - pj.y) * (pi.y - pj.y);
            if (distance < (pi.size / 1.5 + pj.size / 1.5) * (pi.size / 1.5 + pj.size / 1.5)) {
                negs.push(pj);
            }
        }
    }

    function findNeighborsInGrid(pi, g) {
        for (var j = 0; j < g.numParticles; j++) {
            var pj = g.particles[j];
            if (pi == pj)
                continue;
            var distance = (pi.x - pj.x) * (pi.x - pj.x) + (pi.y - pj.y) * (pi.y - pj.y);
            if (distance < (pi.size / 1.5 + pj.size / 1.5) * (pi.size / 1.5 + pj.size / 1.5)) {
                if (neighbors.length == numNeighbors)
                    neighbors[numNeighbors] = new Neighbor();
                neighbors[numNeighbors++].setParticle(pi, pj);
            }
        }
    }

    function calcPressure() {
        for (var i = 0; i < numParticles; i++) {
            var p = particles[i];
            if (p.density < DENSITY)
                p.density = DENSITY;
            p.pressure = p.density - DENSITY;
        }
    }

    function calcForce() {
        for (var i = 0; i < numNeighbors; i++) {
            var n = neighbors[i];
            n.calcForce();
        }
    }
    return function() {
        for (var i = 0; i < NUM_GRIDSX; i++) {
            grids[i] = new Array(NUM_GRIDSY);
            for (var j = 0; j < NUM_GRIDSY; j++)
                grids[i][j] = new Grid();
        }
        for (var x = 0; x < w; x++) {
            var col = [];
            for (var y = 0; y < h; y++) {
                col[y] = 0;
            }
            pixelArray[x] = col;
        }
        for (var y = 20; y < 400; y += 10) {
            for (var x = w / 2 - w/4; x < w / 2 + w/4; x += 10) {
                var p = new Particle(x, y);
                p.vy = 0;
                particles[numParticles++] = p;
            }
        }
        window.addEventListener('mouseup', function(e) {
            press = false;
        }, false);
        delta = new Date();
        window.setInterval(frame, 100);
        //window.setInterval(tick, 1);
        window.setInterval(calc, 1);
    };
})();

var Particle = function(x, y) {
    //this.number=particles.length;
    this.x = x;
    this.y = y;
    this.gx = 0;
    this.gy = 0;
    this.vx = 0;
    this.vy = 0;
    this.fx = 0;
    this.fy = 0;
    this.density = 0;
    this.pressure = 0;
    this.size = SPH.RANGE;

};
Particle.prototype = {
    drag: function() {
        this.vx = this.vx * 0.99;
        this.vy = this.vy * 0.99;
    },
    move: function() {
        var _y1 = 0;
        var _x1 = 0;
        var _d = 0;
        _x1 = mouseX - this.x;
        _y1 = mouseY - this.y;
        this.vy += SPH.GRAVITY;
        this.vx += this.fx; //+Math.random()*0.1-0.05;
        this.vy += this.fy; //+Math.random()*0.1-0.05;
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 10)
            this.vx += (10 - this.x) * 0.5 - this.vx * 0.5;
        if (this.y < 10)
            this.vy += (10 - this.y) * 0.5 - this.vy * 0.5;
        if (this.x > w - 10)
            this.vx += ((w - 10) - this.x) * 0.5 - this.vx * 0.5;
        if (this.y > h - 10)
            this.vy += ((h - 10) - this.y) * 0.5 - this.vy * 0.5;
    }
};

var Neighbor = function() {
    this.p1 = null;
    this.p2 = null;
    this.distance = 0;
    this.nx = 0;
    this.ny = 0;
    this.weight = 0;
};
Neighbor.prototype = {
    setParticle: function(p1, p2) {
        this.p1 = p1;
        this.p2 = p2;
        this.nx = p1.x - p2.x;
        this.ny = p1.y - p2.y;
        this.distance = Math.sqrt(this.nx * this.nx + this.ny * this.ny);
        this.weight = 1 - this.distance / (this.p1.size / 2 + this.p2.size / 2);
        var temp = this.weight * this.weight * this.weight;
        p1.density += temp;
        p2.density += temp;
        temp = 1 / this.distance;
        this.nx *= temp;
        this.ny *= temp;
    },
    calcForce: function() {

        var p1 = this.p1;
        var p2 = this.p2;
        if (this.distance < this.p1.size / 2 + this.p2.size / 2) {
            var pressureWeight = this.weight * (p1.pressure + p2.pressure) / (p1.density + p2.density) * SPH.PRESSURE;
            var viscosityWeight = this.weight / (p1.density + p2.density) * SPH.VISCOSITY;
            p1.fx += this.nx * pressureWeight;
            p1.fy += this.ny * pressureWeight;
            p2.fx -= this.nx * pressureWeight;
            p2.fy -= this.ny * pressureWeight;
            var rvx = p2.vx - p1.vx;
            var rvy = p2.vy - p1.vy;
            p1.fx += rvx * viscosityWeight;
            p1.fy += rvy * viscosityWeight;
            p2.fx -= rvx * viscosityWeight;
            p2.fy -= rvy * viscosityWeight;
        }
    },
};

var Grid = function() {
    this.particles = [];
    this.numParticles = 0;
};
Grid.prototype = {
    clear: function() {
        this.numParticles = 0;
    },
    add: function(p) {
        this.particles[this.numParticles++] = p;
    }
};

initialize();

function HSVtoRGB(h, s, v) {
    var r, g, b, i, f, p, q, t;
    if (arguments.length === 1) {
        s = h.s, v = h.v, h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0:
            r = v, g = t, b = p;
            break;
        case 1:
            r = q, g = v, b = p;
            break;
        case 2:
            r = p, g = v, b = t;
            break;
        case 3:
            r = p, g = q, b = v;
            break;
        case 4:
            r = t, g = p, b = v;
            break;
        case 5:
            r = v, g = p, b = q;
            break;
    }
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}
