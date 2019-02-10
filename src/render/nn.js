import { lerpColor } from '../utils/utils';

export default class NN {

  constructor(renderer) {
    this.renderer = renderer;
    this.TWEEN = renderer.TWEEN;

    this.whiteColor = renderer.whiteColor;
    this.redColor = renderer.redColor;


    this.yShiftIn = 1;
    this.linesAlpha = 0.2;
    this.yShiftOut = 0;
    this.moreAlpha = 0;
    this.lessAlpha = 0;

  }

  update() {
    this.dist = this.renderer.dist;
  }

  draw(ctx) {

    // update
    this.update();

    // draw
    const radius = this.dist * 0.02;
    const unit = this.dist * 0.15;
    const yShift = this.dist * 0.08;
    ctx.save();

    for (let i = 0; i < 3; i += 1) {

      for (let j = 0; j < 4; j += 1) {

        ctx.save();

        if (this.linesAlpha > 1) {
          ctx.strokeStyle = `rgba(255, 255, 255, ${2 - this.linesAlpha})`;
        } else {
          ctx.strokeStyle = `rgba(255, 255, 255, ${this.linesAlpha})`;
        }
        ctx.beginPath();
        ctx.moveTo(unit * (i - 1), yShift);
        ctx.lineTo(unit * (j - 1.5), -yShift);
        ctx.stroke();
        ctx.restore();
      }

      ctx.save();
      ctx.translate(unit * (i - 1), yShift);

      if (this.yShiftIn > 0.01 && this.yShiftIn < 0.99) {
        ctx.save();
        ctx.fillStyle = `rgba(255, 255, 255, ${1 - this.yShiftIn})`;
        ctx.translate(0, this.yShiftIn * 6 * yShift);
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2, true);
        ctx.fill();
        ctx.restore();
      }

      // ctx.fillStyle = this.redColor;
      let amt = 0;
      if (this.lessAlpha > 1) {
        amt = 2 - this.lessAlpha;
      } else {
        amt = this.lessAlpha;
      }
      ctx.fillStyle = lerpColor('#FFFFFF', '#FF6464', amt);
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2, true);
      ctx.fill();

      ctx.restore();
    }

    for (let i = 0; i < 4; i += 1) {

      ctx.save();
      ctx.translate(unit * (i - 1.5), -yShift);

      if (this.yShiftOut > 0.01 && this.yShiftOut < 0.99) {
        ctx.save();
        ctx.fillStyle = `rgba(255, 255, 255, ${1 - this.yShiftOut})`;
        ctx.translate(0, this.yShiftOut * 6 * -yShift);
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2, true);
        ctx.fill();
        ctx.restore();
      }

      let amt = 0;
      if (this.moreAlpha > 1) {
        amt = 2 - this.moreAlpha;
      } else {
        amt = this.moreAlpha;
      }
      ctx.fillStyle = lerpColor('#FFFFFF', '#FF6464', amt);
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2, true);
      ctx.fill();

      ctx.restore();
    }

    ctx.restore();
  }

  aniDecoder(postAni) {
    this.aniIn = new this.TWEEN.Tween({ t: 1 })
      .easing(this.TWEEN.Easing.Exponential.In)
      .to({ t: 0 }, 500)
      .onUpdate(obj => {
        const { t } = obj;
        this.yShiftIn = t;
      });
    this.aniLinesAlpha = new this.TWEEN.Tween({ t: 0.2 })
      .to({ t: 1.8 }, 300)
      .onUpdate(obj => {
        const { t } = obj;
        this.linesAlpha = t;
      })
      .delay(100);
    this.aniMoreAlpha = new this.TWEEN.Tween({ t: 0 })
      .to({ t: 2 }, 300)
      .onUpdate(obj => {
        const { t } = obj;
        this.moreAlpha = t;
      })
      .delay(200);
    this.aniLessAlpha = new this.TWEEN.Tween({ t: 0 })
      .to({ t: 2 }, 300)
      .onUpdate(obj => {
        const { t } = obj;
        this.lessAlpha = t;
      });
    this.aniOut = new this.TWEEN.Tween({ t: 0 })
      .easing(this.TWEEN.Easing.Exponential.In)
      .to({ t: 1 }, 500)
      .onUpdate(obj => {
        const { t } = obj;
        this.yShiftOut = t;
      });

    this.aniIn.chain(this.aniLinesAlpha, this.aniMoreAlpha, this.aniLessAlpha);
    this.aniMoreAlpha.chain(this.aniOut);
    this.aniOut.chain(postAni);

    return this.aniIn;
  }

  aniEncoder(postAni) {
    this.aniIn = new this.TWEEN.Tween({ t: 0 })
      .easing(this.TWEEN.Easing.Exponential.In)
      .to({ t: 1 }, 500)
      .onUpdate(obj => {
        const { t } = obj;
        this.yShiftIn = t;
      });
    this.aniLinesAlpha = new this.TWEEN.Tween({ t: 0.2 })
      .to({ t: 1.8 }, 300)
      .onUpdate(obj => {
        const { t } = obj;
        this.linesAlpha = t;
      })
      .delay(100);
    this.aniMoreAlpha = new this.TWEEN.Tween({ t: 0 })
      .to({ t: 2 }, 300)
      .onUpdate(obj => {
        const { t } = obj;
        this.moreAlpha = t;
      });
    this.aniLessAlpha = new this.TWEEN.Tween({ t: 0 })
      .to({ t: 2 }, 300)
      .onUpdate(obj => {
        const { t } = obj;
        this.lessAlpha = t;
      })
      .delay(200);
    this.aniOut = new this.TWEEN.Tween({ t: 1 })
      .easing(this.TWEEN.Easing.Exponential.In)
      .to({ t: 0 }, 500)
      .onUpdate(obj => {
        const { t } = obj;
        this.yShiftOut = t;
      });

    this.aniOut.chain(this.aniLinesAlpha, this.aniMoreAlpha, this.aniLessAlpha);
    this.aniMoreAlpha.chain(this.aniIn);
    this.aniIn.chain(postAni);

    return this.aniOut;
  }

}
