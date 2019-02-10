import React, { Component } from 'react';
import { render } from 'react-dom';
import styles from './index.module.scss';
import info from './assets/info.png';
import SamplesManager from './music/samples-manager';
import Renderer from './render/renderer';
import playSvg from './assets/play.png';
import pauseSvg from './assets/pause.png';
import shufflePng from './assets/shuffle.png';
import sig from './assets/sig.png';
import TWEEN from '@tweenjs/tween.js';


const genres = [
  'World',
  'Country',
  'Punk',
  'Folk',
  'Pop',
  'NewAge',
  'Rock',
  'Metal',
  'Latin',
  'Blues',
  'Electronic',
  'RnB',
  'Rap',
  'Reggae',
  'Jazz',
];

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      open: false,
      playing: false,
      slash: true,
      dragging: false,
      loadingProgress: 0,
      loadingSamples: true,
      currentTableIndex: 4,
      gate: 0.2,
      bpm: 120,
      instructionStage: 0,
      waitingServer: false,
      screen: {
        width: window.innerWidth,
        height: window.innerHeight,
        ratio: window.devicePixelRatio || 1,
      },
    };

    this.samplesManager = new SamplesManager((i) => {
      this.handleLoadingSamples(i);
    }),

    this.canvas = [];
    this.matrix = [];
    this.rawMatrix = [];
    this.beat = 0;
    this.diffMatrix = [];
    this.diffAnimationAlpha = 0;

    this.serverUrl = 'http://musicai.citi.sinica.edu.tw/drumvae/';
    // this.serverUrl = 'http://140.109.16.227:5002/';
    // this.serverUrl = 'http://140.109.135.76:5010/';

    // animation
    this.TWEEN = TWEEN;
    this.pauseChangeMatrix = false;
    this.pauseChangeLatent = false;
  }

  componentDidMount() {
    this.renderer = new Renderer(this, this.canvas);
    if (!this.state.loadingSamples) {
      this.renderer.draw(this.state.screen);
    }
    window.addEventListener('keydown', this.onKeyDown.bind(this), false);
    window.addEventListener('resize', this.handleResize.bind(this, false));
    window.addEventListener('click', this.handleClick.bind(this));
    window.addEventListener('mousedown', this.handleMouseDown.bind(this));
    window.addEventListener('mousemove', this.handleMouseMove.bind(this));
    window.addEventListener('mouseup', this.handleMouseUp.bind(this));

    requestAnimationFrame(() => { this.update() });
    this.getDrumVaeStatic();
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.onKeyDown.bind(this));
    window.removeEventListener('click', this.handleClick.bind(this));
    window.removeEventListener('mousedown', this.handleMouseDown.bind(this));
    window.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    window.removeEventListener('mouseup', this.handleMouseUp.bind(this));
    window.removeEventListener('resize', this.handleResize.bind(this, false));
  }

  changeMatrix(mat) {
    // console.log('change matrix');
    if (mat) {
      this.rawMatrix = mat;
    }

    const { gate } = this.state;
    const m = this.rawMatrix.map(
      c => c.map(x => (x > gate ? 1 : 0)
    ));
    this.tempMatrix = m;

    this.diffMatrix = [];
    if (this.matrix.length > 0) {
      m.forEach((col, i) => {
        col.forEach((x, j) => {
          if (x !== this.matrix[i][j]) {
            this.diffMatrix.push({i, j, value: x});
            // console.log(`i:${i}, j:${j}`);
          }
        });
      });
    }

    if (this.diffMatrix.length > 0) {
      this.diffAnimation = new this.TWEEN.Tween({t : 0})
        .easing(this.TWEEN.Easing.Exponential.Out)
        .to({ t: 1 }, 500)
        .onUpdate(obj => {
          const { t } = obj;
          this.diffAnimationAlpha = 1 - t;
        });
    }

    if (!this.pauseChangeMatrix) {
      this.updateMatrix()
    }
  }

  updateMatrix() {
    // console.log('update matrix');
    const m = this.tempMatrix;
    this.matrix = m;
    this.renderer.changeMatrix(m);
    this.samplesManager.changeMatrix(m);
  }

  changeLatent(latent) {
    if (this.pauseChangeLatent) {
      this.tempLatent = latent;
    } else {
      this.renderer.latent = latent;
    }
    this.pauseChangeLatent = false;
  }

  getDrumVae(url, restart = true, callback = false) {
    fetch(url, {
      headers: {
        'content-type': 'application/json'
      },
      method: 'GET', // *GET, POST, PUT, DELETE, etc.
    })
      .then(r => r.json())
      .then(d => {
        this.changeMatrix(d['result']);
        this.changeLatent(d['latent']);
        if (restart) {
          this.start();
        }
        if (callback) {
          this.onGetDrumVaeComplete();
        }
      })
      .catch(e => console.log(e));
  }

  getDrumVaeRandom() {
    this.renderer.latentGraph.showIndication = true;
    this.setState({
      waitingServer: true,
    });
    const url = this.serverUrl + 'rand';
    this.getDrumVae(url, true, true);
  }

  getDrumVaeStatic() {
    this.renderer.latentGraph.showIndication = true;
    this.setState({
      waitingServer: true,
    });
    const url = this.serverUrl + 'static';
    this.getDrumVae(url, false, true);
  }

  onGetDrumVaeComplete() {
    const { waitingServer } = this.state;
    if (waitingServer) {
      this.renderer.latentGraph.showIndication = false;

      if (this.diffAnimation) {
        this.diffAnimation.start();
      }

      this.renderer.latentGraph.aniChange().start();
      this.setState({
        waitingServer: false,
      });
    }
  }


  postDrumVae(url, body, restart = false) {
    fetch(url, {
      method: 'POST', // *GET, POST, PUT, DELETE, etc.
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json'
      },
      body,
    })
      .then(r => r.json())
      .then(d => {
        this.changeMatrix(d['result']);
        this.changeLatent(d['latent']);
        if (restart) {
          this.start();
        }
      })
      .catch(e => console.log(e));
  }

  postDrumVaeAdjustLatent(latent, restart = false) {
    const url = this.serverUrl + 'adjust-latent';
    const body = JSON.stringify({ latent });
    this.postDrumVae(url, body, false);
  }

  postDrumVaeAdjustData(data, restart = false) {
    const url = this.serverUrl + 'adjust-data';
    const body = JSON.stringify({ data });
    this.postDrumVae(url, body, false);
  }

  start() {
    this.samplesManager.start();
    this.setState({
      playing: true,
    });
  }

  update() {
    // tween
    TWEEN.update();

    const b = this.samplesManager.beat;
    if (!this.state.loadingSamples) {
      this.renderer.draw(this.state.screen, b);
    }

    requestAnimationFrame(() => { this.update() });
  }

  handleResize(value, e) {
    this.setState({
      screen: {
        width: window.innerWidth,
        height: window.innerHeight,
        ratio: window.devicePixelRatio || 1,
      }
    });
  }

  handleClick(e) {
    e.stopPropagation();
    // const index = this.renderer.handleClick(e);
    // this.changeTableIndex(index);
  }

  handleMouseDown(e) {
    e.stopPropagation();
    const { slash, open } = this.state;
    if (!slash && !open) {
      const [dragging, onGrid] = this.renderer.handleMouseDown(e);
      if (onGrid) {
        const [i, j_reverse] = this.renderer.mouseOnIndex;
        const j = 8 - j_reverse;
        this.rawMatrix[i][j] = (this.rawMatrix[i][j] < this.state.gate ? 1 : 0);
        this.changeMatrix();
        this.diffAnimation.start();
        this.samplesManager.triggerSoundEffect(0);
        this.pauseChangeLatent = true;
        this.renderer.encoderAniStart(() => {
          // this.start();
          if (!this.pauseChangeLatent) {
            this.renderer.latent = this.tempLatent;
          }
          this.pauseChangeLatent = false;
        });
        this.postDrumVaeAdjustData(this.rawMatrix);

        if (this.state.instructionStage === 1) {
          this.nextInstruction();
        }
      }
      if (dragging) {
        this.setState({
          dragging,
        });
      }
    }
  }

  handleMouseUp(e) {
    e.stopPropagation();
    // const dragging = this.renderer.handleMouseDown(e);
    const { slash, open } = this.state;
    const { selectedLatent, latent } = this.renderer;
    if (!slash && !open) {

      if (this.state.dragging) {
        this.pauseChangeMatrix = true;
        this.samplesManager.triggerSoundEffect(0);

        this.renderer.decoderAniStart(() => {
          // this.start();

          if (this.diffAnimation) {
            this.diffAnimation.start();
          }
          this.pauseChangeMatrix = false;
          this.updateMatrix();
        });

        this.postDrumVaeAdjustLatent(latent);

        if (this.state.instructionStage === 0) {
          this.nextInstruction();
        }
      }

      this.setState({
        dragging: false,
      });
    }
  }

  handleMouseMove(e) {
    e.stopPropagation();
    if (!this.state.dragging) {
      this.renderer.handleMouseMove(e);
    }
    this.renderer.handleDraggingOnGraph(e);
  }

  handleClickMenu() {
    const { open } = this.state;
    if (open) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  onKeyDown(e) {
    e.stopPropagation();
    const { slash, loadingSamples } = this.state;
    if (!slash) {
      if (!loadingSamples) {
        // console.log(`key: ${e.keyCode}`);
        if (e.keyCode === 32) {
          // space
          const playing = this.samplesManager.trigger();
          this.setState({
            playing,
          });
        }
        if (e.keyCode === 65) {
          // a
          this.renderer.triggerDisplay();
        }
        if (e.keyCode === 82) {
          // r
          this.getDrumVaeRandom();
        }
        if (e.keyCode === 84) {
          // t
          this.getDrumVaeStatic();
        }


        if (e.keyCode === 49) {
          // 1
        }
      }
    }
  }

  changeTableIndex(currentTableIndex) {
    this.samplesManager.changeTable(this.matrix[currentTableIndex]);
    this.setState({
      currentTableIndex,
    });
  }

  openMenu() {
    document.getElementById('menu').style.height = '100%';
    this.setState({
      open: true,
    });
  }

  closeMenu() {
    document.getElementById('menu').style.height = '0%';
    this.setState({
      open: false,
    });
  }

  nextInstruction() {
    const { instructionStage } = this.state;
    this.setState({
      instructionStage: instructionStage + 1,
    });
  }

  handleLoadingSamples(amt) {
    this.setState({
      loadingProgress: amt,
    });
    if (amt === 8) {
      // const playing = this.samplesManager.trigger();
      this.setState({
        // playing,
        loadingSamples: false,
      });
    }
  }

  handleChangeGateValue(e) {
    const v = e.target.value;
    const gate = v / 100;
    // console.log(`gate changed: ${gate}`);
    this.setState({ gate });
    this.changeMatrix();
  }

  handleChangeBpmValue(e) {
    const v = e.target.value;
    // 0~100 -> 60~120
    const bpm = v;
    console.log(`bpm changed: ${bpm}`);
    this.setState({ bpm });
    this.samplesManager.changeBpm(bpm);
  }

  handleClickPlayButton() {
    const playing = this.samplesManager.trigger();
    this.setState({
      playing,
    });
  }

  onPlay() {
    // console.log('press play!');

    const id =  'splash';
    const splash = document.getElementById(id);
    splash.style.opacity = 0.0;
    setTimeout(() => {
      splash.style.display = 'none';
      this.setState({
        slash: false,
      });
    }, 500);
  }

  render() {
    const { playing, currentTableIndex, loadingProgress, instructionStage } = this.state;
    const loadingText = (loadingProgress < 9) ? `loading..${loadingProgress}/9` : 'play';
    const arr = Array.from(Array(9).keys());
    const mat = Array.from(Array(9 * 16).keys());
    const { gate, bpm } = this.state;
    return (
      <div>
        <section className={styles.splash} id="splash">
          <div className={styles.wrapper}>
            <h1>Latent<br/>Inspector</h1>
            <h2>
              = 🥁 Drum + 🤖 VAE
            </h2>
            <div className="device-supported">
              <p className={styles.description}>
                An interactive demo based on latent vector to generate drum pattern.
                Modify the 32-dim latent vector to produce new drum patterns, and vice versa.
              </p>

              <button
                className={styles.playButton}
                id="splash-play-button"
                onClick={() => this.onPlay()}
              >
                {loadingText}
              </button>

              <p className={styles.builtWith}>
                Built with tone.js + Flask.
                <br />
                Learn more about <a className={styles.about} target="_blank" href="https://github.com/vibertthio/drum-vae-client">how it works.</a>
              </p>

              <p>Made by</p>
              <img className="splash-icon" src={sig} width="100" height="auto" alt="Vibert Thio Icon" />
            </div>
          </div>
          <div className={styles.badgeWrapper}>
            <a className={styles.magentaLink} href="http://musicai.citi.sinica.edu.tw/" target="_blank" >
              <div>Music and AI Lab</div>
            </a>
          </div>
          <div className={styles.privacy}>
            <a href="https://github.com/vibertthio/drum-vae-client" target="_blank">Privacy &amp; </a>
            <a href="https://github.com/vibertthio/drum-vae-client" target="_blank">Terms</a>
          </div>
        </section>
        <div className={styles.title}>
          <a href="https://github.com/vibertthio/drum-vae-client" target="_blank" rel="noreferrer noopener">
            Latent Inspector
          </a>
          <button
            className={styles.btn}
            onClick={() => this.handleClickMenu()}
            onKeyDown={e => e.preventDefault()}
          >
            <img alt="info" src={info} />
          </button>

          <div className={styles.tips} id="tips">
            {instructionStage < 2 ? <p>🙋‍♀️Tips</p> : ''}
            {instructionStage === 0 ? (<p>👇Drag the <font color="#ff6464">red dots</font> in the latent vector</p>) : ''}
            {instructionStage === 1 ? (<p>👇Click on the <font color="#2ecc71">drum patterns</font> to test the encoder</p>) : ''}
            {instructionStage === 2 ? <p>🎉Have fun!</p> : ''}
          </div>
        </div>
        <div>
          {this.state.loadingSamples && (
            <div className={styles.loadingText}>
              <p>{loadingText}</p>
            </div>
          )}
        </div>
        <div>
          <canvas
            ref={ c => this.canvas = c }
            className={styles.canvas}
            width={this.state.screen.width * this.state.screen.ratio}
            height={this.state.screen.height * this.state.screen.ratio}
          />
        </div>
        <div className={styles.control}>
          <div className={styles.slider}>
            <div>
              <input type="range" min="1" max="100" value={gate * 100} onChange={this.handleChangeGateValue.bind(this)}/>
            </div>
            <button onClick={() => this.handleClickPlayButton()} onKeyDown={e => e.preventDefault()}>
              {
                !this.state.playing ?
                  (<img src={playSvg} width="30" height="30" alt="submit" />) :
                  (<img src={pauseSvg} width="30" height="30" alt="submit" />)
              }
            </button>
            <button onClick={() => this.getDrumVaeRandom()} onKeyDown={e => e.preventDefault()}>
              <img src={shufflePng} width="25" height="25" alt="shuffle" />
            </button>
            <div>
              <input type="range" min="60" max="180" value={bpm} onChange={this.handleChangeBpmValue.bind(this)}/>
            </div>
          </div>
        </div>
        <div id="menu" className={styles.overlay}>
          <button className={styles.overlayBtn} onClick={() => this.handleClickMenu()} />
          <div className={styles.intro}>
            <p>
              <strong>$ Latent Inspector $</strong>
              <br />An interactive demo based on latent vector to generate drum pattern. Made by{' '}
              <a href="https://vibertthio.com/portfolio/" target="_blank" rel="noreferrer noopener">
                Vibert Thio
              </a>.{' Source code is on '}
              <a
                href="https://github.com/vibertthio/drum-vae-client"
                target="_blank"
                rel="noreferrer noopener"
              >
                GitHub.
              </a>
            </p>
            <p>
              <strong>$ How to use $</strong>
              <br /> [space]: play/pause
              <br /> [r]: random sample
              <br /> [drag]: rag the circular diagram to change the latent vector
              <br /> [click]: click to change the drum pattern
            </p>
          </div>
          <button className={styles.overlayBtn} onClick={() => this.handleClickMenu()} />
        </div>
      </div>
    );
  }
}

render(<App />, document.getElementById('root'));
