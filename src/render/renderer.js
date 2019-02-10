import LatentGraph from './latent-graph';
import NN from './nn';
import { Noise } from 'noisejs';


function lerp(v, s1, e1, s2, e2) {
  return (v - s1) * (e2 - s2) / (e1 - s1);
}

export default class Renderer {
  constructor(app, canvas) {
    this.app = app;
    this.canvas = canvas;
    this.matrix = [];
    this.latent = [];
    this.latentDisplay = [];
    this.dist = 0;
    this.beat = 0;
    this.TWEEN = this.app.TWEEN;

    this.frameCount = 0;
    this.halt = true;

    // this.backgroundColor = 'rgba(37, 38, 35, 1.0)';
    this.backgroundColor = 'rgba(15, 15, 15, 1.0)';
    this.noteOnColor = 'rgba(255, 255, 255, 1.0)';
    this.mouseOnColor = 'rgba(150, 150, 150, 1.0)';
    this.noteOnCurrentColor = 'rgba(255, 100, 100, 1.0)';
    this.redColor = this.noteOnCurrentColor;
    this.whiteColor = this.noteOnColor;
    this.boxColor = 'rgba(200, 200, 200, 1.0)';
    this.extendAlpha = 0;
    this.currentUpdateDir = 0;
    this.selectedLatent = 20;

    this.gridWidth = 0;
    this.gridHeight = 0;
    this.gridXShift = 0;
    this.gridYShift = 0;
    this.mouseOnIndex = [-1, -1];

    this.latentGraph = new LatentGraph(this);
    this.decoder = new NN(this);
    this.encoder = new NN(this);


    // fake data
    this.showingLatents = false;
    this.latents = [[], [], []];
    this.latentGraphs = [];
    this.noise = new Noise(Math.random());

    // ani
    this.blinkAlpha = 0;
    this.diffAnimationRadiusRatio = 4;

    this.initMatrix();
    this.setDefaultDisplay();
  }

  triggerDisplay() {
    if (this.showingLatents) {
      this.setDefaultDisplay();
    } else {
      this.setMultipleDisplay();
    }
  }

  setDefaultDisplay() {
    this.showingLatents = false;

    this.latentGraph.radiusRatio = 0.65;
    this.latentGraph.widthRatio = 1.0;
    this.latentGraph.heightRatio = 1.7;
    this.latentGraph.xShiftRatio = 0;
    this.latentGraph.yShiftRatio = 1.0;
    this.latentGraph.showIndication = false;
  }

  setMultipleDisplay() {
    this.showingLatents = true;
    this.latentGraph.radiusRatio = 0.5;
    this.latentGraph.widthRatio = 0.5;
    this.latentGraph.heightRatio = 2.0;
    this.latentGraph.xShiftRatio = -0.25;
    this.latentGraph.yShiftRatio = 0.6;
  }

  initMatrix() {
    for (let i = 0; i < 96; i += 1) {
      this.matrix[i] = [];
      for (let t = 0; t < 9; t += 1) {
        this.matrix[i][t] = (Math.random() > 0.5 ? 1 : 0);
      }
    }

    for (let i = 0; i < 32; i += 1) {
      this.latent[i] = 0;
      this.latentDisplay[i] = 0;
      for (let j = 0; j < 3; j += 1) {
        this.latents[j][i] = -0.01 + 0.02 * Math.random();
      }
    }

    this.latentGraphs[0] = new LatentGraph(
      this, 0.2, 0.5, 0.5, 0.25, 0.6 + 0.75);
    this.latentGraphs[1] = new LatentGraph(
      this, 0.2, 0.5, 0.5, 0.25, 0.6);
    this.latentGraphs[2] = new LatentGraph(
      this, 0.2, 0.5, 0.5, 0.25, 0.6 - 0.75);
    this.latentGraphs[0].setDisplay();
    this.latentGraphs[1].setDisplay();
    this.latentGraphs[2].setDisplay();
  }

  randomMatrix() {
    for (let i = 0; i < 96; i += 1) {
      for (let t = 0; t < 9; t += 1) {
        this.matrix[i][t] = (Math.random() > 0.9 ? 1 : 0);
      }
    }
  }

  changeMatrix(mat) {
    this.halt = false;
    this.matrix = mat;
  }

  draw(scr, b) {

    if (this.halt) {
      if (this.frameCount % 5 == 0) {
        this.randomMatrix();
      }
    }
    this.frameCount += 1;
    this.beat = b;
    const ctx = this.canvas.getContext('2d');
    ctx.font = '1rem monospace';
    this.width = scr.width;
    this.height = scr.height;
    const width = scr.width;
    const height = scr.height;


    ctx.save();
    ctx.fillStyle = this.backgroundColor;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const h = Math.min(width, height) * 0.18;
    const w = width * 0.5;
    this.dist = h * 1.2;
    this.gridWidth = w;
    this.gridHeight = h;
    this.gridYShift = -h * 1.5 ;

    ctx.translate(width * 0.5, height * 0.5);

    this.drawVAE(ctx);

    this.drawGrid(ctx, w, h);
    this.latentGraph.draw(ctx, this.latent, this.dist);

    if (this.showingLatents) {
      this.drawLatents(ctx);
    }
    ctx.restore();
  }

  drawGrid(ctx, w, h) {
    const { instructionStage } = this.app.state;
    ctx.save();
    ctx.translate(this.gridXShift, this.gridYShift)

    this.drawFrame(ctx, this.gridWidth * 1.1, this.gridHeight * 1.1);
    this.drawBlink(ctx);

    ctx.translate(w * -0.5, h * -0.5);
    const w_step = w / 96;
    const h_step = h / 9;

    // change
    if (this.app.diffAnimationAlpha > 0) {
      this.app.diffMatrix.forEach(x => {
        const { i, j, value } = x;
        const t = i;
        const d = 8 - j;
        ctx.save();
        ctx.translate((t + 0.5) * w_step, (d + 0.5) * h_step);
        ctx.beginPath();
        if (value > 0) {
          ctx.strokeStyle = `rgba(255, 255, 255, ${this.app.diffAnimationAlpha})`;
        } else {
          ctx.strokeStyle = `rgba(255, 100, 100, ${this.app.diffAnimationAlpha})`;
        }
        const radius = w_step * (1 - this.app.diffAnimationAlpha) * this.diffAnimationRadiusRatio;
        ctx.arc(0, 0, radius, 0, Math.PI * 2, true);
        ctx.stroke();
        ctx.restore();
      })
    }



    for (let t = 0; t < 96; t += 1) {

      if (t === this.beat) {
        const pos = Math.floor(t / 6) * 6;
        ctx.save();
        ctx.translate((pos + 0.5) * w_step, 9.5 * h_step);
        ctx.fillStyle = this.noteOnCurrentColor;
        ctx.beginPath();
        ctx.arc(0, 0, w_step * 0.5, 0, 2 * Math.PI, true);
        ctx.fill();
        ctx.restore();
      } else if (t % 6 === 0) {
        ctx.save();
        ctx.translate((t + 0.5) * w_step, 9.5 * h_step);
        ctx.strokeStyle = this.noteOnCurrentColor;
        ctx.beginPath();
        ctx.arc(0, 0, w_step * 0.1, 0, 2 * Math.PI, true);
        ctx.stroke();
        ctx.restore();
      }

      for (let d = 0; d < 9; d += 1) {
        let recW = w_step;
        let recH = h_step;
        ctx.save();
        ctx.translate((t + 0.5) * w_step, (d + 0.5) * h_step);
        if (this.matrix[t][8 - d] > 0) {

          if (Math.abs(this.beat - t) < 2) {
            ctx.fillStyle = this.noteOnCurrentColor;
            recW = w_step * 1.5;
            recH = h_step * 0.8;
          } else {
            ctx.fillStyle = this.noteOnColor;
            if (t % 6 === 0) {
              recW = w_step * 1.0;
              recH = h_step * 0.5;
            } else {
              recW = w_step * 0.8;
              recH = h_step * 0.4;
            }
          }
        } else {
          // ctx.fillStyle = this.boxColor;
          if (t % 24 === 0) {
            ctx.fillStyle = 'rgba(255, 255, 255, 1)';
          } else {
            ctx.fillStyle = 'rgba(46, 204, 113, 1)';
          }

          if (t % 6 === 0) {
            recW = w_step * 0.1;
            recH = h_step * 0.3;
          } else {
            recW = w_step * 0.08;
            recH = h_step * 0.15;
          }
        }

        if (
          t === this.mouseOnIndex[0] &&
          d === this.mouseOnIndex[1]
        ) {
          ctx.fillStyle = 'rgba(46, 204, 113, 1)';
          recW = w_step * 1.0;
          recH = h_step * 0.5;

          ctx.beginPath();
          const value = Math.sin(this.frameCount * 0.05);
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.5 - 0.2 * value})`;
          ctx.arc(0, 0, this.latentGraph.graphRadius * 0.15 * (1 + 0.3 * value), 0, Math.PI * 2, true);
          ctx.stroke();
        }

        ctx.translate(-0.5 * recW, -0.5 * recH);
        ctx.fillRect(0, 0, recW, recH);
        ctx.restore();
      }
    }
    ctx.restore();
  }

  handleLatentGraphClick(x, y) {
    const { graphX, graphY } = this.latentGraph;
    const r = Math.pow(this.dist, 2);
    const angle = 2 * Math.PI / 32;

    if (Math.pow(x - graphX, 2) + Math.pow(y - graphY, 2) < r * 1.2) {
      const xpos = x - graphX;
      const ypos = y - graphY;
      let theta = Math.atan2(ypos, xpos) + 0.5 * angle;
      if (theta < 0) {
        theta += Math.PI * 2;
      }
      const id = Math.floor(theta / angle);
      this.selectedLatent = id;
      return true;

    }
    return false;
  }

  handleMouseDown(e) {
    let cx = e.clientX - this.width * 0.5;;
    let cy = e.clientY - this.height * 0.5;

    return [
      this.handleLatentGraphClick(cx, cy),
      this.handleMouseDownOnGrid(),
    ];
  }

  handleDraggingOnGraph(e) {
    const { dragging } = this.app.state;
    const { graphX, graphY, graphRadius, graphRadiusRatio } = this.latentGraph;
    const r = Math.pow(this.dist, 2);
    let x = e.clientX - this.width * 0.5;
    let y = e.clientY - this.height * 0.5;
    let d1 = Math.pow(x - graphX, 2) + Math.pow(y - graphY, 2);
    if (d1 < r * 1.2 & d1 > r * 0.1) {

      if (dragging) {
        const d = Math.sqrt(d1);
        const range = 0.1;
        const radius = range * graphRadiusRatio * this.dist + graphRadius;
        const v = lerp(d, graphRadius, radius, 0, range);
        this.latent[this.selectedLatent] = v;
      } else {
        this.handleLatentGraphClick(x, y);
      }
    }
  }

  handleMouseMove(e) {
    this.latentGraph.handleMouseMove(e);
    const x = e.clientX - (this.width * 0.5 + this.gridXShift - this.gridWidth * 0.5);
    const y = e.clientY - (this.height * 0.5 + this.gridYShift - this.gridHeight * 0.5);
    const w = this.gridWidth;
    const h = this.gridHeight;
    const w_step = w / 96;
    const h_step = h / 9;

    if (x > 0 && x < w && y > 0 && y < h) {
      const xpos = Math.floor(x / w_step);
      const ypos = Math.floor(y / h_step);
      this.mouseOnIndex = [xpos, ypos];
      // console.log(`${xpos}, ${ypos}`);
    } else {
      this.mouseOnIndex = [-1, -1];
    }
  }

  handleMouseDownOnGrid() {
    const p = this.mouseOnIndex;
    if (p[0] != -1 && p[1] != -1) {
      return true;
    }
    return false;
  }

  // frame
  drawFrame(ctx, w, h) {
    const unit = this.dist * 0.04;

    ctx.save();

    ctx.strokeStyle = '#FFF';

    ctx.beginPath()
    ctx.moveTo(0.5 * w, 0.5 * h - unit);
    ctx.lineTo(0.5 * w, 0.5 * h);
    ctx.lineTo(0.5 * w - unit, 0.5 * h);
    ctx.stroke();

    ctx.beginPath()
    ctx.moveTo(-0.5 * w, 0.5 * h - unit);
    ctx.lineTo(-0.5 * w, 0.5 * h);
    ctx.lineTo(-0.5 * w + unit, 0.5 * h);
    ctx.stroke();

    ctx.beginPath()
    ctx.moveTo(0.5 * w, -0.5 * h + unit);
    ctx.lineTo(0.5 * w, -0.5 * h);
    ctx.lineTo(0.5 * w - unit, -0.5 * h);
    ctx.stroke();

    ctx.beginPath()
    ctx.moveTo(-0.5 * w, -0.5 * h + unit);
    ctx.lineTo(-0.5 * w, -0.5 * h);
    ctx.lineTo(-0.5 * w + unit, -0.5 * h);
    ctx.stroke();

    ctx.restore();
  }

  drawLatents(ctx) {
    for (let i = 0; i < 3; i += 1) {
      for (let j = 0; j < 12; j += 1) {
        const value = this.noise.perlin2(i * 2 + j * 0.1, this.frameCount * 0.005);
        this.latents[i][j] = lerp(value, 0, 1, -0.01, 0.01);
      }
      this.latentGraphs[i].draw(ctx, this.latents[i], this.dist);

    }
  }

  // vae
  drawVAE(ctx) {
    ctx.save();
    ctx.fillStyle = '#555';
    ctx.textAlign = 'center';
    ctx.font = '1rem monospace';

    // encoder
    ctx.save();

    ctx.translate(this.gridWidth * 0.25, this.gridHeight * -0.4);
    this.drawFrame(ctx, this.gridWidth * 0.4, this.gridHeight * 0.6);

    ctx.save();
    ctx.translate(this.gridWidth * -0.08, this.gridHeight * -0.3);
    ctx.fillText('encoder', 0, 0);
    ctx.restore();

    this.encoder.draw(ctx);

    ctx.restore();

    // decoder
    ctx.save();

    ctx.translate(this.gridWidth * -0.25, this.gridHeight * -0.4);
    this.drawFrame(ctx, this.gridWidth * 0.4, this.gridHeight * 0.6);

    ctx.save();
    ctx.translate(this.gridWidth * -0.08, this.gridHeight * -0.3);
    ctx.fillText('decoder', 0, 0);
    ctx.restore();

    this.decoder.draw(ctx);

    ctx.restore();

    ctx.restore();
  }

  decoderAniStart(callback) {
    this.diffAnimationRadiusRatio = 4;

    const aniMatrix = new this.TWEEN.Tween({ t: 0 })
      .onStart(callback)
      .to({ t: 1 }, 300);

    let aniBlink = this.latentGraph.aniBlink();
    let aniDecoder = this.decoder.aniDecoder(aniMatrix);

    aniBlink.start();
    aniDecoder.start();
  }


  encoderAniStart(callback) {
    this.diffAnimationRadiusRatio = 8;

    const aniChange = this.latentGraph.aniChange();
    const aniMatrix = new this.TWEEN.Tween({ t: 0 })
      .onStart(callback)
      .to({ t: 1 }, 1)
      .chain(aniChange);

    // aniChange.onStart(callback);
    const aniEncoder = this.encoder.aniEncoder(aniMatrix);


    // aniBlink.start();
    aniEncoder.start();
  }

  drawBlink(ctx) {
    ctx.save();

    ctx.translate(this.gridWidth * -0.55, this.gridHeight * -0.55);
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.sin(this.blinkAlpha * Math.PI)})`;
    ctx.fillRect(0, 0, this.gridWidth * 1.1, this.gridHeight * 1.1)

    ctx.restore();
  }
}
