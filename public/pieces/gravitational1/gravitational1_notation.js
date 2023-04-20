//#ef NOTES
/*
Make a timing to pixel matrix with top, bottom, and x
Input time, get location
*/
//#endef NOTES

//#ef GLOBAL VARIABLES


//##ef General Variables
const TEMPO_COLORS = [clr_brightOrange, clr_brightGreen, clr_brightBlue, clr_lavander, clr_darkRed2];
//##endef General Variables

//##ef Timing
const FRAMERATE = 60;
let FRAMECOUNT = 0;
const PX_PER_SEC = 100;
const PX_PER_FRAME = PX_PER_SEC / FRAMERATE;
const MS_PER_FRAME = 1000.0 / FRAMERATE;
const LEAD_IN_TIME_SEC = 2;
const LEAD_IN_TIME_MS = LEAD_IN_TIME_SEC * 1000;
const LEAD_IN_FRAMES = LEAD_IN_TIME_SEC * FRAMERATE;
let startTime_epochTime_MS = 0;
//##endef Timing

//##ef World Canvas Variables
let worldPanel;
const CANVAS_MARGIN = 4;
let CANVAS_W = 1000;
let CANVAS_H = 500;
let CANVAS_CENTER = CANVAS_W / 2;
//##endef END World Canvas Variables

//##ef Staff Variables
let staffDiv, staffSVG;
//##endef END Staff Variables

//##ef BBs Variables
let bbSet = [];
for (let trIx = 0; trIx < NUM_TRACKS; trIx++) bbSet.push({});
const BB_W = 51;
const BB_H = 90;
const BB_TOP = RENDERER_TOP + RENDERER_H;
const BB_CENTER = BB_W / 2;
const BB_PAD_LEFT = 10;
const BB_GAP = 16;
const BBCIRC_R = 13;
const BBCIRC_TOP_CY = BBCIRC_R + 3;
const BBCIRC_BOTTOM_CY = BB_H - BBCIRC_R;
const BB_TRAVEL_DIST = BBCIRC_BOTTOM_CY - BBCIRC_TOP_CY;
const BB_BOUNCE_WEIGHT = 6;
const HALF_BB_BOUNCE_WEIGHT = BB_BOUNCE_WEIGHT / 2;
//##endef BBs Variables

//##ef Scrolling Tempo Cursors
let tempoCursors = [];
const NOTATION_CURSOR_H = 50;
const NOTATION_CURSOR_STROKE_W = 3;
//##endef Scrolling Tempo Cursors

//##ef Scrolling Cursor BBs Variables
let scrollingCsrBbsObjSet = [];
for (let trIx = 0; trIx < NUM_TEMPOS; trIx++) scrollingCsrBbsObjSet.push({});
const SCRBB_GAP = 3;
const SCRBB_W = 9;
const SCRBB_H = NOTATION_CURSOR_H + 2;
const SCRBB_TOP = HALF_NOTEHEAD_H - NOTATION_CURSOR_H - 1;
const SCRBB_CENTER = (-SCRBB_W / 2) - SCRBB_GAP;
const SCRBB_LEFT = -SCRBB_W - SCRBB_GAP;
const SCRBBCIRC_R = SCRBB_W - 4;
const SCRBBCIRC_TOP_CY = SCRBB_TOP + 5;
const SCRBBCIRC_BOTTOM_CY = -SCRBBCIRC_R;
const SCRBB_TRAVEL_DIST = SCRBBCIRC_BOTTOM_CY - SCRBBCIRC_TOP_CY;
const SCRBB_BOUNCE_WEIGHT = 3;
const SCRBB_BOUNCE_WEIGHT_HALF = SCRBB_BOUNCE_WEIGHT / 2;
//##endef Scrolling Cursor BBs Variables

//#ef Animation Engine Variables
let cumulativeChangeBtwnFrames_MS = 0;
let epochTimeOfLastFrame_MS;
let animationEngineCanRun = true;
//#endef END Animation Engine Variables

//#ef SOCKET IO
let ioConnection;

if (window.location.hostname == 'localhost') {
  ioConnection = io();
} else {
  ioConnection = io.connect(window.location.hostname);
}
const SOCKET = ioConnection;
//#endef > END SOCKET IO

//#ef TIMESYNC
const TS = timesync.create({
  server: '/timesync',
  interval: 1000
});
//#endef TIMESYNC


//#endef GLOBAL VARIABLES

//#ef INIT


function init() {
  makeWorldPanel();
  makeStaffContainers();

  // makeBouncingBalls();
  // makeScrollingTempoCursors();
  // makeScrollingCursorBbs();
} // function init() END


//#endef INIT

//#ef BUILD WORLD


//##ef Make World Panel

function makeWorldPanel() {

  worldPanel = mkPanel({
    w: CANVAS_W,
    h: CANVAS_H,
    title: 'Gravitational I',
    onwindowresize: true,
    clr: clr_blueGrey
  });

} // function makeWorldPanel() END

//##endef Make World Panel

//##ef Make Staff Containers

function makeStaffContainers() {

  staffDiv = mkDiv({
    canvas: worldPanel.content,
    w: CANVAS_W,
    h: CANVAS_H,
    top: 0,
    left: 0,
    bgClr: clr_blueGrey
  });

  staffSVG = mkSVGcontainer({
    canvas: rhythmicNotationObj.div,
    w: CANVAS_W,
    h: CANVAS_H,
    x: 0,
    y: 0
  });

} // makeStaffContainers() END

//##endef Make Staff Containers

//##ef Make BBs
function makeBouncingBalls() {

  for (let bbIx = 0; bbIx < NUM_TRACKS; bbIx++) {

    bbSet[bbIx]['div'] = mkDiv({
      canvas: worldPanel.content,
      w: BB_W,
      h: BB_H,
      top: BB_TOP,
      left: RENDERER_DIV_LEFT + BB_PAD_LEFT + ((BB_W + BB_GAP) * bbIx),
      bgClr: 'white'
    });

    bbSet[bbIx]['svgCont'] = mkSVGcontainer({
      canvas: bbSet[bbIx].div,
      w: BB_W,
      h: BB_H,
      x: 0,
      y: 0
    });

    bbSet[bbIx]['bbCirc'] = mkSvgCircle({
      svgContainer: bbSet[bbIx].svgCont,
      cx: BB_CENTER,
      cy: BBCIRC_BOTTOM_CY,
      r: BBCIRC_R,
      fill: TEMPO_COLORS[bbIx],
      stroke: 'white',
      strokeW: 0
    });

    bbSet[bbIx]['bbBouncePadOff'] = mkSvgLine({
      svgContainer: bbSet[bbIx].svgCont,
      x1: 0,
      y1: BB_H - HALF_BB_BOUNCE_WEIGHT,
      x2: BB_W,
      y2: BB_H - HALF_BB_BOUNCE_WEIGHT,
      stroke: 'black',
      strokeW: BB_BOUNCE_WEIGHT
    });

    bbSet[bbIx]['bbBouncePadOn'] = mkSvgLine({
      svgContainer: bbSet[bbIx].svgCont,
      x1: 0,
      y1: BB_H - HALF_BB_BOUNCE_WEIGHT,
      x2: BB_W,
      y2: BB_H - HALF_BB_BOUNCE_WEIGHT,
      stroke: 'yellow',
      strokeW: BB_BOUNCE_WEIGHT + 2
    });
    bbSet[bbIx].bbBouncePadOn.setAttributeNS(null, 'display', 'none');

    bbSet[bbIx]['offIndicator'] = mkSvgRect({
      svgContainer: bbSet[bbIx].svgCont,
      x: 0,
      y: 0,
      w: BB_W,
      h: BB_H,
      fill: 'rgba(173, 173, 183, 0.9)',
    });
    bbSet[bbIx].offIndicator.setAttributeNS(null, 'display', 'none');

  } //for (let bbIx = 0; bbIx < NUM_TRACKS; bbIx++) END

} //makeBouncingBalls() end
//##endef Make BBs

//##ef Make Scrolling Tempo Cursors


function makeScrollingTempoCursors() {

  for (let tempoCsrIx = 0; tempoCsrIx < NUM_TEMPOS; tempoCsrIx++) {

    let tLine = mkSvgLine({
      svgContainer: rhythmicNotationObj.svgCont,
      x1: 0,
      y1: HALF_NOTEHEAD_H - NOTATION_CURSOR_H,
      x2: 0,
      y2: HALF_NOTEHEAD_H,
      stroke: TEMPO_COLORS[tempoCsrIx],
      strokeW: NOTATION_CURSOR_STROKE_W
    });
    tLine.setAttributeNS(null, 'stroke-linecap', 'round');
    tLine.setAttributeNS(null, 'display', 'none');
    // tLine.setAttributeNS(null, 'transform', "translate(" + beatCoords[4].x.toString() + "," + beatCoords[4].y.toString() + ")");
    tempoCursors.push(tLine);

  } //for (let tempoCsrIx = 0; tempoCsrIx < NUM_TEMPOS; tempoCsrIx++) END
  // tempoCursors[0].setAttributeNS(null, 'display', 'yes');
  // tempoCursors[0].setAttributeNS(null, 'transform', 'translate(' + beatCoords[3].x.toString() + ',' + beatCoords[3].y.toString() + ')');
} // function makeScrollingTempoCursors() END


//##endef Make Scrolling Tempo Cursors

//##ef Make Scrolling Cursor BBs


function makeScrollingCursorBbs() {
  // scrollingCsrBbsObjSet
  for (let csrBbIx = 0; csrBbIx < NUM_TEMPOS; csrBbIx++) {

    scrollingCsrBbsObjSet[csrBbIx]['ball'] = mkSvgCircle({
      svgContainer: rhythmicNotationObj.svgCont,
      cx: SCRBB_CENTER,
      cy: SCRBBCIRC_TOP_CY,
      r: SCRBBCIRC_R,
      fill: TEMPO_COLORS[csrBbIx],
      stroke: 'white',
      strokeW: 0
    });

    scrollingCsrBbsObjSet[csrBbIx].ball.setAttributeNS(null, 'display', 'none');

  } //for (let csrBbIx = 0; csrBbIx < NUM_TEMPOS; csrBbIx++) END

} //function makeScrollingCursorBbs() END


//##endef Make Scrolling Cursor BBs


//#endef BUILD WORLD

//#ef WIPE/UPDATE/DRAW


//##ef BBs WIPE/UPDATE/DRAW

//###ef wipeBBs
function wipeBBs() {
  bbSet.forEach((tbb) => {
    tbb.bbBouncePadOn.setAttributeNS(null, 'display', 'none');
  }); // bbSet.forEach((tbb) =>
} // function wipeBbComplex()
//###endef wipeBBs

//###ef updateBBs
function updateBBs() {

  if (FRAMECOUNT >= 0) {
    scoreData.bbYpos_perTempo.forEach((bbYposSet, tempoIx) => { // Loop: set of goFrames

      let bbYposSetIx = FRAMECOUNT % bbYposSet.length; //adjust current FRAMECOUNT to account for lead-in and loop this tempo's set of goFrames
      let tBbCy = bbYposSet[bbYposSetIx];

      bbSet[tempoIx].bbCirc.setAttributeNS(null, 'cy', tBbCy);
      bbSet[tempoIx].bbCirc.setAttributeNS(null, 'display', 'yes');

    }); // scoreData.bbYpos_perTempo.forEach((bbYposSet, tempoIx) => END
  } // if (FRAMECOUNT >= 0) END
  //
  else if (FRAMECOUNT < 0) {
    scoreData.leadIn_bbYpos_perTempo.forEach((leadInSet, tempoIx) => {

      if (-FRAMECOUNT <= leadInSet.length) {
        let tfSetIx = leadInSet.length + FRAMECOUNT;
        bbSet[tempoIx].bbCirc.setAttributeNS(null, 'cy', leadInSet[tfSetIx]);
      } //  if (-FRAMECOUNT <= leadInSet.length)

    }); // scoreData.leadIn_bbYpos_perTempo.forEach((leadInSet, tempoIx) =>  END
  } // if (FRAMECOUNT >= 0) END

} // function updateBBs() END
//###endef updateBBs

//###ef updateBbBouncePad
function updateBbBouncePad() {
  if (FRAMECOUNT >= 0) {

    scoreData.goFretsState_perTempo.forEach((goFrmSet, tempoIx) => { // A set of locations for each frame for each tempo which loops

      let goFrmSetIx = FRAMECOUNT % goFrmSet.length;
      let goFrmState = goFrmSet[goFrmSetIx];

      switch (goFrmState) {

        case 0:
          bbSet[tempoIx].bbBouncePadOn.setAttributeNS(null, 'display', 'none');
          break;

        case 1:
          bbSet[tempoIx].bbBouncePadOn.setAttributeNS(null, 'display', 'yes');
          break;

      } //switch (goFrmState) END

    }); //goFrameCycles_perTempo.forEach((goFrmSet, tempoIx) => END

  } // if (FRAMECOUNT >= 0) END
} // function updateBbBouncePad() END
//###endef updateBbBouncePad

//##endef BBs WIPE/UPDATE/DRAW

//##ef Scrolling Cursors WIPE/UPDATE/DRAW

//###ef wipeTempoCsrs
function wipeTempoCsrs() {
  tempoCursors.forEach((tempoCsr) => {
    tempoCsr.setAttributeNS(null, 'display', 'none');
  });
}
//###endef END wipeTempoCsrs

//###ef updateScrollingCsrs
function updateScrollingCsrs() {
  if (FRAMECOUNT > 0) { //No lead in motion for scrolling cursors
    scoreData.scrollingCsrCoords_perTempo.forEach((posObjSet, tempoIx) => { // Loop: set of goFrames

      let setIx = FRAMECOUNT % posObjSet.length; //adjust current FRAMECOUNT to account for lead-in and loop this tempo's set of goFrames

      let tX = posObjSet[setIx].x;
      let tY1 = posObjSet[setIx].y1;
      let tY2 = posObjSet[setIx].y2;
      tempoCursors[tempoIx].setAttributeNS(null, 'x1', tX);
      tempoCursors[tempoIx].setAttributeNS(null, 'x2', tX);
      tempoCursors[tempoIx].setAttributeNS(null, 'y1', tY1);
      tempoCursors[tempoIx].setAttributeNS(null, 'y2', tY2);
      tempoCursors[tempoIx].setAttributeNS(null, 'display', 'yes');

    }); //goFrameCycles_perTempo.forEach((bbYposSet, tempoIx) => END
  } // if (FRAMECOUNT > LEAD_IN_FRAMES) END
} // function updateScrollingCsrs() END
//###endef updateScrollingCsrs

//##endef Scrolling Cursors WIPE/UPDATE/DRAW

//##ef Notation WIPE/UPDATE/DRAW

//###ef wipeRhythmicNotation
function wipeRhythmicNotation() {
  if (FRAMECOUNT >= 0) {
    motivesByBeat.forEach((thisBeatsMotiveDic) => { //length=16[{key is motiveNum and stores image}]
      for (let key in thisBeatsMotiveDic) {
        let tMotive = thisBeatsMotiveDic[key];
        tMotive.setAttributeNS(null, 'display', 'none');
      }
    });
  }
}
//###endef wipeRhythmicNotation

//###ef Update Notation
function updateNotation() { //FOR UPDATE, HAVE TO HAVE DIFFERENT SIZE LOOP FOR EACH PLAYER
  if (FRAMECOUNT >= 0) {

    let setIx = FRAMECOUNT % scoreData.motiveSet.length; //adjust current FRAMECOUNT to account for lead-in and loop this tempo's set of goFrames

    scoreData.motiveSet[setIx].forEach((motiveObj, beatNum) => { //a set of objects that are on scene {motiveNum:,articulations:[{articulationType:,x:,y:,partialNum:}

      let t_motiveNum = motiveObj.motiveNum;

      motivesByBeat[beatNum][t_motiveNum].setAttributeNS(null, "display", 'yes');

    }); // scoreData.motiveSet[setIx].forEach((motiveNum, beatNum) => => END

  } // if (FRAMECOUNT >= 0) END
} // function updateNotation() END
//###endef Update Notation

//##endef Notation WIPE/UPDATE/DRAW

//##ef Scrolling BBs WIPE/UPDATE/DRAW

//###ef wipeScrBBs
function wipeScrBBs() {
  scrollingCsrBbsObjSet.forEach((scrBbObj) => {
    scrBbObj.ball.setAttributeNS(null, 'display', 'none');
  }); // bbSet.forEach((tbb) =>
} // function wipeBbComplex()
//###endef wipeScrBBs

//###ef updateScrollingBBs
function updateScrollingBBs() {
  if (FRAMECOUNT > 0) { //No lead in motion for scrolling cursors
    scoreData.scrollingCsrCoords_perTempo.forEach((posObjSet, tempoIx) => { // Loop: set of goFrames

      let setIx = FRAMECOUNT % posObjSet.length; //adjust current FRAMECOUNT to account for lead-in and loop this tempo's set of goFrames //scoreData.scrollingCsrCoords_perTempo & scoreData.bbYpos_perTempo arrays are same length so you can just one modulo
      //From scrollingCsrCoords_perTempo:
      let tX = posObjSet[setIx].x;
      let tY1 = posObjSet[setIx].y1;
      let tY2 = posObjSet[setIx].y2;
      //From bbYpos_perTempo:
      let tBbCy = scoreData.bbYpos_perTempo[tempoIx][setIx];

      let tBbCy_norm = (tBbCy - BBCIRC_TOP_CY) / (BBCIRC_BOTTOM_CY - BBCIRC_TOP_CY); //BBCIRC_TOP_CY to BBCIRC_BOTTOM_CY is the distance of the larger bbs; normalize this distance and multiple by the length of the scrolling cursor
      let scrBbY = tY2 - HALF_NOTEHEAD_H + (tBbCy_norm * NOTATION_CURSOR_H);
      let scrBbX = tX + SCRBBCIRC_R + NOTATION_CURSOR_STROKE_W;
      scrollingCsrBbsObjSet[tempoIx].ball.setAttributeNS(null, 'transform', "translate(" + scrBbX.toString() + "," + scrBbY.toString() + ")");
      scrollingCsrBbsObjSet[tempoIx].ball.setAttributeNS(null, 'display', "yes");

    }); //goFrameCycles_perTempo.forEach((bbYposSet, tempoIx) => END
  } // if (FRAMECOUNT > LEAD_IN_FRAMES) END
} // function updateScrollingCsrs() END
//###endef updateScrollingBBs

//##endef Scrolling BBs WIPE/UPDATE/DRAW

//##ef Wipe Function
function wipe() {
  wipeBBs();
  wipeTempoCsrs();
  wipeScrBBs();
} // function wipe() END
//##endef Wipe Function

//##ef Update Function
function update() {
  updateBBs();
  updateBbBouncePad();
  updateScrollingCsrs();
  updateNotation();
  updateScrollingBBs();
}
//##endef Update Function

//##ef Draw Function
function draw() {}
//##endef Draw Function


//#endef WIPE/UPDATE/DRAW

//#ef ANIMATION


//##ef Animation Engine
function animationEngine(timestamp) { //timestamp not used; timeSync server library used instead

  let ts_Date = new Date(TS.now()); //Date stamp object from TimeSync library
  let tsNowEpochTime_MS = ts_Date.getTime();
  cumulativeChangeBtwnFrames_MS += tsNowEpochTime_MS - epochTimeOfLastFrame_MS;
  epochTimeOfLastFrame_MS = tsNowEpochTime_MS; //update epochTimeOfLastFrame_MS for next frame

  while (cumulativeChangeBtwnFrames_MS >= MS_PER_FRAME) { //if too little change of clock time will wait until 1 animation frame's worth of MS before updating etc.; if too much change will update several times until caught up with clock time

    if (cumulativeChangeBtwnFrames_MS > (MS_PER_FRAME * FRAMERATE)) cumulativeChangeBtwnFrames_MS = MS_PER_FRAME; //escape hatch if more than 1 second of frames has passed then just skip to next update according to clock

    wipe();
    update();
    draw();

    cumulativeChangeBtwnFrames_MS -= MS_PER_FRAME; //subtract from cumulativeChangeBtwnFrames_MS 1 frame worth of MS until while cond is satisified

  } // while (cumulativeChangeBtwnFrames_MS >= MS_PER_FRAME) END

  if (animationEngineCanRun) requestAnimationFrame(animationEngine); //animation engine gate: animationEngineCanRun
  // if (FRAMECOUNT < 120) requestAnimationFrame(animationEngine); //animation engine gate: animationEngineCanRun
} // function animationEngine(timestamp) END
//##endef Animation Engine END


//#endef ANIMATION









//
