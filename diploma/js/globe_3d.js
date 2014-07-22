var renderer = null, 
    scene = null, 
    camera = null,
    cube = null,
    cube2 = null,
    man = null,
    maleMesh,
    light2,
    cameraControls,
    camX = -500,
    camY = 600,
    camZ = 1250;

var cubeSide = 100,
    cubeScale = 0.1,
    cubeScaleOld = 0.1,
    camLength = 320,
    camLengthOld = 320,
    camPosY = 73,
    camPosYOld = 73,
    bubbleSize = 37,
    bubbleSizeOld = 37,
    speed = 0.25,
    halfScale = 50,
    manHeightY = 175,
    manWidthX = 50,
    manThickZ = 30;

var container;

var renWidth, renHeight;

var halfRenWidth, halfRenHeight;

var mouseX = 0, mouseY = 0;

var clock = new THREE.Clock();

function initThreeJs() {
    container = document.getElementById("threejs");
    renWidth = container.offsetWidth;
    renHeight = container.offsetHeight;
    halfRenWidth = renWidth / 2;
    halfRenHeight = renHeight / 2;

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setSize( renWidth, renHeight );
    renderer.setClearColor( 0xffffff );
    renderer.shadowMapEnabled = true;
    renderer.shadowMapEnabled = true;   
    container.appendChild( renderer.domElement );

    scene = new THREE.Scene();
    //scene.fog = new THREE.FogExp2( 0x00aeef, 0.0005 );

    camera = new THREE.PerspectiveCamera( 45, container.offsetWidth / container.offsetHeight, 1, 20000 );
    camera.position.set( camX, camY, camZ );

    ///////////////////////////////////////////////////////////////
    ///////////////////////// FLOOR ///////////////////////////////
    ///////////////////////////////////////////////////////////////

        var floorMaterial = new THREE.MeshBasicMaterial( { color: 0xffffff, side: THREE.DoubleSide } ); //8ad448
        var floorGeometry = new THREE.PlaneGeometry(10000, 10000, 10, 10);
        var floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.position.y = -0.01;
        floor.rotation.x = Math.PI / 2;
        floor.receiveShadow = true;
        scene.add(floor);

    ///////////////////////////////////////////////////////////////
    ///////////////////////// LIGHT ///////////////////////////////
    ///////////////////////////////////////////////////////////////

        var hemiLight = new THREE.HemisphereLight( 0xf2bb5c, 0xa47e17, 1 ); //f2bb5c
            scene.add( hemiLight );
        var light = new THREE.DirectionalLight( 0x6b6b6b, 0.8);
            light.position.set(0, 300, -550);
            light.shadowDarkness = 0;
            light.rotation.x = Math.PI;
            light.intensity = 1;
            light.castShadow = true;
       scene.add( light );

        light2 = new THREE.DirectionalLight( 0x404040, 1);
            light2.target.position.set ( 50, 0, 0);
            light2.shadowCameraLeft = -1500;
            light2.shadowCameraRight = 1500;
            light2.position.set( 57, 1800, 1850 );
            light2.shadowDarkness = 0.2;
            light2.intensity = 2;
            light2.castShadow = true;
            light2.shadowMapWidth = light2.shadowMapHeight = 1024;
        scene.add( light2 );
    
    ///////////////////////////////////////////////////////////////
    ///////////////////////// SHADERS /////////////////////////////
    ///////////////////////////////////////////////////////////////
        
        var noiseTexture = new THREE.ImageUtils.loadTexture( 'vendor/img/cloud.png' );
            noiseTexture.wrapS = noiseTexture.wrapT = THREE.RepeatWrapping; 
        
        var waterTexture = new THREE.ImageUtils.loadTexture( 'vendor/img/water.jpg' );
            waterTexture.wrapS = waterTexture.wrapT = THREE.RepeatWrapping; 
        
        this.customUniforms2 = {
            baseTexture:    { type: "t", value: waterTexture },
            baseSpeed:      { type: "f", value: 0.5 },
            noiseTexture:   { type: "t", value: noiseTexture },
            noiseScale:     { type: "f", value: 0.25 }, //
            alpha:          { type: "f", value: 0.65 },
            time:           { type: "f", value: 1.0 }
        };
      
        var customMaterial2 = new THREE.ShaderMaterial( 
        {
            uniforms: customUniforms2,
            vertexShader:   document.getElementById( 'vertexShader'   ).textContent,
            fragmentShader: document.getElementById( 'fragmentShader' ).textContent
        }   );
     
        // other material properties
        customMaterial2.side = THREE.DoubleSide;
        customMaterial2.transparent = true;

    ///////////////////////////////////////////////////////////////
    ///////////////////////// CUBE ////////////////////////////////
    ///////////////////////////////////////////////////////////////

        var geometryCube = new THREE.CubeGeometry(100, 100, 100);
        cube = new THREE.Mesh(geometryCube, customMaterial2);
        cube.castShadow = true;
        cube.visible = false;
        scene.add( cube );

        var geometryCube2 = new THREE.CubeGeometry(99, 99, 99);
        var cubeMaterial2 = new THREE.MeshPhongMaterial( { color: 0x0f6dd6, combine: THREE.MixOperation } );
        cube2 = new THREE.Mesh(geometryCube2, cubeMaterial2);  
        cube2.visible = false;
        scene.add( cube2 );
    
    // man json loader //
    var jsonLoader = new THREE.JSONLoader();
        jsonLoader.load( "js/male5_max.js", createMan );

    // camera mouse control //
    document.addEventListener( 'mousemove', onDocumentMouseMove, false );

    // animate scene //   
    run();
}

function run() {
    renderer.render( scene, camera );
    // cube.rotation.y -= 0.003;
    // cube2.rotation.y -= 0.003;

    if (cubeScale == 0 || cubeScale == 0.1) {
        cube.visible = false;
        cube2.visible = false;
        camera.position.setLength(320);
        camera.lookAt( new THREE.Vector3(50, 73, -10));
    };

    if ( cubeScale && cubeScale > 0.1 ) {

        cube.visible = true;
        cube2.visible = true;

        if (cubeScale != cubeScaleOld) {  
            var updScale = (cubeScale - cubeScaleOld) * speed;
            cubeScaleOld += updScale;
        };

        halfScale = cubeScaleOld * cubeSide / 2;

        cube.scale.set( cubeScaleOld, cubeScaleOld, cubeScaleOld );
        cube.position.set( halfScale,  halfScale + 1, halfScale );

        cube2.scale.set( cubeScaleOld, cubeScaleOld, cubeScaleOld );
        cube2.position.set( halfScale,  halfScale + 1, halfScale );
        
        // camera distance depends on cube size //
        if (cubeScaleOld >= 0.95) {
            camLength = 360;
            camPosY = 53;

            if (camLength != camLengthOld) {  
                var updLength = (camLength - camLengthOld) * speed;
                camLengthOld += updLength;
            };

            if (camPosY != camPosYOld) {  
                var updCamPosY = (camPosY - camPosYOld) * speed / 2;
                camPosYOld += updCamPosY;
            };

        } else {
            camLength = 320;
            camPosY = 73;

            if (camLength != camLengthOld) {  
                var updLength = (camLength - camLengthOld) * speed;
                camLengthOld += updLength;
            };

            if (camPosY != camPosYOld) {  
                var updCamPosY = (camPosY - camPosYOld) * speed / 2;
                camPosYOld += updCamPosY;
            };
        };

        // text bubble size depends on cube size //
        if (cubeScaleOld <= 0.3) {

            bubbleSize = 30;

            if (bubbleSize != bubbleSizeOld) {  
                var updSize = (bubbleSize - bubbleSizeOld) * speed;
                bubbleSizeOld += updSize;
            };
        }
        else if (cubeScaleOld >= 0.3 && cubeScaleOld < 0.6) {
            
            bubbleSize = 31;
                        
            if (bubbleSize != bubbleSizeOld) {  
                var updSize = (bubbleSize - bubbleSizeOld) * speed;
                bubbleSizeOld += updSize;
            };
        } 
        else if (cubeScaleOld >= 0.6 && cubeScaleOld < 0.9) {
            
            bubbleSize = 33;
                       
            if (bubbleSize != bubbleSizeOld) {  
                var updSize = (bubbleSize - bubbleSizeOld) * speed;
                bubbleSizeOld += updSize;
            };
        }
        else if (cubeScaleOld >= 0.9) {
            
            bubbleSize = 37;
                       
            if (bubbleSize != bubbleSizeOld) {  
                var updSize = (bubbleSize - bubbleSizeOld) * speed;
                bubbleSizeOld += updSize;
            };
        };

        if (cubeScale == 0) { bubbleSizeOld = (clickHelp == true) ? 37 : 30; }
        else { bubbleSizeOld = (clickHelp == true) ? 37 : bubbleSizeOld; }
        
        document.getElementById("bubble").style.width = bubbleSizeOld + "%";
        document.getElementById("bubbleText").style.width = bubbleSizeOld + "%";

        camera.lookAt( new THREE.Vector3(cube.position.x, camPosYOld, -10)); // camera look at cube
    };
    
    camera.position.setLength(camLengthOld); //set camera distance
    camera.position.x += ( -mouseX - camera.position.x ) * 0.15; //camera mouse control append

    // shaders animation //
    var delta = clock.getDelta();
    customUniforms2.time.value += delta;

    requestAnimationFrame(run); //lets do it again! (about 60 times per second)
}

function createMan( geometry, materials ) {
    maleMaterial = new THREE.MeshFaceMaterial( materials );
    maleMesh = new THREE.Mesh( geometry, maleMaterial );
    maleMesh.scale.set(0.53, 0.53, 0.53);
    maleMesh.position.set(-40, 57, 15);
    maleMesh.castShadow = true;
    scene.add( maleMesh );
}

function onDocumentMouseMove( event ) {
    mouseX = ( event.clientX / 12 - halfRenWidth + 400 );
    mouseY = ( event.clientY / 10 - halfRenHeight - 30);
}