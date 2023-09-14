const g1ctx = document.getElementById("graph1").getContext("2d");
const cnv = document.getElementById("brut");
//console.log(cnv, cnv.getContext("2d"));
const jscolors = ['red','blue','green','purple','gold','Crimson', 'DarkTurquoise', 'PaleVioletRed', 'Coral','MediumSlateBlue', 'MediumAquaMarine'];

class Ball {
    constructor(position, vitesse, masse, radius, charge, color) {
        this.pos = position;
        this.vit = vitesse;
        this.mas = masse;
        this.rad = radius;
        this.cha = charge;
        this.col = color;
        this.friends=[];
    }
    draw(canvasName, border) {
        const canvas = document.getElementById(canvasName);
        const ctx = canvas.getContext("2d");
        const x = this.pos[0] * canvas.width / 2 * border + canvas.width / 2;
        const y = canvas.height / 2 - this.pos[1] * canvas.height / 2 * border;
        const r = this.rad * canvas.width / 2;
        ctx.beginPath();
        ctx.linewidth = 0.5;
        ctx.strokeStyle = this.col;
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.fillStyle = this.col//'black';
        ctx.fill();
        ctx.stroke();
    }
    get den() {
        return this.mas / (Math.PI*this.rad**2)
    }
    get ene() {
        return 0.5 * this.mas * (this.vit[0] ** 2 + this.vit[1] ** 2);
    }
    get vel() {
        return Math.sqrt(this.vit[0] ** 2 + this.vit[1] ** 2);
    }
    dep() {
        let x;
        for (x in this.pos) {
            this.pos[x] += this.vit[x];
        }
    }
    acc(aVec) {
        let x;
        for (x in this.vit) {
            this.vit[x] += aVec[x];
        }
    }
}

class Gas {
    constructor(n, masse, radius, charge, color,boundType,viscosity=0) {
        let k;
        let balls = [];
        for (k = 0; k < n; k++) {
            balls.push(new Ball(
                [2 * Math.random() - 1, 2 * Math.random() - 1],
                [(2 * Math.random() - 1) * 0.001, (2 * Math.random() - 1) * 0.001],
                masse,
                radius,
                charge,
                color
            ));
        }
        this.elt = balls;
        this.boundType = boundType;
        this.animId = false;
        this.isAnimated = false;
        this.probe=[];
        this.vis=viscosity;
    }
    get n() {
        return this.elt.length;
    }

    drawLinksToFriends(canvasName,border,from,to){
        const canvas = document.getElementById(canvasName);
        const ctx = canvas.getContext("2d");
        const fromCoordinates={
            x:from.pos[0] * canvas.width / 2 * border + canvas.width / 2,
            y:canvas.height / 2 - from.pos[1] * canvas.height / 2 * border
        }
        const toCoordinates={
            x:to.pos[0] * canvas.width / 2 * border + canvas.width / 2,
            y:canvas.height / 2 - to.pos[1] * canvas.height / 2 * border
        }
        ctx.beginPath();
        ctx.linewidth = 0.5;
        ctx.strokeStyle = "black";
        ctx.moveTo(fromCoordinates.x, fromCoordinates.y);
        ctx.lineTo(toCoordinates.x,toCoordinates.y);
        ctx.stroke();
    }

    draw(canvasName, border) {
        let k;
        for (k in this.elt) {
            this.elt[k].draw(canvasName, border);
            for (let j in this.elt[k].friends){
                this.drawLinksToFriends(canvasName,border,this.elt[k],this.elt[this.elt[k].friends[j]])
            }
        }
    }

    setProbe(canvasName, property) {
        const pro = new Probe(canvasName,property);
        this.probe.push(pro);
    }

    setRacistProbe(canvasName, property) {
        const pro = new Probe(canvasName, property);
        const brkDnw = this.racism;
        let datasets = [];
        let set = {};
        for (let k of Object.keys(brkDnw)) {
            set = {
                borderColor: k,
                label: k,
                data: [brkDnw[k]],
                backgroundColor: k,
                tension: 0.0,
            }
            datasets.push(set);
        }
        pro.multiLines = datasets;
        pro.chart.update();
        this.probe.push(pro);
    }

    recordProbe(index,property, gonogo) {
        const gas = this;
        const probe = this.probe[index];
        let fullLoop = function () {
            probe.newValue = gas.properties[property];
            probe.recordId = requestAnimationFrame(fullLoop);
        }
        if (gonogo) {
            probe.reset();
            probe.recordId = requestAnimationFrame(fullLoop);
        } else {
            cancelAnimationFrame(probe.recordId);
            probe.recordId = false;
        }
    }

    monitorProbe(index,property, gonogo,length) {
        const gas = this;
        const probe = this.probe[index];
        let fullLoop = function () {
            probe.moniValue = gas.properties[property];
            probe.recordId = requestAnimationFrame(fullLoop);
        }
        if (gonogo) {
            probe.reset();
            for (let k = 0; k < length; k++) {
                probe.config.data.labels.push(" ");
                probe.config.data.datasets[0].data.push(0);
            }
            probe.recordId = requestAnimationFrame(fullLoop);
        } else {
            cancelAnimationFrame(probe.recordId);
            probe.recordId = false;
        }
    }

    recordRacistProbe(index,gonogo) {
        const gas = this;
        const probe = this.probe[index];
        let fullLoop = function () {
            probe.multiNewValue = gas.racism;
            probe.recordId = requestAnimationFrame(fullLoop);
        }
        if (gonogo) {
            probe.reset();
            probe.recordId = requestAnimationFrame(fullLoop);
        } else {
            cancelAnimationFrame(probe.recordId);
            probe.recordId = false;
        }
    }

    monitorRacistProbe(index, gonogo,length){
        const gas = this;
        const probe = this.probe[index];
        let fullLoop = function () {
            probe.moniMulti = gas.racism;
            probe.recordId = requestAnimationFrame(fullLoop);
        }
        if (gonogo) {
            probe.reset();
            for (let k = 0; k < length; k++) {
                probe.config.data.labels.push(" ");
                probe.config.data.datasets[0].data.push(0);
            }
            probe.recordId = requestAnimationFrame(fullLoop);
        } else {
            cancelAnimationFrame(probe.recordId);
            probe.recordId = false;
        }
    }

    remove(k) {
        elt.splice(k, 1);
    }
    
    get properties() {
        let sumEnergy = 0;
        for (let k of this.elt) {
            sumEnergy += k.ene;
        }
        let prop = {
            N: this.elt.length,
            Energy: sumEnergy,
        }
        return prop
    }

    get racism() {
        const elt = this.elt;
        let races = new Set;
        let breakDown = {};
        for (let i of elt) {
            races.add(i.col);
        }
        races= new Set(Array.from(races).sort())
        for (let k of races) {
            breakDown[k] = 0;
        }
        for (let i of elt) {
            breakDown[i.col]++;
        }
        return breakDown;
    }

    makeDiatomicMolecules(){
        for(let k=1;k<this.n;k+=2){
            this.elt[k].friends.push(k-1)
        }
    }

    makeDipoles(){
        for(let k=1;k<this.n;k+=2){
            this.elt[k].friends.push(k-1)
            this.elt[k].cha=0.001
            this.elt[k].col='crimson'
            this.elt[k-1].cha=-0.001
            this.elt[k-1].col='darkturquoise'
        }
    }

    makeHexagones(){
        for(let k=5;k<this.n;k+=6){
            this.elt[k].friends.push(k-5)
            for(let i=0;i<5;i++){
                this.elt[k-i].friends.push(k-i-1)
            }
        }
    }

    makeRandomMolecule(){
        for(let k=0;k<this.n;k++){
            for(let i=0;i<k;i++){
                if(Math.random()<0.1)[
                    this.elt[k].friends.push(i)
                ]
            }
        }
    }

    splitColor(num) {
        let k;
        let i;
        let n = this.properties.N;
        for (k = 0; k < num; k++) {
            for (i = k*n / num; i < n * (k + 1) / num; i++) {
                this.elt[Math.floor(i)].col = jscolors[k];
            }
        }
    }

    set rad(value) {
        for (let ball of this.elt) {
            ball.rad = value;
        }
    }

    set mas(value) {
        for (let ball of this.elt) {
            ball.mas = value;
        }
    }

    set cha(value) {
        for (let ball of this.elt) {
            ball.cha = value;
        }
    }

    set col(value) {
        for (let ball of this.elt) {
            ball.col = value;
        }
    }

    heat(fac) {
        for (let ball of this.elt) {
            ball.vit[0] *= fac;
            ball.vit[1] *= fac;
        }
    }

    collide(k, i) {
        const a = this.elt[k];
        const b = this.elt[i];
        let dis = Math.sqrt((a.pos[0] - b.pos[0]) ** 2 + (a.pos[1] - b.pos[1]) ** 2);
        let secu = a.rad + b.rad;
        if (dis < secu) {
            let Un = [(b.pos[0] - a.pos[0]) / dis, (b.pos[1] - a.pos[1]) / dis];
            let Ut = [-Un[1],Un[0]];
            let c2 = b.vit;
            //let rapmas = a.mas / b.mas;
            let V1 = [a.vit[0] - b.vit[0], a.vit[1] - b.vit[1]];//vitesse dans le referentiel de la cible
            let Vpz = [Ut[0] * V1[0] + Ut[1] * V1[1], Un[0] * V1[0] + Un[1] * V1[1]];//composantes tengeantes et normales au plan de contact
            a.vit[0] = (a.mas-b.mas)/(a.mas+b.mas)*Vpz[1]*Un[0] + Vpz[0] * Ut[0] + c2[0];
            a.vit[1] = (a.mas-b.mas)/(a.mas+b.mas)*Vpz[1]*Un[1] + Vpz[0] * Ut[1] + c2[1];
            b.vit[0] = (2*a.mas)/(a.mas+b.mas)*Vpz[1] * Un[0] + c2[0];
            b.vit[1] = (2*a.mas)/(a.mas+b.mas)*Vpz[1] * Un[1] + c2[1];
            let cenma = 2 * (a.mas + b.mas)
            b.pos[0] += 0.5 * a.mas / cenma * (secu - dis) * Un[0];
            b.pos[1] += 0.5 * a.mas / cenma * (secu - dis) * Un[1];
            a.pos[0] -= 0.5 * b.mas / cenma * (secu - dis) * Un[0];
            a.pos[1] -= 0.5 * b.mas / cenma * (secu - dis) * Un[1];
            this.chimie(a, b,1,1);
        }
    }

    coulomb(k, i) {
        const a = this.elt[k];
        const b = this.elt[i];
        let epsilon = 1e4;
        let dis = Math.sqrt((a.pos[0] - b.pos[0]) ** 2 + (a.pos[1] - b.pos[1]) ** 2);
        let procha = a.cha * b.cha;
        let Un = [procha*(b.pos[0] - a.pos[0]) / (epsilon * dis ** 3), procha*(b.pos[1] - a.pos[1]) / (epsilon * dis ** 3)];
        a.vit[0] -= Un[0] / a.mas;
        a.vit[1] -= Un[1] / a.mas;
        b.vit[0] += Un[0] / b.mas;
        b.vit[1] += Un[1] / b.mas;
    }

    chimie(a,b,p1,p2) {
        if (Math.random()<p1 && (a.col == jscolors[0] && b.col == jscolors[1]) || (a.col == jscolors[1] && b.col == jscolors[0])) {
            a.col = jscolors[2];
            b.col = jscolors[3];
        } else if (Math.random()<p2 && (a.col == jscolors[2] && b.col == jscolors[3]) || (a.col == jscolors[3] && b.col == jscolors[2])) {
            a.col = jscolors[0];
            b.col = jscolors[1];
        }
    }

    harmonicFriends(ball,R,k){
        let a=ball
        let b=0
        let dis=0
        let Ur=[0,0]
        for (let friendex of ball.friends){
            b=this.elt[friendex]
            dis = Math.sqrt((a.pos[0] - b.pos[0]) ** 2 + (a.pos[1] - b.pos[1]) ** 2)
            Ur=[(b.pos[0]-a.pos[0])/dis,(b.pos[1]-a.pos[1])/dis]
            b.vit[0] += Ur[0]*(R-dis)*(a.mas+b.mas)*k/b.mas**2
            b.vit[1] += Ur[1]*(R-dis)*(a.mas+b.mas)*k/b.mas**2
            a.vit[0] -= Ur[0]*(R-dis)*(a.mas+b.mas)*k/a.mas**2
            a.vit[1] -= Ur[1]*(R-dis)*(a.mas+b.mas)*k/a.mas**2
        }
    }
    
    b2bAccelarations() {
        let a;
        let b;
        for (let k = 0; k < this.n; k++) {
            this.harmonicFriends(this.elt[k],0.06,0.1)
            for (let i = 0; i < k; i++) {
                this.collide(k, i);
                this.coulomb(k, i)
            }
        }
    }

    extFields() {
        for (let k = 0; k < this.n; k++) {
            //weight:
            this.elt[k].vit[1] -= 0.000001;
            //viscosity:
            this.elt[k].vit.forEach((e,i,a)=>{a[i]-=this.vis*a[i]})
        }
    }

    cinematic() {
        for (let ball of this.elt) {
            ball.dep();
        }
    }

    kruskal(canvasName, border) {
        let d1 = new Date();
        let t1 = d1.getTime();
        let nodes = [];
        let parent = [0];
        let n = this.n;
        let p = n * (n - 1) / 2;
        for (let k = 1; k < n; k++) {
            parent.push(k);
            for (let i = 0; i < k; i++) {
                const a = this.elt[k];
                const b = this.elt[i];
                let dis = Math.sqrt((a.pos[0] - b.pos[0]) ** 2 + (a.pos[1] - b.pos[1]) ** 2);
                nodes.push([dis, a, b, k, i,1]);
            }
        }
        nodes=nodes.sort()//function (c, d) { c[0] - d[0] });
        for (let j = 0; j < p; j++) {
            let parA = find(nodes[j][3], parent);
            let parB = find(nodes[j][4], parent);
            if (parA == parB) {
                nodes[j][5] = 0;
            } else {
                union(nodes[j][3], nodes[j][4], parent);
            }
        }
        let d2 = new Date();
        let t2 = d2.getTime();
        console.log(t2 - t1);
        this.mstNodes = nodes;
        draw(nodes, canvasName, border);

        function draw(nodes, canvasName, border) {
            const canvas = document.getElementById(canvasName);
            const ctx = canvas.getContext("2d");
            const n = nodes.length;
            let x;
            let y;
            ctx.linewidth = 1;
            ctx.strokeStyle = 'black';
            for (let j = 0; j < n; j++) {
                if(nodes[j][5]){
                    x = nodes[j][1].pos[0] * canvas.width / 2 * border + canvas.width / 2;
                    y = canvas.height / 2 - nodes[j][1].pos[1] * canvas.height / 2 * border;
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    x = nodes[j][2].pos[0] * canvas.width / 2 * border + canvas.width / 2;
                    y = canvas.height / 2 - nodes[j][2].pos[1] * canvas.height / 2 * border;
                    ctx.lineTo(x, y);
                    ctx.stroke();
                }
            }
        }
    }

    boundaries() {
        switch (this.boundType) {
            default:
                for (let ball of this.elt) {
                    if ((Math.abs(ball.pos[0]) > (1 - ball.rad))) {
                        ball.vit[0] *= - 1;
                        ball.pos[0] = Math.sign(ball.pos[0]) * (1 - ball.rad);
                    }
                    if ((Math.abs(ball.pos[1]) > (1 - ball.rad))) {
                        ball.vit[1] *= - 1;
                        ball.pos[1] = Math.sign(ball.pos[1]) * (1 - ball.rad);
                    }
                }
                break;
            case 'torus':
                for (let ball of this.elt) {
                    if ((Math.abs(ball.pos[0]) > (1 + ball.rad))) {
                        ball.pos[0] *= -1;
                    }
                    if ((Math.abs(ball.pos[1]) > (1 + ball.rad))) {
                        ball.pos[1] *= -1;
                    }
                }
                break;
        }
    }

    simulate(steps) {
        let k = 0;
        let blindLoop = function (k, steps) {
            this.boundaries();
            this.b2bAccelarations();
            this.extFields();
            this.cinematic();
            if (k < steps) {
                blindLoop(k + 1, steps);
            }
        }
    }

    clearBoard(canvasName, border, alpha) {
        const canvas = document.getElementById(canvasName);
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = 'rgba(255, 255, 255,'+alpha+')';
        ctx.fillRect((1 - border) * canvas.width / 2, (1 - border) * canvas.height/2, canvas.width * border, canvas.height * border);
    }

    animate(canvasName,border,gonogo) {
        const gas = this;
        //gas.clearBoard(canvasName, border, 1);
        let fullLoop = function () {
            gas.boundaries();
            gas.b2bAccelarations();
            gas.extFields();
            gas.cinematic();
            //gas.kruskal(canvasName, border);
            gas.clearBoard(canvasName, border,0.05);
            gas.draw(canvasName, border);
            document.getElementById('brkdwnHolder').innerText=gas.racism.toString();
            gas.animId=requestAnimationFrame(fullLoop);
        }
        if (gonogo) {
            console.log(gas.animId);
            if (gas.animId > 0) {
                console.log('ZOB!!!');
            }
            gas.clearBoard(canvasName, border, 1);
            gas.animId = requestAnimationFrame(fullLoop);
        } else{
            cancelAnimationFrame(gas.animId);
            gas.animId = false;
        }
    }
}

function find(k,parent) {
    if (k == parent[k]) {
        return k;
    }
    return find(parent[k], parent);
}

function union(a, b, parent) {
    let c = find(a, parent);
    let d = find(b, parent);
    if (c!=d) {
        parent[d] = c;
    }
}

class Session {
    constructor() {
        this.gases = [];
        this.worldBoundType = 'box';
    }
    set worldBoundType(value) {
        for (let i of this.gases) {
            i.boundType = value;
        }
    }
}

class Probe {
    constructor(canvasName, property) {
        this.canvas = canvasName
        this.property = property;
        this.ctx = document.getElementById(canvasName).getContext("2d");
        this.config = {
            type: "line",
            data: {
                labels: [],
                datasets: [
                    {
                    borderColor: 'rgb(255, 99, 132)',
                    label: property,
                    data: [],
                    backgroundColor: 'rgb(255, 99, 132)',
                    tension: 0.0,
                    }
                ],
            },
            options: {
                elements: {
                    point: {
                        pointRadius:0
                    }
                },
                datasets: {
                    line: {
                        showLine: true
                    }
                },
                animation:false,
                plugins: {
                    tooltip: {
                        enabled: false
                    },
                    legend: {
                        display: true
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false,
                            drawTicks: false,
                            color: 'black'
                        }

                    },

                }
            }
        }
        this.recordID = false;
        this.chart = new Chart(this.ctx, this.config);
    }

    reset() {
        this.config.data.labels = [];
        this.config.data.datasets.forEach((e)=>{e.data=[]})
        this.chart.update();
    }

    set newValue(value) {
        this.config.data.labels.push(" ");
        this.config.data.datasets[0].data.push(value);
        this.chart.update();
    }

    set moniValue(value) {
        this.config.data.labels.shift();
        this.config.data.datasets[0].data.shift();
        this.config.data.labels.push(" ");
        this.config.data.datasets[0].data.push(value);
        this.chart.update();
    }
    get refreshChart() {
        this.chart.destroy()
        this.chart = new Chart(this.ctx, this.config);
    }

    set multiNewValue(value) {//value must be a racism object
        this.config.data.labels.push(" ");
        const n = this.config.data.datasets.length;
        for (let k = 0; k < n; k++) {
            if(value[this.config.data.datasets[k].label]==undefined){
                this.config.data.datasets[k].data.push(0)
            }else{
                this.config.data.datasets[k].data.push(value[this.config.data.datasets[k].label]);
            }
            delete value[this.config.data.datasets[k].label]
        }
        set={}
        for (let k of Object.keys(value)) {
            set = {
                borderColor: k,
                label: k,
                data: Array(this.config.data.labels.length - 1),
                backgroundColor: k,
                tension: 0.0,
            }
            set.data.push(value[k])
            this.config.data.datasets.push(set);
        };
        this.chart.update();
    }

    set moniMulti(value){
        this.config.data.labels.shift();
        this.config.data.labels.push(" ");
        const n = this.config.data.datasets.length;
        for (let k = 0; k < n; k++) {
            this.config.data.datasets[k].data.shift();
            if(value[this.config.data.datasets[k].label]==undefined){
                this.config.data.datasets[k].data.push(0)
            }else{
                this.config.data.datasets[k].data.push(value[this.config.data.datasets[k].label]);
            }
            delete value[this.config.data.datasets[k].label]
        }
        set={}
        for (let k of Object.keys(value)) {
            set = {
                borderColor: k,
                label: k,
                data: Array(this.config.data.labels.length - 1),
                backgroundColor: k,
                tension: 0.0,
            }
            set.data.push(value[k])
            this.config.data.datasets.push(set);
        };
        this.chart.update();
    }

    get lineMap() {
        let tab = new Map;
        for (let k in this.config.data.datasets) {
            tab.set(this.config.data.datasets[k].label, k);
        }
        return tab
    }

    set multiLines(value) {
        this.config.data.datasets = [];
        let maxsize = 0;
        for (let i of value) {
            this.config.data.datasets.push(i);
            maxsize = Math.max(maxsize, i.data.length);
        }
        this.config.data.labels = Array(maxsize);
        this.config.data.labels.fill(" ");
    }
}

let data = {
    labels: [],
    datasets: [{
        label: 'Scatter Dataset',
        data: [],
        backgroundColor: 'rgb(255, 99, 132)',
        tension: 0.1,
    }],
};
let options = {
    plugins: {
        tooltip: {
            enabled: false
        },
        legend: {
            display: true
        }
    },
    scales: {
        x: {
            grid: {
                display:false,
                drawTicks: false,
                color:'black'
            }

        },
        
    }
}
let config = {
    type: "line",
    data: data,
    options: options
}

//let lineGraph = new Chart(g1ctx, config);

function coulomb(position, vitesse, charge, masse, k, i) {
    let epsilon = 1e6;
    let dis = Math.sqrt((position[k].x - position[i].x) ** 2 + (position[k].y - position[i].y) ** 2);
    let procha = charge[k] * charge[i];
    let vec = { x: procha * (position[i].x - position[k].x) / (4 * Math.PI * epsilon * (1e-3 + Math.pow(dis, 3))), y: procha * (position[i].y - position[k].y) / (4 * Math.PI * epsilon * (1e-3 + Math.pow(dis, 3))) };
    if (dis==0) {
        console.log(vec)
    }
    vitesse[k].x -= vec.x/masse[k];
    vitesse[k].y -= vec.y/masse[k];
    vitesse[i].x += vec.x / masse[i];
    vitesse[i].y += vec.y / masse[i];
}

let cur = new Session()
cur.gases[0] = new Gas(0, 1, 0.01, 0, 'black', 'box');
cur.gases[0].setProbe("graph1", "Energy");
cur.gases[0].setRacistProbe("graph2","Chemistry")

document.getElementById("torus").addEventListener('click', function (e) {
    cur.worldBoundType='torus';
});

document.getElementById("box").addEventListener('click', function (e) {
    cur.worldBoundType = 'box';
});

function radioValue(name) {
    let itemList = document.getElementsByName(name);
    let n = itemList.length;
    let k;
    let res;
    for (k = 0; k < n; k++) {
        if (itemList[k].checked) {
            return itemList[k].value;
        }
    }
}

document.getElementById("set").addEventListener('click', (e) => {
    cur.gases[0].isAnimated = false;
    cur.gases[0].animate("brut", 1, false);
    const n = document.getElementById("nbptcl").valueAsNumber;
    const m = document.getElementById("inMass").valueAsNumber;
    const r = document.getElementById("inRadius").valueAsNumber;
    const c = document.getElementById("inCharge").valueAsNumber;
    const colo = (document.getElementById("inColor").value=="#000000" ? 'black' : document.getElementById("inColor").value);
    const bt = radioValue("world");
    cur.gases[0].probe[0].chart.destroy();
    cur.gases[0].probe[1].chart.destroy();
    cur.gases[0] = new Gas(n, m, r, c, colo, bt);
    cur.gases[0].setProbe("graph1", "Energy");
    cur.gases[0].setRacistProbe("graph2","Chemistry");
    cur.gases[0].clearBoard("brut", 1, 1);
    cur.gases[0].draw("brut", 1);
})

document.getElementById("LaunchSimu").addEventListener('click', function (e) {
    if (cur.gases[0].isAnimated==false) {
        cur.gases[0].isAnimated = true;
        cur.gases[0].animate("brut", 1, true);
    }
}
);

document.getElementById("updateGas").addEventListener('click', (e) => {
    const m = document.getElementById("inMass").valueAsNumber;
    cur.gases[0].mas = m;
    const r = document.getElementById("inRadius").valueAsNumber;
    cur.gases[0].rad = r;
    const c = document.getElementById("inCharge").valueAsNumber;
    cur.gases[0].cha = c;
    const colo = (document.getElementById("inColor").value=="#000000" ? 'black' : document.getElementById("inColor").value);
    cur.gases[0].col = colo;
})

document.getElementById("StopSimu").addEventListener('click', function (e) {
    cur.gases[0].isAnimated = false;
    cur.gases[0].animate("brut", 1, false);
}
);

document.getElementById("hup").addEventListener('click', function (e) {
    cur.gases[0].heat(1.1);
}
);

document.getElementById("cdo").addEventListener('click', function (e) {
    cur.gases[0].heat(0.9);
}
);

document.getElementById("fre").addEventListener('click', function (e) {
    cur.gases[0].heat(0.0);
}
);

document.getElementById("setChem").addEventListener('click', function (e) {
    cur.gases[0].splitColor(2);
    cur.gases[0].clearBoard("brut", 1, 1);
    cur.gases[0].draw("brut", 1);
}
);

document.getElementById("Monitor1").addEventListener('click', function (e) {
    cur.gases[0].monitorProbe(0,"Energy",true,150);
}
);

document.getElementById("Rec1").addEventListener('click', function (e) {
    cur.gases[0].recordProbe(0,"Energy",true);
}
);

document.getElementById("Res1").addEventListener('click', function (e) {
    cur.gases[0].probe[0].reset();
}
);

document.getElementById("Stop1").addEventListener('click', function (e) {
    cur.gases[0].recordProbe(0, "Energy", false);
}
);

document.getElementById("Monitor2").addEventListener('click', function (e) {
    cur.gases[0].monitorRacistProbe(1,true,150);
}
);
document.getElementById("Res2").addEventListener('click', function (e) {
    cur.gases[0].probe[1].reset();
}
);
document.getElementById("Rec2").addEventListener('click', function (e) {
    cur.gases[0].recordRacistProbe(1,true);
}
);
document.getElementById("Stop2").addEventListener('click', function (e) {
    cur.gases[0].recordRacistProbe(1,false);
}
);



function bench(n) {
    d1 = new Date();
    t1 = d1.getTime();
    let res = 0;
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            for (let k = 0; k < n; k++) {
                res += Math.sqrt(1 / (1+i + j + k ));
            }
        }
    }
    d2 = new Date();
    t2 = d2.getTime();
    console.log(res,t2-t1);
}






function readSingleFile(e) {
    var file = e.target.files[0];
    console.log(file)
    if (!file) {
        return;
    }
    var reader = new FileReader();
    reader.onload = function (e) {
        var contents = e.target.result;
        displayContents(contents);
    };
    reader.readAsText(file);
}

function displayContents(contents) {
    var element = document.getElementById('file-content');
    element.textContent = contents;
}

document.getElementById('file-input')
    .addEventListener('change', readSingleFile, false);