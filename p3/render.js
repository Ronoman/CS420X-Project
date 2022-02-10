let gl, framebuffer,
    simulationProgram, drawProgram,
    uTime, uSimulationState,
    textureBack, textureFront,
    dimensions = { width:null, height:null }

function poke( x, y, value, texture ) {   
    //gl.bindTexture( gl.TEXTURE_2D, texture )
    
    // https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texSubImage2D
    gl.texSubImage2D( 
        gl.TEXTURE_2D, 0, 
        // x offset, y offset, width, height
        x, y, 1, 1,
        gl.RGBA, gl.FLOAT,
        // is supposed to be a typed array
        new Float32Array([ value[0]/255, value[1]/255, value[2]/255, 1 ])
    )
}

// https://stackoverflow.com/a/59211338/1730405
function drawCircleToTex(radius, offsetX, offsetY, tex)
{
  gl.bindTexture(gl.TEXTURE_2D, tex);

  largestX = radius;
  radiusSquared = Math.pow(radius, 2);
  for(let x = -radius; x < radius; x++)
  {
    let hh = Math.sqrt(radiusSquared - Math.pow(x, 2));
    let rx = offsetX + x;
    let ph = offsetY + hh;

    for(let y = offsetY - hh; y < ph; y++)
    {
      poke(rx, y, [255, 255, 0]);
    }
  }
}

function setInitialState() {
  // Initialize sim parameters
  gl.useProgram(simulationProgram);

  uDA = gl.getUniformLocation(simulationProgram, "DA");
  uDB = gl.getUniformLocation(simulationProgram, "DB");
  uF  = gl.getUniformLocation(simulationProgram, "f");
  uK  = gl.getUniformLocation(simulationProgram, "k");

  // Suggested starting parameters from https://karlsims.com/rd.html
  gl.uniform1f(uDA, 1.0);
  gl.uniform1f(uDB, 0.5);
  gl.uniform1f(uF, 0.055);
  gl.uniform1f(uK, 0.062);

  gl.bindTexture(gl.TEXTURE_2D, textureBack)
  for( i = 0; i < dimensions.width; i++ ) {
    for( j = 0; j < dimensions.height; j++ ) {
      // Initialize with A=1, B=0
      poke( i, j, [255, 0, 0], textureBack ) 
    }
  }

  // Size of the area to add chemical B to. Centered on the screen
  const B_WIDTH = 200;
  const B_HEIGHT = 100;

  let startX = parseInt(dimensions.width/2 - B_WIDTH/2);
  let startY = parseInt(dimensions.height/2 - B_HEIGHT/2);

  // TODO: Maybe change poke() to take in these ranges, since texSubImage2D takes width and height
  // for(i = 0; i < dimensions.width; i++) {
  //   for(j = 0; j < dimensions.height; j++) {
  //     poke( i, j, [255, 0, 0], textureBack )
  //   }
  // }

  for(i = startX; i < startX + B_WIDTH; i++) {
    for(j = startY; j < startY + B_HEIGHT; j++) {
      poke( i, j, [255, 255, 0], textureBack )
    }
  }

  // drawCircleToTex(30, -20 + dimensions.width/2, dimensions.height/2, textureBack);
  // drawCircleToTex(30, 20 + dimensions.width/2,  dimensions.height/2, textureBack);
}

function initWidgets() {
  const pane = new Tweakpane.Pane({title: "Reaction Diffusion Simulation"})

  const PARAMS = {
    "Da": 1.0,
    "Db": 0.5,
    "f": 0.055,
    "k": 0.062,
    "Mode": '',
    "Paused": false
  }

  simParams = pane.addFolder({title: "Simulation Parameters"})
  simParams.addInput(PARAMS, 'Da', {
    min: 0.01,
    max: 1.0,
    step: 0.01
  }).on('change', (ev) => {
    gl.useProgram(simulationProgram)
    let loc = gl.getUniformLocation(simulationProgram, "DA");
    gl.uniform1f(loc, ev.value)
  });
  simParams.addInput(PARAMS, 'Db', {
    min: 0.01,
    max: 1.0,
    step: 0.01
  }).on('change', (ev) => {
    gl.useProgram(simulationProgram)
    let loc = gl.getUniformLocation(simulationProgram, "DB");
    gl.uniform1f(loc, ev.value)
  });
  simParams.addInput(PARAMS, 'f', {
    min: 0.01,
    max: 1.0,
    step: 0.01
  }).on('change', (ev) => {
    gl.useProgram(simulationProgram)
    let loc = gl.getUniformLocation(simulationProgram, "f");
    gl.uniform1f(loc, ev.value)
  });
  simParams.addInput(PARAMS, 'k', {
    min: 0.01,
    max: 1.0,
    step: 0.01
  }).on('change', (ev) => {
    gl.useProgram(simulationProgram)
    let loc = gl.getUniformLocation(simulationProgram, "k");
    gl.uniform1f(loc, ev.value)
  });
  
  simOptions = pane.addFolder({title: "Simulation Options"})
  simOptions.addInput(PARAMS, 'Paused', {
    min: 0.01,
    max: 1.0,
    step: 0.01
  }).on('change', (ev) => {
    gl.useProgram(simulationProgram)
    let loc = gl.getUniformLocation(simulationProgram, "pause");
    gl.uniform1i(loc, ev.value)
  });
  simOptions.addInput(PARAMS, 'Mode', {
    options: {
      normal: "Normal",
      skew_kill: "Skew kill rate"
    }
  }).on('change', (ev) => {
    gl.useProgram(simulationProgram)

    // Pause sim
    let loc = gl.getUniformLocation(simulationProgram, "pause");
    gl.uniform1i(loc, ev.value)

    // Reset sim
  })
  simOptions.addButton({
    title: "Reset"
  }).on('click', () => {
    gl.useProgram(simulationProgram)

    // Pause the simulation
    let loc = gl.getUniformLocation(simulationProgram, "pause");
    gl.uniform1i(loc, 1)

    // Reset to the initial state
    setInitialState()

    // Unpause sim
    gl.uniform1i(loc, 0)
  })
}

window.onload = function() {
  const canvas = document.getElementById( 'gl' )
  gl = canvas.getContext( 'webgl2' )
  canvas.width = dimensions.width = window.innerWidth
  canvas.height = dimensions.height = window.innerHeight

  console.log(dimensions.width)
  console.log(dimensions.height)
  
  // define drawing area of webgl canvas. bottom corner, width / height
  // XXX can't remember why we need the *2!
  gl.viewport( 0,0, gl.drawingBufferWidth, gl.drawingBufferHeight )
  
  initWidgets()
  makeBuffer()
  makeShaders()
  makeTextures()
  setInitialState()
  console.log("Set initial state")
  // textures loaded, now ready to render
  render()
}

function makeBuffer() {
  // create a buffer object to store vertices
  const buffer = gl.createBuffer()

  // point buffer at graphic context's ARRAY_BUFFER
  gl.bindBuffer( gl.ARRAY_BUFFER, buffer )

  const triangles = new Float32Array([
    -1, -1,
      1, -1,
    -1,  1,
    -1,  1,
      1, -1,
      1,  1
  ])

  // initialize memory for buffer and populate it. Give
  // open gl hint contents will not change dynamically.
  gl.bufferData( gl.ARRAY_BUFFER, triangles, gl.STATIC_DRAW )
}

function makeShaders() {
  // create vertex shader
  let shaderScript = document.getElementById('vertex')
  let shaderSource = shaderScript.text
  const vertexShader = gl.createShader( gl.VERTEX_SHADER )
  gl.shaderSource( vertexShader, shaderSource )
  gl.compileShader( vertexShader )

  // create fragment shader
  shaderScript = document.getElementById('render')
  shaderSource = shaderScript.text
  const drawFragmentShader = gl.createShader( gl.FRAGMENT_SHADER )
  gl.shaderSource( drawFragmentShader, shaderSource )
  gl.compileShader( drawFragmentShader )
  let infoLog = gl.getShaderInfoLog(drawFragmentShader)
  if(infoLog === "") {
    console.log("Successfully initialized fragment shader")
  } else {
    console.log(infoLog)
  }
  
  // create render program that draws to screen
  drawProgram = gl.createProgram()
  gl.attachShader( drawProgram, vertexShader )
  gl.attachShader( drawProgram, drawFragmentShader )

  gl.linkProgram( drawProgram )
  gl.useProgram( drawProgram )
  
  uRes = gl.getUniformLocation( drawProgram, 'resolution' )
  gl.uniform2f( uRes, gl.drawingBufferWidth, gl.drawingBufferHeight )

  // get position attribute location in shader
  let position = gl.getAttribLocation( drawProgram, 'a_position' )
  // enable the attribute
  gl.enableVertexAttribArray( position )
  // this will point to the vertices in the last bound array buffer.
  // In this example, we only use one array buffer, where we're storing 
  // our vertices
  gl.vertexAttribPointer( position, 2, gl.FLOAT, false, 0,0 )
  
  shaderScript = document.getElementById('simulation')
  shaderSource = shaderScript.text
  const simulationFragmentShader = gl.createShader( gl.FRAGMENT_SHADER )
  gl.shaderSource( simulationFragmentShader, shaderSource )
  gl.compileShader( simulationFragmentShader )
  infoLog = gl.getShaderInfoLog(simulationFragmentShader)
  if(infoLog === "") {
    console.log("Successfully initialized simulation shader")
  } else {
    console.log(infoLog)
  }
  
  // create simulation program
  simulationProgram = gl.createProgram()
  gl.attachShader( simulationProgram, vertexShader )
  gl.attachShader( simulationProgram, simulationFragmentShader )

  gl.linkProgram( simulationProgram )
  gl.useProgram( simulationProgram )
  
  uRes = gl.getUniformLocation( simulationProgram, 'resolution' )
  gl.uniform2f( uRes, gl.drawingBufferWidth, gl.drawingBufferHeight )
  
  // find a pointer to the uniform "time" in our fragment shader
  uTime = gl.getUniformLocation( simulationProgram, 'time' )
  
  uSimulationState = gl.getUniformLocation( simulationProgram, 'state' )

  position = gl.getAttribLocation( simulationProgram, 'a_position' )
  gl.enableVertexAttribArray( simulationProgram )
  gl.vertexAttribPointer( position, 2, gl.FLOAT, false, 0,0 )
}

function makeTextures() {
  gl.getExtension("EXT_color_buffer_float")

  textureBack = gl.createTexture()
  gl.bindTexture( gl.TEXTURE_2D, textureBack )
  
  // these two lines are needed for non-power-of-2 textures
  gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE )
  gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE )
  
  // how to map when texture element is less than one pixel
  // use gl.NEAREST to avoid linear interpolation
  gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST )
  // how to map when texture element is more than one pixel
  gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  
  console.log("texImage2D call on textureBack")
  // specify texture format, see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texImage2D
  gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA32F, dimensions.width, dimensions.height, 0, gl.RGBA, gl.FLOAT, null )

  textureFront = gl.createTexture()
  gl.bindTexture( gl.TEXTURE_2D, textureFront )
  gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE )
  gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE )
  gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST )
  gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST )
  gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA32F, dimensions.width, dimensions.height, 0, gl.RGBA, gl.FLOAT, null )

  // Create a framebuffer and attach the texture.
  framebuffer = gl.createFramebuffer()
}

// keep track of time via incremental frame counter
let time = 0
function render() {
  // schedules render to be called the next time the video card requests 
  // a frame of video
  window.requestAnimationFrame( render )
  
  // use our simulation shader
  gl.useProgram( simulationProgram )  
  // update time on CPU and GPU
  time++
  gl.uniform1f( uTime, time )     
  gl.bindFramebuffer( gl.FRAMEBUFFER, framebuffer )
  // use the framebuffer to write to our texFront texture
  gl.framebufferTexture2D( gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, textureFront, 0 )
  // set viewport to be the size of our state (game of life simulation)
  // here, this represents the size that will be drawn onto our texture
  gl.viewport(0, 0, dimensions.width,dimensions.height )
  
  // in our shaders, read from texBack, which is where we poked to
  gl.activeTexture( gl.TEXTURE0 )
  gl.bindTexture( gl.TEXTURE_2D, textureBack )
  gl.uniform1i( uSimulationState, 0 )
  // run shader
  gl.drawArrays( gl.TRIANGLES, 0, 6 )

  // swap our front and back textures
  let tmp = textureFront
  textureFront = textureBack
  textureBack = tmp

  // use the default framebuffer object by passing null
  gl.bindFramebuffer( gl.FRAMEBUFFER, null )
  // set our viewport to be the size of our canvas
  // so that it will fill it entirely
  gl.viewport(0, 0, dimensions.width,dimensions.height )
  // select the texture we would like to draw to the screen.
  // note that webgl does not allow you to write to / read from the
  // same texture in a single render pass. Because of the swap, we're
  // displaying the state of our simulation ****before**** this render pass (frame)
  gl.bindTexture( gl.TEXTURE_2D, textureFront )
  // use our drawing (copy) shader
  gl.useProgram( drawProgram )
  // put simulation on screen
  gl.drawArrays( gl.TRIANGLES, 0, 6 )
}