//#ef NOTES
/*
each staff as own svgcontainer

ANIMATE CURSOR
px per ms

Print Epoch Time
Draw Scrolling cursors
Position Scrolling Cursors
Implement Animation Engine
*/
//#endef NOTES

//#ef GLOBAL VARIABLES


//#ef General Variables
let NUM_PLAYERS = 4;
const TEMPO_COLORS = [clr_brightOrange, clr_brightGreen, clr_brightBlue, clr_lavander, clr_darkRed2];
//#endef General Variables

//#ef Timing
const FRAMERATE = 60;
let FRAMECOUNT = 0;
let LASTFRAMECOUNT = 0;
const PX_PER_SEC = 50;
const PX_PER_HALFSEC = PX_PER_SEC / 2;
const PX_PER_FRAME = PX_PER_SEC / FRAMERATE;
const MS_PER_FRAME = 1000.0 / FRAMERATE;
const LEAD_IN_TIME_SEC = 2;
const LEAD_IN_TIME_MS = LEAD_IN_TIME_SEC * 1000;
const LEAD_IN_FRAMES = LEAD_IN_TIME_SEC * FRAMERATE;
let startTime_epochTime_MS = 0;
let pauseState = 0;
let timePaused = 0;
let pieceClockAdjustment = 0;
let displayClock;
//#endef Timing

//#ef Animation Engine Variables
let cumulativeChangeBtwnFrames_MS = 0;
let epochTimeOfLastFrame_MS;
let animationEngineCanRun = true;
//#endef END Animation Engine Variables

//#ef TIMESYNC
const TS = timesync.create({
  server: '/timesync',
  interval: 1000
});
//#endef TIMESYNC

//#ef World Panel Variables
let worldPanel;
const DEVICE_SCREEN_W = window.screen.width;
const DEVICE_SCREEN_H = window.screen.height;
// console.log(DEVICE_SCREEN_W);
const MAX_W = 1280; //16:10 aspect ratio; 0.625
const MAX_H = 720;
const WORLD_MARGIN = 15;
const WORLD_W = Math.min(DEVICE_SCREEN_W, MAX_W) - (WORLD_MARGIN * 2);
const WORLD_H = Math.min(DEVICE_SCREEN_H, MAX_H) - 45;
const WORLD_CENTER = WORLD_W / 2;
const GAP = 6;
const WORLD_W_FRAMES = WORLD_W / PX_PER_FRAME;
//#endef World Panel Variables

//#ef Canvas Variables
const NOTATIONCANVAS_TOP = 0;
const NOTATIONCANVAS_H = WORLD_H;
const NOTATIONCANVAS_W = WORLD_W;
//#endef Canvas Variables

//#ef Staves Variables
const NUMSTAVES = 4;
const STAFFGAP = 4;
const STAFF_H = (NOTATIONCANVAS_H - (STAFFGAP * (NUMSTAVES - 1))) / NUMSTAVES;
const STAFF_W = NOTATIONCANVAS_W;
let staves = [];
//#endef Staves Variables

//#ef Scrolling Tempo Cursors
let tempoCursors = [];
const NOTATION_CURSOR_H = 50;
const NOTATION_CURSOR_STROKE_W = 3;
//#endef Scrolling Tempo Cursors


//#endef GLOBAL VARIABLES

//#ef INIT
function init() {

  makeWorldPanel();
  makeStaves();
  makeScrollingTempoCursors();

  let ts_Date = new Date(TS.now());
  let t_startTime_epoch = ts_Date.getTime();
  startTime_epochTime_MS = t_startTime_epoch;
  epochTimeOfLastFrame_MS = t_startTime_epoch;
  console.log(startTime_epochTime_MS);
  // console.log(startTime_epochTime_MS%500);

  requestAnimationFrame(animationEngine); //kick off animation

} // function init() END
//#endef INIT

//#ef BUILD WORLD


//#ef Make World Panel - floating window made in jspanel
function makeWorldPanel() {
  worldPanel = mkPanel({
    w: WORLD_W,
    h: WORLD_H,
    title: 'SoundFlow #5',
    onwindowresize: true,
    clr: 'none',
    ipos: 'center-top',
  });

  worldPanel.content.addEventListener('click', function() {
    document.documentElement.webkitRequestFullScreen({
      navigationUI: 'hide'
    });
  });

} // function makeWorldPanel() END
//#endef Make World Panel

//#ef Make Staves - SVG rectangle for each individual staff (draw notation on top)
function makeStaves() {

  for (var i = 0; i < NUMSTAVES; i++) {
    let tStaffObj = {}; //{div:,svg:,rect:}
    let ty = i * (STAFF_H + STAFFGAP);

  let tDiv = mkDiv({
      canvas: worldPanel.content,
      w: STAFF_W,
      h: STAFF_H,
      top: ty,
      left: 0,
      bgClr: clr_blueGrey
    });

    tStaffObj['div'] = tDiv;

  let tSvg = mkSVGcontainer({
      canvas: tDiv,
      w: STAFF_W,
      h: STAFF_H,
      x: 0,
      y: 0,
      clr: clr_blueGrey
    });

    tStaffObj['svg'] = tSvg;

    tStaffObj['rect'] = mkSvgRect({
      svgContainer: tSvg,
      x: 0,
      y: 0,
      w: STAFF_W,
      h: STAFF_H,
      fill: 'black',
      stroke: 'black',
      strokeW: 0,
      roundR: 0
    });

    staves.push(tStaffObj);

  } // for (var i = 0; i < NUMSTAVES; i++) END

} // function makeStaves() END
//#endef Make Staves

//#ef Make Scrolling Tempo Cursors
function makeScrollingTempoCursors() {

  for (let tempoCsrIx = 0; tempoCsrIx < NUM_PLAYERS; tempoCsrIx++) {

    let tLine = mkSvgLine({
      svgContainer: staves[tempoCsrIx].svg,
      x1: 0,
      y1: STAFF_H,
      x2: 0,
      y2: 0,
      stroke: TEMPO_COLORS[tempoCsrIx],
      strokeW: NOTATION_CURSOR_STROKE_W
    });
    tLine.setAttributeNS(null, 'stroke-linecap', 'round');
    tLine.setAttributeNS(null, 'display', 'none');
    // tLine.setAttributeNS(null, 'transform', "translate(" + beatCoords[4].x.toString() + "," + beatCoords[4].y.toString() + ")");
    tempoCursors.push(tLine);

  } //for (let tempoCsrIx = 0; tempoCsrIx < NUM_TEMPOS; tempoCsrIx++) END
  tempoCursors[0].setAttributeNS(null, 'display', 'yes');
  //MOVE SVG: "SVG".setAttributeNS(null, 'transform', 'translate(x,y)')
  tempoCursors[0].setAttributeNS(null, 'transform', 'translate( 50,0)');
} // function makeScrollingTempoCursors() END
//#endef Make Scrolling Tempo Cursors


//#endef BUILD WORLD

//#ef WIPE/UPDATE/DRAW



//#endef WIPE/UPDATE/DRAW

//#ef ANIMATION

//#ef Animation Engine
function animationEngine(timestamp) { //timestamp not used; timeSync server library used instead

  let ts_Date = new Date(TS.now()); //Date stamp object from TimeSync library
  let tsNowEpochTime_MS = ts_Date.getTime();
  cumulativeChangeBtwnFrames_MS += tsNowEpochTime_MS - epochTimeOfLastFrame_MS;
  epochTimeOfLastFrame_MS = tsNowEpochTime_MS; //update epochTimeOfLastFrame_MS for next frame

  while (cumulativeChangeBtwnFrames_MS >= MS_PER_FRAME) { //if too little change of clock time will wait until 1 animation frame's worth of MS before updating etc.; if too much change will update several times until caught up with clock time

    if (cumulativeChangeBtwnFrames_MS > (MS_PER_FRAME * FRAMERATE)) cumulativeChangeBtwnFrames_MS = MS_PER_FRAME; //escape hatch if more than 1 second of frames has passed then just skip to next update according to clock

    wipe(tsNowEpochTime_MS);
    update(tsNowEpochTime_MS);
    draw(tsNowEpochTime_MS);

    LASTFRAMECOUNT = FRAMECOUNT;
    FRAMECOUNT++

    cumulativeChangeBtwnFrames_MS -= MS_PER_FRAME; //subtract from cumulativeChangeBtwnFrames_MS 1 frame worth of MS until while cond is satisified

  } // while (cumulativeChangeBtwnFrames_MS >= MS_PER_FRAME) END

  if (animationEngineCanRun) requestAnimationFrame(animationEngine); //animation engine gate: animationEngineCanRun

} // function animationEngine(timestamp) END
//#endef Animation Engine END

//#ef WIPE/UPDATE/DRAW

//#ef Wipe Function
function wipe(epochClock_MS) {

} // function wipe() END
//#endef Wipe Function

//#ef Update Function
function update(epochClock_MS) {

}
//#endef Update Function

//#ef Draw Function
function draw(epochClock_MS) {

}
//#endef Draw Function

//#endef WIPE/UPDATE/DRAW

//#endef ANIMATION





//
