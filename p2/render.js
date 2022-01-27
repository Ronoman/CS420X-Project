// "global" variables
let gl, uTime, program

window.onload = function() {
  initWebGL()

  initWidgets()
  
  video = getVideo()
}

function initWebGL() {
  const canvas = document.getElementById( 'gl' )
  gl = canvas.getContext( 'webgl' )
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  // define drawing area of canvas. bottom corner, width / height
  gl.viewport( 0,0,gl.drawingBufferWidth, gl.drawingBufferHeight )

  // create a buffer object to store vertices
  const buffer = gl.createBuffer()

  // point buffer at graphic context's ARRAY_BUFFER
  gl.bindBuffer( gl.ARRAY_BUFFER, buffer )

  const triangles = new Float32Array([
    -1, -1,
    1,  -1,
    -1, 1,
    -1, 1,
    1, -1,
    1, 1
  ])

  // initialize memory for buffer and populate it. Give
  // open gl hint contents will not change dynamically.
  gl.bufferData( gl.ARRAY_BUFFER, triangles, gl.STATIC_DRAW )

  // create vertex shader
  let shaderScript = document.getElementById('vertex')
  let shaderSource = shaderScript.text
  const vertexShader = gl.createShader( gl.VERTEX_SHADER )
  gl.shaderSource( vertexShader, shaderSource );
  gl.compileShader( vertexShader )

  // create fragment shader
  shaderScript = document.getElementById('fragment')
  shaderSource = shaderScript.text
  const fragmentShader = gl.createShader( gl.FRAGMENT_SHADER )
  gl.shaderSource( fragmentShader, shaderSource );
  gl.compileShader( fragmentShader )

  // create shader program
  program = gl.createProgram()
  gl.attachShader( program, vertexShader )
  gl.attachShader( program, fragmentShader )
  gl.linkProgram( program )
  gl.useProgram( program )
  
  /* ALL ATTRIBUTE/UNIFORM INITIALIZATION MUST COME AFTER 
  CREATING/LINKING/USING THE SHADER PROGAM */
  
  // find a pointer to the uniform "time" in our fragment shader
  uTime = gl.getUniformLocation( program, 'time' ) 
  const uRes = gl.getUniformLocation( program, 'resolution' )
  gl.uniform2f( uRes, window.innerWidth, window.innerHeight )

  // get position attribute location in shader
  const position = gl.getAttribLocation( program, 'a_position' )
  // enable the attribute
  gl.enableVertexAttribArray( position )
  // this will point to the vertices in the last bound array buffer.
  // In this example, we only use one array buffer, where we're storing 
  // our vertices
  gl.vertexAttribPointer( position, 2, gl.FLOAT, false, 0,0 )
}

function initWidgets() {
  const pane = new Tweakpane.Pane({title: "Photobooth"})

  const PARAMS = {
    "Flip X": false,
    "Flip Y": false,
    "Scale X": 1,
    "Scale Y": 1,
    "R Offset": 0,
    "G Offset": 0,
    "B Offset": 0,
    "Enable noise": false,
    "Magnitude": 1,
    "Offset with time": false
  }

  sizeTweaks = pane.addFolder({title: "Position/Scale"})
  sizeTweaks.addInput(PARAMS, 'Flip X').on('change', (ev) => {
    let loc = gl.getUniformLocation(program, "flip_x");
    gl.uniform1i(loc, ev.value)
  });
  sizeTweaks.addInput(PARAMS, 'Flip Y').on('change', (ev) => {
    let loc = gl.getUniformLocation(program, "flip_y");
    gl.uniform1i(loc, ev.value)
  });
  sizeTweaks.addInput(PARAMS, 'Scale X', {
    min: 0.1,
    max: 10,
    step: 0.1
  }).on('change', (ev) => {
    let loc = gl.getUniformLocation(program, "scale_x");
    gl.uniform1f(loc, ev.value)
  });
  sizeTweaks.addInput(PARAMS, 'Scale Y', {
    min: 0.1,
    max: 10,
    step: 0.1
  }).on('change', (ev) => {
    let loc = gl.getUniformLocation(program, "scale_y");
    gl.uniform1f(loc, ev.value)
  });

  colorTweaks = pane.addFolder({title: "Color"});
  colorTweaks.addInput(PARAMS, "R Offset", {
    min: -255,
    max: 255,
    step: 1
  }).on('change', (ev) => {
    let loc = gl.getUniformLocation(program, "dr");
    gl.uniform1f(loc, ev.value/255)
  });
  colorTweaks.addInput(PARAMS, "G Offset", {
    min: -255,
    max: 255,
    step: 1
  }).on('change', (ev) => {
    let loc = gl.getUniformLocation(program, "dg");
    gl.uniform1f(loc, ev.value/255)
  });
  colorTweaks.addInput(PARAMS, "B Offset", {
    min: -255,
    max: 255,
    step: 1
  }).on('change', (ev) => {
    let loc = gl.getUniformLocation(program, "db");
    gl.uniform1f(loc, ev.value/255)
  });

  noiseTweaks = pane.addFolder({title: "Noise"});
  noiseTweaks.addInput(PARAMS, "Enable noise").on('change', (ev) => {
    let loc = gl.getUniformLocation(program, "enable_noise");
    gl.uniform1i(loc, ev.value)
  });
  noiseTweaks.addInput(PARAMS, "Offset with time").on('change', (ev) => {
    let loc = gl.getUniformLocation(program, "time_offset");
    gl.uniform1i(loc, ev.value)
  });
  noiseTweaks.addInput(PARAMS, "Magnitude", {
    min: 0.25,
    max: 2,
    step: 0.01
  }).on('change', (ev) => {
    let loc = gl.getUniformLocation(program, "magnitude");
    gl.uniform1f(loc, ev.value)
  });
}

function getVideo() {
  const video = document.createElement('video');

  // request video stream
  navigator.mediaDevices.getUserMedia({
    video:true
  }).then( stream => { 
    // this block happens when the video stream has been successfully requested
    video.srcObject = stream
    video.play()
    makeTexture()
  }) 
    
  return video
}

function makeTexture() {
  // create an OpenGL texture object
  videoTexture = gl.createTexture()
  
  // this tells OpenGL which texture object to use for subsequent operations
  gl.bindTexture( gl.TEXTURE_2D, videoTexture )
    
  // since canvas draws from the top and shaders draw from the bottom, we
  // have to flip our canvas when using it as a shader.
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  // how to map when texture element is more than one pixel
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR )
  // how to map when texture element is less than one pixel
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR )
  
  // you must have these properties defined for the video texture to
  // work correctly at non-power-of-2 sizes
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE )
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE )
  
  render()
}

// keep track of time via incremental frame counter
let time = 0
function render() {
  // schedules render to be called the next time the video card requests 
  // a frame of video
  window.requestAnimationFrame( render )
  
  // update time on CPU and GPU
  time++
  gl.uniform1f( uTime, time )
      
  gl.texImage2D( 
    gl.TEXTURE_2D,    // target: you will always want gl.TEXTURE_2D
    0,                // level of detail: 0 is the base
    gl.RGBA, gl.RGBA, // color formats
    gl.UNSIGNED_BYTE, // type: the type of texture data; 0-255
    video             // pixel source: could also be video or image
  )
  
  // draw triangles using the array buffer from index 0 to 6 (6 is count)
  gl.drawArrays( gl.TRIANGLES, 0, 6 )
}