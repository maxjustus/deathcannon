var camera, scene, renderer;
var player;
var meshes = [];
var enemies = [];
var debris = [];
var bullets = [];
var bulletFocus = 2;
var keyboard = new THREEx.KeyboardState();
var debrisLifetime = 1000;
var debrisCount = 60;

init();
animate();

function init() {
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
  camera.position.z = 2000;

  scene = new THREE.Scene();

  player = makeShip(0, 0);
  enemies.push(makeShip(100, 500, true));
  enemies.push(makeShip(-200, 500, true));
  scene.add(player);

  renderer = new THREE.WebGLRenderer({
    antialias: true
  });
  renderer.setSize(window.outerWidth, window.innerHeight);

  document.body.appendChild(renderer.domElement);

  for(var i = 0; i < enemies.length; i++) {
    scene.add(enemies[i]);
  }
}

function makeShip(x, y, enemy) {
  var group = new THREE.Object3D();

  makeObject(75, 75, 75, 0, 0, group);
  makeObject(40, 40, 40, 0, 0, group);
  makeObject(20, 20, 20, 0, 0, group);

  var upsideDown = makeTri(75, 0, 0, 75);
  upsideDown.object.position.y = -150;
  upsideDown.object.rotation.y = 0;
  group.add(upsideDown.object);
  meshes.push(upsideDown);

  var t1 = makeThruster(-150, 180);
  group.add(t1.object);
  meshes.push(t1);

  var t2 = makeThruster(150, 180);
  group.add(t2.object);
  meshes.push(t2);

  if(enemy) {
    group.rotation.x = degreesToRadians(180);
  }

  group.position.x = x;
  group.position.y = y;

  return group
}

function makeThruster(x, rotation) {
  var thruster = makeTri(50, 0, 0, 0);
  thruster.object.position.y = -300;
  thruster.object.position.x = x;
  thruster.object.rotation.x = degreesToRadians(rotation);
  return thruster;
}

function rotatingThing(object, x, y, ySpeed, lifetime) {
  this.object = object;
  this.x = x;
  this.y = y;
  this.ySpeed = ySpeed;
  this.xSpeed = 0;
  this.lifetime = lifetime;
}

function fire(originObject, enemy) {
  var bulletCount = enemy ? 1 : 3;
  var x = originObject.position.x;
  var y = originObject.position.y;

  scene.add(makeBullet(x, y, 0, enemy).object);
  for(var i = (3 - bulletFocus) * bulletCount; i > 0; i--) {
    scene.add(makeBullet(x, y, i * bulletFocus, enemy).object);
    scene.add(makeBullet(x, y, -i * bulletFocus, enemy).object);
  }
}

function randomColor() {
  return Math.round(Math.random() * 16777215.0);
}

function makeTri(size, x, y, pointSize) {
  if(typeof pointSize == 'undefined') {
    pointSize = 0;
  }
  var geometry = new THREE.CylinderGeometry(pointSize, size, size * 2, 3, false);
  var material = new THREE.MeshBasicMaterial({
    color: randomColor(),
    wireframe: true,
    transparent: true,
    opacity: 0.8
  })

  var mesh = new THREE.Mesh(geometry, material);
  mesh.position.x = x;
  mesh.position.y = y;
  var tri = new rotatingThing(mesh, 0, 0.02)

  return tri;
}

function degreesToRadians(degrees) {
    return degrees * (Math.PI/180);;
}

function makeBullet(origx, origy, angle, enemy) {
  var speed = enemy ? -10 : 20;
  var tri = makeTri(10, origx, origy);
  tri.ySpeed = speed;
  tri.xSpeed = angle;
  if(enemy) {
    tri.object.rotation.x = degreesToRadians(180);
  }
  bullets.push(tri);

  return tri;
}

function makeObject(x, y, z, px, py, group) {
  var tri = makeTri(x, px, py);
  meshes.push(tri);
  group.add(tri.object);

  var cube = makeCube(x - 15, y - 15, z - 15, 0.02, 0.02);
  cube.object.position.x = px;
  cube.object.position.y = py - 150;
  meshes.push(cube);

  group.add(cube.object);
  return tri;
}

function makeCube(x, y, z, rotateX, rotateY) {
  var geometry = new THREE.CubeGeometry(x, y, z);
  var material = new THREE.MeshBasicMaterial({
    color: randomColor(),
    wireframe: true
  })

  var mesh = new THREE.Mesh(geometry, material);
  return new rotatingThing(mesh, rotateX, rotateY);
}

function explode(enemyIndex) {
  scene.remove(enemies[enemyIndex])
  for(var i = debrisCount; i != 0; i--) {
    var tri = makeTri(10,
                      enemies[enemyIndex].position.x,
                      enemies[enemyIndex].position.y,
                      Math.random() * Math.PI);
    scene.add(tri.object);

    var xSpeed = (Math.random() - 0.5) * (Math.random() * 24);
    var ySpeed = (Math.random() - 0.5) * (Math.random() * 24);
    tri.xSpeed = xSpeed;
    tri.ySpeed = ySpeed;
    tri.lifetime = debrisLifetime;
    tri.object.rotation.x = degreesToRadians(Math.atan2(xSpeed, ySpeed));
    debris[i + ((enemyIndex + 1) * debrisCount)] = tri;
  }
  enemies[enemyIndex] = false;
}

var firing = false;
setInterval(function() {
  if (firing) {
    fire(player);
  }
}, 100);

function animate() {
  requestAnimationFrame(animate);

  if(keyboard.pressed("x")) {
    firing = true;
  } else {
    firing = false;
  }
  if(keyboard.pressed("z")) {
    bulletFocus = 1;
  } else {
    bulletFocus = 2;
  }

  moveBy = 7.5 * bulletFocus;

  if(keyboard.pressed("left")) {
    player.position.x -= moveBy;
  }

  if(keyboard.pressed("right")) {
    player.position.x += moveBy;
  }

  if(keyboard.pressed("up")) {
    player.position.y += moveBy;
  }

  if(keyboard.pressed("down")) {
    player.position.y -= moveBy;
  }

  for(var i = 0; i < meshes.length; i++) {
    meshes[i].object.rotation.x += meshes[i].x;
    meshes[i].object.rotation.y += meshes[i].y;
  }

  for (var i = 0; i < debris.length; i++) {
    if(debris[i]) {
      if(debris[i].lifetime > 0) {
        debris[i].object.position.x += debris[i].xSpeed;
        debris[i].object.position.y += debris[i].ySpeed;
        debris[i].lifetime -= 10;
        debris[i].object.material.opacity -= 10.0 / debrisLifetime;
      } else {
        scene.remove(debris[i].object);
      }
    }
  }

  for(var i = 0; i < bullets.length; i++) {
    bullets[i].object.position.y += bullets[i].ySpeed;
    bullets[i].object.position.x += bullets[i].xSpeed; 

    for(var ei = 0; ei < enemies.length; ei++) {
      if(enemies[ei]) {
        // FIXME use raycasting
        if(
            Math.abs(enemies[ei].position.y - bullets[i].object.position.y) < 30 &&
            Math.abs(enemies[ei].position.x - bullets[i].object.position.x) < 30
          ) {
          explode(ei);
        }
      }
    }
  }

  renderer.render(scene, camera);
}
