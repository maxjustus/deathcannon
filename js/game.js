var camera, scene, renderer;
var player;
var meshes = [];
var enemies = [];
var ships = [];
var debris = [];
var bullets = [];
var bulletFocus = 2;
var keyboard = new THREEx.KeyboardState();
var debrisLifetime = 1000;
var debrisCount = 10;
var speedMultiplier = 2;
var stageY = 1300;
var stageX = 1000;
var enemyCount = 0;
var maxEnemyCount = 50;
var score = 0;
var dead = false;
var unfocusedCamPosition = 4000;

init();
animate();

function init() {
  camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 1, 10000);
  camera.position.z = 4000;

  scene = new THREE.Scene();

  player = makeShip(0, -800);
  scene.add(player.object);

  renderer = new THREE.WebGLRenderer({
    antialias: true
  });

  renderer.setSize(window.outerWidth - 100, window.innerHeight - 100);

  document.body.appendChild(renderer.domElement);
}

function makeShip(x, y, enemy) {
  var group = new THREE.Object3D();
  shipMult = enemy ? 0.5 : 1;

  var tris = [
    makeTri(75 * shipMult, 0, 0),
    makeTri(40 * shipMult, 0, 0),
    makeTri(20 * shipMult, 0, 0, 0, randomColor(), 40, false),
  ];

  if (!enemy) {
    tris.push(makeThruster(-100, 45))
    tris.push(makeThruster(100, 45))
  }
  
  for (var i = 0; i < tris.length; i++) {
    meshes.push(tris[i]);
    group.add(tris[i].object);
  }

  group.position.x = x;
  group.position.y = y;

  var ship = new gameObject(group)
  ship.enemy = enemy;

  if (enemy) {
    ships.push(ship);
  } else {
    ships[0] = ship;
  }

  return ship
}

function makeThruster(x, rotation) {
  var thruster = makeTri(40, 0, 0, 0);
  thruster.object.position.y = -130;
  thruster.object.position.x = x;
  thruster.object.rotation.x = degreesToRadians(rotation);
  return thruster;
}

function gameObject(object, x, y, ySpeed, lifetime) {
  this.object = object;
  this.x = x;
  this.y = y;
  this.ySpeed = ySpeed;
  this.xSpeed = 0;
  this.enemy = false;
  this.lifetime = lifetime;
}

function fire(originObject, enemy, speed) {
  if (!enemy && dead) { return }
  var x = originObject.position.x;
  var y = originObject.position.y + 70;

  var bulletCount = enemy ? 1 : 3;
  scene.add(makeBullet(x, y, 0, enemy).object);
  for(var i = (3 - bulletFocus) * bulletCount; i > 0; i--) {
    scene.add(makeBullet(x, y, i * bulletFocus, enemy).object);
    scene.add(makeBullet(x, y, -i * bulletFocus, enemy).object);
  }
}

function randomColor() {
  return Math.round(Math.random() * 16777215.0) + 100000;
}

function makeTri(size, x, y, pointSize, color, length, wireframe) {
  if(typeof pointSize == 'undefined') {
    pointSize = 0;
  }

  if(typeof color == 'undefined') {
    color = randomColor();
  }

  if(typeof length == 'undefined') {
     length = size * 2;
  }

  if(typeof wireframe == 'undefined') {
     wireframe = true;
  }

  var geometry = new THREE.CylinderGeometry(pointSize, size, length, 3, false);
  var material = new THREE.MeshBasicMaterial({
    color: color,
    wireframe: wireframe,
    transparent: true,
    opacity: 0.8
  })

  var mesh = new THREE.Mesh(geometry, material);
  mesh.position.x = x;
  mesh.position.y = y;
  var tri = new gameObject(mesh, 0, 0.02)

  return tri;
}

function degreesToRadians(degrees) {
  return degrees * (Math.PI/180);;
}

var bulletIter = 0;

function makeBullet(origx, origy, angle, enemy) {
  var speed = 20 * speedMultiplier;
  var color = 0x9999ff;
  if (enemy) {
    speed = -6 * speedMultiplier;
    angle *= 3;
    color = 0xff9999;
  }

  var tri = makeTri(10, origx, origy, 0, color, 80);
  tri.ySpeed = speed;
  tri.xSpeed = angle;
  tri.enemy = enemy;
  console.log(Math.atan2(speed, angle));
  tri.object.rotation.z = -Math.atan2(angle, speed);

  if(enemy) {
    tri.object.rotation.z = -tri.object.rotation.z;
    tri.object.rotation.y += degreesToRadians(180);
  }

  if (bullets[bulletIter]) {
    scene.remove(bullets[bulletIter].object);
  }
  bullets[bulletIter] = tri;

  if (bulletIter > 1000) {
    bulletIter = 0;
  } else {
    bulletIter += 1;
  }

  return tri;
}

function updateScore() {
  document.getElementsByTagName('h1')[0].innerHTML = score;
}

function generateEnemy() {
  if (enemyCount >= maxEnemyCount) {
    return;
  }

  var x = ((Math.random() * stageX))
  var xSpeed = (Math.random() > 0.5 ? 1.0 : -1.0) * 15;
  var ySpeed = -3 * (Math.random() * 10);

  for (i = 0; i < 6; i++) {
    setTimeout(function() {
      enemyCount++;
      var e = makeShip(x, stageY - 1, true);
      e.object.rotation.x = degreesToRadians(180);
      e.xSpeed = xSpeed;
      e.ySpeed = ySpeed;

      enemies.push(e);
      scene.add(e.object);
    }, 75 * i);
  }
}

function fireEnemy() {
  for (var i = 0; i < enemies.length; i++) {
    if (enemies[i]) {
      if(Math.random() - 0.996 > 0) {
        fire(enemies[i].object, true, -3);
      }
    }
  }
}

function atBoundary(position, axis) {
  var stage = stageY;
  if (axis == 'x') {
    stage = stageX;
  }

  return Math.abs(position) > stage;
}

function moveSliderEnemies() {
  for(var i = 0; i < enemies.length; i++) {
    if (enemies[i]) {
      if (atBoundary(Math.round(enemies[i].object.position.x), 'x')) {
        enemies[i].xSpeed = -enemies[i].xSpeed;
      }

      if (atBoundary(Math.round(enemies[i].object.position.y), 'y')) {
        enemies[i].ySpeed = -enemies[i].ySpeed;
      }

      enemies[i].object.position.x += enemies[i].xSpeed;
      enemies[i].object.position.y += enemies[i].ySpeed;
    }
  }
}

function explode(shipIndex) {
  scene.remove(ships[shipIndex].object)
  for(var i = debrisCount; i != 0; i--) {
    var tri = makeTri(25,
                      ships[shipIndex].object.position.x,
                      ships[shipIndex].object.position.y,
                      0xffffff);
    tri.object.material.opacity = 0.6;
    scene.add(tri.object);

    var xSpeed = (Math.random() - 0.5) * (Math.random() * 76);
    var ySpeed = (Math.random() - 0.5) * (Math.random() * 76);
    tri.xSpeed = xSpeed;
    tri.ySpeed = ySpeed;
    tri.x = Math.random() / 10.0;
    tri.y = Math.random() / 10.0;
    tri.lifetime = debrisLifetime;
    tri.object.rotation.x = degreesToRadians(Math.atan2(xSpeed, ySpeed));
    debris[i + ((shipIndex + 1) * debrisCount)] = tri;
    meshes.push(tri);
  }

  if (!ships[shipIndex].enemy) {
    dead = true;
    score = 0;
    updateScore();

    setTimeout(function() {
      dead = false;
      player = makeShip(0, -800);
      scene.add(player.object);
    }, 1000)
  } else {
    score += 100;
    updateScore();
    enemyCount--;
    enemies[shipIndex - 1] = false;
  }

  ships[shipIndex] = false;
}

function moveSpinners() {
  for(var i = 0; i < meshes.length; i++) {
    meshes[i].object.rotation.x += meshes[i].x;
    meshes[i].object.rotation.y += meshes[i].y;
  }
}

function moveDebris() {
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
}

function animateBullets() {
  for(var i = 0; i < bullets.length; i++) {
    if (!bullets[i]) { continue }
    if (Math.abs(bullets[i].object.position.y) > stageY) {
      scene.remove(bullets[i].object);
      bullets[i] = null;
    } else {
      bullets[i].object.position.y += bullets[i].ySpeed;
      bullets[i].object.position.x += bullets[i].xSpeed; 

      for(var si = 0; si < ships.length; si++) {
        if(ships[si]) {
          // FIXME use raycasting
          if(
              ships[si].enemy != bullets[i].enemy &&
              Math.abs(ships[si].object.position.y - bullets[i].object.position.y) < 40 &&
              Math.abs(ships[si].object.position.x - bullets[i].object.position.x) < 40
            ) {
            scene.remove(bullets[i]);
            explode(si);
          }
        }
      }
    }
  }
}

var firing = false;
setInterval(function() {
  if (firing) {
    fire(player.object, false, 20);
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

  moveBy = 7.5 * bulletFocus * speedMultiplier;

  if (bulletFocus == 1) {
    //camera.position.z -= 30;
    camera.fov -= 0.2
  } else {
    camera.fov = 35
  }
  camera.updateProjectionMatrix();

  if(keyboard.pressed("left")) {
    player.object.position.x -= moveBy;
  }

  if(keyboard.pressed("right")) {
    player.object.position.x += moveBy;
  }

  if(keyboard.pressed("up")) {
    player.object.position.y += moveBy;
    //camera.position.z += 30;
  }

  if(keyboard.pressed("down")) {
    player.object.position.y -= moveBy;
    //camera.position.z -= 30;
  }

  moveSliderEnemies();
  moveSpinners();
  moveDebris();
  animateBullets();

  if(Math.random() - 0.98 > 0) {
    generateEnemy();
  }

  fireEnemy();

  renderer.render(scene, camera);
}
