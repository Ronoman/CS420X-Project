// "global" variables
let gl, uTime, uRes, transformFeedback, 
    buffer1, buffer2, simulationPosition, copyPosition,
    textureBack, textureFront, framebuffer,
    copyProgram, simulationProgram, quad,
    dimensions = { width:null, height:null },
    agentCount = 2500000

window.onload = function() {
  const canvas = document.getElementById( 'gl' )
  gl = canvas.getContext( 'webgl2' )
  canvas.width  = dimensions.width  = window.innerWidth
  canvas.height = dimensions.height = window.innerHeight

  // define drawing area of canvas. bottom corner, width / height
  gl.viewport( 0,0,gl.drawingBufferWidth, gl.drawingBufferHeight )

  makeCopyPhase()
  makeSimulationPhase()
  makeDecayDiffusePhase()
  makeTextures()
  // makeControls()
  render()
}

function makeCopyPhase() {
  makeCopyShaders()
  quad = makeCopyBuffer()
  makeCopyUniforms()
}

function makeCopyShaders() {
  let shaderScript = document.getElementById('copyVertex')
  let shaderSource = shaderScript.text
  let vertexShader = gl.createShader( gl.VERTEX_SHADER )
  gl.shaderSource( vertexShader, shaderSource )
  gl.compileShader( vertexShader )

  // create fragment shader
  shaderScript = document.getElementById('copyFragment')
  shaderSource = shaderScript.text
  const drawFragmentShader = gl.createShader( gl.FRAGMENT_SHADER )
  gl.shaderSource( drawFragmentShader, shaderSource )
  gl.compileShader( drawFragmentShader )
  console.log( gl.getShaderInfoLog(drawFragmentShader) )

  // create shader program  
  copyProgram = gl.createProgram()
  gl.attachShader( copyProgram, vertexShader )
  gl.attachShader( copyProgram, drawFragmentShader )
  
  gl.linkProgram( copyProgram )
  gl.useProgram( copyProgram )
}

function makeCopyBuffer() {
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

  return buffer
}

function makeCopyUniforms() {
  uRes = gl.getUniformLocation( copyProgram, 'resolution' )
  gl.uniform2f( uRes, dimensions.width, dimensions.height )

  // get position attribute location in shader
  copyPosition = gl.getAttribLocation( copyProgram, 'a_pos' )
  // enable the attribute
  gl.enableVertexAttribArray( copyPosition )
  // this will point to the vertices in the last bound array buffer.
  // In this example, we only use one array buffer, where we're storing 
  // our vertices. Each vertex will have to floats (one for x, one for y)
  gl.vertexAttribPointer( copyPosition, 2, gl.FLOAT, false, 0,0 )
}

function makeSimulationPhase(){
  makeSimulationShaders()
  makeSimulationBuffer()
  makeSimulationUniforms()
}

function makeSimulationShaders() {
  let shaderScript = document.getElementById('simulationVertex')
  let shaderSource = shaderScript.text
  let vertexShader = gl.createShader( gl.VERTEX_SHADER )
  gl.shaderSource( vertexShader, shaderSource )
  gl.compileShader( vertexShader )

  // create fragment shader
  shaderScript = document.getElementById('simulationFragment')
  shaderSource = shaderScript.text
  const simulationFragmentShader = gl.createShader( gl.FRAGMENT_SHADER )
  gl.shaderSource( simulationFragmentShader, shaderSource )
  gl.compileShader( simulationFragmentShader )
  console.log( gl.getShaderInfoLog(simulationFragmentShader) )
  
  // create render program that draws to screen
  simulationProgram = gl.createProgram()
  gl.attachShader( simulationProgram, vertexShader )
  gl.attachShader( simulationProgram, simulationFragmentShader )

  transformFeedback = gl.createTransformFeedback()
  gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, transformFeedback)
  gl.transformFeedbackVaryings( simulationProgram, ["o_vpos"], gl.SEPARATE_ATTRIBS )

  gl.linkProgram( simulationProgram )
  gl.useProgram(  simulationProgram )
}

function makeSimulationBuffer() {
  // create a buffer object to store vertices
  buffer1 = gl.createBuffer()
  buffer2 = gl.createBuffer()

  // we’re using a vec4
  const agentSize = 4
  const buffer = new Float32Array( agentCount * agentSize )
	
	// set random positions / random headings
  for (let i = 0; i < agentCount * agentSize; i+= agentSize ) {
    buffer[i]   = -1 + Math.random() * 2
    buffer[i+1] = -1 + Math.random() * 2
    buffer[i+2] = Math.random()
    buffer[i+3] = Math.random()
  }

  gl.bindBuffer( gl.ARRAY_BUFFER, buffer1 )

  gl.bufferData( 
    gl.ARRAY_BUFFER, 
    buffer, 
    gl.DYNAMIC_COPY 
  )

  gl.bindBuffer( gl.ARRAY_BUFFER, buffer2 )

  gl.bufferData( gl.ARRAY_BUFFER, agentCount*16, gl.DYNAMIC_COPY )

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
}

function makeSimulationUniforms() {
  uRes = gl.getUniformLocation( simulationProgram, 'resolution' )
  gl.uniform2f( uRes, gl.drawingBufferWidth, gl.drawingBufferHeight )
    
  // get position attribute location in shader
  simulationPosition = gl.getAttribLocation( simulationProgram, 'a_pos' )
  // enable the attribute
  gl.enableVertexAttribArray( simulationPosition )

  gl.vertexAttribPointer( simulationPosition, 4, gl.FLOAT, false, 0,0 )
}

function makeDecayDiffusePhase() {
  makeDecayDiffuseShaders()
  makeDecayDiffuseUniforms()
}

function makeDecayDiffuseShaders() {
  let shaderScript = document.getElementById('copyVertex')
  let shaderSource = shaderScript.text
  let vertexShader = gl.createShader( gl.VERTEX_SHADER )
  gl.shaderSource( vertexShader, shaderSource )
  gl.compileShader( vertexShader )

  // create fragment shader
  shaderScript = document.getElementById('ddFragment')
  shaderSource = shaderScript.text
  const drawFragmentShader = gl.createShader( gl.FRAGMENT_SHADER )
  gl.shaderSource( drawFragmentShader, shaderSource )
  gl.compileShader( drawFragmentShader )
  console.log( gl.getShaderInfoLog(drawFragmentShader) )

  // create shader program  
  ddProgram = gl.createProgram()
  gl.attachShader( ddProgram, vertexShader )
  gl.attachShader( ddProgram, drawFragmentShader )
  
  gl.linkProgram( ddProgram )
  gl.useProgram( ddProgram )
}

function makeDecayDiffuseUniforms() {
  uResDD = gl.getUniformLocation( ddProgram, 'resolution' )
  gl.uniform2f( uResDD, dimensions.width, dimensions.height )

  // get position attribute location in shader
  ddPosition = gl.getAttribLocation( ddProgram, 'a_pos' )
  // enable the attribute
  gl.enableVertexAttribArray( copyPosition )
  // this will point to the vertices in the last bound array buffer.
  // In this example, we only use one array buffer, where we're storing 
  // our vertices. Each vertex will have to floats (one for x, one for y)
  gl.vertexAttribPointer( copyPosition, 2, gl.FLOAT, false, 0,0 )
}

function makeTextures() {
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
  
  // specify texture format, see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texImage2D
  gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, dimensions.width, dimensions.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null )

  textureFront = gl.createTexture()
  gl.bindTexture( gl.TEXTURE_2D, textureFront )
  gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE )
  gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE )
  gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST )
  gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST )
  gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, dimensions.width, dimensions.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null )

  // Create a framebuffer and attach the texture.
  framebuffer = gl.createFramebuffer()
}

function makeControls() {
  const pane = new Tweakpane.Pane({title: "Reaction Diffusion Simulation"})

  const PARAMS = {
    "Da": 1.0,
    "Db": 0.5,
    "f": 0.055,
    "k": 0.062,
    "Variable kill rate": true,
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
  simOptions.addInput(PARAMS, 'Paused').on('change', (ev) => {
    gl.useProgram(simulationProgram)
    let loc = gl.getUniformLocation(simulationProgram, "pause");
    gl.uniform1i(loc, ev.value)
  });
  simOptions.addInput(PARAMS, 'Variable kill rate').on('change', (ev) => {
    gl.useProgram(simulationProgram)
    let loc = gl.getUniformLocation(simulationProgram, "varying_kill");
    gl.uniform1i(loc, ev.value)
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

function render() {
  window.requestAnimationFrame( render )
	
	/* AGENT-BASED SIMULATION */
  gl.useProgram( simulationProgram )

  gl.bindFramebuffer( gl.FRAMEBUFFER, framebuffer )
  // gl.uniform1f( uFrame, frame )

  // use the framebuffer to write to our textureFront texture
  gl.framebufferTexture2D( gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, textureFront, 0 )

  gl.activeTexture( gl.TEXTURE0 )
  // read from textureBack in our shaders
  gl.bindTexture( gl.TEXTURE_2D, textureBack )

  // bind our array buffer of vants
  gl.bindBuffer( gl.ARRAY_BUFFER, buffer1 )
  gl.vertexAttribPointer( simulationPosition, 4, gl.FLOAT, false, 0,0 )
  gl.bindBufferBase( gl.TRANSFORM_FEEDBACK_BUFFER, 0, buffer2 )
  
  gl.beginTransformFeedback( gl.POINTS )  
  gl.drawArrays( gl.POINTS, 0, agentCount )
  gl.endTransformFeedback()
	/* END Agent-based simulation */

	/* SWAP */
  let _tmp = textureFront
  textureFront = textureBack
  textureBack = _tmp

  /* Decay / Diffuse */
  gl.framebufferTexture2D( gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, textureFront, 0 )

  gl.activeTexture( gl.TEXTURE0 )
  gl.bindTexture(   gl.TEXTURE_2D, textureBack )

  gl.useProgram( ddProgram )

  gl.bindBuffer( gl.ARRAY_BUFFER, quad )
  gl.vertexAttribPointer( ddPosition, 2, gl.FLOAT, false, 0,0 )

  gl.drawArrays( gl.TRIANGLES, 0, 6 )
  /* END Decay / Diffuse */

  /* COPY TO SCREEN */
  // use the default framebuffer object by passing null
  gl.bindFramebuffer( gl.FRAMEBUFFER, null )
  gl.viewport( 0,0,gl.drawingBufferWidth, gl.drawingBufferHeight )

  gl.bindTexture( gl.TEXTURE_2D, textureBack )

  // use our drawing (copy) shader
  gl.useProgram( copyProgram )

  gl.bindBuffer( gl.ARRAY_BUFFER, quad )
  gl.vertexAttribPointer( copyPosition, 2, gl.FLOAT, false, 0,0 )

  // put simulation on screen
  gl.drawArrays( gl.TRIANGLES, 0, 6 )
  /* END COPY TO SCREEN */

	// swap vertex buffers 
  let tmp = buffer1;  buffer1 = buffer2;  buffer2 = tmp;
}