import { isContext } from "node:vm";

function throwExpression(errorMessage: string): never {
    throw new Error(errorMessage);
}

const canvas = <HTMLCanvasElement> document.getElementById('tetris');
const canvasContext: CanvasRenderingContext2D = canvas.getContext("2d") ?? throwExpression("Context Identifier is null");

canvasContext.scale(20, 20);

canvasContext.fillStyle = '#000';
canvasContext.fillRect(0, 0, canvas.width, canvas.height);

interface Position {
    x: number,
    y: number
}

interface Player {
    position: Position,
    matrix: number[][],
    score: number
}

function arenaSweep(): void {
    let sweepRowCount: number = 1;

    for (let y: number = arena.length - 1; y > 0; --y) {
        if (arena[y].every(value => value !== 0)) {

            // Remove matrix row (index y) from array, return it, and then fill it with zeros
            let row: number[] = arena.splice(y, 1)[0].fill(0);
            // Append the row to the top of the matrix (shifting everything down)
            arena.unshift(row);
            // Increment iterator count to check the row indexes affected by the shift
            ++y;

            player.score += sweepRowCount * 10;

            // score multiplier
            sweepRowCount *= 2;
        }
    }
}

function detectCollision(arena: number[][], player: Player): boolean {
    const matrix: number[][] = player.matrix;
    const offset: Position = player.position;
    for (let y: number = 0; y < matrix.length; y++) {
        for (let x: number = 0; x < matrix[y].length; x++) {
            if (matrix[y][x] && (arena[y + offset.y] && arena[y + offset.y][x + offset.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function createPiece(type: string): number[][] {
    let pieceMatrix: number[][] = [[]];

    switch(type) {
        case "T":
            pieceMatrix = [
                [0, 0, 0],
                [1, 1, 1],
                [0, 1, 0]
            ];
            break;
        case "O":
            pieceMatrix = [
                [2, 2],
                [2, 2]
            ];
            break;
        case "L":
            pieceMatrix = [
                [0, 3, 0],
                [0, 3, 0],
                [0, 3, 3]
            ];
            break;
        case "J":
            pieceMatrix = [
                [0, 4, 0],
                [0, 4, 0],
                [4, 4, 0]
            ];
            break;
        case "I":
            pieceMatrix = [
                [0, 5, 0, 0],
                [0, 5, 0, 0],
                [0, 5, 0, 0],
                [0, 5, 0, 0],
            ];
            break;
        case "S":
            pieceMatrix = [
                [0, 6, 6],
                [6, 6, 0],
                [0, 0, 0]
            ];
            break;
        case "Z":
            pieceMatrix = [
                [7, 7, 0],
                [0, 7, 7],
                [0, 0, 0]
            ];
            break;
    }

    return pieceMatrix;
}

function createMatrix(columns: number, rows: number): number[][] {
    // Create an array the length of the rows filled with undefined values
    // replace each undefined value with an array that is the length of columns filled with zeros
    const matrix: number[][] = Array(rows).fill(undefined).map(() => Array(columns).fill(0));
    return matrix;
}

function draw(): void {
    canvasContext.fillStyle = '#000';
    canvasContext.fillRect(0, 0, canvas.width, canvas.height);
    drawMatrix(arena, {x: 0, y: 0});
    drawMatrix(player.matrix, player.position);
}

function drawMatrix(matrix: number[][], offset: Position): void {
    matrix.forEach((row: number[], y: number) => {
        row.forEach((value: number, x: number) => {
            if (value !== 0) {
                canvasContext.fillStyle = colors[value];
                canvasContext.fillRect(x + offset.x, y + offset.y, 1, 1);
            }
        });
    });
}

function merge(arena: number[][], player: Player) {
    player.matrix.forEach((row: number[], y: number) => {
        row.forEach((value: number, x: number) => {
            if (value !== 0) {
                arena[y + player.position.y][x + player.position.x] = value;
            }
        })
    })
}

function playerDrop(): void {
    player.position.y++;
    if (detectCollision(arena, player)) {
        player.position.y--;
        merge(arena,player);
        playerReset();
        arenaSweep();
        updateScore();
    }
    dropCounter = 0;
}

function playerMove(direction: number): void {
    player.position.x += direction;
    if (detectCollision(arena, player)) {
        player.position.x -= direction;
    }
}

function playerReset() {
    const pieces: string[] = ["I", "L", "J", "O", "T", "S", "Z"];
    player.matrix = createPiece(pieces[Math.floor(pieces.length * Math.random())]);
    player.position.y = 0;
    player.position.x = (arena[0].length /2 | 0) - (Math.floor(player.matrix[0].length / 2));

    if (detectCollision(arena, player)) {
        arena.forEach(row => row.fill(0));
        player.score = 0;
        updateScore();
    }
}

function playerRotate(direction: number): void {
    const position: number = player.position.x;
    let offset: number = 1;
    rotateMatrix(player.matrix, direction);
    while (detectCollision(arena, player)) {
        player.position.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1))
        if (offset > player.matrix[0].length) {
            rotateMatrix(player.matrix, -direction);
            player.position.x = position;
            return;
        }
    }
}

function rotateMatrix(matrix: number[][], direction: number): void {
    for (let y: number = 0; y < matrix.length; ++y) {
        for (let x: number = 0; x < y; ++x) {
            [
                matrix[x][y],
                matrix[y][x]
            ] = [
                matrix[y][x],
                matrix[x][y]
            ];
        }
    }

    if (direction > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse()
    }
}

let dropCounter: number = 0;
let dropInterval: number = 1000;
let lastTime: number = 0;

function update(time = 0): void {
    const deltaTime: number = time - lastTime;
    
    lastTime = time;

    dropCounter += deltaTime;

    if (dropCounter > dropInterval) {
        playerDrop();
    }

    draw();
    requestAnimationFrame(update);
}

function updateScore() {
    let scoreElement: HTMLElement = document.getElementById('score') ?? throwExpression("'score' element does not exist");
    scoreElement.innerText = player.score.toString();
}

const colors: (string)[] = [
    'black',
    'red',
    'blue',
    'violet',
    'green',
    'purple',
    'orange',
    'pink'
];
 

const arena: number[][] = createMatrix(12, 20);

const player: Player = {
    position: {x: 0, y: 0},
    matrix: createPiece('I'),
    score: 0
}

document.addEventListener('keydown', event => {
    switch (event.code) {
        case 'ArrowLeft':
            playerMove(-1);
            break;
        case 'ArrowRight':
            playerMove(1);
            break;
        case 'ArrowDown':
            playerDrop();
            break;
        case 'KeyQ':
            playerRotate(1);
            break;
        case 'KeyW':
            playerRotate(-1);
            break;
    }
});

playerReset();
updateScore();
update();
