AsteroidsApp = function(veroldApp,ui) {

  this.veroldApp = veroldApp;  
  this.mainScene;
  this.camera;

  this.ship;

  this.asteroid_template;
  this.projectile_template;

  this.ui = ui;

  this.conversionScale = 3.55;

  this.resizeView();

  $(window).resize($.proxy(this.resizeView,this));
  
}

AsteroidsApp.prototype.startup = function( gameCallback ) {

  var that = this;

	this.veroldApp.loadScene( null, {
    
    success_hierarchy: function( scene ) {

      // hide progress indicator
      that.veroldApp.hideLoadingProgress();

      that.inputHandler = that.veroldApp.getInputHandler();
      that.renderer = that.veroldApp.getRenderer();
      that.picker = that.veroldApp.getPicker();
      
      //Bind to input events to control the camera
      that.veroldApp.on("keyDown", that.onKeyPress, that);
      that.veroldApp.on("mouseUp", that.onMouseUp, that);
      that.veroldApp.on("fixedUpdate", that.fixedUpdate, that );
      that.veroldApp.on("update", that.update, that );

      //Store a pointer to the scene
      that.mainScene = scene;
      scene.set({"payload.environment.skyboxOn" : false });
      var renderer = that.veroldApp.getRenderer();
      renderer.setClearColorHex(0x000000, 0);
      
      var models = that.mainScene.getAllObjects( { "filter" :{ "model" : true }});

      // saving reference to asteroid model (template)
      that.asteroid_template = that.mainScene.getObject('514d18e34ad09902000005a9');
      // remove initial model
      that.mainScene.removeChildObject(that.asteroid_template);

      // saving reference to projectile model (template)
      that.projectile_template = that.mainScene.getObject('51421b770b4e5d0200000376');
      // remove initial model
      that.mainScene.removeChildObject(that.projectile_template);

      that.ship = models[ _.keys( models )[0] ];
      var model = that.ship.threeData;

      //Create the camera
      that.camera = new THREE.OrthographicCamera(that.orthLeft,that.orthRight,that.orthTop,that.orthBottom, 0.1, 10000 );
      that.camera.up.set( 0, 1, 0 );
      that.camera.position.set( 0, 0, 20);

      var lookAt = new THREE.Vector3();
      lookAt.add( model.center );
      lookAt.multiply( model.scale );
      lookAt.applyQuaternion( model.quaternion );
      lookAt.add( model.position );

      that.camera.lookAt( lookAt );
      
      //Tell the engine to use this camera when rendering the scene.
      that.veroldApp.setActiveCamera( that.camera );

      if(!!gameCallback) { gameCallback(); }

      that.ui.hideLoadingProgress();

    },

    progress: function(sceneObj) {
      var percent = Math.floor((sceneObj.loadingProgress.loaded_hierarchy / sceneObj.loadingProgress.total_hierarchy)*100);
      that.ui.setLoadingProgress(percent); 
    }

  });
	
}

AsteroidsApp.prototype.getShipModel = function() {
  return this.ship;
};

AsteroidsApp.prototype.createAsteroidModel = function(callback) {

  var angles = [];
  for(i=0;i<3;i++) {
    angles[i] = Math.random() * (2*Math.PI);
  }

  var that = this;
  this.asteroid_template.clone({
    success_hierarchy: function(clonedAsteroid) {
      that.mainScene.addChildObject(clonedAsteroid);

      // this is where asteroids are first rotated about an arbitrary angle
      clonedAsteroid.traverse(function(obj) {
        if(obj.entityModel.get('name').match(/^default.*/) && obj.type === "mesh") {
          var vec3 = new THREE.Vector3(angles[0],angles[1],angles[2])
          obj.threeData.quaternion.setFromEuler(vec3);
        }
      });

      if(!!callback) { callback(clonedAsteroid); }
    }
  })

};

AsteroidsApp.prototype.createProjectileModel = function(callback) {
  var that = this;
  this.projectile_template.clone({
    success_hierarchy: function(clonedProjectile) {
      that.mainScene.addChildObject(clonedProjectile);
      if(!!callback) { callback(clonedProjectile); }
    }
  });
};

AsteroidsApp.prototype.shutdown = function() {
	
  this.veroldApp.off("keyDown", this.onKeyPress, this);
  this.veroldApp.off("mouseUp", this.onMouseUp, this);

  this.veroldApp.off("update", this.update, this );
}

  

AsteroidsApp.prototype.update = function( delta ) {

}

AsteroidsApp.prototype.fixedUpdate = function( delta ) {

}

AsteroidsApp.prototype.onMouseUp = function( event ) {
  
  if ( event.button == this.inputHandler.mouseButtons[ "left" ] && 
    !this.inputHandler.mouseDragStatePrevious[ event.button ] ) {
    
    var mouseX = event.sceneX / this.veroldApp.getRenderWidth();
    var mouseY = event.sceneY / this.veroldApp.getRenderHeight();
    var pickData = this.picker.pick( this.mainScene.threeData, this.camera, mouseX, mouseY );
    if ( pickData ) {
      //Bind 'pick' event to an asset or just let user do this how they want?
      if ( pickData.meshID == "51125eb50a4925020000000f") {
        //Do stuff
      }
    }
  }
}

AsteroidsApp.prototype.onKeyPress = function( event ) {
	
	var keyCodes = this.inputHandler.keyCodes;
  if ( event.keyCode === keyCodes['B'] ) {
    var that = this;
    this.boundingBoxesOn = !this.boundingBoxesOn;
    var scene = veroldApp.getActiveScene();
    
    scene.traverse( function( obj ) {
      if ( obj.isBB ) {
        obj.visible = that.boundingBoxesOn;
      }
    });
  
  }
    
}

/* additional functions */
AsteroidsApp.prototype.resizeView = function() {
  var width = $(window).width(), height = $(window).height();
  this.orthTop = 14;
  this.orthBottom = -this.orthTop;
  this.orthRight = this.orthTop * (width/height);
  this.orthLeft = -this.orthRight;

  if(!!this.camera) {
    this.camera.top = this.orthTop;
    this.camera.right = this.orthRight;
    this.camera.bottom = this.orthBottom;
    this.camera.left = this.orthLeft;

    this.camera.updateProjectionMatrix();
  }
}

AsteroidsApp.prototype.getOrthBounds = function() {
  return {
    top: this.orthTop,
    left: this.orthLeft,
    bottom: this.orthBottom,
    right: this.orthRight
  }
}

AsteroidsApp.prototype.getPhysicsTo3DSpaceConverson = function() {
  return this.conversionScale;
}
