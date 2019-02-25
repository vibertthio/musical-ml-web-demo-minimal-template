export default class Renderer {
  // Initialization
  constructor(app, canvas) {
    this.app = app;
    this.canvas = canvas;
    this.TWEEN = this.app.TWEEN;

    this.beat = 0;
    this.frameCount = 0;
    this.dist = 0;
    this.gridWidth = 0;
    this.gridHeight = 0;
    this.gridXShift = 0;
    this.gridYShift = 0;
    this.mouseOnIndex = [-1, -1];
    this.diffAnimationRadiusRatio = 4;

    // Colors
    this.backgroundColor = 'rgba(15, 15, 15, 1.0)';
    this.noteOnColor = 'rgba(255, 255, 255, 1.0)';
    this.mouseOnColor = 'rgba(150, 150, 150, 1.0)';
    this.noteOnCurrentColor = 'rgba(255, 100, 100, 1.0)';
    this.redColor = this.noteOnCurrentColor;
    this.whiteColor = this.noteOnColor;

    // Init Matrix
    this.initMatrix();
  }

  // Drum pattern
  initMatrix() {
    this.matrix = [];
    for (let i = 0; i < 96; i += 1) {
      this.matrix[i] = [];
      for (let t = 0; t < 9; t += 1) {
        this.matrix[i][t] = (Math.random() > 0.5 ? 1 : 0);
      }
    }
  }

  changeMatrix(mat) {
    this.matrix = mat;
  }

  // Event handling
  handleMouseDown(e) {
    return [
      this.handleMouseDownOnGrid(),
    ];
  }

  handleMouseDownOnGrid() {
    const p = this.mouseOnIndex;
    if (p[0] != -1 && p[1] != -1) {
      return true;
    }
    return false;
  }

  handleMouseMove(e) {
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
    } else {
      this.mouseOnIndex = [-1, -1];
    }
  }

  // Draw
  draw(src, b) {
    const ctx = this.canvas.getContext('2d');
    this.frameCount += 1;
    this.beat = b;
    this.width = src.width;
    this.height = src.height;
    const width = src.width;
    const height = src.height;

    const h = Math.min(width, height) * 0.18;
    const w = width * 0.5;
    this.dist = h * 1.2;
    this.gridWidth = w;
    this.gridHeight = h;
    this.gridXShift = 0;
    this.gridYShift = 0;

    ctx.save();

    // Draw background
    ctx.fillStyle = this.backgroundColor;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw grid
    ctx.translate(width * 0.5, height * 0.5);
    this.drawGrid(ctx, w, h);

    ctx.restore();
  }

  drawGrid(ctx, w, h) {
    const w_step = w / 96;
    const h_step = h / 9;

    ctx.save();
    ctx.translate(this.gridXShift, this.gridYShift)
    this.drawFrame(ctx, this.gridWidth * 1.1, this.gridHeight * 1.3);
    ctx.translate(w * -0.5, h * -0.5);

    // Change animation
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

    // Drum pattern
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
          ctx.arc(0, 0, 15 * (1 + 0.3 * value), 0, Math.PI * 2, true);
          ctx.stroke();
        }

        ctx.translate(-0.5 * recW, -0.5 * recH);
        ctx.fillRect(0, 0, recW, recH);
        ctx.restore();
      }
    }

    ctx.restore();
  }

  drawFrame(ctx, w, h) {
    const unit = this.gridHeight * 0.05;

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
}
