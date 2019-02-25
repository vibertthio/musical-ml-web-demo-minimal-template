import React, { Component } from 'react';
import { render } from 'react-dom';
import styles from './index.module.scss';
import info from './assets/info.png';
import AudioManager from './drum-machine/audio-manager';
import Renderer from './drum-machine/renderer';
import playSvg from './assets/play.png';
import pauseSvg from './assets/pause.png';
import shufflePng from './assets/shuffle.png';
import sig from './assets/sig.png';
import TWEEN from '@tweenjs/tween.js';

class App extends Component {
  // Component (React) & initialization
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
      vol: 100,
      bpm: 120,
      instructionStage: 0,
      waitingServer: false,
      screen: {
        width: window.innerWidth,
        height: window.innerHeight,
        ratio: window.devicePixelRatio || 1,
      },
    };

    this.audioManager = new AudioManager((i) => {
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


  // Data control:
  // 1. drum pattern(matrix)
  // 2. latent vector
  changeMatrix(mat) {
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
    this.audioManager.changeMatrix(m);
  }


  // Server
  getDrumVae(url, restart = true) {
    fetch(url, {
      headers: {
        'content-type': 'application/json'
      },
      method: 'GET', // *GET, POST, PUT, DELETE, etc.
    })
      .then(r => r.json())
      .then(d => {
        this.changeMatrix(d['result']);
        if (restart) {
          this.start();
        }
      })
      .catch(e => console.log(e));
  }

  getDrumVaeRandom() {
    this.setState({
      waitingServer: true,
    });
    const url = this.serverUrl + 'rand';
    this.getDrumVae(url, true);
  }

  getDrumVaeStatic() {
    this.setState({
      waitingServer: true,
    });
    const url = this.serverUrl + 'static';
    this.getDrumVae(url, false);
  }


  // Utilities
  start() {
    this.audioManager.start();
    this.setState({
      playing: true,
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
      // const playing = this.audioManager.trigger();
      this.setState({
        // playing,
        loadingSamples: false,
      });
    }
  }


  // Menu control
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


  // Events handling
  // 1. mouse
  handleMouseDown(e) {
    e.stopPropagation();
    const { slash, open } = this.state;
    if (!slash && !open) {
      const [onGrid] = this.renderer.handleMouseDown(e);
      if (onGrid) {
        const [i, j_reverse] = this.renderer.mouseOnIndex;
        const j = 8 - j_reverse;
        this.rawMatrix[i][j] = (this.rawMatrix[i][j] < this.state.gate ? 1 : 0);
        this.changeMatrix();
        this.diffAnimation.start();
        this.audioManager.triggerSoundEffect(0);

        if (this.state.instructionStage === 1) {
          this.nextInstruction();
        }
      }

    }
  }

  handleMouseUp(e) {
    e.stopPropagation();
    const { slash, open } = this.state;
    if (!slash && !open) {
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
  }

  // 2. Key
  onKeyDown(e) {
    e.stopPropagation();
    const { slash, loadingSamples } = this.state;
    if (!slash) {
      if (!loadingSamples) {
        // console.log(`key: ${e.keyCode}`);
        if (e.keyCode === 32) {
          // space
          const playing = this.audioManager.trigger();
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

  // 3. window resize
  handleResize(value, e) {
    this.setState({
      screen: {
        width: window.innerWidth,
        height: window.innerHeight,
        ratio: window.devicePixelRatio || 1,
      }
    });
  }

  // 4. UIs
  handleClick(e) {
    e.stopPropagation();
  }

  handleClickMenu() {
    const { open } = this.state;
    if (open) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  handleChangeVolume(e) {
    const vol = e.target.value;
    this.audioManager.changeVolume(vol)
    this.setState({ vol })
  }

  handleChangeBpmValue(e) {
    const v = e.target.value;
    // 0~100 -> 60~120
    const bpm = v;
    console.log(`bpm changed: ${bpm}`);
    this.setState({ bpm });
    this.audioManager.changeBpm(bpm);
  }

  handleClickPlayStopIcon() {
    const playing = this.audioManager.trigger();
    this.setState({
      playing,
    });
  }

  handleClickPlayButton() {
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


  // Render
  update() {
    const b = this.audioManager.beat;
    if (!this.state.loadingSamples) {
      this.renderer.draw(this.state.screen, b);
    }

    TWEEN.update();
    requestAnimationFrame(() => { this.update() });
  }

  render() {
    const { loadingProgress, instructionStage, gate, vol, bpm } = this.state;
    const loadingText = (loadingProgress < 9) ? `loading..${loadingProgress}/9` : 'play';
    return (
      <div>

        {/* Landing Page */}
        <section className={styles.splash} id="splash">
          <div className={styles.wrapper}>
            <h1>🎹🤖<br/>Web Music AI</h1>
            <h3>
              = A Minimal Template for Interactive Web-based Demonstrations of Musical Machine Learning
            </h3>
            <div className="device-supported">
              <p className={styles.description}>
                We use Tone.js to support real-time audio rendering and canvas API for visual rendering. It is designed to be easy to used by any practitioners to implement their own demonstrations.
                Below are 4 implementations based on the template
                : 1) <a className={styles.about} target="_blank" href="https://vibertthio.com/sornting/">Sornting</a>
                , 2) <a className={styles.about} target="_blank" href="http://vibertthio.com/drum-vae-client/public/">DrumVAE</a>
                , 3) <a className={styles.about} target="_blank" href="http://vibertthio.com/leadsheet-vae-client/">Song Mixer</a>
                , and 4) <a className={styles.about} target="_blank" href="http://vibertthio.com/tuning-turing/">Tuning Turing</a>.
              </p>

              <button
                className={styles.playButton}
                id="splash-play-button"
                onClick={() => this.handleClickPlayButton()}
              >
                {loadingText}
              </button>

              <p className={styles.builtWith}>
                Learn more about <a className={styles.about} target="_blank" href="https://github.com/vibertthio/drum-vae-client">how it works.</a>
                <br/>
                <a className={styles.about} target="_blank" href="https://arxiv.org/abs/1902.03722">The paper</a> will be present in <a className={styles.about} target="_blank" href="https://milc2019.github.io/">MILC 2019.</a>
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

        {/* Title & Tips */}
        <div className={styles.title}>
          <a href="https://github.com/vibertthio/musical-ml-web-demo-minimal-template" target="_blank" rel="noreferrer noopener">
            🎹 Web Music AI 🤖
          </a>
          <button
            className={styles.btn}
            onClick={() => this.handleClickMenu()}
            onKeyDown={e => e.preventDefault()}
          >
            <img alt="info" src={info} />
          </button>

          <div className={styles.tips} id="tips">
            <p>🙋‍♀️Examples</p>
            <p>1) <a className={styles.about} target="_blank" href="https://vibertthio.com/sornting/">Sornting</a></p>
            <p>2) <a className={styles.about} target="_blank" href="http://vibertthio.com/drum-vae-client/public/">DrumVAE</a></p>
            <p>3) <a className={styles.about} target="_blank" href="http://vibertthio.com/leadsheet-vae-client/">Song Mixer</a></p>
            <p>4) <a className={styles.about} target="_blank" href="http://vibertthio.com/tuning-turing/">Tuning Turing</a></p>


          </div>
        </div>

        {/* Canvas */}
        <div>
          <canvas
            ref={ c => this.canvas = c }
            className={styles.canvas}
            width={this.state.screen.width * this.state.screen.ratio}
            height={this.state.screen.height * this.state.screen.ratio}
          />
        </div>

        {/* Controls */}
        <div className={styles.control}>
          <div className={styles.slider}>
            <div>
              <input type="range" min="1" max="100" value={vol} onChange={this.handleChangeVolume.bind(this)}/>
            </div>
            <button onClick={() => this.handleClickPlayStopIcon()} onKeyDown={e => e.preventDefault()}>
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

        {/* Overlay */}
        <div id="menu" className={styles.overlay}>
          <button className={styles.overlayBtn} onClick={() => this.handleClickMenu()} />
          <div className={styles.intro}>
            <p>
              <strong>$ 🎹 Web Music AI 🤖 $</strong>
              <br />A Minimal Template for Interactive Web-based Demonstrations of Musical Machine Learning. Made by{' '}
              <a href="https://vibertthio.com/portfolio/" target="_blank" rel="noreferrer noopener">
                Vibert Thio
              </a>.{' Source code is on '}
              <a
                href="https://github.com/vibertthio/musical-ml-web-demo-minimal-template"
                target="_blank"
                rel="noreferrer noopener"
              >
                GitHub.
              </a>
            </p>
            <p>
              We use Tone.js to support real-time audio rendering and canvas API for visual rendering. Moreover, it will be presented in the workshop session of IUI 2019.
            </p>
          </div>
          <button className={styles.overlayBtn} onClick={() => this.handleClickMenu()} />
        </div>

      </div>
    );
  }
}

render(<App />, document.getElementById('root'));
